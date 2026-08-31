from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


@dataclass
class AnalysisResult:
    sheet_name: str
    rows: int
    columns: int
    column_types: dict[str, str]
    summary: pd.DataFrame
    missing: pd.DataFrame
    charts: list[Path]


ARABIC_LABELS = {
    "numeric": "رقمي",
    "datetime": "تاريخ/وقت",
    "categorical": "تصنيفي",
    "text": "نصي",
    "empty": "فارغ",
}


def clean_filename(value: str) -> str:
    return re.sub(r"[^\w\-\.]+", "_", str(value), flags=re.UNICODE).strip("_")[:90] or "column"


def detect_column_type(series: pd.Series) -> str:
    non_null = series.dropna()
    if non_null.empty:
        return "empty"
    if pd.api.types.is_numeric_dtype(non_null):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(non_null):
        return "datetime"
    converted_dates = pd.to_datetime(non_null, errors="coerce", format="mixed")
    if len(non_null) >= 3 and converted_dates.notna().mean() >= 0.85:
        return "datetime"
    if non_null.nunique(dropna=True) <= max(20, int(len(non_null) * 0.05)):
        return "categorical"
    return "text"


def classify_columns(df: pd.DataFrame) -> dict[str, str]:
    return {str(column): detect_column_type(df[column]) for column in df.columns}


def build_summary(df: pd.DataFrame, column_types: dict[str, str]) -> pd.DataFrame:
    records: list[dict[str, Any]] = []
    for column, kind in column_types.items():
        series = df[column]
        record: dict[str, Any] = {
            "column": column,
            "type": ARABIC_LABELS[kind],
            "non_null": int(series.notna().sum()),
            "missing": int(series.isna().sum()),
            "missing_pct": round(float(series.isna().mean() * 100), 2),
            "unique": int(series.nunique(dropna=True)),
        }
        if kind == "numeric":
            numeric = pd.to_numeric(series, errors="coerce")
            record.update(
                {
                    "min": numeric.min(),
                    "max": numeric.max(),
                    "mean": numeric.mean(),
                    "median": numeric.median(),
                    "std": numeric.std(),
                }
            )
        elif kind in {"categorical", "text"}:
            mode = series.mode(dropna=True)
            record["top_value"] = str(mode.iloc[0]) if not mode.empty else ""
            record["top_count"] = int(series.value_counts(dropna=True).iloc[0]) if not series.dropna().empty else 0
        records.append(record)
    return pd.DataFrame(records)


def _save_chart(fig: plt.Figure, output_dir: Path, sheet: str, title: str, index: int) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{index:02d}_{clean_filename(sheet)}_{clean_filename(title)}.png"
    path = output_dir / filename
    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def generate_charts(df: pd.DataFrame, column_types: dict[str, str], output_dir: Path, sheet_name: str) -> list[Path]:
    sns.set_theme(style="whitegrid")
    charts: list[Path] = []
    numeric = [c for c, t in column_types.items() if t == "numeric"]
    categorical = [c for c, t in column_types.items() if t in {"categorical", "text"}]
    dates = [c for c, t in column_types.items() if t == "datetime"]
    index = 1

    # Date + numeric: trend chart, using the first useful pair.
    if dates and numeric:
        date_col, value_col = dates[0], numeric[0]
        plot_df = df[[date_col, value_col]].copy()
        plot_df[date_col] = pd.to_datetime(plot_df[date_col], errors="coerce")
        plot_df[value_col] = pd.to_numeric(plot_df[value_col], errors="coerce")
        plot_df = plot_df.dropna().sort_values(date_col)
        if not plot_df.empty:
            fig, ax = plt.subplots(figsize=(10, 5))
            sns.lineplot(data=plot_df, x=date_col, y=value_col, marker="o", ax=ax)
            ax.set_title(f"الاتجاه الزمني: {value_col} حسب {date_col}")
            charts.append(_save_chart(fig, output_dir, sheet_name, "trend", index)); index += 1

    # Category + numeric: top categories bar chart.
    if categorical and numeric:
        category_col, value_col = categorical[0], numeric[0]
        plot_df = df[[category_col, value_col]].copy()
        plot_df[value_col] = pd.to_numeric(plot_df[value_col], errors="coerce")
        plot_df = plot_df.dropna().groupby(category_col, as_index=False)[value_col].sum()
        plot_df = plot_df.sort_values(value_col, ascending=False).head(15)
        if not plot_df.empty:
            fig, ax = plt.subplots(figsize=(10, 6))
            sns.barplot(data=plot_df, y=category_col, x=value_col, hue=category_col, legend=False, palette="viridis", ax=ax)
            ax.set_title(f"أعلى الفئات حسب مجموع {value_col}")
            charts.append(_save_chart(fig, output_dir, sheet_name, "category_bar", index)); index += 1

    # Numeric distributions.
    for column in numeric[:6]:
        values = pd.to_numeric(df[column], errors="coerce").dropna()
        if values.empty:
            continue
        fig, ax = plt.subplots(figsize=(8, 5))
        sns.histplot(values, kde=len(values) >= 5, color="#2563eb", ax=ax)
        ax.set_title(f"توزيع: {column}")
        charts.append(_save_chart(fig, output_dir, sheet_name, f"distribution_{column}", index)); index += 1

    # Correlation heatmap when enough numeric columns exist.
    if len(numeric) >= 2:
        corr = df[numeric].apply(pd.to_numeric, errors="coerce").corr()
        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(corr, annot=True, cmap="coolwarm", center=0, fmt=".2f", ax=ax)
        ax.set_title("مصفوفة الارتباط")
        charts.append(_save_chart(fig, output_dir, sheet_name, "correlation", index)); index += 1

    # Frequency chart when no numeric/category combination is available.
    if categorical and not numeric:
        column = categorical[0]
        counts = df[column].astype("string").fillna("فارغ").value_counts().head(15)
        fig, ax = plt.subplots(figsize=(10, 6))
        counts.sort_values().plot.barh(color="#16a34a", ax=ax)
        ax.set_title(f"تكرار القيم: {column}")
        charts.append(_save_chart(fig, output_dir, sheet_name, "frequency", index))

    return charts


def analyze_dataframe(df: pd.DataFrame, sheet_name: str, output_dir: Path) -> AnalysisResult:
    df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")
    column_types = classify_columns(df)
    summary = build_summary(df, column_types)
    missing = summary[["column", "missing", "missing_pct"]].sort_values("missing_pct", ascending=False)
    charts = generate_charts(df, column_types, output_dir, sheet_name)
    return AnalysisResult(sheet_name, len(df), len(df.columns), column_types, summary, missing, charts)


def analyze_excel(input_path: str | Path, output_dir: str | Path) -> list[AnalysisResult]:
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    workbook = pd.read_excel(input_path, sheet_name=None)
    results = []
    for sheet_name, df in workbook.items():
        results.append(analyze_dataframe(df, str(sheet_name), output_dir / clean_filename(str(sheet_name))))
    return results


def export_results(results: list[AnalysisResult], output_dir: str | Path) -> Path:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "report.xlsx"
    with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
        overview = pd.DataFrame([
            {"sheet": r.sheet_name, "rows": r.rows, "columns": r.columns, "charts": len(r.charts)}
            for r in results
        ])
        overview.to_excel(writer, sheet_name="overview", index=False)
        for result in results:
            safe_name = clean_filename(result.sheet_name)[:25] or "sheet"
            result.summary.to_excel(writer, sheet_name=f"{safe_name}_stats"[:31], index=False)
            result.missing.to_excel(writer, sheet_name=f"{safe_name}_missing"[:31], index=False)
    return report_path

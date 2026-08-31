from pathlib import Path
import pandas as pd

from excel_stats.analyzer import analyze_excel, export_results

base = Path("/tmp/excel_stats_fixture")
base.mkdir(exist_ok=True)
source = base / "sales.xlsx"
out = base / "output"

df = pd.DataFrame({
    "التاريخ": pd.date_range("2026-01-01", periods=8, freq="D"),
    "المدينة": ["الرياض", "جدة", "الرياض", "الدمام", "جدة", "الرياض", "الدمام", "جدة"],
    "المبيعات": [1200, 850, 1430, 620, 910, 1600, 700, 980],
    "عدد_الطلبات": [12, 8, 14, 6, 9, 16, 7, 10],
})
with pd.ExcelWriter(source, engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="المبيعات", index=False)

results = analyze_excel(source, out / "charts")
report = export_results(results, out)
assert len(results) == 1
assert results[0].rows == 8
assert results[0].column_types["المبيعات"] == "numeric"
assert results[0].column_types["التاريخ"] == "datetime"
assert report.exists()
assert len(results[0].charts) >= 3
print("PASS", report, len(results[0].charts))

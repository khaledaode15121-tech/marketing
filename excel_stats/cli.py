from __future__ import annotations

import argparse
from pathlib import Path

from .analyzer import analyze_excel, export_results


def main() -> None:
    parser = argparse.ArgumentParser(description="تحليل ملفات Excel وإنشاء إحصائيات ورسومات تلقائية")
    parser.add_argument("input", type=Path, help="مسار ملف Excel مثل data.xlsx")
    parser.add_argument("-o", "--output", type=Path, default=Path("output"), help="مجلد حفظ النتائج")
    args = parser.parse_args()

    if not args.input.exists():
        parser.error(f"الملف غير موجود: {args.input}")
    results = analyze_excel(args.input, args.output / "charts")
    report = export_results(results, args.output)
    print(f"تم تحليل {len(results)} ورقة/أوراق.")
    for result in results:
        print(f"- {result.sheet_name}: {result.rows} صف، {result.columns} عمود، {len(result.charts)} رسم")
    print(f"تقرير Excel: {report}")
    print(f"الرسومات: {args.output / 'charts'}")


if __name__ == "__main__":
    main()

import { useComparison } from "@/contexts/ComparisonContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Scale, X } from "lucide-react";

export function ComparisonBar() {
  const { products, clearComparison } = useComparison();

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40" dir="rtl">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-900" style={{ fontFamily: "'Cairo', sans-serif" }}>
              {products.length} منتج للمقارنة
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                <span className="text-gray-700 truncate max-w-xs" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  {product.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/comparison">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl">
              <Scale className="w-4 h-4 ml-2" />
              عرض المقارنة
            </Button>
          </Link>
          <button
            onClick={clearComparison}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="مسح المقارنة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useComparison } from "@/contexts/ComparisonContext";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Star,
  X,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { formatSypWithCurrency, getProductImages } from "@/lib/formatters";

export default function Comparison() {
  const { products, removeProduct, clearComparison } = useComparison();

  if (products.length === 0) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            لا توجد منتجات للمقارنة
          </h1>
          <p
            className="text-gray-600 mb-6"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          >
            أضف منتجات من صفحة المنتجات لمقارنتها
          </p>
          <Link href="/products">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl">
              تصفح المنتجات
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get all unique specifications from products
  const specs = [
    { key: "price", label: "السعر", type: "price" },
    { key: "oldPrice", label: "السعر الأصلي", type: "price" },
    { key: "rating", label: "التقييم", type: "rating" },
    { key: "reviewCount", label: "عدد التقييمات", type: "number" },
    { key: "stock", label: "المخزون", type: "number" },
    { key: "category", label: "الفئة", type: "text" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-3xl font-black text-gray-900"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              مقارنة المنتجات
            </h1>
            <button
              onClick={clearComparison}
              className="text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              مسح الكل
            </button>
          </div>
          <p
            className="text-gray-600 text-sm"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          >
            {products.length} من {4} منتجات
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {/* Product Images and Names */}
                <tr className="border-b border-gray-100">
                  <td
                    className="p-6 bg-gray-50 font-semibold text-gray-900 w-32"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    المنتج
                  </td>
                  {products.map(product => (
                    <td key={product.id} className="p-6 w-64 text-center">
                      <div className="relative mb-4">
                        <img
                          src={getProductImages(product)[0] || ""}
                          alt={product.name || "Product"}
                          className="w-full h-48 object-contain rounded-xl bg-muted p-2"
                        />
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <h3
                        className="font-bold text-gray-900 mb-1 line-clamp-2"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        {product.name}
                      </h3>
                      <p
                        className="text-xs text-blue-600 font-semibold"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {product.brand}
                      </p>
                    </td>
                  ))}
                </tr>

                {/* Specifications */}
                {specs.map(spec => (
                  <tr
                    key={spec.key}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td
                      className="p-6 bg-gray-50 font-semibold text-gray-900 w-32"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      {spec.label}
                    </td>
                    {products.map(product => {
                      const value = product[spec.key as keyof typeof product];
                      let displayValue = "";

                      if (spec.type === "price") {
                        displayValue = value
                          ? formatSypWithCurrency(value)
                          : "—";
                      } else if (spec.type === "rating") {
                        displayValue = value ? `${value} ⭐` : "—";
                      } else if (spec.type === "number") {
                        displayValue = value ? String(value) : "—";
                      } else {
                        displayValue = value ? String(value) : "—";
                      }

                      return (
                        <td
                          key={`${product.id}-${spec.key}`}
                          className="p-6 w-64 text-center"
                        >
                          <span
                            className="text-gray-700 font-semibold"
                            style={{
                              fontFamily:
                                spec.type === "price"
                                  ? "'Space Grotesk', sans-serif"
                                  : "'Tajawal', sans-serif",
                            }}
                          >
                            {displayValue}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Action Row */}
                <tr className="bg-blue-50">
                  <td className="p-6 bg-gray-50 w-32"></td>
                  {products.map(product => (
                    <td
                      key={`action-${product.id}`}
                      className="p-6 w-64 text-center"
                    >
                      <Link href={`/product/${product.id}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mb-2">
                          <ArrowLeft className="w-4 h-4 ml-2" />
                          عرض التفاصيل
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        <ShoppingCart className="w-4 h-4 ml-1" />
                        أضف للسلة
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Add More Products */}
        {products.length < 4 && (
          <div className="mt-8 text-center">
            <p
              className="text-gray-600 mb-4"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              أضف المزيد من المنتجات للمقارنة (يمكنك مقارنة حتى 4 منتجات)
            </p>
            <Link href="/products">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl">
                تصفح المنتجات
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

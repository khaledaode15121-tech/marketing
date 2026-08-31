import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Wishlist() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: wishlistItems = [], refetch } = trpc.wishlist.list.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  const removeFromWishlistMutation = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم إزالة المنتج من المفضلة");
    },
  });

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المنتج إلى السلة");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">
            يرجى تسجيل الدخول لعرض المفضلة
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1
            className="text-3xl font-black text-gray-900"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            المفضلة
          </h1>
          <span className="text-gray-600">({wishlistItems.length} منتج)</span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <p className="text-gray-600 text-lg mb-6">
              لا توجد منتجات في المفضلة
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              تصفح المنتجات
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-400 text-sm">صورة المنتج</div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p
                    className="font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    المنتج #{item.productId}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">السعر عند الطلب</p>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={() =>
                        addToCartMutation.mutate({
                          productId: item.productId,
                          quantity: 1,
                        })
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <ShoppingCart className="w-4 h-4 ml-2" />
                      أضف للسلة
                    </Button>
                    <Button
                      onClick={() =>
                        removeFromWishlistMutation.mutate(item.productId)
                      }
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold py-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      إزالة
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

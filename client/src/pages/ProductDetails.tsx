import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { formatSypWithCurrency, getProductImages } from "@/lib/formatters";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useContext();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [rentalDate, setRentalDate] = useState("");
  const [rentalMessage, setRentalMessage] = useState<string | null>(null);

  const productId = id ? parseInt(id) : 0;

  // Fetch product details
  const { data: product, isLoading: productLoading } =
    trpc.products.byId.useQuery(productId, {
      enabled: !!productId,
    });

  // Fetch reviews
  const { data: reviews = [] } = trpc.reviews.byProduct.useQuery(productId, {
    enabled: !!productId,
  });

  // Check if in wishlist
  const { data: inWishlist } = trpc.wishlist.isInWishlist.useQuery(productId, {
    enabled: !!user && !!productId,
  });

  // Mutations
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      void utils.cart.list.invalidate();
      toast.success("تم إضافة المنتج إلى السلة بنجاح ✓");
    },
    onError: (error: any) => {
      console.error("Cart error:", error);
      if (
        error?.message?.includes("UNAUTHORIZED") ||
        error?.message?.includes("unauthorized")
      ) {
        toast.error("انتهت جلستك، يرجى تسجيل الدخول مجدداً");
        setTimeout(() => {
          window.location.href = getLoginUrl();
        }, 500);
      } else {
        toast.error("فشل إضافة المنتج إلى السلة");
      }
    },
  });

  const rentalRequestMutation = trpc.rentals.request.useMutation({
    onSuccess: result => {
      setRentalMessage(result.message);
      toast.success(result.message);
      void utils.rentals.myRequests.invalidate();
    },
    onError: error => {
      setRentalMessage(error.message || "تعذر إرسال طلب الإيجار");
      toast.error(error.message || "تعذر إرسال طلب الإيجار");
    },
  });

  const addToWishlistMutation = trpc.wishlist.add.useMutation({
    onSuccess: () => {
      setIsWishlisted(true);
      toast.success("تم إضافة المنتج إلى المفضلة ♥");
    },
    onError: (error: any) => {
      console.error("Wishlist error:", error);
      toast.error("فشل إضافة المنتج إلى المفضلة");
    },
  });

  const removeFromWishlistMutation = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      setIsWishlisted(false);
      toast.success("تم إزالة المنتج من المفضلة");
    },
    onError: (error: any) => {
      console.error("Remove wishlist error:", error);
      toast.error("فشل إزالة المنتج من المفضلة");
    },
  });

  useEffect(() => {
    if (inWishlist !== undefined) {
      setIsWishlisted(inWishlist);
    }
  }, [inWishlist]);

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">المنتج غير موجود</p>
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

  const images = getProductImages(product);
  const isSellable = product.isSellable !== false;
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum: number, r: any) => sum + parseInt(r.rating || "0"),
            0
          ) / reviews.length
        ).toFixed(1)
      : 0;

  const handleAddToCart = () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 500);
      return;
    }
    addToCartMutation.mutate({ productId, quantity });
  };

  const handleWishlist = () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 500);
      return;
    }

    if (isWishlisted) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <button onClick={() => navigate("/")} className="hover:text-blue-600">
            الرئيسية
          </button>
          <span>/</span>
          <button onClick={() => navigate("/")} className="hover:text-blue-600">
            المنتجات
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="bg-white rounded-2xl overflow-hidden mb-4 aspect-square flex items-center justify-center">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain bg-[#f8f8f8] p-2"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? "border-blue-600"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain bg-[#f8f8f8] p-1.5"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Badge */}
            {product.badge && (
              <div
                className={`inline-block ${product.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-lg mb-4`}
              >
                {product.badge}
              </div>
            )}

            {/* Title */}
            <h1
              className="text-3xl md:text-4xl font-black text-gray-900 mb-2"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {product.name}
            </h1>
            <p
              className="text-blue-600 text-sm font-semibold mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {product.brand}
            </p>
            <p className="mb-4 text-xs font-mono text-gray-500" dir="ltr">
              معرف المنتج: {product.productCode}
            </p>

            {product.isRentable && product.rentalPrice && (
              <div
                className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <span className="font-bold">متاح للإيجار</span>
                <span className="mx-2">—</span>
                <span>
                  سعر الإيجار:{" "}
                  <strong>{formatSypWithCurrency(product.rentalPrice)}</strong>
                </span>
              </div>
            )}

            {product.isRentable && (
              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="mb-2 font-bold text-blue-900">
                  طلب استئجار المنتج
                </h3>
                <p className="mb-3 text-sm text-blue-700">
                  حدد تاريخ الاستئجار ثم اضغط تأكيد الطلب. سيظهر الطلب قيد
                  المعالجة حتى تتم مراجعته.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={rentalDate}
                    onChange={event => setRentalDate(event.target.value)}
                    className="h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm"
                    aria-label="تاريخ طلب الإيجار"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        window.location.href = getLoginUrl();
                        return;
                      }
                      if (!rentalDate) {
                        toast.error("يرجى تحديد تاريخ الإيجار");
                        return;
                      }
                      rentalRequestMutation.mutate({ productId, rentalDate });
                    }}
                    disabled={rentalRequestMutation.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {rentalRequestMutation.isPending
                      ? "جارٍ التحقق..."
                      : "تأكيد طلب الإيجار"}
                  </Button>
                </div>
                {rentalMessage && (
                  <p className="mt-3 text-sm font-semibold text-blue-900">
                    {rentalMessage}
                  </p>
                )}
              </div>
            )}

            {(product.color || product.size) && (
              <div
                className="mb-5 flex flex-wrap gap-2 text-sm"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                {product.color && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                    اللون: <strong>{product.color}</strong>
                  </span>
                )}
                {product.size && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                    المقاس: <strong>{product.size}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {avgRating} ({reviews.length} تقييم)
              </span>
            </div>

            {/* Price */}
            <div className="mb-8 border-b border-gray-200 pb-8">
              {isSellable ? (
                <>
                  <div className="mb-2 flex items-baseline gap-3">
                    <div
                      className="text-4xl font-black text-blue-600"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {formatSypWithCurrency(product.price)}
                    </div>
                    {product.oldPrice && (
                      <div
                        className="text-xl text-gray-400 line-through"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {formatSypWithCurrency(product.oldPrice)}
                      </div>
                    )}
                  </div>
                  {(product.stock ?? 0) > 0 ? (
                    <p className="text-green-600 text-sm font-semibold">
                      متوفر في المخزون
                    </p>
                  ) : (
                    <p className="text-red-600 text-sm font-semibold">
                      غير متوفر حالياً
                    </p>
                  )}
                </>
              ) : (
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                  هذا المنتج غير متاح للبيع حاليًا
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h3
                  className="font-bold text-gray-900 mb-3"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  الوصف
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: "'Tajawal', sans-serif" }}
                >
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity & CTA */}
            {isSellable && (
              <div className="mb-8 flex gap-4">
                <div className="flex items-center border border-gray-300 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center border-0 outline-none"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={
                    (product.stock ?? 0) === 0 || addToCartMutation.isPending
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  أضف للسلة
                </Button>

                <Button
                  onClick={handleWishlist}
                  variant="outline"
                  className="px-6 border-gray-300 hover:bg-gray-100"
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>

                <Button
                  variant="outline"
                  className="px-6 border-gray-300 hover:bg-gray-100"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Features */}
            <div className="space-y-3 bg-gray-50 rounded-xl p-6">
              {[
                { icon: Truck, title: "توصيل سريع", desc: "خلال 24-48 ساعة" },
                { icon: Shield, title: "ضمان أصالة", desc: "100% أصلي مضمون" },
                { icon: RefreshCw, title: "إرجاع مجاني", desc: "خلال 14 يوم" },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p
                        className="font-semibold text-gray-900 text-sm"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        {feature.title}
                      </p>
                      <p className="text-gray-600 text-xs">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <h2
            className="text-2xl font-black text-gray-900 mb-6"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            التقييمات ({reviews.length})
          </h2>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.slice(0, 5).map(review => (
                <div
                  key={review.id}
                  className="border-b border-gray-100 pb-6 last:border-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{review.comment}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>مفيد ({review.helpful})</span>
                    {review.verified && (
                      <span className="text-green-600">✓ تم التحقق</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              لا توجد تقييمات حتى الآن
            </p>
          )}

          {/* Write Review Button */}
          {user && (
            <Button
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              اكتب تقييماً
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatSypWithCurrency } from "@/lib/formatters";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  "الدفع عند الاستلام",
  "بطاقة ائتمان",
  "تحويل بنكي",
  "Apple Pay",
  "Google Pay",
];

type SavedOrder = {
  orderId: number | null;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    title?: string | null;
    image?: string | null;
  }>;
};

const orderStatusLabel: Record<string, string> = {
  pending: "بانتظار المراجعة",
  processing: "قيد التجهيز في المستودع",
  shipped: "خرج من المستودع",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

const paymentStatusLabel: Record<string, string> = {
  unpaid: "غير مدفوع",
  paid: "تم الدفع",
  refunded: "تم رد المبلغ",
};

export default function ShoppingCart() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useContext();

  const [userDetails, setUserDetails] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [paymentMethod, setPaymentMethod] = useState("الدفع عند الاستلام");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [savedOrder, setSavedOrder] = useState<SavedOrder | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  useEffect(() => {
    setUserDetails({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
  }, [user]);

  const { data: cartItems = [], refetch } = trpc.cart.list.useQuery(undefined, {
    enabled: !!user,
  });

  const removeFromCartMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم إزالة المنتج من السلة");
    },
  });

  const setRentalDateMutation = trpc.cart.setRentalDate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم حفظ تاريخ الإيجار");
    },
    onError: error => toast.error(error.message || "تاريخ الإيجار غير صالح"),
  });

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const clearCartMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم تفريغ السلة");
    },
  });

  const checkoutMutation = trpc.cart.checkout.useMutation({
    onSuccess: data => {
      refetch();
      setSavedOrder(data as SavedOrder);
      setCheckoutSuccess(true);
      setIsFinalized(true);
      toast.success("تم حفظ الطلب النهائي؛ يمكنك متابعة حالته من صفحة الطلبات");
    },
    onError: error => {
      toast.error(error.message || "فشل حفظ الطلب النهائي");
    },
  });

  const updateUserMutation = trpc.auth.localLogin.useMutation({
    onSuccess: async data => {
      if (typeof window !== "undefined" && data?.sessionToken) {
        window.localStorage.setItem("manus-session-token", data.sessionToken);
      }
      await utils.auth.me.invalidate();
      toast.success("تم حفظ بيانات العميل بنجاح");
    },
    onError: error => {
      toast.error(error.message || "فشل حفظ بيانات العميل");
    },
  });

  const handleSaveDetails = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userDetails.email.trim()) {
      toast.error("البريد الإلكتروني مطلوب");
      return;
    }

    updateUserMutation.mutate({
      email: userDetails.email.trim(),
      name: userDetails.name.trim() || undefined,
      phone: userDetails.phone.trim() || undefined,
      address: userDetails.address.trim() || undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">
            جارٍ التحقق من حالة التسجيل...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">
            يرجى تسجيل الدخول لعرض السلة
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-blue-600 hover:bg-blue-700"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  const total = cartItems.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        (item.productPrice ? parseFloat(item.productPrice.toString()) : 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1
              className="text-3xl font-black text-gray-900 mt-4"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              سلة التسوق
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-gray-600">مرحباً، {user.name || "عميل"}</p>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setShowCustomerDetails(prev => !prev)}
              >
                {showCustomerDetails
                  ? "إخفاء بيانات العميل"
                  : `تعديل بيانات ${user.name || "العميل"}`}
              </Button>
            </div>
          </div>
          <span className="text-gray-600 text-sm">
            عدد المنتجات: {cartItems.length}
          </span>
        </div>

        {checkoutSuccess && (
          <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-lg">تم إكمال الشراء بنجاح</p>
                <p className="text-sm text-emerald-700">
                  تم نقل المنتجات إلى سجل الطلبات حتى لا تضيع بعد إفراغ السلة
                  الحالية.
                </p>
                {savedOrder && (
                  <div className="mt-4 grid gap-2 text-sm text-emerald-900 sm:grid-cols-3">
                    <span>
                      رقم الطلب: <strong>#{savedOrder.orderId ?? "—"}</strong>
                    </span>
                    <span>
                      الحالة:{" "}
                      <strong>
                        {orderStatusLabel[savedOrder.status] ||
                          savedOrder.status}
                      </strong>
                    </span>
                    <span>
                      الدفع:{" "}
                      <strong>
                        {paymentStatusLabel[savedOrder.paymentStatus] ||
                          savedOrder.paymentStatus}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
              {savedOrder && savedOrder.items.length > 0 && (
                <div className="mt-5 space-y-2 rounded-2xl border border-emerald-200 bg-white/70 p-4">
                  <p className="font-semibold">المنتجات المحفوظة في الطلب</p>
                  {savedOrder.items.map(item => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span>{item.title || `المنتج #${item.productId}`}</span>
                      <span>
                        الكمية: {item.quantity} ×{" "}
                        {formatSypWithCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    setCheckoutSuccess(false);
                    refetch();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  عرض السلة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                  onClick={() => navigate("/")}
                >
                  إضافة منتجات
                </Button>
              </div>
            </div>
          </div>
        )}

        {showCustomerDetails && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  بيانات العميل
                </h2>
                <p className="text-gray-500 text-sm">
                  تأكد من صحة الاسم والهاتف والعنوان قبل إكمال الطلب.
                </p>
              </div>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3"
                onClick={handleSaveDetails}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending
                  ? "جاري الحفظ..."
                  : "حفظ بيانات العميل"}
              </Button>
            </div>

            <form className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">الاسم</Label>
                <Input
                  id="customerName"
                  value={userDetails.name}
                  onChange={event =>
                    setUserDetails({ ...userDetails, name: event.target.value })
                  }
                  placeholder="مثال: أحمد"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">البريد الإلكتروني</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={userDetails.email}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">رقم الهاتف</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={userDetails.phone}
                  onChange={event =>
                    setUserDetails({
                      ...userDetails,
                      phone: event.target.value,
                    })
                  }
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">عنوان السكن</Label>
                <Input
                  id="customerAddress"
                  value={userDetails.address}
                  onChange={event =>
                    setUserDetails({
                      ...userDetails,
                      address: event.target.value,
                    })
                  }
                  placeholder="مثال: حي التحلية، جدة"
                />
              </div>
            </form>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <p className="text-gray-600 text-lg mb-6">سلتك فارغة حالياً</p>
            <Button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              تسوق الآن
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 p-6 flex gap-6"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName || "صورة المنتج"}
                        className="w-full h-full object-contain bg-[#f8f8f8] p-1"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        صورة
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <p
                      className="font-bold text-gray-900 mb-1"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      {item.productName || `المنتج #${item.productId}`}
                    </p>
                    <p className="text-gray-600 text-sm mb-3">
                      الكمية: {item.quantity}
                    </p>
                    <p className="text-gray-600 text-sm mb-3">
                      السعر لكل وحدة:{" "}
                      {item.productPrice
                        ? formatSypWithCurrency(item.productPrice)
                        : "-"}
                    </p>
                    {item.isRentable && (
                      <div className="mb-3 max-w-xs space-y-1">
                        <Label htmlFor={`rental-date-${item.id}`}>
                          تاريخ طلب الإيجار
                        </Label>
                        <Input
                          id={`rental-date-${item.id}`}
                          type="date"
                          min={new Date().toISOString().slice(0, 10)}
                          value={item.rentalDate || ""}
                          disabled={isFinalized}
                          onChange={event =>
                            setRentalDateMutation.mutate({
                              productId: item.productId,
                              rentalDate: event.target.value || null,
                            })
                          }
                        />
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 w-fit">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            productId: item.productId,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                        disabled={isFinalized}
                        className="p-1 hover:bg-gray-100 rounded disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            productId: item.productId,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={isFinalized}
                        className="p-1 hover:bg-gray-100 rounded disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="text-right flex flex-col justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        removeFromCartMutation.mutate(item.productId)
                      }
                      disabled={isFinalized}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div
                      className="text-lg font-bold text-blue-600"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {formatSypWithCurrency(
                        item.quantity *
                          (item.productPrice
                            ? parseFloat(item.productPrice.toString())
                            : 0)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-8">
              <h3
                className="font-bold text-gray-900 mb-6 text-lg"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                ملخص الطلب
              </h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatSypWithCurrency(total)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>الشحن</span>
                  <span className="text-green-600 font-semibold">مجاني</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>الضريبة</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatSypWithCurrency(total * 0.15)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={event => setPaymentMethod(event.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900">المجموع</span>
                <span
                  className="text-2xl font-black text-blue-600"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {formatSypWithCurrency(total * 1.15)}
                </span>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mb-3"
                onClick={() => {
                  if (!paymentMethod) {
                    toast.error("يرجى اختيار طريقة الدفع");
                    return;
                  }
                  checkoutMutation.mutate({ paymentMethod });
                }}
                disabled={
                  checkoutMutation.isPending ||
                  cartItems.length === 0 ||
                  isFinalized
                }
              >
                {checkoutMutation.isPending
                  ? "جارٍ حفظ الطلب النهائي..."
                  : isFinalized
                    ? "تم حفظ الطلب نهائيًا"
                    : "حفظ نهائي"}
              </Button>

              <Button
                variant="secondary"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 rounded-xl mb-3"
                onClick={() => navigate("/orders")}
              >
                عرض الطلبات
              </Button>

              <Button
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 rounded-xl"
                onClick={() => navigate("/")}
              >
                متابعة التسوق
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

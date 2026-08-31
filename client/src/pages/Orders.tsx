import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { formatSypWithCurrency } from "@/lib/formatters";

const orderStatusLabel: Record<string, string> = {
  pending: "بانتظار المراجعة",
  processing: "قيد التجهيز في المستودع",
  shipped: "خرج من المستودع",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

const rentalStatusLabel: Record<string, string> = {
  pending: "قيد المعالجة",
  unavailable: "غير ممكن للإيجار",
  approved: "تم تأكيد الطلب",
  returned: "تم إرجاع المنتج",
  cancelled: "ملغى",
};

const paymentStatusLabel: Record<string, string> = {
  unpaid: "غير مدفوع",
  paid: "تم الدفع",
  refunded: "تم رد المبلغ",
};

export default function Orders() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = trpc.cart.orders.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: rentalRequests = [], isLoading: rentalRequestsLoading } =
    trpc.rentals.myRequests.useQuery(undefined, {
      enabled: !!user,
    });

  const updateStatusMutation = trpc.cart.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      refetch();
    },
    onError: error => {
      toast.error(error.message || "فشل تحديث حالة الطلب");
    },
  });

  const updateItemsMutation = trpc.cart.updateItems.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ التعديلات على الطلب");
      setEditingOrders([]);
      refetch();
    },
    onError: error => {
      toast.error(error.message || "فشل حفظ التعديلات");
    },
  });

  type OrderItem = {
    productId: number;
    quantity: number;
    price: number;
    title?: string | null;
    image?: string | null;
  };
  type OrderMetadata = {
    paymentMethod: string;
    shippingAddress: string | null;
  };

  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [editingOrders, setEditingOrders] = useState<number[]>([]);
  const [editedOrderItems, setEditedOrderItems] = useState<
    Record<number, OrderItem[]>
  >({});
  const [editedOrderMetadata, setEditedOrderMetadata] = useState<
    Record<number, OrderMetadata>
  >({});

  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

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
            يرجى تسجيل الدخول لعرض الطلبات
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

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container">
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
              الطلبات الخاصة بك
            </h1>
            <p className="text-gray-600 mt-2">
              يمكنك مشاهدة سجل طلباتك، حالة الدفع، وطريقة الدفع لكل طلب.
            </p>
          </div>
          <Button
            onClick={() => navigate("/cart")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            العودة إلى السلة
          </Button>
        </div>

        <Card className="mb-8 border-blue-100 shadow-sm">
          <CardHeader>
            <CardTitle>طلبات الإيجار</CardTitle>
            <CardDescription>
              تابع حالة طلبات استئجار المنتجات والتواريخ المحددة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rentalRequestsLoading ? (
              <p className="text-sm text-gray-500">
                جارٍ تحميل طلبات الإيجار...
              </p>
            ) : rentalRequests.length === 0 ? (
              <p className="text-sm text-gray-500">
                لا توجد طلبات إيجار حتى الآن.
              </p>
            ) : (
              <div className="space-y-3">
                {rentalRequests.map(request => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {request.productName || `المنتج #${request.productId}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        تاريخ الإيجار: {request.rentalDate}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${request.status === "approved" ? "bg-emerald-100 text-emerald-700" : request.status === "unavailable" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {rentalStatusLabel[request.status] || request.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جارٍ تحميل الطلبات...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <p className="text-gray-600 text-lg mb-6">
              لم يتم العثور على أي طلبات حتى الآن
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              العودة إلى المتجر
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <Card key={order.id} className="border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">طلب #{order.id}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        تاريخ الطلب:{" "}
                        {new Date(order.createdAt).toLocaleString("ar-SA")}
                      </CardDescription>
                    </div>
                    <div className="space-y-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (order.status !== "shipped") {
                            toast.info(
                              "سيظهر زر تأكيد التسليم بعد خروج الطلب من المستودع"
                            );
                            return;
                          }
                          updateStatusMutation.mutate({
                            orderId: order.id,
                            status: "delivered",
                          });
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          order.status === "delivered"
                            ? "bg-emerald-600 text-white"
                            : order.status === "shipped"
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }}`}
                      >
                        {order.status === "delivered"
                          ? "تم تسليم الطلب"
                          : order.status === "shipped"
                            ? "تأكيد استلام الطلب"
                            : orderStatusLabel[order.status || "pending"] ||
                              order.status ||
                              "pending"}
                      </button>
                      {(order.status === "pending" ||
                        order.status === "processing") && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!editedOrderItems[order.id]) {
                              const normalizedItems = Array.isArray(order.items)
                                ? order.items
                                : typeof order.items === "string"
                                  ? (() => {
                                      try {
                                        const parsed = JSON.parse(order.items);
                                        return Array.isArray(parsed)
                                          ? parsed
                                          : [];
                                      } catch {
                                        return [];
                                      }
                                    })()
                                  : [];

                              setEditedOrderItems(prev => ({
                                ...prev,
                                [order.id]: normalizedItems.map(item => ({
                                  productId: item.productId,
                                  quantity: item.quantity,
                                  price: item.price,
                                  title: item.title,
                                  image: item.image,
                                })),
                              }));
                            }

                            if (!editedOrderMetadata[order.id]) {
                              setEditedOrderMetadata(prev => ({
                                ...prev,
                                [order.id]: {
                                  paymentMethod: order.paymentMethod || "",
                                  shippingAddress: order.shippingAddress || "",
                                },
                              }));
                            }

                            setEditingOrders(prev =>
                              prev.includes(order.id)
                                ? prev.filter(id => id !== order.id)
                                : [...prev, order.id]
                            );
                            if (!expandedOrders.includes(order.id)) {
                              setExpandedOrders(prev => [...prev, order.id]);
                            }
                          }}
                          className="rounded-full px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                        >
                          تعديل المنتج أو حذف
                        </button>
                      )}
                      <div className="text-sm text-gray-700">
                        حالة الطلب:{" "}
                        <strong>
                          {orderStatusLabel[order.status || "pending"] ||
                            order.status ||
                            "pending"}
                        </strong>
                      </div>
                      <div className="text-sm text-gray-700">
                        مدة الانتظار:{" "}
                        <strong>
                          {order.estimatedDeliveryMinutes == null
                            ? "غير محددة"
                            : `${order.estimatedDeliveryMinutes} دقيقة`}
                        </strong>
                      </div>
                      <div className="text-sm text-gray-700">
                        حالة الدفع:{" "}
                        <strong>
                          {paymentStatusLabel[
                            order.paymentStatus || "unpaid"
                          ] ||
                            order.paymentStatus ||
                            "غير محددة"}
                        </strong>
                      </div>
                      <div className="text-sm text-gray-600">
                        طريقة الدفع: {order.paymentMethod}
                      </div>
                      <div className="text-sm text-gray-600">
                        العنوان: {order.shippingAddress || "غير محدد"}
                      </div>
                      <div className="text-sm text-gray-600">
                        المجموع: {formatSypWithCurrency(order.totalPrice)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-500">التفاصيل</div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrders(prev =>
                          prev.includes(order.id)
                            ? prev.filter(id => id !== order.id)
                            : [...prev, order.id]
                        )
                      }
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      {expandedOrders.includes(order.id)
                        ? "إخفاء المنتجات"
                        : "عرض المنتجات"}
                      {expandedOrders.includes(order.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedOrders.includes(order.id) && (
                    <div className="space-y-3">
                      {(() => {
                        const normalizedItems = (() => {
                          if (Array.isArray(order.items)) return order.items;
                          if (typeof order.items === "string") {
                            try {
                              const parsed = JSON.parse(order.items);
                              return Array.isArray(parsed) ? parsed : [];
                            } catch {
                              return [];
                            }
                          }
                          return [];
                        })();

                        const displayedItems = editingOrders.includes(order.id)
                          ? (editedOrderItems[order.id] ?? normalizedItems)
                          : normalizedItems;

                        if (
                          !Array.isArray(displayedItems) ||
                          displayedItems.length === 0
                        ) {
                          return (
                            <p className="text-gray-500">
                              لا توجد منتجات في هذا الطلب.
                            </p>
                          );
                        }

                        return displayedItems.map((item, index) => {
                          const editedItems =
                            editedOrderItems[order.id] ?? normalizedItems;
                          const itemQuantity =
                            editedItems.find(
                              it => it.productId === item.productId
                            )?.quantity ?? item.quantity;
                          return (
                            <div
                              key={index}
                              className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                                {item.image && item.image.toString().trim() ? (
                                  <img
                                    src={item.image}
                                    alt={
                                      item.title && item.title.toString().trim()
                                        ? item.title
                                        : `منتج ${item.productId}`
                                    }
                                    className="h-24 w-24 rounded-xl object-contain bg-[#f8f8f8] p-1"
                                  />
                                ) : (
                                  <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
                                    صورة
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {item.title && item.title.toString().trim()
                                      ? item.title
                                      : `المنتج #${item.productId}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    الكمية: {item.quantity}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    سعر الوحدة:{" "}
                                    {formatSypWithCurrency(item.price)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3 sm:items-center sm:flex-row">
                                {(order.status === "pending" ||
                                  order.status === "processing") && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!editedOrderItems[order.id]) {
                                        setEditedOrderItems(prev => ({
                                          ...prev,
                                          [order.id]: normalizedItems,
                                        }));
                                      }
                                      setEditingOrders(prev =>
                                        prev.includes(order.id)
                                          ? prev
                                          : [...prev, order.id]
                                      );
                                      setEditedOrderItems(prev => ({
                                        ...prev,
                                        [order.id]: (
                                          prev[order.id] ?? normalizedItems
                                        ).filter(
                                          it => it.productId !== item.productId
                                        ),
                                      }));
                                    }}
                                    className="rounded-full border border-red-300 bg-white px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    حذف المنتج
                                  </button>
                                )}
                                {editingOrders.includes(order.id) ? (
                                  <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-2 py-1">
                                    <button
                                      type="button"
                                      disabled={itemQuantity <= 1}
                                      onClick={() => {
                                        setEditedOrderItems(prev => ({
                                          ...prev,
                                          [order.id]: prev[order.id].map(it =>
                                            it.productId === item.productId
                                              ? {
                                                  ...it,
                                                  quantity: Math.max(
                                                    1,
                                                    it.quantity - 1
                                                  ),
                                                }
                                              : it
                                          ),
                                        }));
                                      }}
                                      className="rounded-full px-2 py-1 text-gray-700 disabled:opacity-50"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      value={itemQuantity}
                                      onChange={event => {
                                        const quantity = Math.max(
                                          1,
                                          Number(event.target.value) || 1
                                        );
                                        setEditedOrderItems(prev => ({
                                          ...prev,
                                          [order.id]: prev[order.id].map(it =>
                                            it.productId === item.productId
                                              ? { ...it, quantity }
                                              : it
                                          ),
                                        }));
                                      }}
                                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-center text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditedOrderItems(prev => ({
                                          ...prev,
                                          [order.id]: prev[order.id].map(it =>
                                            it.productId === item.productId
                                              ? {
                                                  ...it,
                                                  quantity: it.quantity + 1,
                                                }
                                              : it
                                          ),
                                        }));
                                      }}
                                      className="rounded-full px-2 py-1 text-gray-700"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        });
                      })()}

                      {editingOrders.includes(order.id) && (
                        <div className="space-y-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-2 text-sm text-gray-700">
                              <span>طريقة الدفع</span>
                              <input
                                type="text"
                                value={
                                  editedOrderMetadata[order.id]
                                    ?.paymentMethod ??
                                  order.paymentMethod ??
                                  ""
                                }
                                onChange={event =>
                                  setEditedOrderMetadata(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...(prev[order.id] ?? {
                                        paymentMethod:
                                          order.paymentMethod || "",
                                        shippingAddress:
                                          order.shippingAddress || "",
                                      }),
                                      paymentMethod: event.target.value,
                                    },
                                  }))
                                }
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-2 text-sm text-gray-700">
                              <span>الموقع / العنوان</span>
                              <input
                                type="text"
                                value={
                                  editedOrderMetadata[order.id]
                                    ?.shippingAddress ??
                                  order.shippingAddress ??
                                  ""
                                }
                                onChange={event =>
                                  setEditedOrderMetadata(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...(prev[order.id] ?? {
                                        paymentMethod:
                                          order.paymentMethod || "",
                                        shippingAddress:
                                          order.shippingAddress || "",
                                      }),
                                      shippingAddress: event.target.value,
                                    },
                                  }))
                                }
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {editingOrders.includes(order.id) && (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              const editedItems =
                                editedOrderItems[order.id] ?? [];
                              const metadata = editedOrderMetadata[
                                order.id
                              ] ?? {
                                paymentMethod: order.paymentMethod || "",
                                shippingAddress: order.shippingAddress || "",
                              };
                              updateItemsMutation.mutate({
                                orderId: order.id,
                                items: editedItems.map(item => ({
                                  productId: item.productId,
                                  quantity: item.quantity,
                                  price: item.price,
                                  title: item.title ?? undefined,
                                  image: item.image ?? undefined,
                                })),
                                paymentMethod: metadata.paymentMethod,
                                shippingAddress:
                                  metadata.shippingAddress || undefined,
                              });
                            }}
                          >
                            حفظ التعديلات
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() =>
                              setEditingOrders(prev =>
                                prev.filter(id => id !== order.id)
                              )
                            }
                          >
                            إلغاء
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

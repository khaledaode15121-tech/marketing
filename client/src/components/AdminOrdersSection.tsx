import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatSypWithCurrency } from "@/lib/formatters";

const STATUS_OPTIONS = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "processing", label: "قيد التجهيز" },
  { value: "shipped", label: "قيد الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغى" },
] as const;

const statusLabels = Object.fromEntries(
  STATUS_OPTIONS.map(item => [item.value, item.label])
);

type OrderItem = {
  productId: number;
  quantity: number;
  price: number;
  title?: string | null;
};

export default function AdminOrdersSection() {
  const {
    data: orders = [],
    isLoading,
    refetch,
  } = trpc.dashboard.orders.list.useQuery();
  const [drafts, setDrafts] = useState<
    Record<number, { status: string; minutes: string }>
  >({});
  const updateMutation = trpc.dashboard.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب ومدة الانتظار");
      refetch();
    },
    onError: error => toast.error(error.message || "تعذر تحديث الطلب"),
  });

  const getDraft = (order: (typeof orders)[number]) =>
    drafts[order.id] ?? {
      status: order.status || "pending",
      minutes:
        order.estimatedDeliveryMinutes == null
          ? ""
          : String(order.estimatedDeliveryMinutes),
    };

  if (isLoading)
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
        جارٍ تحميل الطلبات...
      </div>
    );
  if (orders.length === 0)
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
        لا توجد طلبات لمراجعتها حتى الآن.
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const draft = getDraft(order);
        const items: OrderItem[] = Array.isArray(order.items)
          ? order.items
          : [];
        return (
          <Card key={order.id} className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-lg">طلب #{order.id}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.customerName || "عميل"} —{" "}
                    {order.customerPhone || "بدون هاتف"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString("ar-SA")}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[180px_150px_auto]">
                  <select
                    value={draft.status}
                    onChange={event =>
                      setDrafts(prev => ({
                        ...prev,
                        [order.id]: { ...draft, status: event.target.value },
                      }))
                    }
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    aria-label={`حالة الطلب ${order.id}`}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    value={draft.minutes}
                    onChange={event =>
                      setDrafts(prev => ({
                        ...prev,
                        [order.id]: { ...draft, minutes: event.target.value },
                      }))
                    }
                    placeholder="مدة الانتظار بالدقائق"
                    aria-label={`مدة انتظار الطلب ${order.id}`}
                  />
                  <Button
                    onClick={() =>
                      updateMutation.mutate({
                        orderId: order.id,
                        status: draft.status as
                          | "pending"
                          | "processing"
                          | "shipped"
                          | "delivered"
                          | "cancelled",
                        estimatedDeliveryMinutes:
                          draft.minutes.trim() === ""
                            ? null
                            : Number(draft.minutes),
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    حفظ التحديث
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-4">
                <span>
                  الحالة:{" "}
                  <strong>
                    {statusLabels[order.status || "pending"] || order.status}
                  </strong>
                </span>
                <span>
                  المجموع:{" "}
                  <strong>{formatSypWithCurrency(order.totalPrice)}</strong>
                </span>
                <span>
                  الانتظار:{" "}
                  <strong>
                    {order.estimatedDeliveryMinutes == null
                      ? "غير محدد"
                      : `${order.estimatedDeliveryMinutes} دقيقة`}
                  </strong>
                </span>
                <span>
                  العنوان:{" "}
                  <strong>{order.shippingAddress || "غير محدد"}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map(item => (
                  <span
                    key={`${order.id}-${item.productId}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                  >
                    {item.title || `منتج #${item.productId}`} × {item.quantity}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

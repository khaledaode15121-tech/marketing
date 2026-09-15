import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatSypWithCurrency } from "@/lib/formatters";

const STATUS_OPTIONS = [
  { value: "pending", label: "تم طلب الزبون" },
  { value: "processing", label: "قيد المراجعة" },
  { value: "shipped", label: "تم إرسال الطلبية" },
  { value: "delivered", label: "تم تسليم الطلبية والدفع" },
  { value: "contact_failed", label: "لم يتم التسليم بسبب مشكلة في التواصل" },
  { value: "cancelled", label: "تم إلغاء الطلبية" },
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

type CatalogProduct = {
  id: number;
  name?: string | null;
  categoryId?: number | null;
  brandId?: number | null;
  category?: string | null;
  brand?: string | null;
};

type CatalogCategory = {
  id: number;
  name?: string | null;
  sectionId?: number | null;
};

type CatalogSection = {
  id: number;
  name?: string | null;
};

export default function AdminOrdersSection() {
  const {
    data: orders = [],
    isLoading,
    refetch,
  } = trpc.dashboard.orders.list.useQuery();
  const { data: products = [] } = trpc.dashboard.products.list.useQuery();
  const { data: categories = [] } = trpc.dashboard.categories.list.useQuery();
  const { data: sections = [] } = trpc.dashboard.brands.list.useQuery();
  const utils = trpc.useContext();
  const [drafts, setDrafts] = useState<
    Record<number, { status: string; minutes: string }>
  >({});
  const updateMutation = trpc.dashboard.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب ومدة الانتظار");
      refetch();
      void utils.dashboard.finance.sales.list.invalidate();
      void utils.dashboard.finance.summary.invalidate();
    },
    onError: error => toast.error(error.message || "تعذر تحديث الطلب"),
  });

  const productById = useMemo(
    () => new Map((products as CatalogProduct[]).map(product => [product.id, product])),
    [products]
  );
  const categoryById = useMemo(
    () => new Map((categories as CatalogCategory[]).map(category => [category.id, category])),
    [categories]
  );
  const sectionById = useMemo(
    () => new Map((sections as CatalogSection[]).map(section => [section.id, section])),
    [sections]
  );

  const getOrderItems = (value: unknown): OrderItem[] => {
    if (Array.isArray(value)) return value as OrderItem[];
    if (typeof value !== "string") return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as OrderItem[]) : [];
    } catch {
      return [];
    }
  };

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
        const items = getOrderItems(order.items);
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
                          | "contact_failed"
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
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-800">تفاصيل المنتجات</p>
                {items.length === 0 ? (
                  <p className="text-xs text-gray-500">لا توجد تفاصيل للمنتجات.</p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {items.map((item, index) => {
                      const product = productById.get(Number(item.productId));
                      const category = product?.categoryId
                        ? categoryById.get(Number(product.categoryId))
                        : undefined;
                      const section = category?.sectionId
                        ? sectionById.get(Number(category.sectionId))
                        : product?.brandId
                          ? sectionById.get(Number(product.brandId))
                          : undefined;
                      return (
                        <div
                          key={`${order.id}-${item.productId}-${index}`}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700"
                        >
                          <div className="grid gap-1 sm:grid-cols-2">
                            <span>
                              القسم: <strong>{section?.name || product?.brand || "غير محدد"}</strong>
                            </span>
                            <span>
                              الفئة: <strong>{category?.name || product?.category || "غير محددة"}</strong>
                            </span>
                            <span>
                              المنتج: <strong>{product?.name || item.title || `منتج #${item.productId}`}</strong>
                            </span>
                            <span>
                              العدد: <strong>{item.quantity}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

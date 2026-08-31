import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { formatSypWithCurrency } from "@/lib/formatters";

const requestStatusLabel: Record<string, string> = {
  pending: "قيد المعالجة",
  unavailable: "غير ممكن للإيجار",
  approved: "تم الحجز",
  returned: "تم إرجاع المنتج",
  cancelled: "ملغى",
};

export default function AdminRentalSection() {
  const requestsQuery = trpc.dashboard.rentals.requests.list.useQuery();
  const bookingsQuery = trpc.dashboard.rentals.bookings.list.useQuery();
  const utils = trpc.useContext();
  const [paymentsByRequest, setPaymentsByRequest] = useState<
    Record<number, string>
  >({});
  const [notifyByRequest, setNotifyByRequest] = useState<
    Record<number, boolean>
  >({});
  const approveMutation = trpc.dashboard.rentals.requests.approve.useMutation({
    onSuccess: () => {
      toast.success("تم تأكيد الطلب وتسجيل الدفعة والحجز");
      void utils.dashboard.rentals.requests.list.invalidate();
      void utils.dashboard.rentals.bookings.list.invalidate();
      void utils.rentals.myRequests.invalidate();
    },
    onError: error => toast.error(error.message || "تعذر اعتماد الطلب"),
  });
  const rejectMutation = trpc.dashboard.rentals.requests.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض طلب الإيجار");
      void utils.dashboard.rentals.requests.list.invalidate();
      void utils.rentals.myRequests.invalidate();
    },
    onError: error => toast.error(error.message || "تعذر رفض الطلب"),
  });
  const paymentsMutation =
    trpc.dashboard.rentals.bookings.updatePayments.useMutation({
      onSuccess: () => {
        toast.success("تم تحديث الدفعات وحساب الباقي");
        void utils.dashboard.rentals.bookings.list.invalidate();
      },
      onError: error => toast.error(error.message || "تعذر تحديث الدفعات"),
    });
  const returnMutation = trpc.dashboard.rentals.bookings.return.useMutation({
    onSuccess: () => {
      toast.success("تم إرجاع المنتج وحذف الحجز");
      void utils.dashboard.rentals.requests.list.invalidate();
      void utils.dashboard.rentals.bookings.list.invalidate();
      void utils.rentals.myRequests.invalidate();
    },
    onError: error => toast.error(error.message || "تعذر تسجيل الإرجاع"),
  });

  const isLoading = requestsQuery.isLoading || bookingsQuery.isLoading;
  if (isLoading)
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
        جارٍ تحميل طلبات الإيجار...
      </div>
    );

  return (
    <div className="space-y-6">
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle>طلبات الإيجار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(requestsQuery.data || []).length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد طلبات إيجار.</p>
          ) : (
            (requestsQuery.data || []).map(request => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    {request.productImage && (
                      <img
                        src={request.productImage}
                        alt={request.productName || "المنتج"}
                        className="h-12 w-12 rounded-lg object-contain bg-white"
                      />
                    )}
                    <p className="font-semibold text-gray-900">
                      {request.productName || `المنتج #${request.productId}`}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    العميل:{" "}
                    {request.customerName ||
                      request.customerEmail ||
                      "غير محدد"}{" "}
                    — {request.customerPhone || "بدون هاتف"}
                  </p>
                  <p className="text-sm text-gray-600">
                    تاريخ الإيجار: {request.rentalDate}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${request.status === "approved" ? "bg-emerald-100 text-emerald-700" : request.status === "unavailable" ? "bg-red-100 text-red-700" : request.status === "returned" ? "bg-gray-200 text-gray-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {requestStatusLabel[request.status] || request.status}
                  </span>
                  {request.status === "pending" && (
                    <>
                      <span className="text-sm">
                        سعر الإيجار:{" "}
                        <strong>
                          {formatSypWithCurrency(request.rentalPrice || 0)}
                        </strong>
                      </span>
                      <label className="flex items-center gap-2 text-sm">
                        الدفعة:
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentsByRequest[request.id] || ""}
                          onChange={event =>
                            setPaymentsByRequest(prev => ({
                              ...prev,
                              [request.id]: event.target.value,
                            }))
                          }
                          className="w-24 rounded border px-2 py-1"
                        />
                      </label>
                      <span className="text-sm text-red-600">
                        الباقي:{" "}
                        {formatSypWithCurrency(
                          Math.max(
                            0,
                            Number(request.rentalPrice || 0) -
                              Number(paymentsByRequest[request.id] || 0)
                          )
                        )}
                      </span>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={notifyByRequest[request.id] ?? true}
                          onChange={event =>
                            setNotifyByRequest(prev => ({
                              ...prev,
                              [request.id]: event.target.checked,
                            }))
                          }
                        />{" "}
                        إرسال WhatsApp
                      </label>
                      <Button
                        onClick={() =>
                          approveMutation.mutate({
                            requestId: request.id,
                            payments: paymentsByRequest[request.id] || "0",
                            notifyWhatsApp: notifyByRequest[request.id] ?? true,
                          })
                        }
                        disabled={approveMutation.isPending}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        تأكيد الطلب
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate(request.id)}
                        disabled={rejectMutation.isPending}
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        رفض الطلب
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-100 shadow-sm">
        <CardHeader>
          <CardTitle>جدول المنتجات المحجوزة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(bookingsQuery.data || []).length === 0 ? (
            <p className="text-sm text-gray-500">
              لا توجد منتجات محجوزة حاليًا.
            </p>
          ) : (
            (bookingsQuery.data || []).map(booking => (
              <div
                key={booking.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {booking.productName || `المنتج #${booking.productId}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    تاريخ الحجز: {booking.rentalDate}
                  </p>
                  <p className="text-sm text-gray-600">
                    العميل: {booking.customerName || "غير محدد"} —{" "}
                    {booking.customerPhone || "بدون هاتف"}
                  </p>
                  <div className="mt-2 text-sm">
                    <span>
                      حالة الحجز:{" "}
                      <strong className="text-emerald-700">
                        {booking.status === "booked"
                          ? "تم تأكيد الطلب"
                          : "قيد المعالجة"}
                      </strong>
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => returnMutation.mutate(booking.id)}
                  disabled={returnMutation.isPending}
                  className="bg-slate-700 text-white hover:bg-slate-800"
                >
                  تم إرجاع المنتج — إتاحة للحجز
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

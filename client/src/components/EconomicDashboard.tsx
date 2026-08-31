import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatSypWithCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const periods = [
  { value: "daily", label: "اليوم" },
  { value: "weekly", label: "هذا الأسبوع" },
  { value: "monthly", label: "هذا الشهر" },
] as const;

export default function EconomicDashboard() {
  const [period, setPeriod] =
    useState<(typeof periods)[number]["value"]>("daily");
  const [expense, setExpense] = useState({
    title: "",
    expenseCategory: "مصروف عام",
    amount: "",
    notes: "",
  });
  const [cash, setCash] = useState({
    type: "income" as "income" | "expense" | "adjustment",
    amount: "",
    description: "",
  });
  const summaryQuery = trpc.dashboard.finance.summary.useQuery({ period });
  const expensesQuery = trpc.dashboard.finance.expenses.list.useQuery();
  const salesQuery = trpc.dashboard.finance.sales.list.useQuery();
  const purchasesQuery = trpc.dashboard.finance.purchases.list.useQuery();
  const cashQuery = trpc.dashboard.finance.cash.list.useQuery();
  const utils = trpc.useContext();
  const createExpense = trpc.dashboard.finance.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة المصروف");
      setExpense({
        title: "",
        expenseCategory: "مصروف عام",
        amount: "",
        notes: "",
      });
      void utils.dashboard.finance.expenses.list.invalidate();
      void utils.dashboard.finance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const deleteExpense = trpc.dashboard.finance.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المصروف");
      void utils.dashboard.finance.expenses.list.invalidate();
      void utils.dashboard.finance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const createCash = trpc.dashboard.finance.cash.create.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل حركة الصندوق");
      setCash({ type: "income", amount: "", description: "" });
      void utils.dashboard.finance.cash.list.invalidate();
      void utils.dashboard.finance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const deleteCash = trpc.dashboard.finance.cash.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحركة");
      void utils.dashboard.finance.cash.list.invalidate();
      void utils.dashboard.finance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const summary = summaryQuery.data;

  const addExpense = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(expense.amount);
    if (!expense.title.trim() || !Number.isFinite(amount) || amount < 0)
      return toast.error("أدخل بيانات المصروف بشكل صحيح");
    createExpense.mutate({
      title: expense.title.trim(),
      expenseCategory: expense.expenseCategory.trim() || "مصروف عام",
      amount,
      notes: expense.notes.trim() || null,
    });
  };
  const addCash = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(cash.amount);
    if (!cash.description.trim() || !Number.isFinite(amount) || amount < 0)
      return toast.error("أدخل بيانات حركة الصندوق بشكل صحيح");
    createCash.mutate({
      type: cash.type,
      amount,
      description: cash.description.trim(),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-blue-100 shadow-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>الجدوى الاقتصادية</CardTitle>
            <p className="text-sm text-muted-foreground">
              ملخص المبيعات والمشتريات والمصروفات والصندوق حسب الفترة.
            </p>
          </div>
          <div className="flex gap-2 rounded-xl bg-muted p-1">
            {periods.map(item => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={period === item.value ? "default" : "ghost"}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["إيرادات المبيعات", summary?.revenue ?? 0, "text-blue-700"],
              ["مجمل الربح", summary?.grossProfit ?? 0, "text-emerald-700"],
              ["المشتريات", summary?.purchaseCost ?? 0, "text-orange-700"],
              ["المصروفات", summary?.expensesTotal ?? 0, "text-red-700"],
              ["صافي الربح", summary?.netProfit ?? 0, "text-purple-700"],
            ].map(([label, amount, color]) => (
              <div
                key={String(label)}
                className="rounded-2xl border bg-card p-4"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`mt-2 text-xl font-black ${color}`}>
                  {formatSypWithCurrency(Number(amount))}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-muted p-4">
            <span className="text-sm text-muted-foreground">
              رصيد الصندوق:{" "}
            </span>
            <strong className="text-lg">
              {formatSypWithCurrency(summary?.cashBalance ?? 0)}
            </strong>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="purchases">المشتريات</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="cash">الصندوق النقدي</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <LedgerTable
            title="سجل المبيعات"
            rows={salesQuery.data ?? []}
            amountKey="totalAmount"
            empty="لا توجد مبيعات مسجلة"
          />
        </TabsContent>
        <TabsContent value="purchases">
          <LedgerTable
            title="سجل المشتريات"
            rows={purchasesQuery.data ?? []}
            amountKey="totalAmount"
            empty="لا توجد مشتريات مسجلة"
          />
        </TabsContent>
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>إضافة مصروف</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addExpense} className="grid gap-3 md:grid-cols-4">
                <div>
                  <Label>البيان</Label>
                  <Input
                    value={expense.title}
                    onChange={event =>
                      setExpense({ ...expense, title: event.target.value })
                    }
                    placeholder="إيجار محل"
                  />
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Input
                    value={expense.expenseCategory}
                    onChange={event =>
                      setExpense({
                        ...expense,
                        expenseCategory: event.target.value,
                      })
                    }
                    placeholder="كهرباء"
                  />
                </div>
                <div>
                  <Label>المبلغ (ل.س)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={expense.amount}
                    onChange={event =>
                      setExpense({ ...expense, amount: event.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full" disabled={createExpense.isPending}>
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة
                  </Button>
                </div>
              </form>
              <div className="mt-5 space-y-2">
                {(expensesQuery.data ?? []).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <span className="mr-2 text-sm text-muted-foreground">
                        {item.expenseCategory}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <strong>{formatSypWithCurrency(item.amount)}</strong>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => deleteExpense.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {expensesQuery.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    لا توجد مصروفات مسجلة.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle>إضافة حركة للصندوق</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addCash} className="grid gap-3 md:grid-cols-4">
                <div>
                  <Label>النوع</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3"
                    value={cash.type}
                    onChange={event =>
                      setCash({
                        ...cash,
                        type: event.target.value as typeof cash.type,
                      })
                    }
                  >
                    <option value="income">إيراد</option>
                    <option value="expense">مصروف</option>
                    <option value="adjustment">تسوية</option>
                  </select>
                </div>
                <div>
                  <Label>المبلغ (ل.س)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={cash.amount}
                    onChange={event =>
                      setCash({ ...cash, amount: event.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>البيان</Label>
                  <Input
                    value={cash.description}
                    onChange={event =>
                      setCash({ ...cash, description: event.target.value })
                    }
                    placeholder="وصف الحركة"
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full" disabled={createCash.isPending}>
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة
                  </Button>
                </div>
              </form>
              <div className="mt-5 space-y-2">
                {(cashQuery.data ?? []).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <strong>{item.description}</strong>
                      <span className="mr-2 text-sm text-muted-foreground">
                        {item.type === "income"
                          ? "إيراد"
                          : item.type === "expense"
                            ? "مصروف"
                            : "تسوية"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <strong>{formatSypWithCurrency(item.amount)}</strong>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => deleteCash.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cashQuery.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    لا توجد حركات للصندوق.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LedgerTable({
  title,
  rows,
  amountKey,
  empty,
}: {
  title: string;
  rows: Array<Record<string, any>>;
  amountKey: string;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="space-y-2">
            {rows.map(row => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <div>
                  <strong>{row.productName}</strong>
                  <span className="mr-2 text-sm text-muted-foreground">
                    الكمية: {row.quantity}
                  </span>
                </div>
                <strong>{formatSypWithCurrency(row[amountKey])}</strong>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

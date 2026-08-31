import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ManagerManagement() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    // email and phone intentionally omitted for manager creation when selecting existing user
    selectedUserId: null as number | null,
    sectionIds: [] as number[],
  });
  const managers = trpc.dashboard.managers.list.useQuery();
  const categories = trpc.dashboard.categories.list.useQuery();
  const sections = trpc.dashboard.brands.list.useQuery();
  const users = trpc.dashboard.users.list.useQuery(); // list of all users to pick from when creating a manager
  const utils = trpc.useContext();
  const refreshManagerDependentData = async () => {
    await Promise.all([
      utils.dashboard.managers.list.invalidate(),
      utils.dashboard.users.list.invalidate(),
      utils.dashboard.brands.list.invalidate(),
      utils.dashboard.categories.list.invalidate(),
      utils.dashboard.products.list.invalidate(),
    ]);
  };
  const create = trpc.dashboard.managers.create.useMutation({
    onSuccess: async () => {
      toast.success("تم إنشاء حساب المدير");
      setForm({
        username: "",
        password: "",
        name: "",
        selectedUserId: null,
        sectionIds: [],
      });
      await refreshManagerDependentData();
    },
    onError: error => toast.error(error.message),
  });
  const promoteUser = trpc.dashboard.users.update.useMutation({
    onSuccess: async () => {
      toast.success("تم تعديل صلاحيات المستخدم بنجاح");
      setForm({
        username: "",
        password: "",
        name: "",
        selectedUserId: null,
        sectionIds: [],
      });
      await refreshManagerDependentData();
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.dashboard.managers.update.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث حساب المدير");
      setEditingId(null);
      setForm({
        username: "",
        password: "",
        name: "",
        selectedUserId: null,
        sectionIds: [],
      });
      await refreshManagerDependentData();
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.dashboard.managers.delete.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف حساب المدير");
      await refreshManagerDependentData();
    },
    onError: error => toast.error(error.message),
  });
  const sectionToCategoryIds = (sectionIds: number[]) => {
    const selected = new Set(sectionIds);
    return Array.from(
      new Set(
        (categories.data ?? [])
          .filter(category =>
            typeof category.sectionId === "number" && selected.has(category.sectionId)
          )
          .map(category => category.id)
      )
    );
  };

  const toggleSection = (id: number) =>
    setForm(current => ({
      ...current,
      sectionIds: current.sectionIds.includes(id)
        ? current.sectionIds.filter(item => item !== id)
        : [...current.sectionIds, id],
    }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const categoryIds = sectionToCategoryIds(form.sectionIds);
    if (editingId) {
      update.mutate({
        id: editingId,
        username: form.username,
        name: form.name,
        email: null,
        phone: null,
        password: form.password || undefined,
        categoryIds,
      });
      return;
    }

    if (form.selectedUserId) {
      const selectedUser = (users.data ?? []).find(u => u.id === form.selectedUserId);
      const username = form.username.trim() || selectedUser?.email?.split("@")[0] || `manager-${form.selectedUserId}`;
      const generatedPassword = form.password || username;
      promoteUser.mutate({
        id: form.selectedUserId,
        name: form.name,
        username,
        password: generatedPassword,
        role: "manager",
        categoryIds,
      });
      return;
    }

    create.mutate({
      username: form.username,
      password: form.password,
      name: form.name,
      role: "manager",
      categoryIds,
    });
  };
  const startEdit = (manager: any) => {
    const managerCategoryIds = manager.categoryIds ?? [];
    const sectionIds = Array.from(
      new Set(
        (categories.data ?? [])
          .filter(category => managerCategoryIds.includes(category.id))
          .map(category => category.sectionId)
          .filter((id): id is number => typeof id === "number")
      )
    );

    setEditingId(manager.id);
    setForm({
      username: manager.username ?? "",
      password: "",
      name: manager.name ?? "",
      selectedUserId: null,
      sectionIds,
    });
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "تعديل حساب المدير" : "إضافة مدير جديد"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
              <div>
              <Label>اختر مستخدماً من قائمة المستخدمين لتعديل صلاحياته (أو اتركه فارغاً لإنشاء مدير جديد)</Label>
              <select
                value={form.selectedUserId ?? ""}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  const selected = (users.data ?? []).find(u => u.id === id) ?? null;
                  setForm(prev => ({
                    ...prev,
                    selectedUserId: id,
                    name: selected ? selected.name || "" : prev.name,
                    // if selecting existing user, pref-fill username but allow override
                    username: selected ? selected.email?.split("@")[0] || prev.username : prev.username,
                  }));
                }}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">-- اختر مستخدماً --</option>
                {(users.data ?? []).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>اسم المدير (سيظهر في لوحة الإدارة)</Label>
              <Input
                value={form.name}
                onChange={event =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>اسم المستخدم</Label>
              <Input
                value={form.username}
                onChange={event =>
                  setForm({ ...form, username: event.target.value })
                }
                placeholder="manager01"
                required
              />
            </div>

            <div>
              <Label>كلمة المرور</Label>
              <Input
                type="password"
                value={form.password}
                onChange={event =>
                  setForm({ ...form, password: event.target.value })
                }
                minLength={8}
                required={!form.selectedUserId}
                placeholder={form.selectedUserId ? "سيتم إنشاء كلمة مرور تلقائية" : "********"}
              />
            </div>
            <div className="md:col-span-3">
              <Label>الأقسام المسؤولة</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {(sections.data ?? []).map(section => (
                  <label
                    key={section.id}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2"
                  >
                    <Checkbox
                      checked={form.sectionIds.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <span>{section.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-3">
              <div className="flex gap-2">
                <Button disabled={create.isPending || update.isPending || promoteUser.isPending}>
                  <Plus className="ml-1 h-4 w-4" />
                  {editingId ? "حفظ التعديلات" : form.selectedUserId ? "تعديل صلاحيات المستخدم" : "إنشاء حساب المدير"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        username: "",
                        password: "",
                        name: "",
                      selectedUserId: null,
                      sectionIds: [],
                    });
                    }}
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>المديرون الحاليون</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(managers.data ?? []).map(manager => (
            <div
              key={manager.id}
              className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <strong>{manager.name}</strong>
                <span className="mr-2 text-sm text-muted-foreground">
                  @{manager.username}
                </span>
                <p className="text-sm text-muted-foreground">
                  الأقسام:{" "}
                  {Array.from(
                    new Set(
                      (categories.data ?? [])
                        .filter(category => (manager.categoryIds ?? []).includes(category.id))
                        .map(category => category.sectionId)
                        .filter((id): id is number => typeof id === "number")
                        .map(sectionId => sections.data?.find(section => section.id === sectionId)?.name)
                        .filter((name): name is string => Boolean(name))
                    )
                  ).join("، ") || "غير محدد"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="w-fit"
                  onClick={() => startEdit(manager)}
                >
                  <Edit2 className="ml-1 h-4 w-4" />
                  تعديل
                </Button>
                <Button
                  variant="ghost"
                  className="w-fit text-red-600"
                  onClick={() => remove.mutate(manager.id)}
                >
                  <Trash2 className="ml-1 h-4 w-4" />
                  حذف
                </Button>
              </div>
            </div>
          ))}
          {managers.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">لا يوجد مديرون بعد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
    if (user?.username) setUsername(user.username);
    if (user?.password) setPassword(user.password);
  }, [loading, setLocation, user]);

  const updateAccount = trpc.auth.updateAccount.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث بيانات الحساب بنجاح");
      setPassword("");
      await utils.auth.me.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    updateAccount.mutate({
      username: username.trim() || undefined,
      password: password || undefined,
    });
  };

  if (loading || !user) return null;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12" dir="rtl">
      <Card className="mx-auto w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>إعدادات الحساب</CardTitle>
          <CardDescription>
            يمكنك رؤية وتعديل بيانات حسابك فقط. لا يمكنك تعديل حساب مستخدم آخر.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="account-username">اسم المستخدم</Label>
              <Input
                id="account-username"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="اسم المستخدم"
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-password">كلمة المرور</Label>
              <Input
                id="account-password"
                type="text"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="كلمة المرور"
                minLength={5}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={updateAccount.isPending}>
                حفظ التغييرات
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setLocation(
                    user.role === "admin" || user.role === "manager"
                      ? "/admin/dashboard"
                      : "/"
                  )
                }
              >
                عودة
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MANAGER_SESSION_STORAGE_KEY } from "@shared/const";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin" || user.role === "manager") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/");
      }
    }
  }, [loading, setLocation, user]);

  const managerLoginMutation = trpc.auth.managerLogin.useMutation({
    onSuccess: async data => {
      if (typeof window !== "undefined" && data?.sessionToken) {
        window.localStorage.setItem(
          MANAGER_SESSION_STORAGE_KEY,
          data.sessionToken
        );
      }
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل دخول المدير بنجاح");
      setLocation("/admin/dashboard");
    },
    onError: error => toast.error(error.message || "فشل تسجيل دخول المدير"),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    managerLoginMutation.mutate({
      username: username.trim(),
      password,
    });
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">دخول المديرين</CardTitle>
          <CardDescription>
            صفحة دخول خاصة للمدير العام ومديري الأقسام، لاستخدام لوحة التحكم.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="managerUsername">اسم المستخدم</Label>
              <Input
                id="managerUsername"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerPassword">كلمة المرور</Label>
              <Input
                id="managerPassword"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={managerLoginMutation.isPending || loading}
            >
              {managerLoginMutation.isPending ? "جارٍ تسجيل الدخول..." : "دخول لوحة التحكم"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/")}
            >
              العودة إلى الموقع
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

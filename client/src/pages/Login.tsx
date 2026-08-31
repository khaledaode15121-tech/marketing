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
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useContext();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isExistingUser, setIsExistingUser] = useState<boolean | undefined>(
    undefined
  );
  const [isManagerLogin, setIsManagerLogin] = useState(false);
  const [managerUsername, setManagerUsername] = useState("");
  const [managerPassword, setManagerPassword] = useState("");

  const emailKey = email.trim().toLowerCase();
  const isEmailValid = /^\S+@\S+\.\S+$/.test(emailKey);

  const emailCheckQuery = trpc.auth.checkEmail.useQuery(emailKey, {
    enabled: isEmailValid,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (emailCheckQuery.data) {
      setIsExistingUser(emailCheckQuery.data.exists);
      if (emailCheckQuery.data.exists && !name.trim()) {
        setName(emailCheckQuery.data.name ?? "");
      }
      if (!emailCheckQuery.data.exists) {
        setPhone("");
        setAddress("");
      }
    }
  }, [emailCheckQuery.data, name]);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/");
    }
  }, [loading, setLocation, user]);

  useEffect(() => {
    if (!isEmailValid) {
      setIsExistingUser(undefined);
    }
  }, [isEmailValid]);

  const loginMutation = trpc.auth.localLogin.useMutation({
    onSuccess: async data => {
      if (typeof window !== "undefined" && data?.sessionToken) {
        window.localStorage.setItem("manus-session-token", data.sessionToken);
      }
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل الدخول بنجاح");
      setLocation("/");
    },
    onError: error => {
      toast.error(error.message || "فشل تسجيل الدخول");
    },
  });

  const managerLoginMutation = trpc.auth.managerLogin.useMutation({
    onSuccess: async data => {
      if (typeof window !== "undefined" && data?.sessionToken) {
        window.localStorage.setItem("manus-session-token", data.sessionToken);
      }
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل دخول المدير بنجاح");
      setLocation("/admin/dashboard");
    },
    onError: error => toast.error(error.message || "فشل تسجيل دخول المدير"),
  });

  const handleManagerSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!managerUsername.trim() || !managerPassword) {
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    managerLoginMutation.mutate({
      username: managerUsername.trim(),
      password: managerPassword,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }

    if (!isEmailValid) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    if (isExistingUser === undefined) {
      toast.error("يرجى الانتظار حتى ينتهي التحقق من البريد الإلكتروني");
      return;
    }

    if (isExistingUser === false) {
      if (!name.trim()) {
        toast.error("يرجى إدخال الاسم");
        return;
      }
      if (!phone.trim()) {
        toast.error("يرجى إدخال رقم الهاتف");
        return;
      }
      if (!address.trim()) {
        toast.error("يرجى إدخال عنوان السكن");
        return;
      }
    }

    loginMutation.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
    });
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">
            تسجيل الدخول أو التسجيل
          </CardTitle>
          <CardDescription>
            أدخل البريد الإلكتروني أولاً للتحقق إذا كان لديك حساب سابق. {" "}
            {isExistingUser === true && "يمكنك إكمال الدخول باسم المستخدم فقط."}{" "}
            {isExistingUser === false && "أنت زبون جديد، أكمل جميع الحقول للحساب الجديد."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                />
                {emailKey && !isEmailValid && (
                  <p className="text-sm text-red-600">
                    يرجى إدخال بريد إلكتروني صحيح.
                  </p>
                )}
                {emailCheckQuery.isLoading && isEmailValid && (
                  <p className="text-sm text-blue-600">
                    جارٍ التحقق من البريد...
                  </p>
                )}
                {emailCheckQuery.data && isExistingUser === true && (
                  <p className="text-sm text-green-600">
                    البريد مسجل بالفعل في النظام.
                  </p>
                )}
                {emailCheckQuery.data && isExistingUser === false && (
                  <p className="text-sm text-orange-600">
                    هذا البريد جديد. أكمل باقي البيانات للتسجيل.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="مثال: أحمد"
                  required
                />
              </div>

              {isExistingUser === false && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={event => setPhone(event.target.value)}
                      placeholder="05xxxxxxxx"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">عنوان السكن</Label>
                    <Input
                      id="address"
                      type="text"
                      value={address}
                      onChange={event => setAddress(event.target.value)}
                      placeholder="مثال: حي التحلية، جدة"
                      required
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loginMutation.isPending || loading}
              >
                {loginMutation.isPending
                  ? "جاري المتابعة..."
                  : isExistingUser === false
                    ? "تسجيل وإنشاء الحساب"
                    : "تسجيل الدخول"}
              </Button>
            </form>

          <div className="mt-4 text-center text-sm text-gray-500">أو</div>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
          >
            تسجيل الدخول عبر OAuth
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}

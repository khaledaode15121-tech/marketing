import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart,
  ChevronDown,
  User,
  LogOut,
  History,
  Phone,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 md:gap-4">
      <svg
        viewBox="0 0 160 90"
        className={[
          "shrink-0 drop-shadow-[0_10px_22px_rgba(37,99,235,0.22)]",
          compact ? "h-12 w-12" : "h-14 w-14 md:h-16 md:w-16",
        ].join(" ")}
        aria-label="AliGo logo"
        role="img"
      >
        <defs>
          <linearGradient id="logo-blue" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="25%" stopColor="#1d4ed8" />
            <stop offset="75%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="logo-gold" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>
        <circle cx="42" cy="42" r="34" fill="url(#logo-blue)" />
        <path d="M21 62 L42 19 L63 62 H53 L48 50 H36 L31 62 Z" fill="#ffffff" />
        <path d="M36 42 H48 L42 29 Z" fill="url(#logo-gold)" />
        <circle cx="58" cy="58" r="8" fill="#fbbf24" opacity="0.96" />
        <path d="M56 54 L62 58 L56 62 Z" fill="#ffffff" />
      </svg>

      <div className="leading-none">
        <div
          className={[
            "font-black tracking-[-0.08em]",
            compact ? "text-lg" : "text-[1.3rem] md:text-[1.75rem]",
          ].join(" ")}
          style={{
            fontFamily: "'Cairo', sans-serif",
            backgroundImage: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 35%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 10px 18px rgba(37, 99, 235, 0.18)",
          }}
        >
          AliGo
        </div>
        <div
          className={[
            "mt-1 font-bold tracking-[0.08em]",
            compact ? "text-[8px]" : "text-[9px] md:text-[11px]",
          ].join(" ")}
          style={{
            fontFamily: "'Cairo', sans-serif",
            backgroundImage: "linear-gradient(135deg, #f59e0b 0%, #f9c74f 35%, #2563eb 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "0.08em",
          }}
        >
          وجهتك الأولى
        </div>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibleOverHero, setVisibleOverHero] = useState(true);
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: categories = [] } = trpc.products.categories.useQuery();

  useEffect(() => {
    const hero = document.getElementById("hero");
    const getThreshold = () => {
      if (!hero) return 80; // fallback
      const rect = hero.getBoundingClientRect();
      return rect.bottom + window.scrollY;
    };

    let threshold = getThreshold();
    const onResize = () => (threshold = getThreshold());

    const onScroll = () => {
      setVisibleOverHero(window.scrollY < threshold);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // initial check
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Ensure body does not reserve space for a fixed header (we want a
  // non-fixed header that scrolls with the page). Remove any class that
  // would force body padding for a fixed header.
  useEffect(() => {
    document.body.classList.remove("has-fixed-header");
    return () => {
      // no-op on unmount
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  const handleShoppingCart = () => {
    if (loading) return;
    if (!user) {
      window.location.href = getLoginUrl();
    } else {
      navigate("/cart");
    }
  };

  const navLinks = [
    { label: "الرئيسية", href: "#hero" },
    { label: "المنتجات", href: "#products" },
    { label: "العروض", href: "#offers", isOfferLink: true },
    { label: "تواصل معنا", href: "#contact" },
  ];

  const onCategoryChange = (category?: string) => {
    // Emit a global event so pages (Home) can react
    window.dispatchEvent(new CustomEvent("header:category", { detail: category }));
  };

  return (
    <header
      id="site-header"
       className={`top-0 right-0 left-0 z-50 px-2 pt-2 md:px-3 transform transition-transform duration-300 ${
        visibleOverHero ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[22px] border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="block bg-gradient-to-r from-[#0f172a] via-[#1d4ed8] to-[#fbbf24] text-white">
          <div
            className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-2 text-[11px] font-medium"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            <span>متجر AliGo — تسوق بثقة</span>
            <div className="flex items-center gap-5 text-white/90">
              <span>واتساب: 050 000 0000</span>
              <span>الدعم متاح يومياً</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1500px] px-2 md:px-3">
          <div className="flex h-14 items-center justify-between md:h-16">
            <a href="#hero" className="group flex items-center">
              <BrandLogo compact={false} />
            </a>

            <nav className="hidden items-center gap-2 md:flex">
              {navLinks.map(link =>
                link.isOfferLink ? (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => onCategoryChange("العروض")}
                    className="rounded-full border border-transparent bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-yellow-50 hover:text-blue-700"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-yellow-50 hover:text-blue-700"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    {link.label}
                  </a>
                )
              )}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <a
                href="tel:+966500000000"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"
              >
                <Phone className="h-4 w-4 text-blue-600" />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  +966 50 000 0000
                </span>
              </a>

              {user ? (
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 rounded-full border border-blue-100 bg-gradient-to-r from-blue-50 to-yellow-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:shadow-[0_10px_30px_rgba(37,99,235,0.12)] focus:outline-none"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        <User className="h-4 w-4" />
                        أهلاً وسهلاً، {user.name || "عميل"}
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-right">
                        {user.name ? `مرحباً ${user.name}` : "مرحباً بك"}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => navigate("/cart")}
                        className="text-right"
                      >
                        <ShoppingCart className="ml-2 h-4 w-4" />
                        السلة
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => navigate("/orders")}
                        className="text-right"
                      >
                        <History className="ml-2 h-4 w-4" />
                        الطلبات السابقة
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={handleLogout}
                        className="text-right text-destructive"
                      >
                        <LogOut className="ml-2 h-4 w-4" />
                        تسجيل الخروج
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (!loading) window.location.href = getLoginUrl();
                    }}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-[0_16px_30px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                    disabled={loading}
                  >
                    {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
                  </Button>
                  <Button
                    onClick={handleShoppingCart}
                    className="rounded-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] px-5 py-2.5 font-bold text-slate-900 shadow-[0_14px_30px_rgba(245,158,11,0.28)] transition-all hover:from-[#fbbf24] hover:to-[#facc15] active:scale-[0.98]"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    <ShoppingCart className="ml-2 h-4 w-4" />
                    السلة
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                className="rounded-full border border-slate-200 bg-slate-50 p-2.5 text-slate-700 transition-colors hover:bg-slate-100"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="فتح القائمة"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white/95 md:hidden">
            <div className="container flex flex-col gap-1 py-4">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-yellow-50 hover:text-blue-700"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <a
                  href="tel:+966500000000"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600"
                >
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    +966 50 000 0000
                  </span>
                </a>
                {user ? (
                  <>
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-yellow-50 px-4 py-3 text-blue-700">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium" style={{ fontFamily: "'Cairo', sans-serif" }}>
                        أهلاً وسهلاً، {user.name || "عميل"}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        handleShoppingCart();
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] font-bold text-slate-900"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <ShoppingCart className="ml-2 h-4 w-4" />
                      السلة
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/orders");
                        setMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <History className="ml-1 h-4 w-4" />
                      الطلبات السابقة
                    </Button>
                    <Button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full rounded-xl border-slate-300 hover:bg-slate-100"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <LogOut className="ml-1 h-4 w-4" />
                      خروج
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        if (!loading) {
                          window.location.href = getLoginUrl();
                        }
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                      disabled={loading}
                    >
                      {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
                    </Button>
                    <Button
                      onClick={() => {
                        handleShoppingCart();
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] font-bold text-slate-900"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <ShoppingCart className="ml-2 h-4 w-4" />
                      السلة
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

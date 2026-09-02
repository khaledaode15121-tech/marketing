/**
 * AliGo — Landing Page
 * Design: Bold Electric Blue
 * Primary: #0057FF | Accent: #FF6B00 | BG: #F4F6FA | Text: #0D1B2A
 * Fonts: Cairo (headings) + Tajawal (body) + Space Grotesk (numbers)
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import BrandBadge from "@/components/BrandBadge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// ─── Scroll Animation Hook ────────────────────────────────────────────────────
function WelcomeMarquee() {
  const { data: messages = [] } = trpc.dashboard.welcomeMessages.active.useQuery();

  if (messages.length === 0) return null;

  return (
    <div
      className="welcome-marquee mb-4 overflow-hidden rounded-2xl border border-blue-100 bg-white/80 py-3 shadow-sm backdrop-blur-md"
      aria-label="الرسائل الترحيبية"
    >
      <div className="welcome-marquee-content" dir="rtl">
        {messages.map((message, index) => (
          <span
            key={message.id}
            className="welcome-marquee-message"
            style={{
              color: message.color || "#000000",
              fontSize: message.style?.fontSize || "18px",
              fontWeight: message.style?.fontWeight || "bold",
              fontFamily: message.style?.fontFamily || "Cairo",
            }}
          >
            {message.content}
            {index < messages.length - 1 && <span aria-hidden="true"> ✦ </span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function FloatingStickers() {
  const { data: categories = [] } = trpc.dashboard.categories.list.useQuery();
  const stickers = useMemo(() => categories.filter(c => c.image).map((c, i) => ({
    id: c.id,
    image: c.image,
    delay: i * 0.5,
    duration: 12 + (i % 8),
    top: `${15 + (i * 25) % 70}%`,
    left: `${10 + (i * 30) % 80}%`,
  })), [categories]);

  if (stickers.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      {stickers.map(s => (
        <div
          key={s.id}
          className="absolute w-14 h-14 md:w-24 md:h-24 animate-float"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <img src={s.image || ""} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(20px, -20px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
import { Button } from "@/components/ui/button";
import { formatSypWithCurrency, getProductImages } from "@/lib/formatters";
import {
  ShoppingCart,
  Star,
  Truck,
  Shield,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Zap,
  Award,
  RefreshCw,
  Smartphone,
  Laptop,
  Watch,
  Cpu,
  Cable,
  Wrench,
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  LogOut,
  User,
  History,
  ChevronDown,
  Search,
  Grid2X2,
} from "lucide-react";

// ─── Image URLs ───────────────────────────────────────────────────────────────
const HERO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663786811951/JRcgdRnyZJ9kJAosaM5xmy/hero-phones-SGaT8CjQ2U74WdzKsdc8JZ.webp";
const LOGO_IMG = "/images/aligo.svg";
const PRODUCTS_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663786811951/JRcgdRnyZJ9kJAosaM5xmy/products-banner-Ah5DDtn8483e8hcfHe7qZB.webp";
const OFFER_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663786811951/JRcgdRnyZJ9kJAosaM5xmy/offer-banner-VDtaR2fGfBCPSCNWmhGF2H.webp";
const DELIVERY_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663786811951/JRcgdRnyZJ9kJAosaM5xmy/delivery-icon-KTUVpFbdUR8S46stnPejGJ.webp";

// ─── Data ─────────────────────────────────────────────────────────────────────

const offers = [
  {
    title: "خصم 30% على الهواتف المجددة",
    sub: "عروض محدودة الوقت",
    color: "from-blue-700 to-blue-900",
  },
  {
    title: "اشترِ لابتوب واحصل على حقيبة مجاناً",
    sub: "لفترة محدودة",
    color: "from-orange-500 to-orange-700",
  },
  {
    title: "شحن مجاني على الطلبات فوق 500 ريال",
    sub: "لجميع المحافظات",
    color: "from-green-600 to-green-800",
  },
];

const stats = [
  { value: "50,000+", label: "عميل راضٍ" },
  { value: "10,000+", label: "منتج متوفر" },
  { value: "15+", label: "سنة خبرة" },
  { value: "4.9/5", label: "تقييم العملاء" },
];

const features = [
  {
    icon: Truck,
    title: "توصيل سريع",
    desc: "توصيل خلال 24-48 ساعة لجميع المحافظات مع تتبع فوري لشحنتك",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Shield,
    title: "ضمان أصالة المنتج",
    desc: "جميع منتجاتنا أصلية 100% مع ضمان رسمي من الشركة المصنعة",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: RefreshCw,
    title: "سياسة إرجاع مرنة",
    desc: "إرجاع مجاني خلال 14 يوماً من تاريخ الاستلام بدون شروط معقدة",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Headphones,
    title: "دعم فني 24/7",
    desc: "فريق متخصص لدعمك على مدار الساعة عبر الهاتف والواتساب والشات",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const paymentMethods = [
  "Visa",
  "Mastercard",
  "Apple Pay",
  "Google Pay",
  "مدى",
  "الدفع عند الاستلام",
  "تحويل بنكي",
];

// ─── Components ───────────────────────────────────────────────────────────────

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

function Navbar({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory?: string;
  onCategoryChange: (value: string | undefined) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: categories = [] } = trpc.products.categories.useQuery();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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

  const handleCategorySelect = (category?: string) => {
    onCategoryChange(category);
    if (category) {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header id="site-header" className="fixed top-0 right-0 left-0 z-50 px-3 pt-3 md:px-4">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[26px] border border-white/70 bg-white/85 shadow-[0_20px_50px_rgba(37,99,235,0.12)] backdrop-blur-xl">
        <div className="hidden bg-gradient-to-r from-[#0f172a] via-[#1d4ed8] to-[#fbbf24] text-white md:block">
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

        <div className="mx-auto max-w-[1500px] px-4 md:px-6">
          <div className="flex h-16 items-center justify-between md:h-20">
            <a href="#hero" className="group flex items-center">
              <BrandLogo compact={false} />
            </a>

            <nav className="hidden items-center gap-2 md:flex">
              {navLinks.map(link =>
                link.isOfferLink ? (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => {
                      onCategoryChange("العروض");
                      document
                        .getElementById("products")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
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

function CategoryCarousel({
  onCategoryChange,
  saleProducts,
  onShowProduct,
}: {
  onCategoryChange: (value: string | undefined) => void;
  saleProducts: any[];
  onShowProduct: (id: number) => void;
}) {
  const { data: categories = [] } =
    trpc.products.categoriesWithImages.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageBg, setImageBg] = useState<string | null>(null);

  const categoryCards = useMemo(() => {
    return categories
      .map(category => {
        const fallbackProduct = products.find(
          product => product.category?.trim() === category.name?.trim()
        );
        return {
          ...category,
          image:
            category.image ||
            (fallbackProduct ? getProductImages(fallbackProduct)[0] : undefined),
        };
      })
      .filter(category => category.image);
  }, [categories, products]);

  const featuredProduct =
    saleProducts[activeOfferIndex] ?? saleProducts[0] ?? null;
  const offerImage = featuredProduct
    ? getProductImages(featuredProduct)[0]
    : undefined;
  const offerDescription =
    featuredProduct?.description?.trim() ||
    "استفد من عروضنا المختارة على أحدث المنتجات مع جودة مضمونة وتوصيل سريع.";
  const offerPrice =
    featuredProduct?.price != null
      ? formatSypWithCurrency(featuredProduct.price)
      : "عرض خاص";
  const offerOldPrice =
    featuredProduct?.oldPrice != null
      ? formatSypWithCurrency(featuredProduct.oldPrice)
      : null;

  useEffect(() => {
    if (saleProducts.length <= 1) return;
    setActiveOfferIndex(index => index % saleProducts.length);
    const timer = window.setInterval(() => {
      setActiveOfferIndex(index => (index + 1) % saleProducts.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [saleProducts.length]);

  const selectCategory = (category?: string) => {
    onCategoryChange(category);
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const randomMotion = (index: number) => ({
    top: `${8 + ((index * 29) % 76)}%`,
    left: `${7 + ((index * 41) % 78)}%`,
    animationDelay: `${(index * 0.73) % 4}s`,
    animationDuration: `${10 + (index % 7) * 1.2}s`,
  });

  const handleOfferImageLoad = (event: any) => {
    try {
      const img = event.currentTarget as HTMLImageElement;
      imageRef.current = img;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = 40;
      const h = 40;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      if (count > 0) {
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        setImageBg(`rgba(${r}, ${g}, ${b}, 0.14)`);
      }
    } catch (err) {
      setImageBg(null);
    }
  };

  return (
    <section
      aria-labelledby="homepage-featured-heading"
      className="relative overflow-hidden rounded-[22px] shadow-[0_20px_60px_rgba(37,99,235,0.15)]"
      dir="rtl"
    >
      <div className="grid items-stretch gap-1 bg-white/10 p-0 md:grid-cols-[1.35fr_1.65fr] md:p-0">
        {/* Left: product image + title + description */}
        <div className="relative overflow-hidden rounded-[16px] border border-slate-200 bg-white p-2 shadow-[0_12px_22px_rgba(15,23,42,0.04)] md:p-3">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-blue-700 shadow-sm" style={{ fontFamily: "'Cairo', sans-serif" }}>
              أحدث العروض
            </span>
            {saleProducts.length > 1 && (
              <div className="flex gap-1.5" aria-label="التنقل بين العروض">
                {saleProducts.slice(0, 5).map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    aria-label={`العرض ${index + 1}`}
                    onClick={() => setActiveOfferIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full transition ${index === activeOfferIndex ? "bg-blue-700" : "bg-slate-200 hover:bg-blue-400"}`}
                  />
                ))}
              </div>
            )}
          </div>

          <h1
            id="homepage-featured-heading"
            className="mb-4 text-2xl font-black leading-tight text-slate-900 md:text-[2.4rem]"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            {featuredProduct?.name || "اكتشف عروضنا المميزة"}
          </h1>

          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-0 shadow-inner shadow-slate-200/60">
            {offerImage && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 blur-2xl"
                style={{ backgroundImage: `url(${offerImage})` }}
              />
            )}
            <img
              key={offerImage ?? "default-product"}
              src={offerImage || ""}
              alt={featuredProduct?.name || "منتج عليه عرض"}
              onLoad={handleOfferImageLoad}
              className="relative z-10 max-h-[340px] w-auto object-contain drop-shadow-[0_30px_50px_rgba(30,64,175,0.18)] transition duration-700"
            />
          </div>

          <div className="mt-5 text-right">
            <p className="text-base leading-8 text-slate-700 md:text-lg" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              {offerDescription}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-black text-slate-900 md:text-[2.15rem]" style={{ fontFamily: "'Cairo', sans-serif" }}>
                {offerPrice}
              </span>
              {offerOldPrice && (
                <span className="text-sm text-slate-400 line-through" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  {offerOldPrice}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => featuredProduct && onShowProduct(featuredProduct.id)}
              disabled={!featuredProduct}
              className="mt-6 inline-flex items-center gap-2 rounded-[18px] bg-gradient-to-r from-blue-600 to-blue-700 px-7 py-3 text-base font-black text-white shadow-[0_16px_28px_rgba(37,99,235,0.24)] transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              تسوق الآن
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Right: category cards */}
        <div className="relative overflow-hidden rounded-[16px] border border-slate-200 bg-white p-2 shadow-[0_10px_20px_rgba(15,23,42,0.04)] md:p-2.5">
          <div className="mb-3 text-right">
            <p className="mb-1 text-sm font-bold text-blue-700" style={{ fontFamily: "'Cairo', sans-serif" }}>
              فئاتنا المميزة
            </p>
            <h2 className="text-2xl font-black text-slate-900 md:text-[2.1rem]" style={{ fontFamily: "'Cairo', sans-serif" }}>
              اكتشف كل التصنيفات
            </h2>
          </div>

          {categoryCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">
              {categoryCards.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category.name)}
                  className="group relative overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50 p-1 text-center shadow-[0_12px_20px_rgba(15,23,42,0.03)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_26px_rgba(37,99,235,0.09)]"
                  aria-label={`عرض فئة ${category.name}`}
                >
                  <div className="flex items-center justify-center py-3">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-white/20 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                    <img
                      src={category.image || ""}
                      alt={category.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>
                <span className="mt-1.5 block truncate px-1 text-[13px] font-bold text-slate-800 text-center" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  {category.name}
                </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-[#eaf6ff] via-[#93c5fd] to-[#fbbf24]/90 p-4 text-sm leading-7 text-slate-900/90 shadow-[0_16px_40px_rgba(37,99,235,0.12)]">
              ستظهر أسماء الفئات هنا بعد إضافة الفئات في لوحة الإدارة.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CatalogHero({
  selectedCategory,
  onCategoryChange,
  onSearch,
  saleProducts,
  onShowProduct,
}: {
  selectedCategory?: string;
  onCategoryChange: (value: string | undefined) => void;
  onSearch: (value: string) => void;
  saleProducts: any[];
  onShowProduct: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const brandMenuTimerRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { data: sections = [] } = trpc.products.sections.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();
  const liveQuery = query.trim();
  const featuredProduct =
    saleProducts[activeImageIndex] ?? saleProducts[0] ?? null;
  const heroImage =
    (featuredProduct ? getProductImages(featuredProduct)[0] : undefined) ||
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80";
  const heroBrand = featuredProduct?.brand || "إلكترونيات";
  const heroCategory = featuredProduct?.category || "منتجات مميزة";
  const heroDescription =
    featuredProduct?.description?.trim() || "لا يوجد وصف لهذا المنتج حاليًا.";
  const heroPrice =
    featuredProduct?.price != null
      ? formatSypWithCurrency(featuredProduct.price)
      : "السعر عند الطلب";

  useEffect(() => {
    if (saleProducts.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveImageIndex(prev => (prev + 1) % saleProducts.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [saleProducts]);
  const { data: suggestions = [], isFetching: suggestionsLoading } =
    trpc.products.search.useQuery(
      { query: liveQuery, limit: 6 },
      { enabled: searchOpen && liveQuery.length >= 2 }
    );

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    onSearch(value);
    setSearchOpen(false);
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const selectSuggestion = (product: { id: number }) => {
    setSearchOpen(false);
    navigate(`/product/${product.id}`);
  };

  const topBrands = useMemo(() => {
    const list = Array.from(
      new Set((sections ?? []).map(section => section.name).filter(Boolean) as string[])
    );
    return list.length > 0
      ? list
      : Array.from(
          new Set(
            (products ?? [])
              .map(product => product.brand?.trim())
              .filter(Boolean) as string[]
          )
        );
  }, [sections, products]);

  const brandCategoryMap = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const section of sections ?? []) {
      const brand = section.name?.trim();
      if (!brand) continue;
      const categories = Array.from(
        new Set(
          (section.categories ?? [])
            .map(category => category?.trim())
            .filter((category): category is string => Boolean(category))
        )
      );
      map.set(brand, categories);
    }

    if (map.size === 0) {
      for (const product of products) {
        const brand = product.brand?.trim();
        const category = product.category?.trim();
        if (!brand || !category) continue;
        const current = map.get(brand) ?? [];
        if (!current.includes(category)) {
          current.push(category);
          map.set(brand, current);
        }
      }
    }

    return map;
  }, [sections, products]);

  const clearBrandMenuTimer = () => {
    if (brandMenuTimerRef.current) {
      window.clearTimeout(brandMenuTimerRef.current);
      brandMenuTimerRef.current = null;
    }
  };

  const openBrandMenu = (brand: string) => {
    clearBrandMenuTimer();
    setActiveBrand(brand);
  };

  const closeBrandMenu = (brand: string) => {
    clearBrandMenuTimer();
    brandMenuTimerRef.current = window.setTimeout(() => {
      setActiveBrand(current => (current === brand ? null : current));
    }, 120);
  };

  return (
    <section id="hero" className="hero-gradient pb-2 pt-0 md:pt-0 -mt-6 md:-mt-8">
      <div className="container !max-w-[1700px] !px-1 md:!px-1.5">
        {/* Top brands bar moved to global TopBrandsBar component */}

        <CategoryCarousel
          onCategoryChange={onCategoryChange}
          saleProducts={saleProducts}
          onShowProduct={onShowProduct}
        />
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/55 px-4 pt-24 backdrop-blur-sm md:pt-32"
          role="dialog"
          aria-modal="true"
          aria-label="البحث عن المنتجات"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p
                  className="text-xs font-semibold text-[#f97316]"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  بحث سريع
                </p>
                <h2
                  className="mt-1 text-lg font-black text-slate-900"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  ما الذي تبحث عنه؟
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="إغلاق البحث"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitSearch} className="p-5">
              <div className="flex min-h-14 items-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 focus-within:border-[#f97316] focus-within:bg-white">
                <Search className="mx-4 h-5 w-5 shrink-0 text-[#f97316]" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={event => {
                    const value = event.target.value;
                    setQuery(value);
                    onSearch(value);
                  }}
                  placeholder="اكتب اسم المنتج أو الوصف..."
                  className="h-full min-w-0 flex-1 bg-transparent px-1 text-right text-sm text-slate-800 outline-none"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="h-full bg-[#f97316] px-6 font-bold text-white"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  بحث
                </button>
              </div>

              {liveQuery.length >= 2 && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
                  {suggestionsLoading ? (
                    <div className="space-y-2 p-3">
                      {[1, 2, 3].map(item => (
                        <div
                          key={item}
                          className="h-14 animate-pulse rounded-xl bg-slate-200/70"
                        />
                      ))}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {suggestions.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectSuggestion(product)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-right transition hover:bg-white"
                        >
                          <img
                            src={
                              product.image ||
                              "https://via.placeholder.com/80x80?text=Product"
                            }
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-xl object-contain bg-muted p-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-sm font-bold text-slate-800"
                              style={{ fontFamily: "'Cairo', sans-serif" }}
                            >
                              {product.name}
                            </span>
                            <span
                              className="mt-1 block truncate text-xs text-[#f97316]"
                              style={{ fontFamily: "'Tajawal', sans-serif" }}
                            >
                              <BrandBadge name={product.brand} /> ·{" "}
                              {formatSypWithCurrency(product.price)}
                            </span>
                          </span>
                          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="px-4 py-5 text-center text-sm text-slate-400"
                      style={{ fontFamily: "'Tajawal', sans-serif" }}
                    >
                      لم نعثر على منتجات مطابقة.
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function HeroSection({ saleProducts }: { saleProducts: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (saleProducts.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex(prev => (prev + 1) % saleProducts.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [saleProducts]);

  const featuredProduct = saleProducts[activeIndex] ?? saleProducts[0] ?? null;
  const image =
    (featuredProduct ? getProductImages(featuredProduct)[0] : undefined) ||
    HERO_IMG;
  const title = featuredProduct?.name || "أحدث العروض";
  const description =
    featuredProduct?.description ||
    "اكتشف أفضل المنتجات والعروض المميزة من متجر AliGo.";
  const price = featuredProduct
    ? formatSypWithCurrency(featuredProduct.price || 0)
    : "خصم يصل إلى 50%";

  return (
    <section
      id="hero"
      className="relative min-h-[75vh] md:min-h-[82vh] flex items-center overflow-hidden bg-[#0D1B2A] shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
    >
      <FloatingStickers />
      <div className="absolute inset-0">
        <img
          key={image}
          src={image}
          alt={title}
          className="h-full w-full object-contain opacity-60 transition-all duration-[1400ms] ease-in-out scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0d1b2a]/75 via-[#0d1b2a]/30 to-[#0d1b2a]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%)]" />
      </div>

      <div className="absolute top-1/4 left-1/4 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="container relative z-10 pb-16 pt-24">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <Zap className="h-4 w-4 text-orange-400" />
            <span
              className="text-sm font-medium text-white/90"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {featuredProduct
                ? "أفضل عروض اليوم"
                : "أكثر من 10,000 منتج في المخزون"}
            </span>
          </div>

          <h1
            className="mb-6 text-4xl font-black leading-[1.1] text-white md:text-5xl lg:text-[5rem]"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            <span className="block text-white">{title}</span>
          </h1>

          <p
            className="mb-8 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          >
            {description}
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.2)] backdrop-blur-sm">
              <div
                className="text-xs text-white/70"
                style={{ fontFamily: "'Tajawal', sans-serif" }}
              >
                السعر
              </div>
              <div
                className="text-2xl font-black text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {price}
              </div>
            </div>
            <Button
              size="lg"
              className="rounded-2xl bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 active:scale-95"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              <ShoppingCart className="ml-2 h-5 w-5" />
              تسوق الآن
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="h-8 w-px bg-gradient-to-b from-white/0 via-white/60 to-white/0" />
        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
      </div>
    </section>
  );
}

function ProductsSection({
  selectedCategory,
  searchQuery,
  onSearch,
  onCategoryChange,
  highlightedProductId,
}: {
  selectedCategory?: string;
  searchQuery: string;
  onSearch: (value: string) => void;
  onCategoryChange: (value: string | undefined) => void;
  highlightedProductId?: number;
}) {
  const [, navigate] = useLocation();
  const utils = trpc.useContext();
  const { user } = useAuth();
  const normalizedSearchQuery = searchQuery.trim();
  const searchResult = trpc.products.search.useQuery({
    query: normalizedSearchQuery || undefined,
    limit: 24,
  });
  const productList = trpc.products.list.useQuery(undefined, {
    enabled: !normalizedSearchQuery,
  });
  const { data: sections = [] } = trpc.products.sections.useQuery();
  const { data: categories = [] } = trpc.products.categories.useQuery();
  const [sortBy, setSortBy] = useState<
    "newest" | "price-asc" | "price-desc" | "brand-asc" | "brand-desc"
  >("newest");
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [rentalFilter, setRentalFilter] = useState<
    "all" | "rentable" | "not-rentable"
  >("all");
  const products = normalizedSearchQuery
    ? (searchResult.data ?? [])
    : (productList.data ?? []);
  const productsLoading = normalizedSearchQuery
    ? searchResult.isLoading
    : productList.isLoading;

  useEffect(() => {
    if (!highlightedProductId || productsLoading) return;
    const target = document.querySelector(
      `[data-product-id="${highlightedProductId}"]`
    );
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("product-highlight");
    const timer = window.setTimeout(
      () => target.classList.remove("product-highlight"),
      2200
    );
    return () => window.clearTimeout(timer);
  }, [highlightedProductId, productsLoading, products]);
  const womenCategory = useMemo(
    () => categories.find(category => /نسائ|نساء|women/i.test(category)),
    [categories]
  );
  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (sections ?? [])
            .map(section => section.name?.trim())
            .filter(Boolean) as string[]
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "ar")),
    [sections]
  );
  const sectionCategoryMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const section of sections ?? []) {
      const sectionName = section.name?.trim();
      if (!sectionName) continue;
      const categories = Array.from(
        new Set(
          (section.categories ?? [])
            .map(category => category?.trim())
            .filter((category): category is string => Boolean(category))
        )
      );
      map.set(sectionName, categories);
    }
    return map;
  }, [sections]);
  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map(product => product.color?.trim()).filter(Boolean))
      ).sort((a, b) => String(a).localeCompare(String(b), "ar")),
    [products]
  );
  const sizeOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map(product => product.size?.trim()).filter(Boolean))
      ).sort((a, b) => String(a).localeCompare(String(b), "ar")),
    [products]
  );
  const filteredProducts = useMemo(() => {
    let results = products;
    if (selectedCategory === "العروض") {
      results = results.filter(product => Boolean(product.isOnSale));
    } else if (selectedCategory) {
      results = results.filter(
        product => product.category === selectedCategory
      );
    }
    if (selectedBrand) {
      const sectionCategories = sectionCategoryMap.get(selectedBrand) ?? [];
      if (sectionCategories.length > 0) {
        results = results.filter(product =>
          sectionCategories.includes(product.category?.trim() || "")
        );
      } else {
        results = results.filter(
          product =>
            product.brand === selectedBrand || product.category === selectedBrand
        );
      }
    }
    if (selectedColor) {
      results = results.filter(product => product.color === selectedColor);
    }
    if (selectedSize) {
      results = results.filter(product => product.size === selectedSize);
    }
    if (rentalFilter === "rentable") {
      results = results.filter(product => Boolean(product.isRentable));
    } else if (rentalFilter === "not-rentable") {
      results = results.filter(product => !Boolean(product.isRentable));
    }

    return [...results].sort((a, b) => {
      if (sortBy === "price-asc" || sortBy === "price-desc") {
        const difference = Number(a.price) - Number(b.price);
        return sortBy === "price-asc" ? difference : -difference;
      }
      if (sortBy === "brand-asc" || sortBy === "brand-desc") {
        const difference = String(a.brand || "").localeCompare(
          String(b.brand || ""),
          "ar"
        );
        return sortBy === "brand-asc" ? difference : -difference;
      }
      return 0;
    });
  }, [
    products,
    selectedCategory,
    selectedBrand,
    selectedColor,
    selectedSize,
    rentalFilter,
    sortBy,
    sectionCategoryMap,
  ]);

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      void utils.cart.list.invalidate();
      toast.success("تم إضافة المنتج إلى السلة");
    },
    onError: () => {
      toast.error("يرجى تسجيل الدخول أولاً");
      window.location.href = getLoginUrl();
    },
  });

  const handleAddToCart = (productId: number) => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>(
    {}
  );

  const sidebarBrands = useMemo(() => {
    if ((sections ?? []).length > 0) {
      return (sections ?? []).map(section => ({
        brand: section.name,
        categories: Array.from(
          new Set(
            (section.categories ?? [])
              .map(category => category?.trim())
              .filter((category): category is string => Boolean(category))
          )
        ),
      }));
    }

    const map = new Map<string, Set<string>>();
    for (const product of products) {
      const brand = product.brand?.trim();
      const category = product.category?.trim();
      if (!brand) continue;
      if (!map.has(brand)) map.set(brand, new Set());
      if (category) map.get(brand)?.add(category);
    }
    return Array.from(map.entries()).map(([brand, categories]) => ({
      brand,
      categories: Array.from(categories),
    }));
  }, [sections, products]);

  return (
    <section id="products" className="bg-muted py-8 md:py-10">
      <div className="container">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-foreground shadow-sm">
              <Grid2X2 className="h-4 w-4" />
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-foreground shadow-sm">
              <Menu className="h-4 w-4" />
            </div>
          </div>
          <div className="text-right">
            <span
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              تسوق حسب
            </span>
            <h2
              className="text-2xl font-black text-foreground"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              أحدث المنتجات
            </h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-[18px] border border-border bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div
                className="text-lg font-black text-foreground"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                الأقسام
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff7ed] text-[#f97316]">
                +
              </div>
            </div>

            {womenCategory && (
              <button
                type="button"
                onClick={() =>
                  onCategoryChange(
                    selectedCategory === womenCategory
                      ? undefined
                      : womenCategory
                  )
                }
                className={`mb-3 flex w-full items-center justify-between rounded-xl px-3 py-2 text-right text-sm font-bold transition ${selectedCategory === womenCategory ? "bg-[#f97316] text-white" : "bg-[#fff7ed] text-[#f97316] hover:bg-[#ffedd5]"}`}
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <span>المنتجات النسائية فقط</span>
                {selectedCategory === womenCategory && <span>✓</span>}
              </button>
            )}

            <div className="space-y-2">
              {sidebarBrands.map(({ brand, categories }) => {
                const isExpanded = Boolean(expandedBrands[brand]);
                return (
                  <div
                    key={brand}
                    className="rounded-xl border border-[#f3f4f6] bg-muted"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isExpanded;
                        setExpandedBrands(prev => ({ ...prev, [brand]: next }));
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-right text-sm font-medium text-foreground transition hover:bg-muted"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <span>{brand}</span>
                      <span className="text-muted-foreground">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-[#f3f4f6] px-2 py-2">
                        {categories.length > 0 ? (
                          categories.map(category => (
                            <button
                              key={`${brand}-${category}`}
                              type="button"
                              onClick={() => {
                                onCategoryChange(category);
                                document
                                  .getElementById("products")
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                              }}
                              className={`block w-full rounded-lg px-2 py-2 text-right text-xs text-muted-foreground transition hover:bg-[#fff7ed] hover:text-[#f97316] ${selectedCategory === category ? "bg-[#fff7ed] text-[#f97316]" : ""}`}
                              style={{ fontFamily: "'Cairo', sans-serif" }}
                            >
                              {category}
                            </button>
                          ))
                        ) : (
                          <div
                            className="px-2 py-2 text-xs text-muted-foreground"
                            style={{ fontFamily: "'Cairo', sans-serif" }}
                          >
                            لا توجد فئات مرتبطة
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <div>
            <WelcomeMarquee />
            <div className="mb-5 rounded-2xl border border-border bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-muted px-3 py-2 transition focus-within:border-[#f97316] focus-within:bg-white">
                <Search className="h-5 w-5 shrink-0 text-[#f97316]" />
                <input
                  value={searchQuery}
                  onChange={event => onSearch(event.target.value)}
                  placeholder="ابحث باسم المنتج أو الوصف..."
                  className="min-w-0 flex-1 bg-transparent text-right text-sm text-foreground outline-none"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                  aria-label="البحث عن المنتجات بالاسم أو الوصف"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearch("")}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-[#f97316] transition hover:bg-[#fff7ed]"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted-foreground"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  <span>الأقسام:</span>
                  <select
                    value={selectedBrand ?? ""}
                    onChange={event =>
                      setSelectedBrand(event.target.value || undefined)
                    }
                    className="max-w-[170px] bg-transparent font-semibold outline-none"
                    aria-label="التصفية حسب الأقسام"
                  >
                    <option value="">كل الأقسام</option>
                    {sectionOptions.map(section => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </label>
                {colorOptions.length > 0 && (
                  <label
                    className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted-foreground"
                    style={{ fontFamily: "'Cairo', sans-serif'" }}
                  >
                    <span>اللون:</span>
                    <select
                      value={selectedColor ?? ""}
                      onChange={event =>
                        setSelectedColor(event.target.value || undefined)
                      }
                      className="max-w-[150px] bg-transparent font-semibold outline-none"
                      aria-label="التصفية حسب اللون"
                    >
                      <option value="">كل الألوان</option>
                      {colorOptions.map(color => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {sizeOptions.length > 0 && (
                  <label
                    className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted-foreground"
                    style={{ fontFamily: "'Cairo', sans-serif'" }}
                  >
                    <span>المقاس:</span>
                    <select
                      value={selectedSize ?? ""}
                      onChange={event =>
                        setSelectedSize(event.target.value || undefined)
                      }
                      className="max-w-[150px] bg-transparent font-semibold outline-none"
                      aria-label="التصفية حسب المقاس"
                    >
                      <option value="">كل المقاسات</option>
                      {sizeOptions.map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted-foreground"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  <span>الإيجار:</span>
                  <select
                    value={rentalFilter}
                    onChange={event =>
                      setRentalFilter(event.target.value as typeof rentalFilter)
                    }
                    className="bg-transparent font-semibold outline-none"
                    aria-label="التصفية حسب قابلية الإيجار"
                  >
                    <option value="all">كل المنتجات</option>
                    <option value="rentable">القابلة للإيجار فقط</option>
                    <option value="not-rentable">غير القابلة للإيجار</option>
                  </select>
                </label>
                <label
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted-foreground"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  <span>الفرز:</span>
                  <select
                    value={sortBy}
                    onChange={event =>
                      setSortBy(event.target.value as typeof sortBy)
                    }
                    className="bg-transparent font-semibold outline-none"
                    aria-label="فرز المنتجات"
                  >
                    <option value="newest">الافتراضي</option>
                    <option value="price-asc">السعر: من الأقل للأعلى</option>
                    <option value="price-desc">السعر: من الأعلى للأقل</option>
                    <option value="brand-asc">الأقسام: أ-ي</option>
                    <option value="brand-desc">الأقسام: ي-أ</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand(undefined);
                    setSelectedColor(undefined);
                    setSelectedSize(undefined);
                    setRentalFilter("all");
                    setSortBy("newest");
                    onCategoryChange(undefined);
                  }}
                  className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-sm font-semibold text-[#ea580c] transition hover:bg-[#ffedd5]"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  إلغاء كل الفلاتر
                </button>
              </div>
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <span>{selectedCategory === "العروض" ? "عروض" : "عرض"}</span>
                <span className="rounded-lg bg-white px-2 py-1">
                  {filteredProducts.length}
                </span>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {(
                (productsLoading
                  ? Array.from({ length: 6 })
                  : filteredProducts) as any[]
              ).map((product: any, i: number) => {
                const isPlaceholder = productsLoading;
                const ratingValue = isPlaceholder
                  ? 0
                  : Math.floor(Number(product.rating) || 0);
                const productImages = isPlaceholder
                  ? []
                  : getProductImages(product);
                return (
                  <div
                    key={isPlaceholder ? `loading-${i}` : product.id}
                    data-product-id={!isPlaceholder ? product.id : undefined}
                    className={`group overflow-hidden rounded-[18px] border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md ${!isPlaceholder && highlightedProductId === product.id ? "ring-4 ring-blue-400/60" : ""}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="relative h-52 overflow-hidden bg-muted">
                      {isPlaceholder ? (
                        <div className="h-full w-full animate-pulse bg-gray-200" />
                      ) : (
                        <>
                          <img
                            src={
                              productImages[0] ||
                              "https://via.placeholder.com/400x300?text=Product"
                            }
                            alt={product.name}
                            className="absolute inset-0 h-full w-full object-contain bg-muted p-2 opacity-100 transition-transform duration-500 group-hover:scale-110"
                          />
                          {product.brand === "النهدي" && (
                            <div className="absolute inset-0 brand-image-overlay opacity-90 pointer-events-none" />
                          )}
                          {productImages[1] && (
                            <img
                              src={productImages[1]}
                              alt={`${product.name} - صورة ثانية`}
                              className="absolute inset-0 h-full w-full object-contain bg-muted p-2 opacity-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
                            />
                          )}
                          {!isPlaceholder && product.badge && (
                            <span
                              className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-bold text-white ${product.badgeColor || "bg-[#f97316]"}`}
                            >
                              {product.badge}
                            </span>
                          )}
                          <button className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm">
                            <Star className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {isPlaceholder ? "..." : <BrandBadge name={product.brand} />}
                      </div>
                      {!isPlaceholder && product.description && (
                        <p
                          className="mb-2 line-clamp-2 text-xs leading-5 text-muted-foreground"
                          style={{ fontFamily: "'Tajawal', sans-serif" }}
                        >
                          {`${product.description}${product.isRentable ? " — قابل للإيجار" : ""}`}
                        </p>
                      )}
                      <h3
                        className="mb-2 min-h-[48px] text-base font-bold leading-6 text-foreground"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        {isPlaceholder ? "..." : product.name}
                      </h3>

                      {!isPlaceholder && (product.color || product.size) && (
                        <div
                          className="mb-3 flex flex-wrap gap-2"
                          style={{ fontFamily: "'Cairo', sans-serif" }}
                        >
                          {product.color && (
                            <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                              اللون: {product.color}
                            </span>
                          )}
                          {product.size && (
                            <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                              المقاس: {product.size}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mb-3 flex items-center gap-1.5">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className={`h-3.5 w-3.5 ${j < ratingValue ? "fill-[#fbbf24] text-[#fbbf24]" : "text-[#d1d5db]"}`}
                          />
                        ))}
                        <span
                          className="text-xs text-muted-foreground"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {isPlaceholder
                            ? "..."
                            : `${Number(product.rating || 0).toFixed(1)} (${product.reviewCount ?? 0})`}
                        </span>
                      </div>

                      {!isPlaceholder && product.isRentable && (
                        <div className="mb-3 text-xs font-bold text-emerald-600">
                          متاح للإيجار
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                          {isPlaceholder || product.isSellable !== false ? (
                            <div>
                              <div
                                className="text-xl font-black text-foreground"
                                style={{
                                  fontFamily: "'Space Grotesk', sans-serif",
                                }}
                              >
                                {isPlaceholder
                                  ? "..."
                                  : formatSypWithCurrency(product.price)}
                              </div>
                              {!isPlaceholder && product.oldPrice && (
                                <div
                                  className="text-xs text-muted-foreground line-through"
                                  style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                  }}
                                >
                                  {formatSypWithCurrency(product.oldPrice)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                              غير متاح للبيع
                            </span>
                          )}
                          {!isPlaceholder && (
                            <div className="flex w-full flex-row flex-nowrap items-center gap-2">
                              {product.isSellable !== false && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToCart(product.id)}
                                  disabled={addToCartMutation.isPending}
                                  className="min-w-0 flex-1 rounded-xl bg-[#f97316] px-2 text-white hover:bg-[#ea580c] disabled:opacity-50"
                                  style={{ fontFamily: "'Cairo', sans-serif" }}
                                >
                                  <ShoppingCart className="ml-1 h-4 w-4 shrink-0" />
                                  {addToCartMutation.isPending
                                    ? "..."
                                    : "أضف للشراء"}
                                </Button>
                              )}
                              {product.isRentable && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    window.location.assign(
                                      `/product/${product.id}`
                                    )
                                  }
                                  className="min-w-0 flex-1 rounded-xl bg-emerald-600 px-2 text-white hover:bg-emerald-700"
                                  style={{ fontFamily: "'Cairo', sans-serif" }}
                                >
                                  أضف للإيجار
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OffersSection() {
  return (
    <section id="offers" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={OFFER_BG}
          alt=""
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-[#0D1B2A]/75" />
      </div>

      <div className="container relative z-10">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            <Zap className="w-4 h-4" />
            عروض حصرية
          </div>
          <h2
            className="text-3xl md:text-4xl font-black text-white"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            لا تفوّت هذه العروض!
          </h2>
          <p
            className="text-gray-400 mt-2"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          >
            عروض محدودة الوقت — اغتنم الفرصة قبل انتهائها
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {offers.map((offer, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${offer.color} rounded-2xl p-6 border border-white/10 hover:scale-105 transition-transform duration-200 cursor-pointer animate-fade-in-up`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className="text-white/70 text-sm mb-2"
                style={{ fontFamily: "'Tajawal', sans-serif" }}
              >
                {offer.sub}
              </div>
              <h3
                className="text-white font-black text-xl leading-tight"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                {offer.title}
              </h3>
              <button
                className="mt-4 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                اكتشف العرض
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Products image */}
        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={PRODUCTS_IMG}
            alt="منتجاتنا المميزة"
            className="w-full h-64 md:h-80 object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            <Award className="w-4 h-4" />
            لماذا AliGo؟
          </div>
          <h2
            className="text-3xl md:text-4xl font-black text-gray-900"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            تجربة تسوق لا مثيل لها
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 animate-fade-in-up group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <h3
                  className="font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  {feat.title}
                </h3>
                <p
                  className="text-sm text-gray-500 leading-relaxed"
                  style={{ fontFamily: "'Tajawal', sans-serif" }}
                >
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Delivery visual */}
        <div className="mt-16 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6 w-fit"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <Truck className="w-4 h-4" />
                التوصيل السريع
              </div>
              <h3
                className="text-2xl md:text-3xl font-black text-gray-900 mb-4"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                توصيل لجميع المحافظات
                <br />
                <span className="text-blue-600">خلال 24-48 ساعة</span>
              </h3>
              <ul className="space-y-3 mb-8">
                {[
                  "تتبع فوري لشحنتك عبر الرسائل",
                  "شحن مجاني على الطلبات فوق 500 ل.س",
                  "التغليف الآمن لجميع الأجهزة",
                  "خيار الاستلام من المتجر متاح",
                ].map((item, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span
                      className="text-gray-600 text-sm"
                      style={{ fontFamily: "'Tajawal', sans-serif" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl w-fit shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                اطلب الآن
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8">
              <img
                src={DELIVERY_IMG}
                alt="توصيل سريع"
                className="w-full max-w-sm object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentSection() {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3
              className="text-lg font-bold text-gray-900 mb-1"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              وسائل الدفع المتاحة
            </h3>
            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              ادفع بالطريقة التي تناسبك — آمن ومشفر 100%
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center md:justify-end">
            {paymentMethods.map((method, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-700 via-blue-800 to-[#0D1B2A] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10 text-center">
        <div
          className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white rounded-full px-4 py-1.5 text-sm font-medium mb-6"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          <MessageCircle className="w-4 h-4" />
          تواصل معنا عبر واتساب
        </div>
        <h2
          className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          جاهز للتسوق؟
          <br />
          <span className="text-orange-400">نحن هنا لمساعدتك</span>
        </h2>
        <p
          className="text-gray-300 text-lg mb-10 max-w-xl mx-auto"
          style={{ fontFamily: "'Tajawal', sans-serif" }}
        >
          فريقنا المتخصص يستقبل استفساراتك على مدار الساعة. احصل على أفضل عرض
          لما تحتاجه الآن.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white font-black text-base px-10 py-4 rounded-2xl shadow-xl shadow-green-500/30 btn-cta transition-all active:scale-95"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            <MessageCircle className="w-5 h-5 ml-2" />
            تواصل عبر واتساب
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 font-bold text-base px-10 py-4 rounded-2xl transition-all"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            <Phone className="w-5 h-5 ml-2" />
            اتصل بنا مباشرة
          </Button>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Info */}
          <div>
            <div
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              <Phone className="w-4 h-4" />
              تواصل معنا
            </div>
            <h2
              className="text-3xl md:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              نحن دائماً
              <br />
              <span className="text-blue-600">في خدمتك</span>
            </h2>
            <p
              className="text-gray-500 mb-8 leading-relaxed"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              هل لديك استفسار؟ تريد معرفة سعر منتج معين؟ أو تحتاج مساعدة في
              اختيار الجهاز المناسب؟ فريقنا جاهز لمساعدتك.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: Phone,
                  label: "الهاتف",
                  value: "+966 50 000 0000",
                  href: "tel:+966500000000",
                },
                {
                  icon: MessageCircle,
                  label: "واتساب",
                  value: "+966 50 000 0000",
                  href: "https://wa.me/966500000000",
                },
                {
                  icon: Mail,
                  label: "البريد الإلكتروني",
                  value: "info@abuali-telecom.com",
                  href: "mailto:info@abuali-telecom.com",
                },
                {
                  icon: MapPin,
                  label: "العنوان",
                  value: "الرياض، المملكة العربية السعودية",
                  href: "#",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <a
                    key={i}
                    href={item.href}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <div
                        className="text-xs text-gray-400 mb-0.5"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="font-semibold text-gray-800"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {item.value}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3
              className="text-xl font-black text-gray-900 mb-6"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              أرسل لنا رسالة
            </h3>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h4
                  className="text-lg font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  تم إرسال رسالتك بنجاح!
                </h4>
                <p
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: "'Tajawal', sans-serif" }}
                >
                  سنتواصل معك في أقرب وقت ممكن
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-800 bg-gray-50"
                    style={{ fontFamily: "'Tajawal', sans-serif" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+966 5X XXX XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-800 bg-gray-50"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      direction: "ltr",
                      textAlign: "right",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    رسالتك
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={e =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="اكتب استفسارك أو طلبك هنا..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-800 bg-gray-50 resize-none"
                    style={{ fontFamily: "'Tajawal', sans-serif" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  إرسال الرسالة
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0D1B2A] text-white pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo compact={true} />
            </div>
            <p
              className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              متجرك المتخصص في الهواتف الذكية، اللابتوبات، الإكسسوارات وقطع
              الغيار. خبرة تتجاوز 15 عاماً في خدمة عملائنا الكرام.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: "#" },
                { icon: Facebook, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Youtube, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4
              className="font-bold text-white mb-4"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              روابط سريعة
            </h4>
            <ul className="space-y-2">
              {[
                "الصفحة الرئيسية",
                "المنتجات",
                "العروض والتخفيضات",
                "من نحن",
                "سياسة الخصوصية",
                "الشروط والأحكام",
              ].map((link, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="font-bold text-white mb-4"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              تواصل معنا
            </h4>
            <ul className="space-y-3">
              {[
                { icon: Phone, text: "+966 50 000 0000" },
                { icon: Mail, text: "info@aligo.com" },
                { icon: MapPin, text: "الرياض، المملكة العربية السعودية" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span
                    className="text-gray-400 text-sm"
                    style={{
                      fontFamily:
                        i === 0
                          ? "'Space Grotesk', sans-serif"
                          : "'Tajawal', sans-serif",
                    }}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            © 2024 AliGo. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span
              className="text-gray-500 text-xs"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              موقع آمن ومشفر بـ SSL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── WhatsApp Floating Button ─────────────────────────────────────────────────
function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <a
      href="https://wa.me/966500000000"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 left-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-500/40 transition-all duration-300 animate-pulse-ring ${
        visible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90 pointer-events-none"
      }`}
      title="تواصل عبر واتساب"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function () {
  useScrollReveal();
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedProductId, setHighlightedProductId] = useState<
    number | undefined
  >();
  const { data: products = [] } = trpc.products.list.useQuery();

  useEffect(() => {
    const handler = (e: any) => {
      setSelectedCategory(e?.detail);
      if (e?.detail) {
        // If header requested a category, scroll to products
        document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("header:category", handler as EventListener);
    return () => window.removeEventListener("header:category", handler as EventListener);
  }, []);

  return (
    <div className="min-h-screen pt-24" dir="rtl">
      <CatalogHero
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onSearch={setSearchQuery}
        onShowProduct={productId => {
          setSearchQuery("");
          setHighlightedProductId(productId);
          window.setTimeout(() => {
            document
              .getElementById("products")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 0);
        }}
        saleProducts={products.filter((product: any) =>
          Boolean(product.isOnSale)
        )}
      />
      <ProductsSection
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onCategoryChange={setSelectedCategory}
        highlightedProductId={highlightedProductId}
      />
      <PaymentSection />
      <CTASection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

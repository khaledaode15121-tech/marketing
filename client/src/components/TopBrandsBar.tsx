import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import BrandBadge from "@/components/BrandBadge";
import { ChevronDown } from "lucide-react";

export default function TopBrandsBar({ selectedCategory }: { selectedCategory?: string }) {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const brandMenuTimerRef = useRef<number | null>(null);
  const { data: sections = [] } = trpc.products.sections.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();

  const topBrands = useMemo(() => {
    const list = Array.from(
      new Set((sections ?? []).map(section => section.name).filter(Boolean) as string[])
    );
    if (list.length > 0) return list;
    return Array.from(
      new Set((products ?? []).map(product => product.brand?.trim()).filter(Boolean) as string[])
    );
  }, [sections, products]);

  const brandCategoryMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if ((sections ?? []).length > 0) {
      for (const section of sections ?? []) {
        const name = section.name?.trim();
        if (!name) continue;
        const cats = Array.from(new Set((section.categories ?? []).map(c => c?.trim()).filter(Boolean) as string[]));
        map.set(name, cats);
      }
      return map;
    }
    const m = new Map<string, Set<string>>();
    for (const product of products) {
      const brand = product.brand?.trim();
      const category = product.category?.trim();
      if (!brand) continue;
      if (!m.has(brand)) m.set(brand, new Set());
      if (category) m.get(brand)?.add(category);
    }
    for (const [brand, set] of Array.from(m.entries())) {
      map.set(brand, Array.from(set));
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

  const handleCategoryClick = (category?: string) => {
    window.dispatchEvent(new CustomEvent("header:category", { detail: category }));
    if (category) {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    return () => clearBrandMenuTimer();
  }, []);

  if (!topBrands || topBrands.length === 0) return null;

  return (
    <div className="relative z-20 mt-8 md:mt-10 lg:mt-12 mb-0 -mb-6 md:-mb-8 lg:-mb-10 flex flex-wrap items-center justify-start gap-2 overflow-visible rounded-full border border-transparent bg-gradient-to-r from-[#0f172a] via-[#1d4ed8] to-[#fbbf24] px-4 md:px-6 py-2 shadow-md mx-auto max-w-[1500px]">
      {topBrands.map(brand => {
        const brandCategories = brandCategoryMap.get(brand) ?? [];
        const isActive = activeBrand === brand;
        const shouldShowMenu = isActive && brandCategories.length > 0;

        return (
          <div key={brand} className="relative z-20" onMouseEnter={() => openBrandMenu(brand)} onMouseLeave={() => closeBrandMenu(brand)}>
            <button
              type="button"
              onFocus={() => openBrandMenu(brand)}
              onClick={() => setActiveBrand(current => (current === brand ? null : brand))}
              className={`flex min-w-[120px] items-center justify-between gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${selectedCategory === brand ? "ring-2 ring-white/40 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              <span className="flex items-center gap-2">
                <BrandBadge name={brand} />
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isActive ? "rotate-180" : ""} text-white`} />
            </button>

            {shouldShowMenu && (
              <div className="absolute left-1/2 top-full z-[90] mt-2 w-[180px] -translate-x-1/2 rounded-[16px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <div className="mb-1 px-2 pt-1 text-center text-[10px] font-bold text-slate-400" style={{ fontFamily: "'Cairo', sans-serif" }}>الفئات المرتبطة</div>
                {brandCategories.map(category => (
                  <button
                    key={`${brand}-${category}`}
                    type="button"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                      handleCategoryClick(category);
                      clearBrandMenuTimer();
                      setActiveBrand(null);
                    }}
                    className={`block w-full rounded-xl px-2 py-2 text-center text-sm font-medium transition ${selectedCategory === category ? "bg-[#fff7ed] text-[#f97316]" : "text-slate-800 hover:bg-[#f8fafc] hover:text-[#0f172a]"}`}
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

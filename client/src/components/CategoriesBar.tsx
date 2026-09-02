import React from "react";
import { trpc } from "@/lib/trpc";

export default function CategoriesBar() {
  const { data: sections = [], isLoading } = trpc.products.sections.useQuery();

  const categories = React.useMemo(() => {
    if (!sections || sections.length === 0) return [];
    return Array.from(
      new Set(
        sections
          .map(s => s.name?.trim())
          .filter(Boolean) as string[]
      )
    );
  }, [sections]);

  if (isLoading || categories.length === 0) return null;

  const handleClick = (category?: string) => {
    window.dispatchEvent(new CustomEvent("header:category", { detail: category }));
    // Smooth scroll to products if present
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full bg-transparent py-3">
      <div className="mx-auto flex max-w-[1500px] items-center justify-center overflow-x-auto px-4 md:px-6">
        <nav className="flex gap-3 py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleClick(cat)}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:shadow-md"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {cat}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

import React from "react";

export default function BrandBadge({ name }: { name?: string | null }) {
  const brand = name?.trim();
  if (!brand) return null;

  // Show a logo-inspired gradient badge for the specific brand 'النهدي'
  if (brand === "النهدي") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-white brand-badge">
        <span className="h-2 w-6 rounded-full shadow-sm brand-badge-dot" />
        <span className="text-sm font-semibold">{brand}</span>
      </span>
    );
  }

  return <span className="text-xs text-blue-600 font-semibold">{brand}</span>;
}

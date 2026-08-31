import { createContext, useContext, useState, ReactNode } from "react";

export interface ComparisonProduct {
  id: number;
  name: string | null | undefined;
  brand: string | null | undefined;
  price: string | number;
  oldPrice: string | number | null | undefined;
  image: string;
  rating: string | number;
  reviewCount: number;
  category: string | null | undefined;
  description: string | null | undefined;
  stock: number;
}

interface ComparisonContextType {
  products: ComparisonProduct[];
  addProduct: (product: ComparisonProduct) => void;
  removeProduct: (productId: number) => void;
  clearComparison: () => void;
  isInComparison: (productId: number) => boolean;
  maxProducts: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ComparisonProduct[]>([]);
  const maxProducts = 4;

  const addProduct = (product: ComparisonProduct) => {
    if (products.length < maxProducts && !products.find(p => p.id === product.id)) {
      setProducts([...products, product]);
    }
  };

  const removeProduct = (productId: number) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const clearComparison = () => {
    setProducts([]);
  };

  const isInComparison = (productId: number) => {
    return products.some(p => p.id === productId);
  };

  return (
    <ComparisonContext.Provider
      value={{
        products,
        addProduct,
        removeProduct,
        clearComparison,
        isInComparison,
        maxProducts,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within ComparisonProvider");
  }
  return context;
}

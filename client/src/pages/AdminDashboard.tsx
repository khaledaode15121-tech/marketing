import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import AdminOrdersSection from "@/components/AdminOrdersSection";
import AdminLogin from "@/pages/AdminLogin";
import AdminRentalSection from "@/components/AdminRentalSection";
import EconomicDashboard from "@/components/EconomicDashboard";
import ManagerManagement from "@/components/ManagerManagement";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { formatSypWithCurrency } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Trash2,
  Edit2,
  Plus,
  TrendingUp,
  Users,
  ShoppingCart,
  Star,
  Package,
  Tags,
  Search,
  X,
  ShieldCheck,
  BriefcaseBusiness,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ProductFormData {
  name: string;
  brand: string;
  category: string;
  categoryId: number | null;
  brandId: number | null;
  description: string;
  price: string;
  oldPrice: string;
  image: string;
  images: string[];
  stock: number;
  isOnSale: boolean;
  badge: string;
  badgeColor: string;
  color: string;
  size: string;
  isRentable: boolean;
  isSellable: boolean;
  purchasePrice: string;
  rentalPrice: string;
}

interface CategoryFormData {
  name: string;
  categoryCode: string;
  slug: string;
  description: string;
  image: string;
  sectionId: number | null;
  isActive: boolean;
}

interface BrandFormData {
  name: string;
  brandCode: string;
  slug: string;
  description: string;
  logo: string;
  managerId: number | null;
  isActive: boolean;
}

interface WelcomeMessageFormData {
  name: string;
  content: string;
  color: string;
  isActive: boolean;
  style: {
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    backgroundColor?: string;
  };
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: "user" | "manager" | "admin";
}

const emptyProductForm: ProductFormData = {
  name: "",
  brand: "",
  category: "",
  categoryId: null,
  brandId: null,
  description: "",
  price: "",
  oldPrice: "",
  image: "",
  images: [],
  stock: 0,
  isOnSale: false,
  badge: "",
  badgeColor: "bg-blue-600",
  color: "",
  size: "",
  isRentable: false,
  isSellable: true,
  purchasePrice: "",
  rentalPrice: "",
};

const emptyCategoryForm: CategoryFormData = {
  name: "",
  categoryCode: "",
  slug: "",
  description: "",
  image: "",
  sectionId: null,
  isActive: true,
};

const emptyBrandForm: BrandFormData = {
  name: "",
  brandCode: "",
  slug: "",
  description: "",
  logo: "",
  managerId: null,
  isActive: true,
};

const emptyWelcomeMessageForm: WelcomeMessageFormData = {
  name: "",
  content: "",
  color: "#000000",
  isActive: true,
  style: {
    fontSize: "16px",
    fontWeight: "normal",
    fontFamily: "Cairo",
    backgroundColor: "transparent",
  },
};

const emptyUserForm: UserFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  role: "user",
};

const BADGE_COLORS = [
  { label: "أزرق", value: "bg-blue-600" },
  { label: "أخضر", value: "bg-green-600" },
  { label: "برتقالي", value: "bg-orange-500" },
  { label: "أحمر", value: "bg-red-500" },
  { label: "بنفسجي", value: "bg-purple-600" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center" dir="rtl">جاري التحقق من الصلاحيات...</div>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return <AdminLogin />;
  }

  return <AdminDashboardContent user={user} />;
}

type AdminDashboardUser = NonNullable<ReturnType<typeof useAuth>["user"]>;

function AdminDashboardContent({ user }: { user: AdminDashboardUser }) {
  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const managerCategoryIds =
    (user as (typeof user & { categoryIds?: number[] }) | null)?.categoryIds ??
    [];
  const roleMeta = isAdmin
    ? { label: "المدير العام", icon: ShieldCheck, badgeClass: "bg-red-100 text-red-700" }
    : { label: "مدير القسم", icon: BriefcaseBusiness, badgeClass: "bg-amber-100 text-amber-700" };
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    ...emptyProductForm,
  });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    ...emptyCategoryForm,
  });
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [brandFormData, setBrandFormData] = useState<BrandFormData>({
    ...emptyBrandForm,
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    ...emptyUserForm,
  });
  const [editingWelcomeMessage, setEditingWelcomeMessage] = useState<any>(null);
  const [isWelcomeMessageDialogOpen, setIsWelcomeMessageDialogOpen] = useState(false);
  const [welcomeMessageFormData, setWelcomeMessageFormData] = useState<WelcomeMessageFormData>({
    ...emptyWelcomeMessageForm,
  });
  const [productSearch, setProductSearch] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState("");
  const [productColorFilter, setProductColorFilter] = useState("");
  const [productSizeFilter, setProductSizeFilter] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productRentalFilter, setProductRentalFilter] = useState<
    "" | "rentable" | "not-rentable"
  >("");
  const [productSort, setProductSort] = useState<
    "default" | "price-asc" | "price-desc" | "brand-asc" | "brand-desc"
  >("default");

  const utils = trpc.useContext();
  const { data: stats, isLoading: statsLoading } =
    trpc.dashboard.stats.useQuery();
  const {
    data: products,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = trpc.dashboard.products.list.useQuery();
  const {
    data: reviews,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = trpc.dashboard.reviews.list.useQuery();
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = trpc.dashboard.categories.list.useQuery();
  const {
    data: brands,
    isLoading: brandsLoading,
    refetch: refetchBrands,
  } = trpc.dashboard.brands.list.useQuery();
  const {
    data: users,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = trpc.dashboard.users.list.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: managers } = trpc.dashboard.managers.list.useQuery(undefined, {
    enabled: isAdmin,
  });
  const {
    data: welcomeMessages,
    isLoading: welcomeMessagesLoading,
    refetch: refetchWelcomeMessages,
  } = trpc.dashboard.welcomeMessages.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  const managerAssignedBrands = useMemo(() => {
    if (isAdmin || !Array.isArray(brands)) return brands ?? [];
    if (!Array.isArray(categories) || managerCategoryIds.length === 0) {
      return (brands ?? []).filter(
        (brand: any) => Number(brand.managerId) === Number(user.id)
      );
    }

    const sectionIdsFromCategories = new Set(
      (categories as any[])
        .filter((category: any) =>
          managerCategoryIds.includes(Number(category.id))
        )
        .map((category: any) => Number(category.sectionId))
        .filter((id: number) => Number.isFinite(id) && id > 0)
    );

    const managerOwnedSectionIds = new Set(
      (brands as any[])
        .filter((brand: any) => Number(brand.managerId) === Number(user.id))
        .map((brand: any) => Number(brand.id))
    );

    return (brands as any[]).filter((brand: any) => {
      const brandId = Number(brand.id);
      return (
        managerOwnedSectionIds.has(brandId) ||
        sectionIdsFromCategories.has(brandId)
      );
    });
  }, [brands, categories, isAdmin, managerCategoryIds, user.id]);

  const managerAllowedBrandIds = useMemo(
    () => new Set((managerAssignedBrands as any[]).map((brand: any) => Number(brand.id))),
    [managerAssignedBrands]
  );
  const managerAllowedCategoryIds = useMemo(
    () =>
      new Set(
        (categories ?? [])
          .filter((category: any) => {
            const categoryId = Number(category.id);
            const sectionId = Number(category.sectionId);
            if (managerCategoryIds.includes(categoryId)) return true;
            return managerAllowedBrandIds.has(sectionId);
          })
          .map((category: any) => Number(category.id))
      ),
    [categories, managerAllowedBrandIds, managerCategoryIds]
  );

  const productFilterOptions = useMemo(() => {
    const list = isManager
      ? (products ?? []).filter((product: any) => {
          const productCategoryId = Number(product.categoryId);
          return (
            managerAllowedCategoryIds.size === 0 ||
            managerAllowedCategoryIds.has(productCategoryId) ||
            managerAllowedBrandIds.has(Number(product.brandId))
          );
        })
      : (products ?? []);

    return {
      brands: Array.from(
        new Set(
          list.map((product: any) => product.brand?.trim()).filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "ar")),
      colors: Array.from(
        new Set(
          list.map((product: any) => product.color?.trim()).filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "ar")),
      sizes: Array.from(
        new Set(
          list.map((product: any) => product.size?.trim()).filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "ar")),
      categories: Array.from(
        new Set(
          list.map((product: any) => product.category?.trim()).filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "ar")),
    };
  }, [isManager, managerAllowedBrandIds, managerAllowedCategoryIds, products]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase("ar");
    const result = (products ?? []).filter((product: any) => {
      const productCategoryId = Number(product.categoryId);
      const isAllowedForManager =
        !isManager ||
        managerAllowedCategoryIds.size === 0 ||
        managerAllowedCategoryIds.has(productCategoryId) ||
        managerAllowedBrandIds.has(Number(product.brandId));
      const searchable =
        `${product.name ?? ""} ${product.description ?? ""}`.toLocaleLowerCase(
          "ar"
        );
      return (
        isAllowedForManager &&
        (!query || searchable.includes(query)) &&
        (!productBrandFilter || product.brand === productBrandFilter) &&
        (!productColorFilter || product.color === productColorFilter) &&
        (!productSizeFilter || product.size === productSizeFilter) &&
        (!productCategoryFilter ||
          product.category === productCategoryFilter) &&
        (!productRentalFilter ||
          (productRentalFilter === "rentable"
            ? Boolean(product.isRentable)
            : !Boolean(product.isRentable)))
      );
    });

    return result.sort((a: any, b: any) => {
      if (productSort === "price-asc" || productSort === "price-desc") {
        const difference = Number(a.price) - Number(b.price);
        return productSort === "price-asc" ? difference : -difference;
      }
      if (productSort === "brand-asc" || productSort === "brand-desc") {
        const difference = String(a.brand ?? "").localeCompare(
          String(b.brand ?? ""),
          "ar"
        );
        return productSort === "brand-asc" ? difference : -difference;
      }
      return 0;
    });
  }, [
    products,
    productSearch,
    productBrandFilter,
    productColorFilter,
    productSizeFilter,
    productCategoryFilter,
    productRentalFilter,
    isManager,
    managerAllowedBrandIds,
    managerAllowedCategoryIds,
    productSort,
  ]);

  const clearProductFilters = () => {
    setProductSearch("");
    setProductBrandFilter("");
    setProductColorFilter("");
    setProductSizeFilter("");
    setProductCategoryFilter("");
    setProductRentalFilter("");
    setProductSort("default");
  };

  const createProductMutation = trpc.dashboard.products.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المنتج بنجاح ✅");
      refetchProducts();
      closeProductDialog();
    },
    onError: err => {
      toast.error(`فشل إضافة المنتج: ${err.message}`);
    },
  });

  const updateProductMutation = trpc.dashboard.products.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المنتج بنجاح ✅");
      refetchProducts();
      closeProductDialog();
    },
    onError: err => {
      toast.error(`فشل تحديث المنتج: ${err.message}`);
    },
  });

  const deleteProductMutation = trpc.dashboard.products.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح");
      refetchProducts();
    },
    onError: () => {
      toast.error("فشل حذف المنتج");
    },
  });

  const refreshSectionAndCategoryData = async () => {
    await Promise.all([
      utils.dashboard.categories.list.invalidate(),
      utils.dashboard.brands.list.invalidate(),
      utils.dashboard.products.list.invalidate(),
      utils.dashboard.managers.list.invalidate(),
    ]);
  };

  const createCategoryMutation = trpc.dashboard.categories.create.useMutation({
    onSuccess: async () => {
      toast.success("تم إضافة الفئة بنجاح");
      await refreshSectionAndCategoryData();
      refetchCategories();
      setCategoryFormData({ ...emptyCategoryForm });
      setEditingCategory(null);
    },
    onError: err => {
      toast.error(`فشل إضافة الفئة: ${err.message}`);
    },
  });

  const updateCategoryMutation = trpc.dashboard.categories.update.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث الفئة بنجاح");
      await refreshSectionAndCategoryData();
      refetchCategories();
      setCategoryFormData({ ...emptyCategoryForm });
      setEditingCategory(null);
    },
    onError: err => {
      toast.error(`فشل تحديث الفئة: ${err.message}`);
    },
  });

  const deleteCategoryMutation = trpc.dashboard.categories.delete.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف الفئة بنجاح");
      await refreshSectionAndCategoryData();
      refetchCategories();
    },
    onError: () => {
      toast.error("فشل حذف الفئة");
    },
  });

  const createBrandMutation = trpc.dashboard.brands.create.useMutation({
    onSuccess: async () => {
      toast.success("تم إضافة القسم بنجاح");
      await refreshSectionAndCategoryData();
      refetchBrands();
      setBrandFormData({ ...emptyBrandForm });
      setEditingBrand(null);
    },
    onError: err => {
      toast.error(`فشل إضافة القسم: ${err.message}`);
    },
  });

  const updateBrandMutation = trpc.dashboard.brands.update.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث القسم بنجاح");
      await refreshSectionAndCategoryData();
      refetchBrands();
      setBrandFormData({ ...emptyBrandForm });
      setEditingBrand(null);
    },
    onError: err => {
      toast.error(`فشل تحديث القسم: ${err.message}`);
    },
  });

  const deleteBrandMutation = trpc.dashboard.brands.delete.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف القسم بنجاح");
      await refreshSectionAndCategoryData();
      refetchBrands();
    },
    onError: () => {
      toast.error("فشل حذف القسم");
    },
  });

  const createWelcomeMessageMutation = trpc.dashboard.welcomeMessages.create.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الرسالة الترحيبية بنجاح");
      refetchWelcomeMessages();
      closeWelcomeMessageDialog();
    },
    onError: (error: any) => {
      toast.error(`فشل إضافة الرسالة: ${error.message}`);
    },
  });

  const updateWelcomeMessageMutation = trpc.dashboard.welcomeMessages.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الرسالة الترحيبية بنجاح");
      refetchWelcomeMessages();
      closeWelcomeMessageDialog();
    },
    onError: (error: any) => {
      toast.error(`فشل تحديث الرسالة: ${error.message}`);
    },
  });

  const deleteWelcomeMessageMutation = trpc.dashboard.welcomeMessages.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الرسالة الترحيبية بنجاح");
      refetchWelcomeMessages();
    },
    onError: (error: any) => {
      toast.error(`فشل حذف الرسالة: ${error.message}`);
    },
  });

  const deleteReviewMutation = trpc.dashboard.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التقييم بنجاح");
      refetchReviews();
    },
    onError: () => {
      toast.error("فشل حذف التقييم");
    },
  });

  const createUserMutation = trpc.dashboard.users.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المستخدم بنجاح ✅");
      refetchUsers();
      closeUserDialog();
    },
    onError: err => {
      toast.error(`فشل إضافة المستخدم: ${err.message}`);
    },
  });

  const updateUserMutation = trpc.dashboard.users.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستخدم بنجاح ✅");
      refetchUsers();
      closeUserDialog();
    },
    onError: err => {
      toast.error(`فشل تحديث المستخدم: ${err.message}`);
    },
  });

  const deleteUserMutation = trpc.dashboard.users.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم بنجاح");
      refetchUsers();
    },
    onError: err => {
      toast.error(`فشل حذف المستخدم: ${err.message}`);
    },
  });

  function openAddProductDialog() {
    setEditingProduct(null);
    setProductFormData({ ...emptyProductForm });
    setIsProductDialogOpen(true);
  }

  function openEditProductDialog(product: any) {
    setEditingProduct(product);
    setProductFormData({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      categoryId: product.categoryId ?? null,
      brandId: product.brandId ?? null,
      description: product.description || "",
      price: String(product.price || ""),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      image: product.image || "",
      images: Array.isArray(product.images)
        ? product.images.filter(Boolean)
        : product.image
          ? [product.image]
          : [],
      stock: product.stock || 0,
      isOnSale: Boolean(product.isOnSale),
      badge: product.badge || "",
      badgeColor: product.badgeColor || "bg-blue-600",
      color: product.color || "",
      size: product.size || "",
      isRentable: Boolean(product.isRentable),
      isSellable: product.isSellable !== false,
      purchasePrice: product.purchasePrice ? String(product.purchasePrice) : "",
      rentalPrice: product.rentalPrice ? String(product.rentalPrice) : "",
    });
    setIsProductDialogOpen(true);
  }

  function closeProductDialog() {
    setIsProductDialogOpen(false);
    setEditingProduct(null);
    setProductFormData({ ...emptyProductForm });
  }

  function handleProductFormChange(
    field: keyof ProductFormData,
    value: string | string[] | number | boolean | null
  ) {
    setProductFormData(prev => ({ ...prev, [field]: value }));
  }

  async function uploadImageFile(file: File): Promise<string> {
    const readFile = (inputFile: File) =>
      new Promise<{ fileName: string; data: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve({ fileName: inputFile.name, data: reader.result });
          } else {
            reject(new Error("تعذر قراءة الملف"));
          }
        };
        reader.onerror = () =>
          reject(reader.error ?? new Error("تعذر قراءة الملف"));
        reader.readAsDataURL(inputFile);
      });

    const payload = await readFile(file);
    const resp = await fetch("/manus-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(await resp.text().catch(() => "فشل رفع الصورة"));
    }

    const json = await resp.json();
    if (!json?.url) {
      throw new Error("استجابة رفع غير متوقعة");
    }

    return json.url as string;
  }

  function handleProductImageFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    void (async () => {
      const toastId = toast.loading(`جارٍ رفع ${files.length} صورة...`);
      try {
        const uploads = await Promise.all(
          files.map(async file => {
            const url = await uploadImageFile(file);
            return url;
          })
        );
        setProductFormData(prev => ({
          ...prev,
          image: prev.image || uploads[0] || "",
          images: Array.from(new Set([...prev.images, ...uploads])),
        }));
        toast.success(`تم رفع ${uploads.length} صورة`, { id: toastId });
      } catch (err: any) {
        toast.error(`فشل رفع الصور: ${err?.message || err}`, { id: toastId });
      } finally {
        event.target.value = "";
      }
    })();
  }

  function handleCategoryImageFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      const toastId = toast.loading("جارٍ رفع صورة الفئة...");
      try {
        const url = await uploadImageFile(file);
        setCategoryFormData(prev => ({ ...prev, image: url }));
        toast.success("تم رفع صورة الفئة", { id: toastId });
      } catch (err: any) {
        toast.error(`فشل رفع صورة الفئة: ${err?.message || err}`, { id: toastId });
      } finally {
        event.target.value = "";
      }
    })();
  }

  function handleBrandLogoFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      const toastId = toast.loading("جارٍ رفع شعار القسم...");
      try {
        const url = await uploadImageFile(file);
        setBrandFormData(prev => ({ ...prev, logo: url }));
        toast.success("تم رفع شعار القسم", { id: toastId });
      } catch (err: any) {
        toast.error(`فشل رفع شعار القسم: ${err?.message || err}`, { id: toastId });
      } finally {
        event.target.value = "";
      }
    })();
  }

  function handleProductSubmit() {
    if (!productFormData.name.trim()) {
      toast.error("يرجى إدخال اسم المنتج");
      return;
    }
    if (productFormData.isSellable && !productFormData.price.trim()) {
      toast.error("يرجى إدخال سعر البيع للمنتج");
      return;
    }

    if (
      !productFormData.category.trim() ||
      !productFormData.brand.trim() ||
      !productFormData.categoryId ||
      !productFormData.brandId
    ) {
      toast.error("يرجى اختيار القسم والفئة قبل الحفظ");
      return;
    }

    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        name: productFormData.name,
        brand: productFormData.brand,
        category: productFormData.category,
        categoryId: productFormData.categoryId ?? null,
        brandId: productFormData.brandId ?? null,
        description: productFormData.description,
        price: productFormData.isSellable ? productFormData.price : "0",
        oldPrice:
          productFormData.isSellable && productFormData.isOnSale
            ? productFormData.oldPrice || undefined
            : undefined,
        image: productFormData.image || productFormData.images[0] || undefined,
        images: productFormData.images,
        stock: productFormData.stock,
        isOnSale: productFormData.isOnSale,
        badge: productFormData.badge || undefined,
        badgeColor: productFormData.badgeColor || undefined,
        color: productFormData.color || undefined,
        size: productFormData.size || undefined,
        isRentable: productFormData.isRentable,
        isSellable: productFormData.isSellable,
        purchasePrice: productFormData.isSellable
          ? productFormData.purchasePrice || undefined
          : undefined,
        rentalPrice: productFormData.isRentable
          ? productFormData.rentalPrice || undefined
          : undefined,
      });
    } else {
      createProductMutation.mutate({
        name: productFormData.name,
        brand: productFormData.brand,
        category: productFormData.category,
        categoryId: productFormData.categoryId!,
        brandId: productFormData.brandId!,
        description: productFormData.description || undefined,
        price: productFormData.isSellable ? productFormData.price : "0",
        oldPrice:
          productFormData.isSellable && productFormData.isOnSale
            ? productFormData.oldPrice || undefined
            : undefined,
        image: productFormData.image || productFormData.images[0] || undefined,
        images: productFormData.images,
        stock: productFormData.stock,
        isOnSale: productFormData.isOnSale,
        badge: productFormData.badge || undefined,
        badgeColor: productFormData.badgeColor || undefined,
        color: productFormData.color || undefined,
        size: productFormData.size || undefined,
        isRentable: productFormData.isRentable,
        isSellable: productFormData.isSellable,
        purchasePrice: productFormData.isSellable
          ? productFormData.purchasePrice || undefined
          : undefined,
        rentalPrice: productFormData.isRentable
          ? productFormData.rentalPrice || undefined
          : undefined,
      });
    }
  }

  function startEditCategory(category: any) {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name || "",
      categoryCode: category.categoryCode || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image || "",
      sectionId: category.sectionId ?? null,
      isActive: category.isActive !== false,
    });
  }

  function handleCategorySubmit() {
    if (!categoryFormData.name.trim()) {
      toast.error("يرجى إدخال اسم الفئة");
      return;
    }

    const payload = {
      name: categoryFormData.name,
      categoryCode: categoryFormData.categoryCode.trim() || undefined,
      slug: categoryFormData.slug || slugify(categoryFormData.name),
      description: categoryFormData.description || undefined,
      image: categoryFormData.image || undefined,
      sectionId: categoryFormData.sectionId,
      isActive: categoryFormData.isActive,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, ...payload });
    } else {
      createCategoryMutation.mutate(payload);
    }
  }

  function startEditBrand(brand: any) {
    setEditingBrand(brand);
    setBrandFormData({
      name: brand.name || "",
      brandCode: brand.brandCode || "",
      slug: brand.slug || "",
      description: brand.description || "",
      logo: brand.logo || "",
      managerId: brand.managerId ?? null,
      isActive: brand.isActive !== false,
    });
  }

  function handleBrandSubmit() {
    if (!brandFormData.name.trim()) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }

    const payload = {
      name: brandFormData.name,
      brandCode: brandFormData.brandCode.trim() || undefined,
      slug: brandFormData.slug || slugify(brandFormData.name),
      description: brandFormData.description || undefined,
      logo: brandFormData.logo || undefined,
      managerId: brandFormData.managerId,
      isActive: brandFormData.isActive,
    };

    if (editingBrand) {
      updateBrandMutation.mutate({ id: editingBrand.id, ...payload });
    } else {
      createBrandMutation.mutate(payload);
    }
  }

  function openAddWelcomeMessageDialog() {
    setEditingWelcomeMessage(null);
    setWelcomeMessageFormData({
      ...emptyWelcomeMessageForm,
      style: { ...emptyWelcomeMessageForm.style },
    });
    setIsWelcomeMessageDialogOpen(true);
  }

  function openEditWelcomeMessageDialog(message: any) {
    setEditingWelcomeMessage(message);
    setWelcomeMessageFormData({
      name: message.name || "",
      content: message.content || "",
      color: message.color || "#000000",
      style: {
        ...emptyWelcomeMessageForm.style,
        ...(message.style || {}),
      },
      isActive: message.isActive !== false,
    });
    setIsWelcomeMessageDialogOpen(true);
  }

  function closeWelcomeMessageDialog() {
    setIsWelcomeMessageDialogOpen(false);
    setEditingWelcomeMessage(null);
    setWelcomeMessageFormData({
      ...emptyWelcomeMessageForm,
      style: { ...emptyWelcomeMessageForm.style },
    });
  }

  function handleWelcomeMessageSubmit() {
    if (!welcomeMessageFormData.name.trim() || !welcomeMessageFormData.content.trim()) {
      toast.error("يرجى إدخال اسم الرسالة ومحتواها");
      return;
    }

    const payload = {
      name: welcomeMessageFormData.name.trim(),
      content: welcomeMessageFormData.content.trim(),
      color: welcomeMessageFormData.color,
      style: welcomeMessageFormData.style,
    };

    if (editingWelcomeMessage) {
      updateWelcomeMessageMutation.mutate({
        id: editingWelcomeMessage.id,
        ...payload,
        isActive: welcomeMessageFormData.isActive,
      });
    } else {
      createWelcomeMessageMutation.mutate(payload);
    }
  }

  function openAddUserDialog() {
    setEditingUser(null);
    setUserFormData({ ...emptyUserForm });
    setIsUserDialogOpen(true);
  }

  function openEditUserDialog(userItem: any) {
    setEditingUser(userItem);
    setUserFormData({
      name: userItem.name || "",
      email: userItem.email || "",
      phone: userItem.phone || "",
      address: userItem.address || "",
      role: userItem.role === "admin" ? "admin" : userItem.role === "manager" ? "manager" : "user",
    });
    setIsUserDialogOpen(true);
  }
  function closeUserDialog() {
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({ ...emptyUserForm });
  }

  function handleUserFormChange(field: keyof UserFormData, value: string) {
    setUserFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleUserSubmit() {
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      toast.error("يرجى ملء الاسم والبريد الإلكتروني على الأقل");
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        name: userFormData.name,
        email: userFormData.email,
        phone: userFormData.phone || undefined,
        address: userFormData.address || undefined,
        role: userFormData.role,
      });
    } else {
      createUserMutation.mutate({
        name: userFormData.name,
        email: userFormData.email,
        phone: userFormData.phone || undefined,
        address: userFormData.address || undefined,
        role: userFormData.role,
      });
    }
  }

  function handleDeleteUser(userItem: any) {
    if (userItem.id === user?.id) {
      toast.error("لا يمكنك حذف حسابك الحالي");
      return;
    }
    if (
      confirm(
        `هل أنت متأكد من حذف المستخدم "${userItem.name || userItem.email}"؟`
      )
    ) {
      deleteUserMutation.mutate(userItem.id);
    }
  }

  const pieData = [
    { name: "المنتجات", value: stats?.totalProducts || 0 },
    ...(isAdmin ? [{ name: "المستخدمون", value: stats?.totalUsers || 0 }] : []),
    { name: "التقييمات", value: stats?.totalReviews || 0 },
  ];

  const barData =
    stats?.topProducts?.slice(0, 5).map((p: any) => ({
      name: p.name?.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
      تقييمات: p.reviewCount || 0,
    })) || [];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];
  const isPending =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    createBrandMutation.isPending ||
    updateBrandMutation.isPending ||
    createUserMutation.isPending ||
    updateUserMutation.isPending;
  const isUserPending =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isAdmin ? "لوحة المدير العام" : "لوحة مدير القسم"}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              مرحباً {user?.name}، {isAdmin ? "إدارة متجر أبو علي للاتصالات" : "متابعة الأقسام المخصصة لك فقط"}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${roleMeta.badgeClass}`}>
            <roleMeta.icon className="h-3.5 w-3.5" />
            {roleMeta.label}
          </div>
        </div>

        {isManager && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-800">
                الأقسام المخصصة لك
              </h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                {managerAssignedBrands.length || 0} قسم
              </span>
            </div>

            {managerAssignedBrands.length === 0 ? (
              <Card className="border-dashed border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-sm text-amber-700">
                  لا توجد أقسام مخصصة لهذا المدير حالياً.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {managerAssignedBrands.map((brand: any) => {
                  const assignedCategories = (categories ?? []).filter(
                    (category: any) =>
                      Number(category.sectionId) === Number(brand.id)
                  );

                  return (
                    <Card
                      key={brand.id}
                      className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-amber-700">القسم</p>
                            <h3 className="text-xl font-bold text-amber-900">
                              {brand.name}
                            </h3>
                          </div>
                          <div className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            {assignedCategories.length} فئة
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {assignedCategories.length > 0 ? (
                            assignedCategories.slice(0, 4).map((category: any) => (
                              <div
                                key={category.id}
                                className="rounded-lg border border-amber-100 bg-white px-2.5 py-1.5 text-sm text-gray-700"
                              >
                                {category.name}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-lg border border-dashed border-amber-200 bg-white px-2.5 py-1.5 text-sm text-amber-700">
                              لا توجد فئات مرتبطة بهذا القسم
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className={`grid gap-4 ${isAdmin ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    إجمالي المنتجات
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {statsLoading ? "..." : stats?.totalProducts || 0}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">
                      إجمالي المستخدمين
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {statsLoading ? "..." : stats?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600 font-medium mb-1">
                    إجمالي التقييمات
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {statsLoading ? "..." : stats?.totalReviews || 0}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium mb-1">
                    متوسط التقييم
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {statsLoading
                      ? "..."
                      : stats?.averageRating?.toFixed(1) || "0"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base">توزيع البيانات</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base">أفضل المنتجات تقييماً</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="تقييمات"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  لا توجد بيانات كافية للعرض
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue={isManager ? "finance" : "products"}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="finance">الجدوى الاقتصادية</TabsTrigger>
            <TabsTrigger value="orders">مراجعة الطلبات</TabsTrigger>
            <TabsTrigger value="rentals">طلبات الإيجار</TabsTrigger>
            <TabsTrigger value="products">إدارة المنتجات</TabsTrigger>
            <TabsTrigger value="catalog">الفئات</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="managers">المديرون والصلاحيات</TabsTrigger>
            )}
            {!isManager && (
              <TabsTrigger value="welcome">الرسائل الترحيبية</TabsTrigger>
            )}
            {!isManager && (
              <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            )}
            {!isManager && (
              <TabsTrigger value="reviews">إدارة التقييمات</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="finance">
            <EconomicDashboard />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="managers">
              <ManagerManagement />
            </TabsContent>
          )}
          <TabsContent value="orders">
            <AdminOrdersSection />
          </TabsContent>
          <TabsContent value="rentals">
            <AdminRentalSection />
          </TabsContent>
          <TabsContent value="products">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      المنتجات ({filteredProducts.length} من{" "}
                      {products?.length || 0})
                    </CardTitle>
                    <CardDescription>
                      عرض وتعديل وحذف وإضافة المنتجات
                    </CardDescription>
                  </div>
                  <Button
                    onClick={openAddProductDialog}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منتج
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="mb-5 space-y-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500">
                    <Search className="h-5 w-5 shrink-0 text-blue-600" />
                    <Input
                      value={productSearch}
                      onChange={event => setProductSearch(event.target.value)}
                      placeholder="ابحث باسم المنتج أو الوصف..."
                      className="border-0 bg-transparent p-0 text-right shadow-none focus-visible:ring-0"
                      aria-label="البحث في المنتجات بالاسم أو الوصف"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch("")}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="مسح البحث"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                      <span className="font-semibold">الأقسام:</span>
                      <select
                        value={productBrandFilter}
                        onChange={event =>
                          setProductBrandFilter(event.target.value)
                        }
                        className="bg-transparent font-medium outline-none"
                      >
                        <option value="">كل الأقسام</option>
                        {productFilterOptions.brands.map(brand => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </label>
                    {productFilterOptions.colors.length > 0 && (
                      <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <span className="font-semibold">اللون:</span>
                        <select
                          value={productColorFilter}
                          onChange={event =>
                            setProductColorFilter(event.target.value)
                          }
                          className="bg-transparent font-medium outline-none"
                        >
                          <option value="">كل الألوان</option>
                          {productFilterOptions.colors.map(color => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {productFilterOptions.sizes.length > 0 && (
                      <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <span className="font-semibold">المقاس:</span>
                        <select
                          value={productSizeFilter}
                          onChange={event =>
                            setProductSizeFilter(event.target.value)
                          }
                          className="bg-transparent font-medium outline-none"
                        >
                          <option value="">كل المقاسات</option>
                          {productFilterOptions.sizes.map(size => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {productFilterOptions.categories.length > 0 && (
                      <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <span className="font-semibold">الفئة:</span>
                        <select
                          value={productRentalFilter}
                          onChange={e =>
                            setProductRentalFilter(
                              e.target.value as "" | "rentable" | "not-rentable"
                            )
                          }
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                        >
                          <option value="">كل حالات الإيجار</option>
                          <option value="rentable">القابلة للإيجار</option>
                          <option value="not-rentable">
                            غير القابلة للإيجار
                          </option>
                        </select>
                        <select
                          value={productCategoryFilter}
                          onChange={event =>
                            setProductCategoryFilter(event.target.value)
                          }
                          className="bg-transparent font-medium outline-none"
                        >
                          <option value="">كل الفئات</option>
                          {productFilterOptions.categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                      <span className="font-semibold">الفرز:</span>
                      <select
                        value={productSort}
                        onChange={event =>
                          setProductSort(
                            event.target.value as typeof productSort
                          )
                        }
                        className="bg-transparent font-medium outline-none"
                      >
                        <option value="default">الافتراضي</option>
                        <option value="price-asc">
                          السعر: من الأقل للأعلى
                        </option>
                        <option value="price-desc">
                          السعر: من الأعلى للأقل
                        </option>
                        <option value="brand-asc">الأقسام: أ-ي</option>
                        <option value="brand-desc">الأقسام: ي-أ</option>
                      </select>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearProductFilters}
                      className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    >
                      إلغاء كل الفلاتر
                    </Button>
                  </div>
                </div>
                {productsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 bg-gray-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : !products || products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد منتجات بعد</p>
                    <Button
                      onClick={openAddProductDialog}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      أضف أول منتج
                    </Button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">
                      لا توجد منتجات تطابق الفلاتر الحالية
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearProductFilters}
                      className="mt-4"
                    >
                      مسح الفلاتر
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">
                            معرف المنتج
                          </TableHead>
                          <TableHead className="text-right">الصورة</TableHead>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-right">الفئة</TableHead>
                          <TableHead className="text-right">السعر</TableHead>
                          <TableHead className="text-right">
                            قابل للإيجار
                          </TableHead>
                          <TableHead className="text-right">
                            سعر الإيجار
                          </TableHead>
                          <TableHead className="text-right">المخزون</TableHead>
                          <TableHead className="text-right">عرض؟</TableHead>
                          <TableHead className="text-right">التقييم</TableHead>
                          <TableHead className="text-right">
                            الإجراءات
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product: any) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-xs font-semibold text-blue-700">
                              {product.productCode || "—"}
                            </TableCell>
                            <TableCell>
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-10 h-10 object-contain rounded-lg border bg-white p-0.5"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium max-w-[150px]">
                              <div className="truncate">{product.name}</div>
                              <div className="text-xs text-gray-400">
                                {product.brand}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                                {product.category}
                              </span>
                            </TableCell>
                            <TableCell>
                              {product.isSellable !== false ? (
                                <>
                                  <div className="font-semibold text-blue-600">
                                    {formatSypWithCurrency(product.price)}
                                  </div>
                                  {product.oldPrice && (
                                    <div className="text-xs text-gray-400 line-through">
                                      {formatSypWithCurrency(product.oldPrice)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  غير مخصص للبيع
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs font-medium rounded-full px-2 py-1 ${product.isRentable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                              >
                                {product.isRentable ? "نعم" : "لا"}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-emerald-700">
                              {product.isRentable && product.rentalPrice
                                ? formatSypWithCurrency(product.rentalPrice)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  (product.stock || 0) > 10
                                    ? "bg-green-100 text-green-700"
                                    : (product.stock || 0) > 0
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {product.stock || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${product.isOnSale ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}
                              >
                                {product.isOnSale ? "نعم" : "لا"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-sm">
                                  {Number(product.rating || 0).toFixed(1)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditProductDialog(product)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `هل أنت متأكد من حذف "${product.name}"؟`
                                      )
                                    ) {
                                      deleteProductMutation.mutate(product.id);
                                    }
                                  }}
                                  disabled={deleteProductMutation.isPending}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="shadow-md border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        إجمالي الفئات
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {categories?.length || 0}
                      </p>
                    </div>
                    <Tags className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-purple-100 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">
                        إجمالي الأقسام
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {brands?.length || 0}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>إدارة الفئات</CardTitle>
                  <CardDescription>
                    {isManager
                      ? "أضف أو عدّل الفئات الخاصة بقسمك فقط"
                      : "أضف أو عدّل الفئات المرتبطة بالمنتجات"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">اسم الفئة</Label>
                    <Input
                      id="categoryName"
                      value={categoryFormData.name}
                      onChange={e =>
                        setCategoryFormData(prev => ({
                          ...prev,
                          name: e.target.value,
                          slug: prev.slug || slugify(e.target.value),
                        }))
                      }
                      placeholder="مثال: الهواتف الذكية"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryCode">معرف الفئة بالإنجليزية</Label>
                    <Input
                      id="categoryCode"
                      value={categoryFormData.categoryCode}
                      onChange={e =>
                        setCategoryFormData(prev => ({
                          ...prev,
                          categoryCode: e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9-]/g, ""),
                        }))
                      }
                      placeholder="CAT-PHONE"
                    />
                    <p className="text-xs text-gray-500">
                      حروف إنجليزية وأرقام وشرطة فقط. يُستخدم في معرف المنتج.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categorySection">القسم التابع له</Label>
                    <select
                      id="categorySection"
                      value={categoryFormData.sectionId ?? ""}
                      onChange={e =>
                        setCategoryFormData(prev => ({
                          ...prev,
                          sectionId: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">اختر القسم...</option>
                      {((isManager ? managerAssignedBrands : (brands || [])) || []).map((section: any) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      يحدد القسم الذي تتبع له هذه الفئة.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categorySlug">الاسم المختصر</Label>
                    <Input
                      id="categorySlug"
                      value={categoryFormData.slug}
                      onChange={e =>
                        setCategoryFormData(prev => ({
                          ...prev,
                          slug: e.target.value,
                        }))
                      }
                      placeholder="phones"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">الوصف</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryFormData.description}
                      onChange={e =>
                        setCategoryFormData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryImage">صورة الفئة</Label>
                    <div className="flex items-center gap-3">
                      {categoryFormData.image ? (
                        <img
                          src={categoryFormData.image}
                          alt="معاينة صورة الفئة"
                          className="h-14 w-14 rounded-lg border object-cover bg-white"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed bg-gray-50 text-xs text-gray-400">
                          صورة
                        </div>
                      )}
                      <Input
                        id="categoryImage"
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryImageFileChange}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="categoryActive"
                      type="checkbox"
                      checked={categoryFormData.isActive}
                      onChange={e =>
                        setCategoryFormData(prev => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    <Label htmlFor="categoryActive">نشط</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={handleCategorySubmit}
                      disabled={
                        createCategoryMutation.isPending ||
                        updateCategoryMutation.isPending
                      }
                    >
                      {editingCategory ? "تحديث الفئة" : "إضافة فئة"}
                    </Button>
                    {editingCategory && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryFormData({ ...emptyCategoryForm });
                        }}
                      >
                        إلغاء
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">معرف الفئة</TableHead>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoriesLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-gray-400">
                              جاري التحميل...
                            </TableCell>
                          </TableRow>
                        ) : (
                          (categories || []).map((category: any) => (
                            <TableRow key={category.id}>
                              <TableCell className="font-mono text-xs text-gray-600">
                                {category.categoryCode || category.id}
                              </TableCell>
                              <TableCell>{category.name}</TableCell>
                              <TableCell>
                                {category.isActive === false ? "غير نشط" : "نشط"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditCategory(category)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (
                                        confirm(`هل تريد حذف الفئة ${category.name}?`)
                                      )
                                        deleteCategoryMutation.mutate(category.id);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {!isManager && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>إدارة الأقسام</CardTitle>
                    <CardDescription>أضف أو عدّل أقسام المنتجات</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="brandName">اسم القسم</Label>
                      <Input
                        id="brandName"
                        value={brandFormData.name}
                        onChange={e =>
                          setBrandFormData(prev => ({
                            ...prev,
                            name: e.target.value,
                            slug: prev.slug || slugify(e.target.value),
                          }))
                        }
                        placeholder="مثال: Apple"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandCode">معرف القسم بالإنجليزية</Label>
                      <Input
                        id="brandCode"
                        value={brandFormData.brandCode}
                        onChange={e =>
                          setBrandFormData(prev => ({
                            ...prev,
                            brandCode: e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9-]/g, ""),
                          }))
                        }
                        placeholder="SEC-APPLE"
                      />
                      <p className="text-xs text-gray-500">
                        حروف إنجليزية وأرقام وشرطة فقط. يُستخدم في معرف المنتج.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandManager">المدير المسؤول</Label>
                      <select
                        id="brandManager"
                        value={brandFormData.managerId ?? ""}
                        onChange={e =>
                          setBrandFormData(prev => ({
                            ...prev,
                            managerId: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">بدون مدير مسؤول</option>
                        {(managers || [])
                          .filter((manager: any) => manager.role === "manager")
                          .map((manager: any) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name} — {manager.username}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500">
                        يمكن للمدير العام ربط هذا القسم بمدير واحد.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandSlug">الاسم المختصر</Label>
                      <Input
                        id="brandSlug"
                        value={brandFormData.slug}
                        onChange={e =>
                          setBrandFormData(prev => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                        placeholder="apple"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandDescription">الوصف</Label>
                      <Textarea
                        id="brandDescription"
                        value={brandFormData.description}
                        onChange={e =>
                          setBrandFormData(prev => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandLogo">شعار القسم</Label>
                      <div className="flex items-center gap-3">
                        {brandFormData.logo ? (
                          <img
                            src={brandFormData.logo}
                            alt="معاينة شعار القسم"
                            className="h-14 w-14 rounded-lg border object-cover bg-white"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed bg-gray-50 text-xs text-gray-400">
                            شعار
                          </div>
                        )}
                        <Input
                          id="brandLogo"
                          type="file"
                          accept="image/*"
                          onChange={handleBrandLogoFileChange}
                          className="max-w-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="brandActive"
                        type="checkbox"
                        checked={brandFormData.isActive}
                        onChange={e =>
                          setBrandFormData(prev => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                      />
                      <Label htmlFor="brandActive">نشط</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={handleBrandSubmit}
                        disabled={
                          createBrandMutation.isPending ||
                          updateBrandMutation.isPending
                        }
                      >
                        {editingBrand ? "تحديث القسم" : "إضافة قسم"}
                      </Button>
                      {editingBrand && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingBrand(null);
                            setBrandFormData({ ...emptyBrandForm });
                          }}
                        >
                          إلغاء
                        </Button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">معرف القسم</TableHead>
                            <TableHead className="text-right">الاسم</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {brandsLoading ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-sm text-gray-400">
                                جاري التحميل...
                              </TableCell>
                            </TableRow>
                          ) : (
                            (brands || []).map((brand: any) => (
                              <TableRow key={brand.id}>
                                <TableCell className="font-mono text-xs text-gray-600">
                                  {brand.brandCode || brand.id}
                                </TableCell>
                                <TableCell>{brand.name}</TableCell>
                                <TableCell>{brand.isActive === false ? "غير نشط" : "نشط"}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditBrand(brand)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`هل تريد حذف القسم ${brand.name}?`))
                                          deleteBrandMutation.mutate(brand.id);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          {!isManager && (
            <TabsContent value="welcome">
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>الرسائل الترحيبية ({welcomeMessages?.length || 0})</CardTitle>
                      <CardDescription>إدارة الرسائل المتحركة التي تظهر في الصفحة الرئيسية</CardDescription>
                    </div>
                    <Button onClick={openAddWelcomeMessageDialog} className="bg-blue-600">
                      <Plus className="ml-2 h-4 w-4" /> إضافة رسالة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-right">المحتوى</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {welcomeMessagesLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center">جاري التحميل...</TableCell></TableRow>
                        ) : (
                          (welcomeMessages || []).map((msg: any) => (
                            <TableRow key={msg.id}>
                              <TableCell className="font-medium">{msg.name}</TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate" style={{ color: msg.color }}>{msg.content}</div>
                              </TableCell>
                              <TableCell>{msg.isActive ? "نشط" : "غير نشط"}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openEditWelcomeMessageDialog(msg)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذه الرسالة؟")) deleteWelcomeMessageMutation.mutate(msg.id);
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          {!isManager && (
            <TabsContent value="users">
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>المستخدمون ({users?.length || 0})</CardTitle>
                      <CardDescription>
                        عرض وتعديل وحذف وإضافة المستخدمين
                      </CardDescription>
                    </div>
                    <Button
                      onClick={openAddUserDialog}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مستخدم
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-12 bg-gray-100 rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  ) : !users || users.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p>لا توجد مستخدمين مسجلين بعد</p>
                      <Button
                        onClick={openAddUserDialog}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        أضف أول مستخدم
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">الاسم</TableHead>
                            <TableHead className="text-right">البريد</TableHead>
                            <TableHead className="text-right">الدور</TableHead>
                            <TableHead className="text-right">
                              طريقة الدخول
                            </TableHead>
                            <TableHead className="text-right">
                              تاريخ الإنشاء
                            </TableHead>
                            <TableHead className="text-right">
                              الإجراءات
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((userItem: any) => (
                            <TableRow key={userItem.id}>
                              <TableCell className="font-medium">
                                {userItem.name || "—"}
                              </TableCell>
                              <TableCell>{userItem.email || "—"}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${userItem.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                                >
                                  {userItem.role === "admin"
                                    ? "مدير"
                                    : "مستخدم"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {userItem.loginMethod || "—"}
                              </TableCell>
                              <TableCell>
                                {userItem.createdAt
                                  ? new Date(
                                      userItem.createdAt
                                    ).toLocaleDateString("ar-SA")
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditUserDialog(userItem)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUser(userItem)}
                                    disabled={
                                      deleteUserMutation.isPending ||
                                      userItem.id === user?.id
                                    }
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
          {!isManager && (
            <TabsContent value="reviews">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>التقييمات ({reviews?.length || 0})</CardTitle>
                  <CardDescription>عرض وحذف تقييمات العملاء</CardDescription>
                </CardHeader>
                <CardContent>
                  {reviewsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-20 bg-gray-100 rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  ) : !reviews || reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p>لا توجد تقييمات بعد</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review: any) => (
                        <div
                          key={review.id}
                          className="border rounded-xl p-4 flex items-start justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">
                                {review.title}
                              </h4>
                              <div className="flex">
                                {[...Array(5)].map((_, j) => (
                                  <Star
                                    key={j}
                                    className={`w-3 h-3 ${j < parseInt(review.rating || "0") ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-600 mb-1">
                                {review.comment}
                              </p>
                            )}
                            <div className="flex gap-3 text-xs text-gray-400">
                              <span>منتج #{review.productId}</span>
                              <span>مستخدم #{review.userId}</span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا التقييم؟"))
                                deleteReviewMutation.mutate(review.id);
                            }}
                            disabled={deleteReviewMutation.isPending}
                            className="h-8 w-8 p-0 mr-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog
        open={isProductDialogOpen}
        onOpenChange={open => {
          if (!open) closeProductDialog();
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingProduct ? "✏️ تعديل المنتج" : "➕ إضافة منتج جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? `تعديل بيانات المنتج: ${editingProduct.name}`
                : "أضف منتجاً جديداً إلى متجرك"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="productName">
                اسم المنتج <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                placeholder="مثال: iPhone 15 Pro Max"
                value={productFormData.name}
                onChange={e => handleProductFormChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="productBrand">
                الأقسام <span className="text-red-500">*</span>
              </Label>
              <select
                id="productBrand"
                value={productFormData.brandId ?? ""}
                onChange={e => {
                  const selectedId = e.target.value
                    ? Number(e.target.value)
                    : null;
                  const selectedBrand = (brands || []).find(
                    (item: any) => item.id === selectedId
                  );
                  setProductFormData(prev => ({
                    ...prev,
                    brandId: selectedId,
                    brand: selectedBrand?.name || prev.brand,
                  }));
                }}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر القسم...</option>
                {(brands || []).map((brand: any) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="productCategory">
                الفئة <span className="text-red-500">*</span>
              </Label>
              <select
                id="productCategory"
                value={productFormData.categoryId ?? ""}
                onChange={e => {
                  const selectedId = e.target.value
                    ? Number(e.target.value)
                    : null;
                  const selectedCategory = (categories || []).find(
                    (item: any) => item.id === selectedId
                  );
                  setProductFormData(prev => ({
                    ...prev,
                    categoryId: selectedId,
                    category: selectedCategory?.name || prev.category,
                  }));
                }}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر الفئة...</option>
                {(categories || []).map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="productDescription">الوصف</Label>
              <Textarea
                id="productDescription"
                placeholder="وصف المنتج..."
                value={productFormData.description}
                onChange={e =>
                  handleProductFormChange("description", e.target.value)
                }
                rows={3}
              />
            </div>

            {productFormData.isSellable && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="productPrice">
                    سعر البيع (ل.س) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productPrice"
                    type="number"
                    placeholder="0"
                    value={productFormData.price}
                    onChange={e =>
                      handleProductFormChange("price", e.target.value)
                    }
                    min="0"
                    step="1"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="productPurchasePrice">سعر الشراء (ل.س)</Label>
                  <Input
                    id="productPurchasePrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={productFormData.purchasePrice}
                    onChange={e =>
                      handleProductFormChange("purchasePrice", e.target.value)
                    }
                  />
                </div>
              </div>
            )}
            {productFormData.isSellable && productFormData.isOnSale && (
              <div className="space-y-1">
                <Label htmlFor="productOldPrice">
                  السعر قبل التخفيض (اختياري، لعرض الخصم)
                </Label>
                <Input
                  id="productOldPrice"
                  type="number"
                  placeholder="0"
                  value={productFormData.oldPrice}
                  onChange={e =>
                    handleProductFormChange("oldPrice", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
            )}

            <div className="order-first rounded-xl border-2 border-emerald-100 bg-emerald-50/60 p-4">
              <div className="mb-3">
                <Label className="text-base font-bold text-emerald-900">
                  إعدادات البيع والإيجار
                </Label>
                <p className="mt-1 text-xs text-emerald-700">
                  المنتج للبيع افتراضيًا. أزل علامة البيع لإخفاء أسعار البيع
                  والشراء.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productIsSellable">هل المنتج للبيع؟</Label>
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-950 shadow-sm transition-colors hover:bg-emerald-50">
                    <Checkbox
                      id="productIsSellable"
                      checked={productFormData.isSellable}
                      onCheckedChange={checked => {
                        const isSellable = checked === true;
                        handleProductFormChange("isSellable", isSellable);
                        if (!isSellable) {
                          handleProductFormChange("price", "0");
                          handleProductFormChange("purchasePrice", "");
                          handleProductFormChange("oldPrice", "");
                        }
                      }}
                    />
                    <span>
                      {productFormData.isSellable
                        ? "نعم، المنتج للبيع"
                        : "لا، إخفاء أسعار البيع والشراء"}
                    </span>
                  </label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="productIsRentable">
                    هل المنتج قابل للإيجار؟
                  </Label>
                  <select
                    id="productIsRentable"
                    value={productFormData.isRentable ? "yes" : "no"}
                    onChange={e => {
                      const isRentable = e.target.value === "yes";
                      handleProductFormChange("isRentable", isRentable);
                      if (!isRentable)
                        handleProductFormChange("rentalPrice", "");
                    }}
                    className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="no">لا</option>
                    <option value="yes">نعم</option>
                  </select>
                </div>
                {productFormData.isRentable && (
                  <div className="space-y-1">
                    <Label htmlFor="productRentalPrice">
                      سعر الإيجار (ل.س)
                    </Label>
                    <Input
                      id="productRentalPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={productFormData.rentalPrice}
                      onChange={e =>
                        handleProductFormChange("rentalPrice", e.target.value)
                      }
                      className="border-emerald-200 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="productStock">الكمية في المخزون</Label>
              <Input
                id="productStock"
                type="number"
                placeholder="0"
                value={productFormData.stock}
                onChange={e =>
                  handleProductFormChange(
                    "stock",
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="productIsOnSale">هل هذا المنتج في عرض؟</Label>
              <select
                id="productIsOnSale"
                value={productFormData.isOnSale ? "yes" : "no"}
                onChange={e =>
                  handleProductFormChange("isOnSale", e.target.value === "yes")
                }
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="no">لا</option>
                <option value="yes">نعم</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productImage">الصورة الرئيسية أو رابط صورة</Label>
              <Input
                id="productImage"
                type="url"
                placeholder="https://..."
                value={productFormData.image}
                onChange={e => {
                  const image = e.target.value;
                  handleProductFormChange("image", image);
                  if (image && !productFormData.images.includes(image)) {
                    handleProductFormChange("images", [
                      image,
                      ...productFormData.images,
                    ]);
                  }
                }}
              />
              <div className="space-y-1 pt-2">
                <Label htmlFor="productImageFile">
                  أضف صورًا متعددة من جهازك
                </Label>
                <Input
                  id="productImageFile"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProductImageFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  يمكن اختيار عدة صور دفعة واحدة. الصورة الأولى هي صورة العرض
                  الرئيسية.
                </p>
              </div>
              {productFormData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-5">
                  {productFormData.images.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-white"
                    >
                      <img
                        src={image}
                        alt={`صورة المنتج ${index + 1}`}
                        className="h-full w-full object-contain p-1"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-0 right-0 left-0 bg-blue-600/90 px-1 py-0.5 text-center text-[10px] font-bold text-white">
                          رئيسية
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`حذف صورة ${index + 1}`}
                        onClick={() => {
                          const images = productFormData.images.filter(
                            (_, imageIndex) => imageIndex !== index
                          );
                          handleProductFormChange("images", images);
                          handleProductFormChange("image", images[0] || "");
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="productColor">اللون (للمنتجات النسائية)</Label>
                <Input
                  id="productColor"
                  placeholder="مثال: أسود، وردي، بيج"
                  value={productFormData.color}
                  onChange={e =>
                    handleProductFormChange("color", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="productSize">المقاس (للمنتجات النسائية)</Label>
                <Input
                  id="productSize"
                  placeholder="مثال: S، M، L أو 38"
                  value={productFormData.size}
                  onChange={e =>
                    handleProductFormChange("size", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="productBadge">نص الشارة (اختياري)</Label>
                <Input
                  id="productBadge"
                  placeholder="مثال: جديد، خصم 20%"
                  value={productFormData.badge}
                  onChange={e =>
                    handleProductFormChange("badge", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="productBadgeColor">لون الشارة</Label>
                <select
                  id="productBadgeColor"
                  value={productFormData.badgeColor}
                  onChange={e =>
                    handleProductFormChange("badgeColor", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BADGE_COLORS.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleProductSubmit}
                disabled={isPending}
              >
                {isPending
                  ? "جاري الحفظ..."
                  : editingProduct
                    ? "تحديث المنتج"
                    : "إضافة المنتج"}
              </Button>
              <Button
                variant="outline"
                onClick={closeProductDialog}
                disabled={isPending}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Message Dialog */}
      <Dialog open={isWelcomeMessageDialogOpen} onOpenChange={setIsWelcomeMessageDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingWelcomeMessage ? "تعديل الرسالة الترحيبية" : "إضافة رسالة ترحيبية جديدة"}</DialogTitle>
            <DialogDescription>صمم الرسالة التي ستظهر بشكل متحرك فوق شريط البحث.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الرسالة (للإدارة)</Label>
                <Input value={welcomeMessageFormData.name} onChange={e => setWelcomeMessageFormData(p => ({ ...p, name: e.target.value }))} placeholder="مثال: رسالة العيد" />
              </div>
              <div className="space-y-2">
                <Label>نص الرسالة</Label>
                <Textarea value={welcomeMessageFormData.content} onChange={e => setWelcomeMessageFormData(p => ({ ...p, content: e.target.value }))} placeholder="أهلاً بكم في متجرنا..." />
              </div>
              <div className="space-y-2">
                <Label>لون النص</Label>
                <div className="flex gap-2 flex-wrap">
                  {["#000000", "#f97316", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6"].map(c => (
                    <button key={c} onClick={() => setWelcomeMessageFormData(p => ({ ...p, color: c }))} className={`h-8 w-8 rounded-full border-2 ${welcomeMessageFormData.color === c ? 'border-black' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                  <Input type="color" className="h-8 w-12 p-0 border-none" value={welcomeMessageFormData.color} onChange={e => setWelcomeMessageFormData(p => ({ ...p, color: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>حجم الخط</Label>
                <select className="w-full h-10 border rounded-md px-3" value={welcomeMessageFormData.style.fontSize} onChange={e => setWelcomeMessageFormData(p => ({ ...p, style: { ...p.style, fontSize: e.target.value } }))}>
                  {["14px", "16px", "18px", "20px", "24px", "28px"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>نوع الخط</Label>
                <select className="w-full h-10 border rounded-md px-3" value={welcomeMessageFormData.style.fontFamily} onChange={e => setWelcomeMessageFormData(p => ({ ...p, style: { ...p.style, fontFamily: e.target.value } }))}>
                  {["Cairo", "Tajawal", "Almarai", "Amiri"].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input type="checkbox" id="msgActive" checked={welcomeMessageFormData.isActive} onChange={e => setWelcomeMessageFormData(p => ({ ...p, isActive: e.target.checked }))} />
                <Label htmlFor="msgActive">تفعيل الرسالة الآن</Label>
              </div>
              <div className="mt-4 p-4 border rounded-xl bg-gray-50">
                <Label className="text-xs text-gray-400 mb-2 block">معاينة مباشرة:</Label>
                <div className="overflow-hidden whitespace-nowrap py-2 bg-white rounded border border-gray-100">
                  <div style={{ color: welcomeMessageFormData.color, fontSize: welcomeMessageFormData.style.fontSize, fontFamily: welcomeMessageFormData.style.fontFamily }}>
                    {welcomeMessageFormData.content || "نص المعاينة يظهر هنا..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={closeWelcomeMessageDialog}>إلغاء</Button>
            <Button onClick={handleWelcomeMessageSubmit} className="bg-blue-600">{editingWelcomeMessage ? "تحديث" : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isUserDialogOpen}
        onOpenChange={open => {
          if (!open) closeUserDialog();
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingUser ? "✏️ تعديل المستخدم" : "➕ إضافة مستخدم جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? `تعديل بيانات المستخدم: ${editingUser.name || editingUser.email}`
                : "أضف مستخدماً جديداً إلى النظام"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="userName">
                الاسم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userName"
                placeholder="مثال: أحمد محمد"
                value={userFormData.name}
                onChange={e => handleUserFormChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="userEmail">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="example@email.com"
                value={userFormData.email}
                onChange={e => handleUserFormChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="userPhone">رقم الهاتف</Label>
              <Input
                id="userPhone"
                placeholder="05xxxxxxxx"
                value={userFormData.phone}
                onChange={e => handleUserFormChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="userAddress">العنوان</Label>
              <Textarea
                id="userAddress"
                placeholder="العنوان..."
                value={userFormData.address}
                onChange={e => handleUserFormChange("address", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="userRole">الدور</Label>
              <select
                id="userRole"
                value={userFormData.role}
                onChange={e =>
                  handleUserFormChange(
                    "role",
                    e.target.value as "user" | "manager" | "admin"
                  )
                }
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">مستخدم</option>
                <option value="manager">مدير قسم</option>
                <option value="admin">المدير العام</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleUserSubmit}
                disabled={isUserPending}
              >
                {isUserPending
                  ? "جاري الحفظ..."
                  : editingUser
                    ? "تحديث المستخدم"
                    : "إضافة المستخدم"}
              </Button>
              <Button
                variant="outline"
                onClick={closeUserDialog}
                disabled={isUserPending}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

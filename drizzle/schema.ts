import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 100 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  token: text("token"),
  role: mysqlEnum("role", ["user", "admin", "manager"])
    .default("user")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Category Table ─────────────────────────────────────────────────────────
export const category = mysqlTable("category", {
  id: int("id").autoincrement().primaryKey(),
  categoryCode: varchar("categoryCode", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  sectionId: int("sectionId"),
  image: text("image"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof category.$inferSelect;
export type InsertCategory = typeof category.$inferInsert;

// ─── Manager Category Assignments ─────────────────────────────────────────────
export const managerCategoryAssignments = mysqlTable(
  "managerCategoryAssignments",
  {
    id: int("id").autoincrement().primaryKey(),
    managerId: int("managerId").notNull(),
    categoryId: int("categoryId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

export type ManagerCategoryAssignment =
  typeof managerCategoryAssignments.$inferSelect;
export type InsertManagerCategoryAssignment =
  typeof managerCategoryAssignments.$inferInsert;

// ─── Brand Table ───────────────────────────────────────────────────────────
export const brand = mysqlTable("brand", {
  id: int("id").autoincrement().primaryKey(),
  brandCode: varchar("brandCode", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  image: text("image"),
  managerId: int("managerId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Brand = typeof brand.$inferSelect;
export type InsertBrand = typeof brand.$inferInsert;

// ─── Products Table ───────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productCode: varchar("productCode", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  categoryId: int("categoryId"),
  brandId: int("brandId"),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  oldPrice: decimal("oldPrice", { precision: 10, scale: 2 }),
  isRentable: boolean("isRentable").default(false).notNull(),
  isSellable: boolean("isSellable").default(true).notNull(),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 2 }),
  rentalPrice: decimal("rentalPrice", { precision: 10, scale: 2 }),
  image: text("image"), // URL to image
  images: json("images").$type<string[]>(), // Array of image URLs
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: int("reviewCount").default(0),
  stock: int("stock").default(0),
  isOnSale: boolean("isOnSale").default(false).notNull(),
  badge: varchar("badge", { length: 100 }),
  badgeColor: varchar("badgeColor", { length: 50 }),
  color: varchar("color", { length: 100 }),
  size: varchar("size", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Shopping Cart Table ──────────────────────────────────────────────────────
// Keep the table name lowercase to match the production SQL dump. MySQL table
// names can be case-sensitive on Linux, so "cartItems" would point elsewhere.
export const cartItems = mysqlTable("cartitems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  rentalDate: date("rentalDate", { mode: "string" }),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ─── Rental Requests & Bookings ───────────────────────────────────────────────
export const rentalRequests = mysqlTable("rentalRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  rentalDate: date("rentalDate", { mode: "string" }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "unavailable",
    "approved",
    "cancelled",
    "returned",
  ])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalRequest = typeof rentalRequests.$inferSelect;
export type InsertRentalRequest = typeof rentalRequests.$inferInsert;

export const rentalBookings = mysqlTable("rentalBookings", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  rentalDate: date("rentalDate", { mode: "string" }).notNull(),
  status: mysqlEnum("status", ["booked", "available"])
    .default("booked")
    .notNull(),
  quantity: int("quantity").default(1).notNull(),
  rentalPrice: decimal("rentalPrice", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  payments: decimal("payments", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  remaining: decimal("remaining", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  rentalRequestId: int("rentalRequestId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalBooking = typeof rentalBookings.$inferSelect;
export type InsertRentalBooking = typeof rentalBookings.$inferInsert;

// ─── Wishlist Table ───────────────────────────────────────────────────────────
export const wishlistItems = mysqlTable("wishlistItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = typeof wishlistItems.$inferInsert;

// ─── Reviews & Ratings Table ──────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  rating: int("rating").notNull(), // 1-5
  title: varchar("title", { length: 255 }).notNull(),
  comment: text("comment"),
  helpful: int("helpful").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Orders Table (for future use) ────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]).default("pending"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"])
    .default("unpaid")
    .notNull(),
  paymentMethod: varchar("paymentMethod", { length: 100 }).notNull(),
  customerName: text("customerName"),
  customerPhone: varchar("customerPhone", { length: 20 }),
  shippingAddress: text("shippingAddress"),
  estimatedDeliveryMinutes: int("estimatedDeliveryMinutes"),
  items: json("items").$type<
    Array<{
      productId: number;
      quantity: number;
      price: number;
      title?: string | null;
      image?: string | null;
    }>
  >(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Welcome Messages Table ───────────────────────────────────────────────────
export const welcomeMessages = mysqlTable("welcomeMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  color: varchar("color", { length: 50 }).default("#000000"),
  style: json("style").$type<{
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    backgroundColor?: string;
  }>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WelcomeMessage = typeof welcomeMessages.$inferSelect;
export type InsertWelcomeMessage = typeof welcomeMessages.$inferInsert;

// ─── Economic Feasibility Ledger ──────────────────────────────────────────────
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId"),
  managerId: int("managerId"),
  categoryId: int("categoryId"),
  productId: int("productId"),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  profitAmount: decimal("profitAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["confirmed", "cancelled"])
    .default("confirmed")
    .notNull(),
  saleDate: timestamp("saleDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId"),
  categoryId: int("categoryId"),
  productId: int("productId"),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["confirmed", "cancelled"])
    .default("confirmed")
    .notNull(),
  purchaseDate: timestamp("purchaseDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId"),
  title: varchar("title", { length: 255 }).notNull(),
  expenseCategory: varchar("expenseCategory", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  expenseDate: timestamp("expenseDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const cashTransactions = mysqlTable("cashTransactions", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId"),
  type: mysqlEnum("type", ["income", "expense", "adjustment"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  sourceType: varchar("sourceType", { length: 50 }),
  sourceId: int("sourceId"),
  transactionDate: timestamp("transactionDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CashTransaction = typeof cashTransactions.$inferSelect;
export type InsertCashTransaction = typeof cashTransactions.$inferInsert;

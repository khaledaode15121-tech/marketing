import mysql, { type RowDataPacket } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  Product,
  products,
  CartItem,
  cartItems,
  WishlistItem,
  wishlistItems,
  Review,
  reviews,
  Category,
  InsertCategory,
  Brand,
  InsertBrand,
  Order,
  orders,
  InsertOrder,
  rentalRequests,
  rentalBookings,
  category as categoryTable,
  brand as brandTable,
  welcomeMessages,
  managerCategoryAssignments,
  sales,
  purchases,
  expenses,
  cashTransactions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { hashManagerPassword } from "./_core/managerAuth";
import { eq, and, or, like, gte, lte, inArray, desc } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

export function resolveDatabaseUrl() {
  return process.env.DATABASE_URL || ENV.databaseUrl || "";
}

export function extractInsertId(result: unknown): number | undefined {
  if (Array.isArray(result)) {
    for (const item of result) {
      const nestedInsertId = extractInsertId(item);
      if (typeof nestedInsertId === "number") {
        return nestedInsertId;
      }
    }
    return undefined;
  }

  if (typeof result !== "object" || result === null) {
    return undefined;
  }

  const record = result as { insertId?: unknown };
  if (typeof record.insertId === "number") {
    return record.insertId;
  }

  return undefined;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
async function ensureDatabaseSchemaCompatibility() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) return;

  try {
    const connection = await mysql.createConnection(databaseUrl);

    try {
      // Older SQL dumps used `cartItems`, while the application schema uses
      // the lowercase `cartitems`. On Linux MySQL treats these as different
      // tables, so normalize the legacy name before any Drizzle query runs.
      const [cartNameRows] = await connection.query<RowDataPacket[]>(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?)`,
        ["cartitems"]
      );
      const cartNames = cartNameRows.map(row => String(row.TABLE_NAME));
      const lowerCartName = cartNames.find(name => name === "cartitems");
      const legacyCartName = cartNames.find(name => name === "cartItems");
      if (!lowerCartName && legacyCartName) {
        await connection.query("RENAME TABLE `cartItems` TO `cartitems`");
      }

      const [cartTables] = await connection.query<RowDataPacket[]>(
        "SHOW TABLES LIKE ?",
        ["cartitems"]
      );
      if (!cartTables.length) {
        await connection.query(`CREATE TABLE IF NOT EXISTS \`cartitems\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`userId\` INT NOT NULL,
          \`productId\` INT NOT NULL,
          \`quantity\` INT NOT NULL DEFAULT 1,
          \`rentalDate\` DATE NULL,
          \`addedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_cartitems_user\` (\`userId\`),
          KEY \`idx_cartitems_product\` (\`productId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      }

      const [orderTables] = await connection.query<RowDataPacket[]>(
        "SHOW TABLES LIKE ?",
        ["orders"]
      );
      if (!orderTables.length) {
        await connection.query(`CREATE TABLE IF NOT EXISTS \`orders\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`userId\` INT NOT NULL,
          \`totalPrice\` DECIMAL(10,2) NOT NULL,
          \`status\` ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
          \`paymentStatus\` ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
          \`paymentMethod\` VARCHAR(100) NOT NULL,
          \`customerName\` TEXT NULL,
          \`customerPhone\` VARCHAR(20) NULL,
          \`shippingAddress\` TEXT NULL,
          \`estimatedDeliveryMinutes\` INT NULL,
          \`items\` JSON NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_orders_user\` (\`userId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      }

      const tableChecks = [
        {
          table: "products",
          columns: [
            ["productCode", "VARCHAR(64) NULL"],
            ["categoryId", "INT NULL"],
            ["brandId", "INT NULL"],
            ["oldPrice", "DECIMAL(10,2) NULL"],
            ["isRentable", "BOOLEAN NOT NULL DEFAULT FALSE"],
            ["isSellable", "BOOLEAN NOT NULL DEFAULT TRUE"],
            ["purchasePrice", "DECIMAL(10,2) NULL"],
            ["rentalPrice", "DECIMAL(10,2) NULL"],
            ["images", "JSON NULL"],
            ["rating", "DECIMAL(3,2) NULL DEFAULT 0"],
            ["reviewCount", "INT NULL DEFAULT 0"],
            ["stock", "INT NULL DEFAULT 0"],
            ["isOnSale", "BOOLEAN NOT NULL DEFAULT FALSE"],
            ["badge", "VARCHAR(100) NULL"],
            ["badgeColor", "VARCHAR(50) NULL"],
            ["color", "VARCHAR(100) NULL"],
            ["size", "VARCHAR(100) NULL"],
          ],
        },
        {
          table: "category",
          columns: [["sectionId", "INT NULL"]],
        },
        {
          table: "brand",
          columns: [
            ["image", "TEXT NULL"],
            ["managerId", "INT NULL"],
          ],
        },
        {
          // Existing installations may have an older cart table without the
          // columns used by the current cart queries.
          table: "cartitems",
          columns: [
            ["userId", "INT NOT NULL"],
            ["productId", "INT NOT NULL"],
            ["quantity", "INT NOT NULL DEFAULT 1"],
            ["rentalDate", "DATE NULL"],
            ["addedAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
            [
              "updatedAt",
              "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
            ],
          ],
        },
        {
          table: "orders",
          columns: [
            ["paymentStatus", "ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid'"],
            ["paymentMethod", "VARCHAR(100) NOT NULL DEFAULT 'الدفع عند الاستلام'"],
            ["customerName", "TEXT NULL"],
            ["customerPhone", "VARCHAR(20) NULL"],
            ["shippingAddress", "TEXT NULL"],
            ["estimatedDeliveryMinutes", "INT NULL"],
            ["items", "JSON NULL"],
            ["createdAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
            ["updatedAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
          ],
        },
      ];

      const requiredTables = [
        {
          table: "users",
          sql: `CREATE TABLE IF NOT EXISTS users (
            id INT NOT NULL AUTO_INCREMENT, openId VARCHAR(64) NOT NULL,
            username VARCHAR(100) NULL, passwordHash VARCHAR(255) NULL,
            name TEXT NULL, email VARCHAR(320) NULL, phone VARCHAR(20) NULL,
            address TEXT NULL, loginMethod VARCHAR(64) NULL, token TEXT NULL,
            role ENUM('user','admin','manager') NOT NULL DEFAULT 'user',
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id), UNIQUE KEY uq_users_openId (openId), UNIQUE KEY uq_users_username (username)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "category",
          sql: `CREATE TABLE IF NOT EXISTS category (
            id INT NOT NULL AUTO_INCREMENT, categoryCode VARCHAR(32) NOT NULL,
            name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL,
            description TEXT NULL, sectionId INT NULL, image TEXT NULL,
            isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id), UNIQUE KEY uq_category_code (categoryCode), UNIQUE KEY uq_category_slug (slug)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "brand",
          sql: `CREATE TABLE IF NOT EXISTS brand (
            id INT NOT NULL AUTO_INCREMENT, brandCode VARCHAR(32) NOT NULL,
            name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL,
            description TEXT NULL, logo TEXT NULL, image TEXT NULL,
            managerId INT NULL, isActive BOOLEAN NOT NULL DEFAULT TRUE,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id), UNIQUE KEY uq_brand_code (brandCode), UNIQUE KEY uq_brand_slug (slug)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "products",
          sql: `CREATE TABLE IF NOT EXISTS products (
            id INT NOT NULL AUTO_INCREMENT, productCode VARCHAR(64) NOT NULL,
            name VARCHAR(255) NOT NULL, brand VARCHAR(100) NOT NULL, category VARCHAR(100) NOT NULL,
            categoryId INT NULL, brandId INT NULL, description TEXT NULL,
            price DECIMAL(10,2) NOT NULL, oldPrice DECIMAL(10,2) NULL,
            isRentable BOOLEAN NOT NULL DEFAULT FALSE, isSellable BOOLEAN NOT NULL DEFAULT TRUE,
            purchasePrice DECIMAL(10,2) NULL, rentalPrice DECIMAL(10,2) NULL,
            image TEXT NULL, images JSON NULL, rating DECIMAL(3,2) DEFAULT 0,
            reviewCount INT DEFAULT 0, stock INT DEFAULT 0, isOnSale BOOLEAN NOT NULL DEFAULT FALSE,
            badge VARCHAR(100) NULL, badgeColor VARCHAR(50) NULL, color VARCHAR(100) NULL, size VARCHAR(100) NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id), UNIQUE KEY uq_products_code (productCode)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          // The SQL dump uses the lowercase table name. Keep this explicit so
          // fresh or partially migrated databases can serve cart requests.
          table: "cartitems",
          sql: `CREATE TABLE IF NOT EXISTS \`cartitems\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`userId\` INT NOT NULL,
            \`productId\` INT NOT NULL,
            \`quantity\` INT NOT NULL,
            \`rentalDate\` DATE NULL,
            \`addedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`idx_cartitems_user\` (\`userId\`),
            KEY \`idx_cartitems_product\` (\`productId\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "managerCategoryAssignments",
          sql: `CREATE TABLE IF NOT EXISTS \`managerCategoryAssignments\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`managerId\` INT NOT NULL,
            \`categoryId\` INT NOT NULL,
            \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`idx_manager_category_manager\` (\`managerId\`),
            KEY \`idx_manager_category_category\` (\`categoryId\`),
            UNIQUE KEY \`uq_manager_category\` (\`managerId\`,\`categoryId\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "sales",
          sql: `CREATE TABLE IF NOT EXISTS \`sales\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`orderId\` INT NULL,
            \`managerId\` INT NULL,
            \`categoryId\` INT NULL,
            \`productId\` INT NULL,
            \`productName\` VARCHAR(255) NOT NULL,
            \`quantity\` INT NOT NULL DEFAULT 1,
            \`unitPrice\` DECIMAL(12,2) NOT NULL,
            \`unitCost\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            \`totalAmount\` DECIMAL(12,2) NOT NULL,
            \`profitAmount\` DECIMAL(12,2) NOT NULL,
            \`status\` ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
            \`saleDate\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`idx_sales_order\` (\`orderId\`),
            KEY \`idx_sales_manager\` (\`managerId\`),
            KEY \`idx_sales_category\` (\`categoryId\`),
            KEY \`idx_sales_date\` (\`saleDate\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "purchases",
          sql: `CREATE TABLE IF NOT EXISTS \`purchases\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`managerId\` INT NULL,
            \`categoryId\` INT NULL,
            \`productId\` INT NULL,
            \`productName\` VARCHAR(255) NOT NULL,
            \`quantity\` INT NOT NULL DEFAULT 1,
            \`unitCost\` DECIMAL(12,2) NOT NULL,
            \`totalAmount\` DECIMAL(12,2) NOT NULL,
            \`status\` ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
            \`purchaseDate\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`idx_purchases_manager\` (\`managerId\`),
            KEY \`idx_purchases_category\` (\`categoryId\`),
            KEY \`idx_purchases_date\` (\`purchaseDate\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "expenses",
          sql: `CREATE TABLE IF NOT EXISTS \`expenses\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`managerId\` INT NULL,
            \`title\` VARCHAR(255) NOT NULL,
            \`expenseCategory\` VARCHAR(100) NOT NULL,
            \`amount\` DECIMAL(12,2) NOT NULL,
            \`notes\` TEXT NULL,
            \`expenseDate\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`idx_expenses_manager\` (\`managerId\`),
            KEY \`idx_expenses_date\` (\`expenseDate\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
          table: "cashTransactions",
          sql: `CREATE TABLE IF NOT EXISTS \`cashTransactions\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`managerId\` INT NULL,
            \`type\` ENUM('income','expense','adjustment') NOT NULL,
            \`amount\` DECIMAL(12,2) NOT NULL,
            \`description\` VARCHAR(255) NOT NULL,
            \`sourceType\` VARCHAR(50) NULL,
            \`sourceId\` INT NULL,
            \`transactionDate\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`idx_cash_manager\` (\`managerId\`),
            KEY \`idx_cash_source\` (\`sourceType\`,\`sourceId\`),
            KEY \`idx_cash_date\` (\`transactionDate\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        }
      ];

      // Create missing feature tables before inspecting their columns. This
      // makes a fresh or partially migrated database self-healing instead of
      // aborting the whole compatibility pass at the first missing table.
      for (const { table, sql } of requiredTables) {
        const [tables] = await connection.query<RowDataPacket[]>(
          `SELECT TABLE_NAME FROM information_schema.TABLES
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
          [table]
        );
        if (!tables.length) await connection.query(sql);
      }

      for (const { table, columns } of tableChecks) {
        const [rows] = await connection.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${table}\``);
        const existingFields = new Set(rows.map(row => row.Field));
        const missingColumns = columns.filter(([field]) => !existingFields.has(field));

        if (missingColumns.length === 0) continue;

        const addColumnSql = missingColumns
          .map(([field, definition]) => `ADD COLUMN \`${field}\` ${definition}`)
          .join(", ");

        await connection.query(`ALTER TABLE \`${table}\` ${addColumnSql}`);
      }

      for (const { table, sql } of requiredTables) {
        const [tables] = await connection.query<RowDataPacket[]>(
          `SELECT TABLE_NAME FROM information_schema.TABLES
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
          [table]
        );
        if (!tables.length) {
          await connection.query(sql);
        }
      }
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.warn("[Database] Schema compatibility check failed:", error);
  }
}

export async function getDb() {
  if (!_db) {
    const databaseUrl = resolveDatabaseUrl();
    if (!databaseUrl) {
      console.warn("[Database] No database URL configured");
      return null;
    }

    try {
      _db = drizzle(databaseUrl);
      await ensureDatabaseSchemaCompatibility();
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "phone",
      "address",
      "loginMethod",
      "token",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by id: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (err: any) {
    // Detect common migration mismatch (missing column) and surface a clearer message
    const msg = err && err.message ? String(err.message) : String(err);
    if (
      /Unknown column|doesn't exist|column not found|Unknown column/.test(msg)
    ) {
      console.error(
        `[Database] Query failed selecting users.email. Possible schema mismatch. Error: ${msg}`
      );
      console.error(
        `[Database] Ensure migrations have run (run 'pnpm run db:push') or add the missing columns (e.g. run ALTER TABLE users ADD COLUMN token TEXT NULL;)`
      );
    } else {
      console.error("[Database] Failed getUserByEmail:", err);
    }
    throw err;
  }
}

export async function updateUserById(
  id: number,
  values: Partial<
    Pick<
      InsertUser,
      | "openId"
      | "name"
      | "email"
      | "phone"
      | "address"
      | "loginMethod"
      | "lastSignedIn"
      | "role"
      | "token"
    >
  >
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return undefined;
  }

  await db.update(users).set(values).where(eq(users.id, id));
  return getUserById(id);
}

export async function getAllUsersAdmin() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createUserAdmin(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: "user" | "admin" | "manager";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const email = data.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("البريد الإلكتروني مستخدم بالفعل");
  }

  const openId = `local:${email}`;
  const payload: InsertUser = {
    openId,
    name: data.name.trim(),
    email,
    phone: data.phone?.trim() || null,
    address: data.address?.trim() || null,
    role: data.role || "user",
    loginMethod: "email",
    lastSignedIn: new Date(),
  };

  const result = await db.insert(users).values(payload);
  const insertId = extractInsertId(result);
  if (typeof insertId === "number") {
    return getUserById(insertId);
  }
  return undefined;
}

export async function updateUserAdmin(
  id: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    username?: string;
    password?: string;
    role?: "user" | "admin" | "manager";
    categoryIds?: number[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values: Partial<
    Pick<
      InsertUser,
      "name" | "email" | "phone" | "address" | "role" | "openId" | "username" | "passwordHash"
    >
  > = {};

  if (data.name !== undefined) values.name = data.name.trim();
  if (data.phone !== undefined) values.phone = data.phone.trim() || null;
  if (data.address !== undefined) values.address = data.address.trim() || null;
  if (data.role !== undefined) values.role = data.role;

  if (data.username !== undefined) {
    const username = data.username.trim();
    if (!username) throw new Error("اسم المستخدم مطلوب");
    const existing = await getUserByUsername(username);
    if (existing && existing.id !== id) {
      throw new Error("اسم المستخدم مستخدم بالفعل");
    }
    values.username = username;
  }

  if (data.password !== undefined) {
    const password = data.password.trim();
    if (!password) throw new Error("كلمة المرور غير صالحة");
    values.passwordHash = hashManagerPassword(password);
  }

  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    const existing = await getUserByEmail(email);
    if (existing && existing.id !== id) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }
    values.email = email;
    values.openId = `local:${email}`;
  }

  if (Object.keys(values).length > 0) {
    await db.update(users).set(values).where(eq(users.id, id));
  }

  if ((data.role === "manager" || data.role === "admin") && Array.isArray(data.categoryIds)) {
    await replaceManagerCategoryAssignments(id, data.categoryIds);
  }

  return getUserById(id);
}

export async function deleteUserAdmin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cartItems).where(eq(cartItems.userId, id));
  await db.delete(wishlistItems).where(eq(wishlistItems.userId, id));
  await db.delete(reviews).where(eq(reviews.userId, id));
  await db.delete(users).where(eq(users.id, id));
  return true;
}

// ─── Product Functions ────────────────────────────────────────────────────────
export async function getProducts(limit?: number) {
  const db = await getDb();
  if (!db) return [];

  if (limit) {
    return db.select().from(products).limit(limit);
  }
  return db.select().from(products);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(products).where(eq(products.category, category));
}

// ─── Cart Functions ───────────────────────────────────────────────────────────
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      rentalDate: cartItems.rentalDate,
      productName: products.name,
      productImage: products.image,
      productPrice: products.price,
      productStock: products.stock,
      isRentable: products.isRentable,
      rentalPrice: products.rentalPrice,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
}

export async function addToCart(
  userId: number,
  productId: number,
  quantity: number = 1
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
    )
    .limit(1);

  if (existing.length > 0) {
    // Update quantity
    return db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(
        and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      );
  } else {
    // Insert new cart item
    return db.insert(cartItems).values({ userId, productId, quantity });
  }
}

export async function setCartItemRentalDate(
  userId: number,
  productId: number,
  rentalDate: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (
    rentalDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(rentalDate) ||
      rentalDate < new Date().toISOString().slice(0, 10))
  ) {
    throw new Error("تاريخ الإيجار غير صالح أو سابق");
  }
  return db
    .update(cartItems)
    .set({ rentalDate })
    .where(
      and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
    );
}

export async function removeFromCart(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(cartItems)
    .where(
      and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
    );
}

export async function updateCartItemQuantity(
  userId: number,
  productId: number,
  quantity: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (quantity <= 0) {
    return removeFromCart(userId, productId);
  }

  return db
    .update(cartItems)
    .set({ quantity })
    .where(
      and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
    );
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(cartItems).where(eq(cartItems.userId, userId));
}

export async function createOrderFromCart(
  userId: number,
  paymentMethod: string,
  customerName: string | null,
  customerPhone: string | null,
  shippingAddress: string | null
) {
  if (userId <= 0) {
    throw new Error("معرّف المستخدم غير صالح لإنشاء الطلب");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cart = await getCartItems(userId);
  if (cart.length === 0) {
    throw new Error("عربة التسوق فارغة");
  }

  const productIds = cart.map(item => item.productId);
  const productsInCart = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));
  const productMap = new Map(
    productsInCart.map(product => [product.id, product])
  );

  const orderItems = cart.map(item => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`المنتج ${item.productId} غير موجود`);
    }
    const stock = product.stock ?? 0;
    if (stock < item.quantity) {
      throw new Error(
        `الكمية المطلوبة من المنتج ${product.name || item.productId} غير متوفرة`
      );
    }
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: parseFloat(product.price.toString()),
      title: product.name || `المنتج ${item.productId}`,
      image: product.image || null,
      stock,
    };
  });

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalPriceFormatted = totalPrice.toFixed(2);
  const rentalItems = cart.filter(item => Boolean(item.isRentable));
  for (const item of rentalItems) {
    if (!item.rentalDate)
      throw new Error(
        `يرجى تحديد تاريخ الإيجار للمنتج ${item.productName || item.productId}`
      );
    const conflict = await db
      .select({ id: rentalBookings.id })
      .from(rentalBookings)
      .where(
        and(
          eq(rentalBookings.productId, item.productId),
          eq(rentalBookings.rentalDate, item.rentalDate),
          eq(rentalBookings.status, "booked")
        )
      )
      .limit(1);
    if (conflict.length > 0)
      throw new Error(
        `المنتج ${item.productName || item.productId} غير متاح للإيجار في تاريخ ${item.rentalDate}`
      );
  }

  let createdOrderId: number | null = null;

  await db.transaction(async tx => {
    for (const item of orderItems) {
      const product = productMap.get(item.productId)!;
      const stock = product.stock ?? 0;
      await tx
        .update(products)
        .set({ stock: stock - item.quantity })
        .where(eq(products.id, product.id));
    }

    try {
      const insertedOrder = await tx.insert(orders).values({
        userId,
        totalPrice: totalPriceFormatted,
        status: "pending",
        paymentStatus: "unpaid",
        paymentMethod,
        customerName,
        customerPhone,
        shippingAddress,
        items: orderItems.map(
          ({ productId, quantity, price, title, image }) => ({
            productId,
            quantity,
            price,
            title,
            image,
          })
        ),
      });
      const insertedId = extractInsertId(insertedOrder);
      createdOrderId = typeof insertedId === "number" ? insertedId : null;
      if (createdOrderId) {
        for (const item of orderItems) {
          const product = productMap.get(item.productId)!;
          const unitCost = Number(product.purchasePrice || 0);
          await tx.insert(sales).values({
            orderId: createdOrderId,
            managerId: null,
            categoryId: product.categoryId ?? null,
            productId: item.productId,
            productName: item.title,
            quantity: item.quantity,
            unitPrice: item.price.toFixed(2),
            unitCost: unitCost.toFixed(2),
            totalAmount: (item.price * item.quantity).toFixed(2),
            profitAmount: ((item.price - unitCost) * item.quantity).toFixed(2),
            status: "confirmed",
            saleDate: new Date(),
          });
        }
        await tx.insert(cashTransactions).values({
          managerId: null,
          type: "income",
          amount: totalPriceFormatted,
          description: `مبيعات الطلب #${createdOrderId}`,
          sourceType: "order",
          sourceId: createdOrderId,
          transactionDate: new Date(),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        /Unknown column|doesn't exist|column not found|Unknown column/.test(
          message
        )
      ) {
        throw new Error(
          "خطأ في بنية جدول الطلبات. تأكد من أن التعديلات على قاعدة البيانات تم تطبيقها (run `pnpm run db:push` مع إعداد DATABASE_URL)."
        );
      }
      throw err;
    }

    for (const item of rentalItems) {
      const product = productMap.get(item.productId)!;
      const rentalTotal = (
        Number(product.rentalPrice || 0) * item.quantity
      ).toFixed(2);
      const requestInsert = await tx.insert(rentalRequests).values({
        userId,
        productId: item.productId,
        rentalDate: item.rentalDate!,
        status: "pending",
      });
      const requestId = extractInsertId(requestInsert);
      if (!requestId) throw new Error("تعذر إنشاء طلب الإيجار");
      await tx.insert(rentalBookings).values({
        productId: item.productId,
        rentalDate: item.rentalDate!,
        status: "available",
        quantity: item.quantity,
        rentalPrice: rentalTotal,
        payments: "0.00",
        remaining: rentalTotal,
        rentalRequestId: requestId,
        userId,
      });
    }
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
  });

  return {
    orderId: createdOrderId,
    totalPrice,
    items: orderItems,
    status: "pending" as const,
    paymentStatus: "unpaid" as const,
  };
}

export type OrderStatus = (typeof orders.$inferSelect)["status"];

export async function getAllOrdersAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrdersForManager(managerId: number, isAdmin: boolean) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return getAllOrdersAdmin();

  const allowedCategoryIds = await getManagerCategoryIds(managerId);
  if (allowedCategoryIds.length === 0) return [];

  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const productIds = Array.from(
    new Set(
      allOrders.flatMap(order =>
        Array.isArray(order.items)
          ? order.items.map(item => Number(item?.productId)).filter(id => Number.isFinite(id))
          : []
      )
    )
  );

  if (productIds.length === 0) return [];

  const relatedProducts = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(inArray(products.id, productIds));

  const allowedProductIds = new Set(
    relatedProducts
      .filter(product =>
        product.categoryId != null && allowedCategoryIds.includes(Number(product.categoryId))
      )
      .map(product => product.id)
  );

  return allOrders.filter(order => {
    if (!Array.isArray(order.items)) return false;
    return order.items.some(item => {
      const productId = Number(item?.productId);
      return Number.isFinite(productId) && allowedProductIds.has(productId);
    });
  });
}

export async function updateOrderStatusAdmin(
  orderId: number,
  status: OrderStatus,
  estimatedDeliveryMinutes?: number | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (existing.length === 0) throw new Error("الطلب غير موجود");

  const updateData: {
    status: OrderStatus;
    estimatedDeliveryMinutes?: number | null;
  } = { status };
  if (estimatedDeliveryMinutes !== undefined) {
    updateData.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
  }
  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
  if (status === "cancelled") await setSalesStatusByOrder(orderId, "cancelled");
  const updated = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return updated[0] ?? null;
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const productIds = Array.from(
    new Set(
      orderRows.flatMap(order =>
        Array.isArray(order.items)
          ? order.items
              .filter(item => !item?.title || !item?.image)
              .map(item => item.productId)
          : []
      )
    )
  );

  if (productIds.length === 0) {
    return orderRows;
  }

  const productsById = new Map(
    (
      await db.select().from(products).where(inArray(products.id, productIds))
    ).map(product => [product.id, product])
  );

  return orderRows.map(order => {
    if (!Array.isArray(order.items)) {
      return order;
    }

    return {
      ...order,
      items: order.items.map(item => {
        const product = productsById.get(item.productId);
        const title =
          item.title && item.title.toString().trim()
            ? item.title
            : (product?.name ?? `المنتج ${item.productId}`);
        const image =
          item.image && item.image.toString().trim()
            ? item.image
            : (product?.image ?? null);
        return {
          ...item,
          title,
          image,
        };
      }),
    };
  });
}

export async function updateOrderStatus(
  userId: number,
  orderId: number,
  status: OrderStatus
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await db
    .select({ status: orders.status })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  if (current.length === 0) return null;
  if (status === "delivered" && current[0].status !== "shipped") {
    throw new Error("لا يمكن تسجيل التسليم قبل خروج الطلب من المستودع");
  }
  if (current[0].status === "delivered" && status !== "delivered") {
    throw new Error("لا يمكن تغيير حالة الطلب بعد التسليم");
  }

  await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
  if (status === "cancelled") await setSalesStatusByOrder(orderId, "cancelled");

  const updated = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  return updated.length > 0 ? updated[0] : null;
}

export async function updateOrderItems(
  userId: number,
  orderId: number,
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    title?: string | null;
    image?: string | null;
  }>,
  paymentMethod?: string,
  shippingAddress?: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("الطلب غير موجود");
  }

  const order = existing[0];
  if (
    order.status === "shipped" ||
    order.status === "delivered" ||
    order.status === "cancelled"
  ) {
    throw new Error("لا يمكن تعديل الطلب بعد خروجه من المستودع أو إلغائه");
  }

  const totalPrice = items
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  const updatePayload: {
    items: typeof items;
    totalPrice: string;
    paymentMethod?: string;
    shippingAddress?: string | null;
  } = {
    items,
    totalPrice,
  };

  if (paymentMethod !== undefined) {
    updatePayload.paymentMethod = paymentMethod;
  }

  if (shippingAddress !== undefined) {
    updatePayload.shippingAddress = shippingAddress;
  }

  await db
    .update(orders)
    .set(updatePayload)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

  const updated = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  return updated.length > 0 ? updated[0] : null;
}

// ─── Wishlist Functions ───────────────────────────────────────────────────────
export type RentalRequestStatus =
  (typeof rentalRequests.$inferSelect)["status"];
export type RentalBookingStatus =
  (typeof rentalBookings.$inferSelect)["status"];

async function getRentalRequestWithProduct(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      id: rentalRequests.id,
      userId: rentalRequests.userId,
      productId: rentalRequests.productId,
      rentalDate: rentalRequests.rentalDate,
      status: rentalRequests.status,
      createdAt: rentalRequests.createdAt,
      updatedAt: rentalRequests.updatedAt,
      productName: products.name,
      productImage: products.image,
      rentalPrice: products.rentalPrice,
    })
    .from(rentalRequests)
    .leftJoin(products, eq(rentalRequests.productId, products.id))
    .where(eq(rentalRequests.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createRentalRequest(
  userId: number,
  productId: number,
  rentalDate: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rentalDate))
    throw new Error("تاريخ الإيجار غير صالح");
  if (rentalDate < new Date().toISOString().slice(0, 10))
    throw new Error("لا يمكن اختيار تاريخ سابق");

  const product = await getProductById(productId);
  if (!product || !product.isRentable)
    throw new Error("هذا المنتج غير متاح للإيجار");
  const existingBooking = await db
    .select({ id: rentalBookings.id })
    .from(rentalBookings)
    .where(
      and(
        eq(rentalBookings.productId, productId),
        eq(rentalBookings.rentalDate, rentalDate),
        eq(rentalBookings.status, "booked")
      )
    )
    .limit(1);

  const inserted = await db.insert(rentalRequests).values({
    userId,
    productId,
    rentalDate,
    status: existingBooking.length > 0 ? "unavailable" : "pending",
  });
  const requestId = extractInsertId(inserted);
  const request = requestId
    ? await getRentalRequestWithProduct(requestId)
    : null;
  return {
    request,
    available: existingBooking.length === 0,
    message:
      existingBooking.length === 0
        ? "الطلب قيد المعالجة"
        : "الطلب غير ممكن للإيجار في هذا التاريخ",
  };
}

export async function getRentalRequestsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: rentalRequests.id,
      userId: rentalRequests.userId,
      productId: rentalRequests.productId,
      rentalDate: rentalRequests.rentalDate,
      status: rentalRequests.status,
      createdAt: rentalRequests.createdAt,
      updatedAt: rentalRequests.updatedAt,
      productName: products.name,
      productImage: products.image,
      rentalPrice: products.rentalPrice,
    })
    .from(rentalRequests)
    .leftJoin(products, eq(rentalRequests.productId, products.id))
    .where(eq(rentalRequests.userId, userId))
    .orderBy(desc(rentalRequests.createdAt));
}

export async function getAllRentalRequestsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: rentalRequests.id,
      userId: rentalRequests.userId,
      productId: rentalRequests.productId,
      rentalDate: rentalRequests.rentalDate,
      status: rentalRequests.status,
      createdAt: rentalRequests.createdAt,
      updatedAt: rentalRequests.updatedAt,
      productName: products.name,
      productImage: products.image,
      rentalPrice: products.rentalPrice,
      customerName: users.name,
      customerPhone: users.phone,
      customerEmail: users.email,
    })
    .from(rentalRequests)
    .leftJoin(products, eq(rentalRequests.productId, products.id))
    .leftJoin(users, eq(rentalRequests.userId, users.id))
    .orderBy(desc(rentalRequests.createdAt));
}

export async function getRentalRequestsForManager(
  managerId: number,
  isAdmin: boolean
) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return getAllRentalRequestsAdmin();

  const allowedCategoryIds = await getManagerCategoryIds(managerId);
  if (allowedCategoryIds.length === 0) return [];

  const rows = await db
    .select({
      id: rentalRequests.id,
      userId: rentalRequests.userId,
      productId: rentalRequests.productId,
      rentalDate: rentalRequests.rentalDate,
      status: rentalRequests.status,
      createdAt: rentalRequests.createdAt,
      updatedAt: rentalRequests.updatedAt,
      productName: products.name,
      productImage: products.image,
      rentalPrice: products.rentalPrice,
      customerName: users.name,
      customerPhone: users.phone,
      customerEmail: users.email,
    })
    .from(rentalRequests)
    .leftJoin(products, eq(rentalRequests.productId, products.id))
    .leftJoin(users, eq(rentalRequests.userId, users.id))
    .orderBy(desc(rentalRequests.createdAt));

  const productIds = rows
    .map(row => row.productId)
    .filter((id): id is number => Number.isFinite(id));

  if (productIds.length === 0) return [];

  const productRows = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(inArray(products.id, productIds));

  const allowedProductIds = new Set(
    productRows
      .filter(
        product =>
          product.categoryId != null &&
          allowedCategoryIds.includes(Number(product.categoryId))
      )
      .map(product => product.id)
  );

  return rows.filter(row => {
    return row.productId != null && allowedProductIds.has(row.productId);
  });
}

export async function approveRentalRequest(
  requestId: number,
  payments: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.transaction(async tx => {
    const requestRows = await tx
      .select()
      .from(rentalRequests)
      .where(eq(rentalRequests.id, requestId))
      .limit(1);
    const request = requestRows[0];
    if (!request) throw new Error("طلب الإيجار غير موجود");
    if (request.status !== "pending")
      throw new Error("لا يمكن اعتماد هذا الطلب في حالته الحالية");
    const productRows = await tx
      .select({
        isRentable: products.isRentable,
        name: products.name,
        categoryId: products.categoryId,
        purchasePrice: products.purchasePrice,
      })
      .from(products)
      .where(eq(products.id, request.productId))
      .limit(1);
    if (!productRows[0]?.isRentable) throw new Error("المنتج غير قابل للإيجار");
    const conflict = await tx
      .select({ id: rentalBookings.id })
      .from(rentalBookings)
      .where(
        and(
          eq(rentalBookings.productId, request.productId),
          eq(rentalBookings.rentalDate, request.rentalDate),
          eq(rentalBookings.status, "booked")
        )
      )
      .limit(1);
    if (conflict.length > 0) {
      await tx
        .update(rentalRequests)
        .set({ status: "unavailable" })
        .where(eq(rentalRequests.id, requestId));
      throw new Error("تم حجز المنتج في هذا التاريخ من طلب آخر");
    }
    const bookingRows = await tx
      .select()
      .from(rentalBookings)
      .where(eq(rentalBookings.rentalRequestId, request.id))
      .limit(1);
    const booking = bookingRows[0];
    const rentalTotal = Number(booking?.rentalPrice || 0);
    const paid = Math.max(0, Number(payments) || 0);
    if (!booking) throw new Error("سجل الحجز غير موجود");
    if (paid > rentalTotal)
      throw new Error("الدفعة لا يمكن أن تتجاوز قيمة الإيجار");
    await tx
      .update(rentalBookings)
      .set({
        status: "booked",
        payments: paid.toFixed(2),
        remaining: Math.max(0, rentalTotal - paid).toFixed(2),
      })
      .where(eq(rentalBookings.id, booking.id));
    await tx
      .update(rentalRequests)
      .set({ status: "approved" })
      .where(eq(rentalRequests.id, requestId));
    const product = productRows[0];
    const unitPrice = rentalTotal / Math.max(1, booking.quantity || 1);
    const unitCost = Number(product.purchasePrice || 0);
    await tx.insert(sales).values({
      orderId: null,
      managerId: null,
      categoryId: product.categoryId ?? null,
      productId: request.productId,
      productName: product.name || `إيجار المنتج #${request.productId}`,
      quantity: booking.quantity || 1,
      unitPrice: unitPrice.toFixed(2),
      unitCost: unitCost.toFixed(2),
      totalAmount: rentalTotal.toFixed(2),
      profitAmount: (rentalTotal - unitCost * (booking.quantity || 1)).toFixed(
        2
      ),
      status: "confirmed",
      saleDate: new Date(),
    });
    if (paid > 0) {
      await tx.insert(cashTransactions).values({
        managerId: null,
        type: "income",
        amount: paid.toFixed(2),
        description: `دفعة إيجار الطلب #${requestId}`,
        sourceType: "rental",
        sourceId: requestId,
        transactionDate: new Date(),
      });
    }
  });
  const approved = await getRentalRequestWithProduct(requestId);
  const bookingRows = await db
    .select()
    .from(rentalBookings)
    .where(eq(rentalBookings.rentalRequestId, requestId))
    .limit(1);
  return approved ? { ...approved, booking: bookingRows[0] ?? null } : null;
}

export async function rejectRentalRequest(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(rentalRequests)
    .set({ status: "unavailable" })
    .where(
      and(
        eq(rentalRequests.id, requestId),
        eq(rentalRequests.status, "pending")
      )
    );
  return getRentalRequestWithProduct(requestId);
}

export async function updateRentalBookingPayments(
  bookingId: number,
  payments: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const bookingRows = await db
    .select()
    .from(rentalBookings)
    .where(eq(rentalBookings.id, bookingId))
    .limit(1);
  const booking = bookingRows[0];
  if (!booking) throw new Error("الحجز غير موجود");
  const paid = Math.max(0, Number(payments) || 0);
  const total = Number(booking.rentalPrice) || 0;
  const remaining = Math.max(0, total - paid);
  await db
    .update(rentalBookings)
    .set({ payments: paid.toFixed(2), remaining: remaining.toFixed(2) })
    .where(eq(rentalBookings.id, bookingId));
  return db
    .select()
    .from(rentalBookings)
    .where(eq(rentalBookings.id, bookingId))
    .limit(1)
    .then(rows => rows[0] ?? null);
}

export async function getAllRentalBookingsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: rentalBookings.id,
      productId: rentalBookings.productId,
      rentalDate: rentalBookings.rentalDate,
      status: rentalBookings.status,
      quantity: rentalBookings.quantity,
      rentalPrice: rentalBookings.rentalPrice,
      payments: rentalBookings.payments,
      remaining: rentalBookings.remaining,
      rentalRequestId: rentalBookings.rentalRequestId,
      userId: rentalBookings.userId,
      createdAt: rentalBookings.createdAt,
      productName: products.name,
      productImage: products.image,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(rentalBookings)
    .leftJoin(products, eq(rentalBookings.productId, products.id))
    .leftJoin(users, eq(rentalBookings.userId, users.id))
    .orderBy(desc(rentalBookings.rentalDate));
}

export async function getRentalBookingsForManager(
  managerId: number,
  isAdmin: boolean
) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return getAllRentalBookingsAdmin();

  const allowedCategoryIds = await getManagerCategoryIds(managerId);
  if (allowedCategoryIds.length === 0) return [];

  const rows = await db
    .select({
      id: rentalBookings.id,
      productId: rentalBookings.productId,
      rentalDate: rentalBookings.rentalDate,
      status: rentalBookings.status,
      quantity: rentalBookings.quantity,
      rentalPrice: rentalBookings.rentalPrice,
      payments: rentalBookings.payments,
      remaining: rentalBookings.remaining,
      rentalRequestId: rentalBookings.rentalRequestId,
      userId: rentalBookings.userId,
      createdAt: rentalBookings.createdAt,
      productName: products.name,
      productImage: products.image,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(rentalBookings)
    .leftJoin(products, eq(rentalBookings.productId, products.id))
    .leftJoin(users, eq(rentalBookings.userId, users.id))
    .orderBy(desc(rentalBookings.rentalDate));

  const ids = rows.map(row => row.productId).filter((id): id is number => Number.isFinite(id));
  if (ids.length === 0) return [];

  const productRows = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(inArray(products.id, ids));
  const allowedProductIds = new Set(
    productRows
      .filter(product => product.categoryId != null && allowedCategoryIds.includes(Number(product.categoryId)))
      .map(product => product.id)
  );

  return rows.filter(row => {
    return row.productId != null && allowedProductIds.has(row.productId);
  });
}

export async function returnRentalBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.transaction(async tx => {
    const bookingRows = await tx
      .select()
      .from(rentalBookings)
      .where(eq(rentalBookings.id, bookingId))
      .limit(1);
    const booking = bookingRows[0];
    if (!booking) throw new Error("الحجز غير موجود");
    await tx.delete(rentalBookings).where(eq(rentalBookings.id, bookingId));
    await tx
      .update(rentalRequests)
      .set({ status: "returned" })
      .where(eq(rentalRequests.id, booking.rentalRequestId));
    return booking;
  });
}

export async function getWishlistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));
}

export async function addToWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0]; // Already in wishlist
  }

  return db.insert(wishlistItems).values({ userId, productId });
}

export async function removeFromWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    );
}

export async function isInWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
    .limit(1);

  return result.length > 0;
}

// ─── Review Functions ────────────────────────────────────────────────────────
export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews).where(eq(reviews.productId, productId));
}

export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews).where(eq(reviews.userId, userId));
}

export async function createReview(
  userId: number,
  productId: number,
  rating: number,
  title: string,
  comment?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return db.insert(reviews).values({
    userId,
    productId,
    rating,
    title,
    comment,
    verified: true, // Can be set to false and verified later
  });
}

export async function updateReview(
  reviewId: number,
  rating: number,
  title: string,
  comment?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return db
    .update(reviews)
    .set({ rating, title, comment })
    .where(eq(reviews.id, reviewId));
}

export async function deleteReview(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(reviews).where(eq(reviews.id, reviewId));
}

export async function markReviewAsHelpful(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const review = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);
  if (review.length === 0) throw new Error("Review not found");

  const currentReview = review[0];
  if (!currentReview) throw new Error("Review not found");

  return db
    .update(reviews)
    .set({ helpful: (currentReview.helpful || 0) + 1 })
    .where(eq(reviews.id, reviewId));
}

// ─── Search & Filter Functions ───────────────────────────────────────────────
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ name: categoryTable.name })
    .from(categoryTable)
    .where(eq(categoryTable.isActive, true));
  return result.map(r => r.name).filter(Boolean);
}

export async function getActiveCategoriesWithImages() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: categoryTable.id,
      name: categoryTable.name,
      slug: categoryTable.slug,
      description: categoryTable.description,
      image: categoryTable.image,
    })
    .from(categoryTable)
    .where(eq(categoryTable.isActive, true))
    .orderBy(desc(categoryTable.id));
}


export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(categoryTable).orderBy(desc(categoryTable.id));
}

export function buildUniqueValue(
  value: string | null | undefined,
  fallback: string,
  options?: { caseMode?: "upper" | "lower"; separator?: string }
): string {
  const config = {
    caseMode: "upper",
    separator: "-",
    ...options,
  };

  const source = String(value ?? "").trim();
  const base = source ? source.replace(/[^a-zA-Z0-9]+/g, config.separator) : fallback;

  const normalized = base
    .replace(new RegExp(`^${config.separator}+|${config.separator}+$`, "g"), "")
    .replace(new RegExp(`${config.separator}{2,}`, "g"), config.separator);

  const candidate =
    config.caseMode === "lower" ? normalized.toLowerCase() : normalized.toUpperCase();

  return candidate || fallback;
}

function nextUniqueValue(
  candidate: string,
  used: Set<string>,
  fallback: string
): string {
  let value = candidate || fallback;
  let suffix = 2;
  while (used.has(value)) {
    value = `${candidate || fallback}-${suffix}`;
    suffix += 1;
  }
  used.add(value);
  return value;
}

export async function createCategoryAdmin(data: {
  name: string;
  categoryCode?: string;
  slug?: string;
  description?: string;
  image?: string;
  sectionId?: number | null;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const database = db;

  async function tryInsertCategory(existingRows: Array<{ categoryCode: string | null; slug: string | null }>) {
    const usedCategoryCodes = new Set(
      existingRows.map(item => item.categoryCode).filter(Boolean) as string[]
    );
    const usedCategorySlugs = new Set(
      existingRows.map(item => item.slug).filter(Boolean) as string[]
    );

    const categoryCode = nextUniqueValue(
      buildUniqueValue(data.categoryCode, `CAT-${Date.now()}`, {
        caseMode: "upper",
        separator: "-",
      }),
      usedCategoryCodes,
      `CAT-${Date.now()}`
    );

    const slugValue = nextUniqueValue(
      buildUniqueValue(data.slug || data.name, `category-${Date.now()}`, {
        caseMode: "lower",
        separator: "-",
      }),
      usedCategorySlugs,
      `category-${Date.now()}`
    );

    const payload: InsertCategory = {
      categoryCode,
      name: data.name,
      slug: slugValue,
      description: data.description,
      sectionId: data.sectionId ?? null,
      image: data.image,
      isActive: data.isActive ?? true,
    };

    const result = await database.insert(categoryTable).values(payload);
    const insertId = extractInsertId(result);
    if (typeof insertId === "number") {
      const created = await database
        .select()
        .from(categoryTable)
        .where(eq(categoryTable.id, insertId))
        .limit(1);
      return created[0] ?? null;
    }

    return null;
  }

  try {
    const existingCategoryRows = await database
      .select({ categoryCode: categoryTable.categoryCode, slug: categoryTable.slug })
      .from(categoryTable);
    return await tryInsertCategory(existingCategoryRows);
  } catch (error: any) {
    const message = error && error.message ? String(error.message) : String(error);
    if (!/Duplicate entry|1062|unique/i.test(message)) {
      throw error;
    }

    const existingCategoryRows = await database
      .select({ categoryCode: categoryTable.categoryCode, slug: categoryTable.slug })
      .from(categoryTable);
    return await tryInsertCategory(existingCategoryRows);
  }
}

export async function updateCategoryAdmin(
  id: number,
  data: Partial<InsertCategory>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categoryTable).set(data).where(eq(categoryTable.id, id));
  const updated = await db
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.id, id))
    .limit(1);
  return updated[0] ?? null;
}

export async function deleteCategoryAdmin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categoryTable).where(eq(categoryTable.id, id));
  return true;
}

export async function getBrands() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(brandTable)
    .where(eq(brandTable.isActive, true))
    .orderBy(desc(brandTable.id));
}

export async function getBrandSectionsWithCategories() {
  const db = await getDb();
  if (!db) return [];

  const brands = await db
    .select()
    .from(brandTable)
    .where(eq(brandTable.isActive, true))
    .orderBy(desc(brandTable.id));

  const categories = await db
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.isActive, true));

  const categoryMap = new Map<number, string[]>();
  for (const category of categories) {
    if (category.sectionId == null) continue;
    const current = categoryMap.get(category.sectionId) ?? [];
    if (category.name && !current.includes(category.name)) {
      current.push(category.name);
      categoryMap.set(category.sectionId, current);
    }
  }

  return brands
    .map(brand => ({
      id: brand.id,
      name: brand.name,
      categories: categoryMap.get(brand.id) ?? [],
    }))
    .filter(section => section.categories.length > 0);
}

export async function getProductColors() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ color: products.color }).from(products);
  return Array.from(
    new Set(
      result
        .map(row => row.color)
        .filter((value): value is string => Boolean(value?.trim()))
    )
  );
}

export async function getProductSizes() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ size: products.size }).from(products);
  return Array.from(
    new Set(
      result
        .map(row => row.size)
        .filter((value): value is string => Boolean(value?.trim()))
    )
  );
}

export async function getAllBrands() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brandTable).orderBy(desc(brandTable.id));
}

export async function getBrandsForManager(managerId: number, isAdmin: boolean) {
  const allSections = await getAllBrands();
  if (isAdmin) return allSections;

  const categoryIds = await getManagerCategoryIds(managerId);
  const allowedSections = new Set(
    (await getAllCategories())
      .filter(category => categoryIds.includes(category.id) && category.sectionId != null)
      .map(category => Number(category.sectionId))
  );

  return allSections.filter(
    section =>
      section.managerId === managerId ||
      (typeof section.id === "number" && allowedSections.has(section.id))
  );
}

export async function createBrandAdmin(data: {
  name: string;
  brandCode?: string;
  slug?: string;
  description?: string;
  logo?: string;
  managerId?: number | null;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const database = db;

  async function tryInsertBrand(existingRows: Array<{ brandCode: string | null; slug: string | null }>) {
    const usedBrandCodes = new Set(
      existingRows.map(item => item.brandCode).filter(Boolean) as string[]
    );
    const usedBrandSlugs = new Set(
      existingRows.map(item => item.slug).filter(Boolean) as string[]
    );

    const brandCode = nextUniqueValue(
      buildUniqueValue(data.brandCode, `SEC-${Date.now()}`, {
        caseMode: "upper",
        separator: "-",
      }),
      usedBrandCodes,
      `SEC-${Date.now()}`
    );

    const slugValue = nextUniqueValue(
      buildUniqueValue(data.slug || data.name, `brand-${Date.now()}`, {
        caseMode: "lower",
        separator: "-",
      }),
      usedBrandSlugs,
      `brand-${Date.now()}`
    );

    const payload: InsertBrand = {
      brandCode,
      name: data.name,
      slug: slugValue,
      description: data.description,
      logo: data.logo,
      image: (data as any).image,
      managerId: typeof data.managerId === "number" ? data.managerId : null,
      isActive: data.isActive ?? true,
    };

    const result = await database.insert(brandTable).values(payload);
    const insertId = extractInsertId(result);
    if (typeof insertId === "number") {
      const created = await database
        .select()
        .from(brandTable)
        .where(eq(brandTable.id, insertId))
        .limit(1);
      return created[0] ?? null;
    }

    return null;
  }

  try {
    const existingBrands = await database
      .select({ brandCode: brandTable.brandCode, slug: brandTable.slug })
      .from(brandTable);
    return await tryInsertBrand(existingBrands);
  } catch (error: any) {
    const message = error && error.message ? String(error.message) : String(error);
    if (!/Duplicate entry|1062|unique/i.test(message)) {
      throw error;
    }

    const existingBrands = await database
      .select({ brandCode: brandTable.brandCode, slug: brandTable.slug })
      .from(brandTable);
    return await tryInsertBrand(existingBrands);
  }
}

export async function updateBrandAdmin(id: number, data: Partial<InsertBrand>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sanitizedData: Partial<InsertBrand> = { ...(data as Partial<InsertBrand>) } as any;
  if (Object.prototype.hasOwnProperty.call(sanitizedData, "managerId")) {
    sanitizedData.managerId = typeof (sanitizedData as any).managerId === "number" ? (sanitizedData as any).managerId : null;
  }

  await db.update(brandTable).set(sanitizedData).where(eq(brandTable.id, id));
  const updated = await db
    .select()
    .from(brandTable)
    .where(eq(brandTable.id, id))
    .limit(1);
  return updated[0] ?? null;
}

export async function deleteBrandAdmin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(brandTable).where(eq(brandTable.id, id));
  return true;
}

// ─── Welcome Messages Functions ───────────────────────────────────────────────
async function ensureWelcomeMessagesTable(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`welcomeMessages\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`name\` varchar(255) NOT NULL,
      \`content\` text NOT NULL,
      \`color\` varchar(50) DEFAULT '#000000',
      \`style\` json,
      \`isActive\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function getActiveWelcomeMessages() {
  const db = await getDb();
  if (!db) return [];
  await ensureWelcomeMessagesTable(db);
  return db.select().from(welcomeMessages).where(eq(welcomeMessages.isActive, true));
}

export async function getAllWelcomeMessagesAdmin() {
  const db = await getDb();
  if (!db) return [];
  await ensureWelcomeMessagesTable(db);
  return db.select().from(welcomeMessages).orderBy(desc(welcomeMessages.createdAt));
}

export async function createWelcomeMessageAdmin(data: {
  name: string;
  content: string;
  color?: string;
  style?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureWelcomeMessagesTable(db);
  return db.insert(welcomeMessages).values({
    name: data.name,
    content: data.content,
    color: data.color || "#000000",
    style: data.style,
  });
}

export async function updateWelcomeMessageAdmin(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureWelcomeMessagesTable(db);
  return db.update(welcomeMessages).set(data).where(eq(welcomeMessages.id, id));
}

export async function deleteWelcomeMessageAdmin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureWelcomeMessagesTable(db);
  return db.delete(welcomeMessages).where(eq(welcomeMessages.id, id));
}

export async function searchProducts(filters: {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  categories?: string[];
  brands?: string[];
  colors?: string[];
  sizes?: string[];
  limit?: number;
}): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all products, sorted by newest first
  let results = await db.select().from(products).orderBy(products.id);
  console.log(`[DEBUG] Total products found in DB: ${results.length}`);
  results.reverse(); // Newest first (highest ID)

  // Apply filters on client side
  if (filters.query) {
    const searchTerm = filters.query.toLowerCase();
    results = results.filter(
      p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.brand.toLowerCase().includes(searchTerm)
    );
  }

  // Price range filter
  if (filters.minPrice !== undefined) {
    const minPrice = filters.minPrice;
    results = results.filter(p => parseFloat(p.price as any) >= minPrice);
  }
  if (filters.maxPrice !== undefined) {
    const maxPrice = filters.maxPrice;
    results = results.filter(p => parseFloat(p.price as any) <= maxPrice);
  }

  // Rating filter
  if (filters.minRating !== undefined) {
    const minRating = filters.minRating;
    results = results.filter(p => parseFloat(p.rating as any) >= minRating);
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    results = results.filter(p => filters.categories!.includes(p.category));
  }

  // Brand filter
  if (filters.brands && filters.brands.length > 0) {
    results = results.filter(p => filters.brands!.includes(p.brand));
  }

  // Color and size filters
  if (filters.colors && filters.colors.length > 0) {
    results = results.filter(p =>
      p.color ? filters.colors!.includes(p.color) : false
    );
  }
  if (filters.sizes && filters.sizes.length > 0) {
    results = results.filter(p =>
      p.size ? filters.sizes!.includes(p.size) : false
    );
  }

  // Limit results
  const limit = filters.limit || 50;
  return results.slice(0, limit);
}

// Dashboard Statistics Functions
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get dashboard stats: database not available"
    );
    return null;
  }

  try {
    // Get total products count
    const totalProducts = await db.select().from(products);

    // Get total users count
    const totalUsers = await db.select().from(users);

    // Get total reviews count
    const totalReviews = await db.select().from(reviews);

    // Get average rating
    const avgRating =
      totalReviews.length > 0
        ? (
            totalReviews.reduce(
              (sum, r) => sum + (parseInt(String(r.rating) || "0") || 0),
              0
            ) / totalReviews.length
          ).toFixed(1)
        : "0";

    return {
      totalProducts: totalProducts.length,
      totalUsers: totalUsers.length,
      totalReviews: totalReviews.length,
      averageRating: parseFloat(avgRating),
      topProducts: totalProducts
        .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        .slice(0, 5),
      recentReviews: totalReviews.slice(-5),
    };
  } catch (error) {
    console.error("[Database] Failed to get dashboard stats:", error);
    return null;
  }
}

export async function getDashboardStatsForUser(
  userId: number,
  isAdmin: boolean
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get dashboard stats: database not available"
    );
    return null;
  }

  try {
    if (isAdmin) {
      return getDashboardStats();
    }

    // Manager-scoped stats: products in manager's categories or brands
    const managerCategoryIds = await getManagerCategoryIds(userId);
    const managedBrandRows = await db
      .select()
      .from(brandTable)
      .where(eq(brandTable.managerId, userId));
    const managedBrandIds = managedBrandRows.map((r: any) => Number(r.id));

    const allProducts = await db.select().from(products);
    const filteredProducts = (allProducts ?? []).filter((p: any) => {
      const categoryId = Number(p.categoryId);
      const brandId = Number(p.brandId);
      if (managerCategoryIds.includes(categoryId)) return true;
      if (managedBrandIds.includes(brandId)) return true;
      return false;
    });

    const allReviews = await db.select().from(reviews);
    const productIdSet = new Set((filteredProducts ?? []).map((p: any) => Number(p.id)));
    const filteredReviews = (allReviews ?? []).filter((r: any) =>
      productIdSet.has(Number(r.productId))
    );

    const avgRating =
      filteredReviews.length > 0
        ? (
            filteredReviews.reduce(
              (sum: number, r: any) => sum + (Number(r.rating) || 0),
              0
            ) / filteredReviews.length
          ).toFixed(1)
        : "0";

    // Collect unique users who interacted with manager's products (reviews or orders)
    const userIdSet = new Set<number>();
    filteredReviews.forEach((r: any) => userIdSet.add(Number(r.userId)));

    let allOrders: any[] = [];
    try {
      allOrders = await db.select().from(orders);
    } catch (error) {
      console.warn("[Dashboard] Unable to read orders for scoped manager stats:", error);
    }

    for (const ord of allOrders ?? []) {
      try {
        const items = Array.isArray(ord.items)
          ? ord.items
          : JSON.parse(String(ord.items || "[]"));
        if (items.some((it: any) => productIdSet.has(Number(it.productId)))) {
          userIdSet.add(Number(ord.userId));
        }
      } catch (e) {
        // ignore malformed order items
      }
    }

    const scopedStats = {
      totalProducts: filteredProducts.length,
      totalReviews: filteredReviews.length,
      averageRating: parseFloat(avgRating),
      topProducts: (filteredProducts ?? [])
        .sort((a: any, b: any) => (b.reviewCount || 0) - (a.reviewCount || 0))
        .slice(0, 5),
      recentReviews: (filteredReviews ?? []).slice(-5),
    };

    return {
      ...scopedStats,
      ...(isAdmin ? { totalUsers: (await db.select().from(users)).length } : {}),
    };
  } catch (error) {
    console.error("[Database] Failed to get dashboard stats for user:", error);
    return null;
  }
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  try {
    return await db.select().from(products);
  } catch (error) {
    console.error("[Database] Failed to get products:", error);
    return [];
  }
}

function normalizeIdentifier(
  value: string | null | undefined,
  fallback: string
) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  return normalized || fallback;
}

function buildProductCode(
  brandCode: string | null | undefined,
  categoryCode: string | null | undefined,
  sequence: number
) {
  return `${normalizeIdentifier(brandCode, "SEC-000")}-${normalizeIdentifier(categoryCode, "CAT-000")}-${String(sequence).padStart(6, "0")}`;
}

export async function updateProductAdmin(
  id: number,
  data: Partial<Product> & {
    categoryId?: number | null;
    brandId?: number | null;
  }
) {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Database not available. Please check your DATABASE_URL environment variable."
    );
  }

  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.oldPrice !== undefined) updateData.oldPrice = data.oldPrice;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isOnSale !== undefined) updateData.isOnSale = data.isOnSale;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.images !== undefined)
      updateData.images = data.images?.filter(Boolean).length
        ? data.images.filter(Boolean)
        : null;
    if (data.badge !== undefined) updateData.badge = data.badge;
    if (data.badgeColor !== undefined) updateData.badgeColor = data.badgeColor;
    if (data.color !== undefined) updateData.color = data.color || null;
    if (data.size !== undefined) updateData.size = data.size || null;
    if (data.isRentable !== undefined) {
      updateData.isRentable = data.isRentable;
      updateData.rentalPrice = data.isRentable
        ? data.rentalPrice || null
        : null;
    } else if (data.rentalPrice !== undefined) {
      updateData.rentalPrice = data.rentalPrice || null;
    }
    if (data.isSellable !== undefined) {
      updateData.isSellable = data.isSellable;
      if (!data.isSellable) {
        updateData.purchasePrice = null;
        updateData.oldPrice = null;
        updateData.isOnSale = false;
      }
    }
    if (data.purchasePrice !== undefined && data.isSellable !== false)
      updateData.purchasePrice = data.purchasePrice || null;
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId ?? null;
      if (data.categoryId) {
        const categoryRow = await db
          .select()
          .from(categoryTable)
          .where(eq(categoryTable.id, data.categoryId))
          .limit(1);
        if (categoryRow[0]) updateData.category = categoryRow[0].name;
      }
    }
    if (data.brandId !== undefined) {
      updateData.brandId = data.brandId ?? null;
      if (data.brandId) {
        const brandRow = await db
          .select()
          .from(brandTable)
          .where(eq(brandTable.id, data.brandId))
          .limit(1);
        if (brandRow[0]) updateData.brand = brandRow[0].name;
      }
    }

    if (
      data.categoryId !== undefined ||
      data.brandId !== undefined ||
      data.brand !== undefined
    ) {
      const currentProduct = await getProductById(id);
      const finalBrandId =
        data.brandId !== undefined ? data.brandId : currentProduct?.brandId;
      const finalCategoryId =
        data.categoryId !== undefined
          ? data.categoryId
          : currentProduct?.categoryId;
      const [brandRow] = finalBrandId
        ? await db
            .select({ brandCode: brandTable.brandCode })
            .from(brandTable)
            .where(eq(brandTable.id, finalBrandId))
            .limit(1)
        : [];
      const [categoryRow] = finalCategoryId
        ? await db
            .select({ categoryCode: categoryTable.categoryCode })
            .from(categoryTable)
            .where(eq(categoryTable.id, finalCategoryId))
            .limit(1)
        : [];
      updateData.productCode = buildProductCode(
        brandRow?.brandCode,
        categoryRow?.categoryCode,
        id
      );
    }
    await db.update(products).set(updateData).where(eq(products.id, id));
    const updatedProduct = await getProductById(id);
    if (!updatedProduct) {
      throw new Error("Failed to retrieve updated product.");
    }
    return updatedProduct;
  } catch (error) {
    console.error("[Database] Failed to update product:", error);
    throw new Error(
      `Failed to update product: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteProductAdmin(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Database not available. Please check your DATABASE_URL environment variable."
    );
  }

  try {
    await db.delete(products).where(eq(products.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete product:", error);
    throw new Error(
      `Failed to delete product: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getAllReviewsAdmin() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reviews: database not available");
    return [];
  }

  try {
    return await db.select().from(reviews);
  } catch (error) {
    console.error("[Database] Failed to get reviews:", error);
    return [];
  }
}

export async function deleteReviewAdmin(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete review: database not available");
    return false;
  }

  try {
    await db.delete(reviews).where(eq(reviews.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete review:", error);
    return false;
  }
}

export async function createProductAdmin(data: {
  name: string;
  brand: string;
  category: string;
  categoryId?: number;
  brandId?: number;
  description?: string;
  price: string;
  oldPrice?: string;
  image?: string;
  images?: string[];
  stock?: number;
  isOnSale?: boolean;
  badge?: string;
  badgeColor?: string;
  color?: string;
  size?: string;
  isRentable?: boolean;
  rentalPrice?: string;
  isSellable?: boolean;
  purchasePrice?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Database not available. Please check your DATABASE_URL environment variable."
    );
  }

  try {
    if (!data.categoryId || !data.brandId) {
      throw new Error(
        "A product must be linked to both a section and a category."
      );
    }

    let categoryName = data.category;
    let brandName = data.brand;
    let categoryCode = "CAT-000";
    let brandCode = "SEC-000";

    if (data.categoryId) {
      const categoryRow = await db
        .select({
          name: categoryTable.name,
          categoryCode: categoryTable.categoryCode,
        })
        .from(categoryTable)
        .where(eq(categoryTable.id, data.categoryId))
        .limit(1);
      if (categoryRow[0]) {
        categoryName = categoryRow[0].name;
        categoryCode = categoryRow[0].categoryCode;
      }
    }

    if (data.brandId) {
      const brandRow = await db
        .select({ name: brandTable.name, brandCode: brandTable.brandCode })
        .from(brandTable)
        .where(eq(brandTable.id, data.brandId))
        .limit(1);
      if (brandRow[0]) {
        brandName = brandRow[0].name;
        brandCode = brandRow[0].brandCode;
      }
    }

    const result = await db.insert(products).values({
      name: data.name,
      brand: brandName,
      category: categoryName,
      categoryId: data.categoryId ?? null,
      brandId: data.brandId ?? null,
      description: data.description,
      price: data.price,
      oldPrice: data.isSellable === false ? null : data.oldPrice || null,
      image: data.image || data.images?.[0],
      images: data.images?.filter(Boolean).length
        ? data.images.filter(Boolean)
        : data.image
          ? [data.image]
          : null,
      stock: data.stock ?? 0,
      isOnSale: data.isSellable === false ? false : (data.isOnSale ?? false),
      badge: data.badge,
      badgeColor: data.badgeColor,
      color: data.color || null,
      size: data.size || null,
      isRentable: data.isRentable ?? false,
      isSellable: data.isSellable ?? true,
      purchasePrice: data.isSellable ? data.purchasePrice || null : null,
      rentalPrice: data.isRentable ? data.rentalPrice || null : null,
      productCode: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      rating: "0",
      reviewCount: 0,
    });

    const insertId = extractInsertId(result);
    if (typeof insertId === "number") {
      await db
        .update(products)
        .set({
          productCode: buildProductCode(brandCode, categoryCode, insertId),
        })
        .where(eq(products.id, insertId));
      const newProduct = await getProductById(insertId);
      if (newProduct) {
        return newProduct;
      }
    }

    const [latestProduct] = await db
      .select()
      .from(products)
      .orderBy(desc(products.id))
      .limit(1);
    if (!latestProduct) {
      throw new Error("Failed to retrieve newly created product.");
    }
    await db
      .update(products)
      .set({
        productCode: buildProductCode(
          brandCode,
          categoryCode,
          latestProduct.id
        ),
      })
      .where(eq(products.id, latestProduct.id));
    return getProductById(latestProduct.id);
  } catch (error) {
    console.error("[Database] Failed to create product:", error);
    throw new Error(
      `Failed to create product: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Managers & Economic Ledger ───────────────────────────────────────────────
export async function getUserByUsername(username: string) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database
    .select()
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getManagerCategoryIds(managerId: number) {
  const database = await getDb();
  if (!database) return [];
  const directRows = await database
    .select({ categoryId: managerCategoryAssignments.categoryId })
    .from(managerCategoryAssignments)
    .where(eq(managerCategoryAssignments.managerId, managerId));
  const managedSections = await database
    .select({ id: brandTable.id })
    .from(brandTable)
    .where(eq(brandTable.managerId, managerId));
  const sectionIds = managedSections.map(row => row.id);
  const sectionCategoryRows = sectionIds.length
    ? await database
        .select({ id: categoryTable.id })
        .from(categoryTable)
        .where(inArray(categoryTable.sectionId, sectionIds))
    : [];
  return Array.from(
    new Set([
      ...directRows.map(row => row.categoryId),
      ...sectionCategoryRows.map(row => row.id),
    ])
  );
}

export async function replaceManagerCategoryAssignments(
  managerId: number,
  categoryIds: number[]
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .delete(managerCategoryAssignments)
    .where(eq(managerCategoryAssignments.managerId, managerId));
  const uniqueCategoryIds = Array.from(
    new Set(categoryIds.filter(id => Number.isInteger(id) && id > 0))
  );
  if (uniqueCategoryIds.length > 0) {
    await database
      .insert(managerCategoryAssignments)
      .values(uniqueCategoryIds.map(categoryId => ({ managerId, categoryId })));
  }
  return uniqueCategoryIds;
}

export async function getManagersAdmin() {
  const database = await getDb();
  if (!database) return [];
  const managerRows = await database
    .select()
    .from(users)
    .where(or(eq(users.role, "admin"), eq(users.role, "manager")))
    .orderBy(desc(users.createdAt));
  return Promise.all(
    managerRows.map(async manager => ({
      ...manager,
      passwordHash: undefined,
      categoryIds: await getManagerCategoryIds(manager.id),
    }))
  );
}

export async function createManagerAdmin(data: {
  username: string;
  passwordHash: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: "admin" | "manager";
  categoryIds?: number[];
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const username = data.username.trim().toLowerCase();
  if (!/^[a-zA-Z0-9._-]{3,100}$/.test(username))
    throw new Error(
      "اسم المستخدم يجب أن يكون 3 أحرف على الأقل وبأحرف لاتينية أو أرقام"
    );
  const existing = await getUserByUsername(username);
  if (existing) throw new Error("اسم المستخدم مستخدم مسبقًا");
  const openId = `manager:${username}`;
  const result = await database.insert(users).values({
    openId,
    username,
    passwordHash: data.passwordHash,
    name: data.name.trim(),
    email: data.email?.trim().toLowerCase() || null,
    phone: data.phone?.trim() || null,
    role: data.role ?? "manager",
    loginMethod: "manager-password",
  });
  const id = extractInsertId(result);
  if (!id) throw new Error("تعذر إنشاء حساب المدير");
  await replaceManagerCategoryAssignments(id, data.categoryIds ?? []);
  return database
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then(rows => rows[0] ?? null);
}

export async function updateManagerAdmin(
  id: number,
  data: {
    username?: string;
    passwordHash?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    role?: "admin" | "manager";
    categoryIds?: number[];
  }
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const current = await database
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!current[0]) throw new Error("المدير غير موجود");
  const updateData: Record<string, unknown> = {};
  if (data.username !== undefined)
    updateData.username = data.username.trim().toLowerCase();
  if (data.passwordHash !== undefined)
    updateData.passwordHash = data.passwordHash;
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.email !== undefined)
    updateData.email = data.email?.trim().toLowerCase() || null;
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.role !== undefined) updateData.role = data.role;
  if (Object.keys(updateData).length > 0)
    await database.update(users).set(updateData).where(eq(users.id, id));
  if (data.categoryIds !== undefined)
    await replaceManagerCategoryAssignments(id, data.categoryIds);
  return database
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then(rows => rows[0] ?? null);
}

export async function getEconomicLedgerRows(
  managerId?: number,
  from?: Date,
  to?: Date
) {
  const database = await getDb();
  if (!database)
    return { sales: [], purchases: [], expenses: [], cashTransactions: [] };
  const categoryIds = managerId ? await getManagerCategoryIds(managerId) : [];
  const restrict = (row: {
    managerId?: number | null;
    categoryId?: number | null;
  }) =>
    !managerId ||
    row.managerId === managerId ||
    (row.categoryId != null && categoryIds.includes(row.categoryId));
  const inRange = (value: Date | string | null | undefined) => {
    const dateValue = value instanceof Date ? value : new Date(value ?? 0);
    return (!from || dateValue >= from) && (!to || dateValue <= to);
  };
  const [saleRows, purchaseRows, expenseRows, cashRows] = await Promise.all([
    database.select().from(sales).orderBy(desc(sales.saleDate)),
    database.select().from(purchases).orderBy(desc(purchases.purchaseDate)),
    database.select().from(expenses).orderBy(desc(expenses.expenseDate)),
    database
      .select()
      .from(cashTransactions)
      .orderBy(desc(cashTransactions.transactionDate)),
  ]);
  return {
    sales: saleRows.filter(row => restrict(row) && inRange(row.saleDate)),
    purchases: purchaseRows.filter(
      row => restrict(row) && inRange(row.purchaseDate)
    ),
    expenses: expenseRows.filter(
      row => restrict(row) && inRange(row.expenseDate)
    ),
    cashTransactions: cashRows.filter(
      row => restrict(row) && inRange(row.transactionDate)
    ),
  };
}

export async function getEconomicSummary(
  managerId?: number,
  from?: Date,
  to?: Date
) {
  const rows = await getEconomicLedgerRows(managerId, from, to);
  const confirmedSales = rows.sales.filter(row => row.status === "confirmed");
  const confirmedPurchases = rows.purchases.filter(
    row => row.status === "confirmed"
  );
  const revenue = confirmedSales.reduce(
    (sum, row) => sum + Number(row.totalAmount),
    0
  );
  const grossProfit = confirmedSales.reduce(
    (sum, row) => sum + Number(row.profitAmount),
    0
  );
  const purchaseCost = confirmedPurchases.reduce(
    (sum, row) => sum + Number(row.totalAmount),
    0
  );
  const expensesTotal = rows.expenses.reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );
  const cashIncome = rows.cashTransactions
    .filter(row => row.type === "income")
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const cashExpense = rows.cashTransactions
    .filter(row => row.type === "expense")
    .reduce((sum, row) => sum + Number(row.amount), 0);
  return {
    revenue,
    grossProfit,
    purchaseCost,
    expensesTotal,
    netProfit: grossProfit - expensesTotal,
    cashBalance: cashIncome - cashExpense,
    salesCount: confirmedSales.length,
    purchasesCount: confirmedPurchases.length,
    expensesCount: rows.expenses.length,
    rows,
  };
}

export async function recordSale(data: {
  orderId?: number | null;
  managerId?: number | null;
  categoryId?: number | null;
  productId?: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  status?: "confirmed" | "cancelled";
  saleDate?: Date;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const unitCost = Number(data.unitCost ?? 0);
  const totalAmount = Number(data.unitPrice) * data.quantity;
  const profitAmount = (Number(data.unitPrice) - unitCost) * data.quantity;
  const result = await database.insert(sales).values({
    orderId: data.orderId ?? null,
    managerId: data.managerId ?? null,
    categoryId: data.categoryId ?? null,
    productId: data.productId ?? null,
    productName: data.productName,
    quantity: data.quantity,
    unitPrice: data.unitPrice.toFixed(2),
    unitCost: unitCost.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    profitAmount: profitAmount.toFixed(2),
    status: data.status ?? "confirmed",
    saleDate: data.saleDate ?? new Date(),
  });
  return extractInsertId(result);
}

export async function setSalesStatusByOrder(
  orderId: number,
  status: "confirmed" | "cancelled"
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .update(sales)
    .set({ status })
    .where(eq(sales.orderId, orderId));
  if (status === "cancelled") {
    await database
      .delete(cashTransactions)
      .where(
        and(
          eq(cashTransactions.sourceType, "order"),
          eq(cashTransactions.sourceId, orderId)
        )
      );
  }
}

export async function recordPurchase(data: {
  managerId?: number | null;
  categoryId?: number | null;
  productId?: number | null;
  productName: string;
  quantity: number;
  unitCost: number;
  purchaseDate?: Date;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const totalAmount = Number(data.unitCost) * data.quantity;
  const result = await database.insert(purchases).values({
    managerId: data.managerId ?? null,
    categoryId: data.categoryId ?? null,
    productId: data.productId ?? null,
    productName: data.productName,
    quantity: data.quantity,
    unitCost: Number(data.unitCost).toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    purchaseDate: data.purchaseDate ?? new Date(),
  });
  return extractInsertId(result);
}

export async function createExpense(data: {
  managerId?: number | null;
  title: string;
  expenseCategory: string;
  amount: number;
  notes?: string | null;
  expenseDate?: Date;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(expenses).values({
    ...data,
    amount: Number(data.amount).toFixed(2),
    expenseDate: data.expenseDate ?? new Date(),
  });
  return extractInsertId(result);
}

export async function updateExpense(
  id: number,
  data: Partial<{
    title: string;
    expenseCategory: string;
    amount: number;
    notes: string | null;
    expenseDate: Date;
  }>
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .update(expenses)
    .set({
      ...data,
      amount:
        data.amount === undefined ? undefined : Number(data.amount).toFixed(2),
    })
    .where(eq(expenses.id, id));
}

export async function deleteExpense(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.delete(expenses).where(eq(expenses.id, id));
}

export async function createCashTransaction(data: {
  managerId?: number | null;
  type: "income" | "expense" | "adjustment";
  amount: number;
  description: string;
  sourceType?: string | null;
  sourceId?: number | null;
  transactionDate?: Date;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(cashTransactions).values({
    ...data,
    amount: Number(data.amount).toFixed(2),
    transactionDate: data.transactionDate ?? new Date(),
  });
  return extractInsertId(result);
}

export async function updateCashTransaction(
  id: number,
  data: Partial<{
    type: "income" | "expense" | "adjustment";
    amount: number;
    description: string;
    transactionDate: Date;
  }>
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .update(cashTransactions)
    .set({
      ...data,
      amount:
        data.amount === undefined ? undefined : Number(data.amount).toFixed(2),
    })
    .where(eq(cashTransactions.id, id));
}

export async function deleteCashTransaction(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.delete(cashTransactions).where(eq(cashTransactions.id, id));
}

export async function deleteFinancialEntry(
  table: "sales" | "purchases",
  id: number
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .delete(table === "sales" ? sales : purchases)
    .where(eq((table === "sales" ? sales : purchases).id, id));
}

export async function getProductsForManager(
  managerId: number,
  isAdmin: boolean
) {
  const allProducts = await getAllProducts();
  if (isAdmin) return allProducts;
  const categoryIds = await getManagerCategoryIds(managerId);
  if (categoryIds.length === 0) return [];
  const assignedCategories = await getAllCategories();
  const assignedNames = new Set(
    assignedCategories
      .filter(item => categoryIds.includes(item.id))
      .map(item => item.name.trim().toLowerCase())
  );
  return allProducts.filter(product => {
    if (product.categoryId != null)
      return categoryIds.includes(product.categoryId);
    return Boolean(
      product.category &&
      assignedNames.has(product.category.trim().toLowerCase())
    );
  });
}

export async function getCategoriesForManager(
  managerId: number,
  isAdmin: boolean
) {
  const allCategories = await getAllCategories();
  if (isAdmin) return allCategories;
  const categoryIds = await getManagerCategoryIds(managerId);
  return allCategories.filter(item => categoryIds.includes(item.id));
}

export async function assertManagerCategoryAccess(
  managerId: number,
  categoryId: number | null | undefined
) {
  const manager = await getUserById(managerId);
  if (!manager || manager.role === "admin") return;
  if (
    !categoryId ||
    !(await getManagerCategoryIds(managerId)).includes(categoryId)
  ) {
    throw new Error("لا تملك صلاحية إدارة هذا القسم");
  }
}

export async function assertManagerCategorySectionAccess(
  managerId: number,
  sectionId: number | null | undefined
) {
  const manager = await getUserById(managerId);
  if (!manager || manager.role === "admin") return;
  if (!sectionId) throw new Error("يجب اختيار قسم للفئة");
  const sections = await getBrandsForManager(managerId, false);
  if (!sections.some(section => section.id === sectionId)) {
    throw new Error("لا تملك صلاحية إدارة هذا القسم");
  }
}

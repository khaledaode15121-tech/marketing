import { describe, expect, it, beforeEach, afterEach } from "vitest";
import mysql from "mysql2/promise";
import {
  buildUniqueValue,
  extractInsertId,
  getBrandSectionsWithCategories,
  getDashboardStatsForUser,
  resolveDatabaseUrl,
} from "./db";

describe("resolveDatabaseUrl", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("falls back to the shared environment database URL", () => {
    expect(resolveDatabaseUrl()).toContain("mysql://");
  });
});

describe("extractInsertId", () => {
  it("reads insertId from a direct MySQL result object", () => {
    expect(extractInsertId({ insertId: 42 })).toBe(42);
  });

  it("reads insertId from an array-wrapped result", () => {
    expect(extractInsertId([{ insertId: 42 }])).toBe(42);
  });

  it("returns undefined when no insertId exists", () => {
    expect(extractInsertId({ affectedRows: 1 })).toBeUndefined();
  });
});

describe("buildUniqueValue", () => {
  it("normalizes values and preserves uppercase for codes", () => {
    expect(buildUniqueValue("FSATEN", "SEC-000", { caseMode: "upper" })).toBe(
      "FSATEN"
    );
    expect(buildUniqueValue("  فساتين  ", "SEC-000")).toBe("SEC-000");
  });

  it("keeps slug values lower-case and readable", () => {
    expect(
      buildUniqueValue("فساتين بيع وشراء", "brand-123", {
        caseMode: "lower",
        separator: "-",
      })
    ).toBe("brand-123");
  });

  it("avoids collisions by appending a numeric suffix", () => {
    const used = new Set(["FSATEN", "brand-123"]);
    expect(
      (() => {
        let value = buildUniqueValue("FSATEN", "SEC-000", {
          caseMode: "upper",
          separator: "-",
        });
        let suffix = 2;
        while (used.has(value)) {
          value = `${value}-${suffix}`;
          suffix += 1;
        }
        return value;
      })()
    ).toBe("FSATEN-2");
  });
});

describe("brand section category mapping", () => {
  it("ignores product-derived brands and only exposes database-backed sections", async () => {
    const connection = await mysql.createConnection(
      process.env.DATABASE_URL || "mysql://root:@localhost:3306/abu_ali_telecom"
    );

    const fakeBrandName = `ProductOnlyBrand-${Date.now()}`;
    const fakeCategoryName = `ProductOnlyCategory-${Date.now()}`;

    try {
      await connection.execute(
        "INSERT INTO products (productCode, name, brand, category, description, price, stock, isSellable, isOnSale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          `TEST-${Date.now()}`,
          `Product ${Date.now()}`,
          fakeBrandName,
          fakeCategoryName,
          "test product",
          "199.00",
          5,
          true,
          false,
        ]
      );

      const sections = await getBrandSectionsWithCategories();
      const section = sections.find(item => item.name === fakeBrandName);

      expect(section).toBeUndefined();
    } finally {
      await connection.execute(
        "DELETE FROM products WHERE brand = ? AND category = ?",
        [fakeBrandName, fakeCategoryName]
      );
      await connection.end();
    }
  });
});

describe("dashboard stats scope", () => {
  it("keeps the global user count only for the admin dashboard", async () => {
    const connection = await mysql.createConnection(
      process.env.DATABASE_URL || "mysql://root:@localhost:3306/abu_ali_telecom"
    );

    const managerUsername = `manager_stats_${Date.now()}`;
    const managerOpenId = `openid_${Date.now()}`;
    const managerName = `Stats Manager ${Date.now()}`;

    try {
      const [insertResult] = await connection.execute(
        "INSERT INTO users (openId, username, name, email, role) VALUES (?, ?, ?, ?, 'manager')",
        [managerOpenId, managerUsername, managerName, `${managerUsername}@test.local`]
      );
      const managerId = (insertResult as any).insertId as number;

      const stats = await getDashboardStatsForUser(managerId, false);

      expect(stats).not.toBeNull();
      expect(stats?.totalProducts).toBeGreaterThanOrEqual(0);
      expect(stats?.totalReviews).toBeGreaterThanOrEqual(0);
      expect(stats?.averageRating).toBeGreaterThanOrEqual(0);
      expect(stats?.totalUsers).toBeUndefined();
    } finally {
      await connection.execute("DELETE FROM users WHERE username = ?", [managerUsername]);
      await connection.end();
    }
  });
});

describe("database schema compatibility", () => {
  it("has the columns used by the app for categories, brands, and products", async () => {
    const connection = await mysql.createConnection(
      process.env.DATABASE_URL || "mysql://root:@localhost:3306/abu_ali_telecom"
    );

    try {
      const [productColumns] = await connection.query("SHOW COLUMNS FROM products");
      const productFields = (productColumns as Array<{ Field: string }>).map(
        column => column.Field
      );

      const [categoryColumns] = await connection.query("SHOW COLUMNS FROM category");
      const categoryFields = (categoryColumns as Array<{ Field: string }>).map(
        column => column.Field
      );

      const [brandColumns] = await connection.query("SHOW COLUMNS FROM brand");
      const brandFields = (brandColumns as Array<{ Field: string }>).map(
        column => column.Field
      );

      expect(productFields).toEqual(
        expect.arrayContaining([
          "oldPrice",
          "isSellable",
          "purchasePrice",
          "brandId",
          "categoryId",
        ])
      );
      expect(categoryFields).toEqual(
        expect.arrayContaining(["categoryCode", "sectionId"])
      );
      expect(brandFields).toEqual(
        expect.arrayContaining(["brandCode", "image", "managerId"])
      );
    } finally {
      await connection.end();
    }
  });
});

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Set it before running the seed script.");
  process.exit(1);
}

const categories = [
  ["هواتف ذكية", "CAT-PHONE", "smartphones", "أحدث الهواتف الذكية والإكسسوارات الأساسية"],
  ["لابتوبات وأجهزة لوحية", "CAT-COMPUTE", "laptops-tablets", "أجهزة للعمل والدراسة والترفيه"],
  ["سماعات", "CAT-AUDIO", "headphones", "سماعات لاسلكية ورأسية بجودة صوت عالية"],
  ["ساعات ذكية", "CAT-WATCH", "smartwatches", "ساعات ذكية لمتابعة النشاط والصحة"],
];

const brands = [
  ["Apple", "SEC-APPLE", "apple"],
  ["Samsung", "SEC-SAMSUNG", "samsung"],
  ["Sony", "SEC-SONY", "sony"],
  ["Google", "SEC-GOOGLE", "google"],
  ["Dell", "SEC-DELL", "dell"],
  ["Xiaomi", "SEC-XIAOMI", "xiaomi"],
];

const products = [
  { code: "APL-SMART-001", name: "iPhone 15 Pro Max", brand: "Apple", category: "هواتف ذكية", price: "4999.00", oldPrice: "5499.00", stock: 50, rating: "4.90", reviewCount: 128, badge: "الأكثر مبيعاً", rentable: false, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80", description: "هاتف احترافي بمعالج A17 Pro وكاميرا متقدمة وشاشة Super Retina XDR." },
  { code: "SAM-SMART-001", name: "Samsung Galaxy S24 Ultra", brand: "Samsung", category: "هواتف ذكية", price: "4299.00", oldPrice: "4799.00", stock: 45, rating: "4.80", reviewCount: 95, badge: "جديد", rentable: false, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80", description: "هاتف رائد بمعالج Snapdragon 8 Gen 3 وقلم S Pen وكاميرا 200 ميجابكسل." },
  { code: "GOO-SMART-001", name: "Google Pixel 8 Pro", brand: "Google", category: "هواتف ذكية", price: "3799.00", oldPrice: "4199.00", stock: 30, rating: "4.60", reviewCount: 65, badge: "ذكي", rentable: false, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80", description: "هاتف ذكي بتقنيات تصوير ومعالجة مدعومة بالذكاء الاصطناعي." },
  { code: "APL-LAPT-001", name: "MacBook Pro M3", brand: "Apple", category: "لابتوبات وأجهزة لوحية", price: "7999.00", oldPrice: null, stock: 20, rating: "4.90", reviewCount: 64, badge: "مميز", rentable: true, rentalPrice: "299.00", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", description: "لابتوب احترافي بمعالج Apple M3 وشاشة Retina وبطارية طويلة الأمد." },
  { code: "DEL-LAPT-001", name: "Dell XPS 15", brand: "Dell", category: "لابتوبات وأجهزة لوحية", price: "6499.00", oldPrice: null, stock: 15, rating: "4.70", reviewCount: 78, badge: "قوي", rentable: true, rentalPrice: "249.00", image: "https://images.unsplash.com/photo-1588872657840-790ff3bde08c?w=800&q=80", description: "لابتوب عالي الأداء مناسب للأعمال الإبداعية والبرمجة." },
  { code: "SAM-TABL-001", name: "Samsung Galaxy Tab S9", brand: "Samsung", category: "لابتوبات وأجهزة لوحية", price: "2799.00", oldPrice: "3199.00", stock: 25, rating: "4.60", reviewCount: 53, badge: "خصم", rentable: true, rentalPrice: "119.00", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80", description: "جهاز لوحي بشاشة AMOLED وقلم S Pen للاستخدام اليومي والمهني." },
  { code: "SON-AUDI-001", name: "Sony WH-1000XM5", brand: "Sony", category: "سماعات", price: "2299.00", oldPrice: "2699.00", stock: 40, rating: "4.80", reviewCount: 142, badge: "الأفضل", rentable: true, rentalPrice: "79.00", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", description: "سماعات رأس احترافية بإلغاء ضوضاء متقدم وصوت نقي." },
  { code: "APL-AUDI-001", name: "AirPods Pro 2", brand: "Apple", category: "سماعات", price: "899.00", oldPrice: "1099.00", stock: 100, rating: "4.70", reviewCount: 210, badge: "خصم 18%", rentable: false, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80", description: "سماعات لاسلكية بإلغاء ضوضاء نشط وصوت مكاني." },
  { code: "SAM-WATC-001", name: "Samsung Galaxy Watch 6", brand: "Samsung", category: "ساعات ذكية", price: "1199.00", oldPrice: "1399.00", stock: 40, rating: "4.40", reviewCount: 62, badge: "ذكية", rentable: false, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", description: "ساعة ذكية لمتابعة الصحة والرياضة مع نظام Wear OS." },
  { code: "XIA-SMART-001", name: "Xiaomi 13 Ultra", brand: "Xiaomi", category: "هواتف ذكية", price: "2899.00", oldPrice: "3299.00", stock: 28, rating: "4.50", reviewCount: 45, badge: "عرض", rentable: false, image: "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=800&q=80", description: "هاتف بكاميرا احترافية ومعالج قوي وشحن سريع." },
];

async function createSchema(connection) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, openId VARCHAR(64) NOT NULL UNIQUE, username VARCHAR(100) NULL UNIQUE, passwordHash VARCHAR(255) NULL, name TEXT, email VARCHAR(320), phone VARCHAR(20), address TEXT, loginMethod VARCHAR(64), token TEXT, role ENUM('user','admin','manager') NOT NULL DEFAULT 'user', createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS category (id INT AUTO_INCREMENT PRIMARY KEY, categoryCode VARCHAR(32) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, description TEXT, image TEXT, isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS brand (id INT AUTO_INCREMENT PRIMARY KEY, brandCode VARCHAR(32) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, description TEXT, logo TEXT, isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, productCode VARCHAR(64) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL, brand VARCHAR(100) NOT NULL, category VARCHAR(100) NOT NULL, categoryId INT NULL, brandId INT NULL, description TEXT, price DECIMAL(10,2) NOT NULL, oldPrice DECIMAL(10,2) NULL, isRentable BOOLEAN NOT NULL DEFAULT FALSE, isSellable BOOLEAN NOT NULL DEFAULT TRUE, purchasePrice DECIMAL(10,2) NULL, rentalPrice DECIMAL(10,2) NULL, image TEXT, images JSON, rating DECIMAL(3,2) DEFAULT 0, reviewCount INT DEFAULT 0, stock INT DEFAULT 0, isOnSale BOOLEAN NOT NULL DEFAULT FALSE, badge VARCHAR(100), badgeColor VARCHAR(50), color VARCHAR(100), size VARCHAR(100), createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX products_categoryId_idx (categoryId), INDEX products_brandId_idx (brandId)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS cartitems (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, productId INT NOT NULL, quantity INT NOT NULL DEFAULT 1, rentalDate DATE NULL, addedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX cart_user_idx (userId), INDEX cart_product_idx (productId)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS wishlistItems (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, productId INT NOT NULL, addedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS reviews (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, productId INT NOT NULL, rating INT NOT NULL, title VARCHAR(255) NOT NULL, comment TEXT, helpful INT DEFAULT 0, verified BOOLEAN DEFAULT FALSE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, totalPrice DECIMAL(10,2) NOT NULL, status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending', paymentStatus ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid', paymentMethod VARCHAR(100) NOT NULL DEFAULT 'الدفع عند الاستلام', customerName TEXT, customerPhone VARCHAR(20), shippingAddress TEXT, estimatedDeliveryMinutes INT NULL, items JSON, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];
  for (const statement of statements) await connection.query(statement);

  for (const statement of [
    `CREATE TABLE IF NOT EXISTS managerCategoryAssignments (id INT AUTO_INCREMENT PRIMARY KEY, managerId INT NOT NULL, categoryId INT NOT NULL, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY manager_category_unique (managerId, categoryId)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS rentalRequests (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, productId INT NOT NULL, rentalDate DATE NOT NULL, status ENUM('pending','unavailable','approved','cancelled','returned') NOT NULL DEFAULT 'pending', createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS rentalBookings (id INT AUTO_INCREMENT PRIMARY KEY, productId INT NOT NULL, rentalDate DATE NOT NULL, status ENUM('booked','available') NOT NULL DEFAULT 'booked', quantity INT NOT NULL DEFAULT 1, rentalPrice DECIMAL(10,2) NOT NULL DEFAULT 0, payments DECIMAL(10,2) NOT NULL DEFAULT 0, remaining DECIMAL(10,2) NOT NULL DEFAULT 0, rentalRequestId INT NOT NULL, userId INT NOT NULL, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS sales (id INT AUTO_INCREMENT PRIMARY KEY, orderId INT NULL, managerId INT NULL, categoryId INT NULL, productId INT NULL, productName VARCHAR(255) NOT NULL, quantity INT NOT NULL DEFAULT 1, unitPrice DECIMAL(12,2) NOT NULL, unitCost DECIMAL(12,2) NOT NULL DEFAULT 0, totalAmount DECIMAL(12,2) NOT NULL, profitAmount DECIMAL(12,2) NOT NULL, status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed', saleDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS purchases (id INT AUTO_INCREMENT PRIMARY KEY, managerId INT NULL, categoryId INT NULL, productId INT NULL, productName VARCHAR(255) NOT NULL, quantity INT NOT NULL DEFAULT 1, unitCost DECIMAL(12,2) NOT NULL, totalAmount DECIMAL(12,2) NOT NULL, status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed', purchaseDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS expenses (id INT AUTO_INCREMENT PRIMARY KEY, managerId INT NULL, title VARCHAR(255) NOT NULL, expenseCategory VARCHAR(100) NOT NULL, amount DECIMAL(12,2) NOT NULL, notes TEXT NULL, expenseDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS cashTransactions (id INT AUTO_INCREMENT PRIMARY KEY, managerId INT NULL, type ENUM('income','expense','adjustment') NOT NULL, amount DECIMAL(12,2) NOT NULL, description VARCHAR(255) NOT NULL, sourceType VARCHAR(50) NULL, sourceId INT NULL, transactionDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ]) await connection.query(statement);
}

async function resetDatabase(connection) {
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of ["cartItems", "cartitems", "rentalBookings", "rentalRequests", "sales", "purchases", "expenses", "cashTransactions", "managerCategoryAssignments", "reviews", "wishlistItems", "orders", "products", "category", "brand", "welcomeMessages", "users"]) {
    await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function ensureColumn(connection, table, column, definition) {
  try {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  }
}

async function createIndexes(connection) {
  for (const statement of [
    "ALTER TABLE `category` ADD UNIQUE KEY `category_categoryCode_unique` (`categoryCode`)",
    "ALTER TABLE `brand` ADD UNIQUE KEY `brand_brandCode_unique` (`brandCode`)",
  ]) {
    try {
      await connection.query(statement);
    } catch (error) {
      if (error.code !== "ER_DUP_KEYNAME" && error.code !== "ER_DUP_ENTRY") throw error;
    }
  }
}

async function seedDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  try {
    await resetDatabase(connection);
    await connection.beginTransaction();
    await createSchema(connection);
    await ensureColumn(connection, "users", "username", "VARCHAR(100) NULL UNIQUE");
    await ensureColumn(connection, "users", "passwordHash", "VARCHAR(255) NULL");
    await ensureColumn(connection, "category", "categoryCode", "VARCHAR(32) NULL");
    await ensureColumn(connection, "brand", "brandCode", "VARCHAR(32) NULL");
    await ensureColumn(connection, "orders", "paymentStatus", "ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid'");
    await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('user','admin','manager') NOT NULL DEFAULT 'user'");
    await connection.query("UPDATE category SET categoryCode = CONCAT('CAT-', LPAD(id, 3, '0')) WHERE categoryCode IS NULL");
    await connection.query("UPDATE brand SET brandCode = CONCAT('SEC-', LPAD(id, 3, '0')) WHERE brandCode IS NULL");
    await createIndexes(connection);

    for (const [name, categoryCode, slug, description] of categories) {
      await connection.execute("INSERT INTO category (categoryCode, name, slug, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE categoryCode = VALUES(categoryCode), name = VALUES(name), description = VALUES(description)", [categoryCode, name, slug, description]);
    }
    for (const [name, brandCode, slug] of brands) {
      await connection.execute("INSERT INTO brand (brandCode, name, slug) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE brandCode = VALUES(brandCode), name = VALUES(name)", [brandCode, name, slug]);
    }

    const [categoryRows] = await connection.query("SELECT id, name, categoryCode FROM category");
    const [brandRows] = await connection.query("SELECT id, name, brandCode FROM brand");
    const categoryIds = new Map(categoryRows.map((row) => [row.name, row.id]));
    const categoryCodes = new Map(categoryRows.map((row) => [row.name, row.categoryCode]));
    const brandIds = new Map(brandRows.map((row) => [row.name, row.id]));
    const brandCodes = new Map(brandRows.map((row) => [row.name, row.brandCode]));

    for (const product of products) {
      const categoryId = categoryIds.get(product.category);
      const categoryCode = categoryCodes.get(product.category) || "CAT-000";
      const brandId = brandIds.get(product.brand);
      const brandCode = brandCodes.get(product.brand) || "SEC-000";
      const values = [product.name, product.brand, product.category, categoryId, brandId, product.description, product.price, product.oldPrice, product.rentable, product.rentalPrice ?? null, product.image, JSON.stringify([product.image]), product.rating, product.reviewCount, product.stock, Boolean(product.oldPrice), product.badge, "bg-blue-600"];
      const [[existingProduct]] = await connection.query("SELECT id FROM products WHERE name = ? LIMIT 1", [product.name]);
      let productId = existingProduct?.id;
      if (productId) {
        await connection.execute(
          `UPDATE products SET brand = ?, category = ?, categoryId = ?, brandId = ?, description = ?, price = ?, oldPrice = ?, isRentable = ?, rentalPrice = ?, image = ?, images = ?, rating = ?, reviewCount = ?, stock = ?, isOnSale = ?, badge = ?, badgeColor = ? WHERE id = ?`,
          [...values.slice(1), productId],
        );
      } else {
        const [result] = await connection.execute(
          `INSERT INTO products (productCode, name, brand, category, categoryId, brandId, description, price, oldPrice, isRentable, rentalPrice, image, images, rating, reviewCount, stock, isOnSale, badge, badgeColor)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [`SEED-${product.code}`, ...values],
        );
        productId = result.insertId;
      }
      const generatedCode = `${brandCode}-${categoryCode}-${String(productId).padStart(6, "0")}`;
      await connection.execute("UPDATE products SET productCode = ? WHERE id = ?", [generatedCode, productId]);
    }

    await connection.execute("INSERT INTO users (openId, username, passwordHash, name, email, phone, address, loginMethod, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), passwordHash = VALUES(passwordHash), name = VALUES(name), email = VALUES(email), role = VALUES(role)", ["demo-admin", "demo_admin", "scrypt:136c59f1921d04fcf2c7001a6449e734:f552bfd330b14dd20e8a64a39964dd63030906b4bba15c37561ebdf1d2969d646ea69bab1206a349347e57d53b8ddbb0883b47a129b6e86cd8a70982b50d7bc7", "مدير تجريبي", "demo-admin@example.com", "0500000000", "الرياض - حي تجريبي", "seed", "admin"]);
    await connection.execute("INSERT INTO users (openId, name, email, phone, address, loginMethod, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email)", ["demo-customer", "عميل تجريبي", "demo-customer@example.com", "0550000000", "جدة - حي تجريبي", "seed", "user"]);

    const [[admin]] = await connection.query("SELECT id FROM users WHERE openId = 'demo-admin'");
    const [[customer]] = await connection.query("SELECT id FROM users WHERE openId = 'demo-customer'");
    const [[firstProduct]] = await connection.query("SELECT id, productCode, price, name, image FROM products ORDER BY id LIMIT 1");
    const [[secondProduct]] = await connection.query("SELECT id, productCode, price, name, image FROM products ORDER BY id LIMIT 1 OFFSET 1");

    await connection.execute("INSERT INTO reviews (userId, productId, rating, title, comment, helpful, verified) SELECT ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE userId = ? AND productId = ?)", [customer.id, firstProduct.id, 5, "تجربة ممتازة", "المنتج مطابق للوصف والتوصيل كان سريعاً.", 4, true, customer.id, firstProduct.id]);
    await connection.execute("INSERT INTO cartitems (userId, productId, quantity) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM cartitems WHERE userId = ? AND productId = ?)", [customer.id, secondProduct.id, 1, customer.id, secondProduct.id]);
    await connection.execute("INSERT INTO wishlistItems (userId, productId) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM wishlistItems WHERE userId = ? AND productId = ?)", [customer.id, firstProduct.id, customer.id, firstProduct.id]);
    await connection.execute("INSERT INTO orders (userId, totalPrice, status, paymentStatus, paymentMethod, customerName, customerPhone, shippingAddress, items) SELECT ?, ?, 'processing', 'unpaid', 'الدفع عند الاستلام', ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM orders WHERE userId = ?)", [customer.id, firstProduct.price, "عميل تجريبي", "0550000000", "جدة - حي تجريبي", JSON.stringify([{ productId: firstProduct.id, quantity: 1, price: Number(firstProduct.price), title: firstProduct.name, image: firstProduct.image }]), customer.id]);

    await connection.commit();
    const [[{ productCount }]] = await connection.query("SELECT COUNT(*) AS productCount FROM products");
    const [[{ userCount }]] = await connection.query("SELECT COUNT(*) AS userCount FROM users");
    console.log(`تمت تهيئة قاعدة البيانات بنجاح: ${productCount} منتج، ${userCount} مستخدم تجريبي.`);
  } catch (error) {
    await connection.rollback();
    console.error("فشل تهيئة قاعدة البيانات:", error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

seedDatabase();

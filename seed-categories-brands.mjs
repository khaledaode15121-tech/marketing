import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'abu_ali_telecom',
});

const categories = [
  { name: 'هواتف ذكية', slug: 'smartphones', description: 'أحدث الهواتف الذكية', image: '', isActive: true },
  { name: 'لابتوبات', slug: 'laptops', description: 'ألابتوبات للأعمال والترفيه', image: '', isActive: true },
  { name: 'ساعات ذكية', slug: 'smartwatches', description: 'ساعات ذكية متنوعة', image: '', isActive: true },
];

const brands = [
  { name: 'Apple', slug: 'apple', description: 'أجهزة Apple الأصلية', logo: '', isActive: true },
  { name: 'Samsung', slug: 'samsung', description: 'تقنيات سامسونج المتقدمة', logo: '', isActive: true },
  { name: 'Xiaomi', slug: 'xiaomi', description: 'أجهزة Xiaomi المميزة', logo: '', isActive: true },
  { name: 'Dell', slug: 'dell', description: 'أجهزة Dell للأعمال', logo: '', isActive: true },
  { name: 'Garmin', slug: 'garmin', description: 'ساعات Garmin الذكية', logo: '', isActive: true },
];

for (const item of categories) {
  await connection.execute(
    'INSERT INTO category (name, slug, description, image, isActive) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), image = VALUES(image), isActive = VALUES(isActive)',
    [item.name, item.slug, item.description, item.image, item.isActive ? 1 : 0]
  );
}

for (const item of brands) {
  await connection.execute(
    'INSERT INTO brand (name, slug, description, logo, isActive) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), logo = VALUES(logo), isActive = VALUES(isActive)',
    [item.name, item.slug, item.description, item.logo, item.isActive ? 1 : 0]
  );
}

const [products] = await connection.query('SELECT id, category, brand FROM products');
const categoryRows = await connection.query('SELECT id, name FROM category');
const brandRows = await connection.query('SELECT id, name FROM brand');

const categoryMap = new Map(categoryRows[0].map((row) => [row.name, row.id]));
const brandMap = new Map(brandRows[0].map((row) => [row.name, row.id]));

for (const product of products) {
  const categoryId = categoryMap.get(product.category) ?? null;
  const brandId = brandMap.get(product.brand) ?? null;
  if (categoryId !== null || brandId !== null) {
    await connection.execute('UPDATE products SET categoryId = ?, brandId = ? WHERE id = ?', [categoryId, brandId, product.id]);
  }
}

console.log(JSON.stringify({
  categoriesInserted: categories.length,
  brandsInserted: brands.length,
  productsLinked: products.length,
}));

await connection.end();

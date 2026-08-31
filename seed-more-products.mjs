import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'abu_ali_telecom',
});

const products = [
  {
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    category: 'هواتف ذكية',
    description: 'هاتف ذكي فاخر من Apple',
    price: '14999',
    oldPrice: '16999',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    badge: 'جديد',
    badgeColor: 'bg-blue-600',
    rating: '4.8',
    reviewCount: 120,
  },
  {
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'هواتف ذكية',
    description: 'هاتف Samsung قوي بكاميرات متقدمة',
    price: '13999',
    oldPrice: '15999',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    stock: 8,
    badge: 'أفضل بيع',
    badgeColor: 'bg-green-600',
    rating: '4.7',
    reviewCount: 95,
  },
  {
    name: 'Redmi Note 13 Pro',
    brand: 'Xiaomi',
    category: 'هواتف ذكية',
    description: 'هاتف Xiaomi متوازن السعر والأداء',
    price: '5999',
    oldPrice: '6999',
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    badge: 'عرض',
    badgeColor: 'bg-orange-500',
    rating: '4.5',
    reviewCount: 70,
  },
  {
    name: 'Dell XPS 13',
    brand: 'Dell',
    category: 'لابتوبات',
    description: 'لابتوب Dell خفيف وقوي',
    price: '12999',
    oldPrice: '14999',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    stock: 6,
    badge: 'مميز',
    badgeColor: 'bg-purple-600',
    rating: '4.6',
    reviewCount: 88,
  },
  {
    name: 'Garmin Venu 3',
    brand: 'Garmin',
    category: 'ساعات ذكية',
    description: 'ساعة Garmin ذكية ومناسبة للرياضة',
    price: '3999',
    oldPrice: '4799',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    badge: 'خصم',
    badgeColor: 'bg-red-500',
    rating: '4.4',
    reviewCount: 60,
  },
];

for (const product of products) {
  await connection.execute(
    `INSERT INTO products
      (name, brand, category, description, price, oldPrice, image, stock, badge, badgeColor, rating, reviewCount, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      product.name,
      product.brand,
      product.category,
      product.description,
      product.price,
      product.oldPrice,
      product.image,
      product.stock,
      product.badge,
      product.badgeColor,
      product.rating,
      product.reviewCount,
    ]
  );
}

const [categoryRows] = await connection.query('SELECT id, name FROM category');
const [brandRows] = await connection.query('SELECT id, name FROM brand');
const categoryMap = new Map(categoryRows.map((row) => [row.name, row.id]));
const brandMap = new Map(brandRows.map((row) => [row.name, row.id]));

const [allProducts] = await connection.query('SELECT id, category, brand FROM products ORDER BY id DESC LIMIT 5');
for (const product of allProducts) {
  const categoryId = categoryMap.get(product.category) ?? null;
  const brandId = brandMap.get(product.brand) ?? null;
  await connection.execute('UPDATE products SET categoryId = ?, brandId = ? WHERE id = ?', [categoryId, brandId, product.id]);
}

console.log(JSON.stringify({ inserted: products.length }));
await connection.end();

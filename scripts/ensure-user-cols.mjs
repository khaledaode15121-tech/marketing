import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/abu_ali_telecom';
const connection = await createConnection(url);

try {
  const [rows] = await connection.query('SHOW COLUMNS FROM users LIKE "phone"');
  if (!Array.isArray(rows) || rows.length === 0) {
    await connection.query('ALTER TABLE users ADD COLUMN phone varchar(20) NULL');
  }

  const [rows2] = await connection.query('SHOW COLUMNS FROM users LIKE "address"');
  if (!Array.isArray(rows2) || rows2.length === 0) {
    await connection.query('ALTER TABLE users ADD COLUMN address text NULL');
  }

  console.log('users table updated');
} finally {
  await connection.end();
}

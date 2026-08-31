import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/abu_ali_telecom';
console.log('[ensure-user-token] connecting to', url.replace(/:[^@]+@/, ':***@'));
const connection = await createConnection(url);

try {
  const [rows] = await connection.query("SHOW COLUMNS FROM users LIKE 'token'");
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('[ensure-user-token] token column missing, adding...');
    await connection.query('ALTER TABLE users ADD COLUMN token TEXT NULL');
    console.log('[ensure-user-token] token column added');
  } else {
    console.log('[ensure-user-token] token column already exists');
  }
} catch (err) {
  console.error('[ensure-user-token] error:', err);
  process.exitCode = 1;
} finally {
  await connection.end();
}

#!/usr/bin/env node
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { randomBytes, scryptSync } from 'crypto';

const KEY_LENGTH = 64;
function hashManagerPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

async function main() {
  const [,, username, password] = process.argv;
  if (!username || !password) {
    console.error('Usage: node scripts/reset-manager-password.mjs <username> <newPassword>');
    process.exit(2);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(2);
  }

  const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/abu_ali_telecom';
  const conn = await mysql.createConnection(databaseUrl);
  try {
    const hashed = hashManagerPassword(password);
    const [result] = await conn.execute('UPDATE `users` SET `passwordHash` = ? WHERE `username` = ?', [hashed, username.trim().toLowerCase()]);
    // result.affectedRows may be available depending on driver
    console.log('Password updated for', username);
  } catch (err) {
    console.error('Failed to update password:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();

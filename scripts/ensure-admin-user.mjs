#!/usr/bin/env node
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { randomBytes, scryptSync } from 'crypto';

const KEY_LENGTH = 64;
function hashPasswordNoLengthCheck(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

async function main() {
  const username = 'admin';
  const password = 'admin';

  const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/abu_ali_telecom';
  const conn = await mysql.createConnection(databaseUrl);
  try {
    const passwordHash = hashPasswordNoLengthCheck(password);

    // Check if a user with this username exists
    const [rows] = await conn.execute('SELECT id FROM `users` WHERE username = ? LIMIT 1', [username]);
    const userRow = (rows && rows[0]) || null;

    if (userRow && userRow.id) {
      await conn.execute('UPDATE `users` SET `passwordHash` = ?, `role` = ? WHERE `id` = ?', [passwordHash, 'admin', userRow.id]);
      console.log('Updated existing user `admin` with new password.');
    } else {
      const openId = `manager:${username}`;
      await conn.execute(
        'INSERT INTO `users` (`openId`,`username`,`passwordHash`,`name`,`email`,`phone`,`address`,`loginMethod`,`role`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [openId, username, passwordHash, 'admin', null, null, null, 'manager-password', 'admin']
      );
      console.log('Created new admin user `admin` with password `admin`.');
    }
    console.warn('\nSECURITY WARNING: Using username `admin` with password `admin` is insecure. Remove or change this account in production.\n');
  } catch (err) {
    console.error('Failed to ensure admin user:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();

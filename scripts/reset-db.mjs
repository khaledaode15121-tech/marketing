#!/usr/bin/env node
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { spawnSync } from 'child_process';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Set it in .env or environment before running.');
  process.exit(1);
}

function parseDatabaseUrl(urlString) {
  try {
    const url = new URL(urlString);
    const database = url.pathname.replace(/\//g, '');
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  } catch (err) {
    throw new Error('Invalid DATABASE_URL format: ' + err.message);
  }
}

async function main() {
  const cfg = parseDatabaseUrl(DATABASE_URL);
  if (!cfg.database) {
    console.error('No database name found in DATABASE_URL.');
    process.exit(1);
  }

  console.warn('This will DROP and RECREATE the database:', cfg.database);
  console.warn('If you are sure, run this script. Waiting 3 seconds to let you cancel (Ctrl+C)...');
  await new Promise(res => setTimeout(res, 3000));

  const adminConn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
  });

  try {
    // Drop and create database with proper charset
    await adminConn.query(`DROP DATABASE IF EXISTS \`${cfg.database}\``);
    await adminConn.query(`CREATE DATABASE \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('Dropped and recreated database:', cfg.database);
  } catch (err) {
    console.error('Failed to drop/create database:', err.message);
    process.exit(1);
  } finally {
    await adminConn.end();
  }

  // Run seed script(s)
  console.log('Running seed scripts (seed-db.mjs)...');
  const seedCmd = spawnSync(process.execPath, ['seed-db.mjs'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  if (seedCmd.error) {
    console.error('Failed to start seed script:', seedCmd.error);
    process.exit(1);
  }
  if (seedCmd.status !== 0) {
    console.error('Seed script exited with code', seedCmd.status);
    process.exit(seedCmd.status || 1);
  }

  console.log('Database reset and seeded successfully.');
}

main();

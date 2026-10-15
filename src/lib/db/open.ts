import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

export type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');

export function databasePath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'dazytech.db');
}

// `file` = ':memory:' untuk test.
export function openDatabase(file = databasePath()): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = new Database(file);
  // WAL: pembaca tidak memblokir penulis. File -wal & -shm muncul di folder
  // yang sama, makanya yang di-mount ke volume adalah folder, bukan file.
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  return drizzle(sqlite, { schema });
}

export function runMigrations(db: DB): void {
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}

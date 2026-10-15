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

// Foreign key WAJIB mati selama migrasi: migrasi yang membangun ulang tabel
// (drop + rename) akan memicu ON DELETE CASCADE / gagal FK kalau masih aktif.
// PRAGMA ini tidak berlaku di dalam transaksi, jadi diset sebelum migrate()
// (yang membungkus semua migrasi dalam satu transaksi). Setelahnya integritas
// dicek ulang; kalau ada pelanggaran, start dibatalkan.
export function runMigrations(db: DB, migrationsFolder = MIGRATIONS_DIR): void {
  const sqlite = db.$client;
  sqlite.pragma('foreign_keys = OFF');
  try {
    migrate(db, { migrationsFolder });
    const violations = sqlite.pragma('foreign_key_check') as unknown[];
    if (violations.length > 0) {
      throw new Error(`Migrasi menghasilkan ${violations.length} pelanggaran foreign key: ${JSON.stringify(violations.slice(0, 5))}`);
    }
  } finally {
    sqlite.pragma('foreign_keys = ON');
  }
}

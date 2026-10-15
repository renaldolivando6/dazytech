import 'server-only';
import { openDatabase, type DB } from './open';

export type { DB } from './open';

// Satu koneksi per proses. Di dev, modul di-reload saat hot reload, jadi
// koneksinya disimpan di globalThis supaya tidak bocor ratusan file handle.
const globalForDb = globalThis as unknown as { __dazytechDb?: DB };

export function getDb(): DB {
  globalForDb.__dazytechDb ??= openDatabase();
  return globalForDb.__dazytechDb;
}

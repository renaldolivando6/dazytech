// Salinan konsisten database SQLite untuk dibuka di DBeaver / tool lain.
// Aman dijalankan selagi app jalan (memakai backup API SQLite, bukan cp).
//
//   docker exec dazytech-dev npm run db:snapshot
//   -> data/dazytech-snapshot.db
//
// Jangan buka data/dazytech.db langsung dari Windows (\\wsl.localhost):
// mode WAL tidak bisa di-lock lewat share itu -> SQLITE_BUSY / risiko rusak.
import path from 'node:path';
import Database from 'better-sqlite3';

const source = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'dazytech.db');
const target = process.argv[2] || path.join(path.dirname(source), 'dazytech-snapshot.db');

const db = new Database(source, { readonly: true, fileMustExist: true });
await db.backup(target);
db.close();

// Snapshot dibuat mode journal biasa (bukan WAL) supaya cukup satu file.
const snap = new Database(target);
snap.pragma('journal_mode = DELETE');
const tables = snap
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all()
  .map((t) => `${t.name}=${snap.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get().n}`);
snap.close();

console.log(`Snapshot: ${target}`);
console.log(tables.join('  '));

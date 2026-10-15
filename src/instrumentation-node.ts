import { bootstrapDatabase } from '@/lib/db/bootstrap';
import { openDatabase } from '@/lib/db/open';

// Migrasi + akun admin awal. Koneksi terpisah khusus ini lalu ditutup;
// request biasa memakai koneksi dari src/lib/db/client.ts.
const db = openDatabase();
try {
  await bootstrapDatabase(db);
} finally {
  db.$client.close();
}

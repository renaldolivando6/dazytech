import { count } from 'drizzle-orm';
import { generatePassword, hashPassword } from '@/lib/auth/password';
import { runMigrations, type DB } from './open';
import { users } from './schema';

// Dijalankan sekali saat server start (src/instrumentation.ts):
//   1. migrasi skema (idempotent, hanya yang belum jalan),
//   2. buat akun admin pertama kalau tabel users masih kosong.
export async function bootstrapDatabase(db: DB): Promise<void> {
  runMigrations(db);

  const existing = db.select({ n: count() }).from(users).get()?.n ?? 0;
  if (existing > 0) return;

  const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
  const fromEnv = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  const password = fromEnv || generatePassword();

  db.insert(users)
    .values({ username, passwordHash: await hashPassword(password), mustChangePassword: true })
    .run();

  // Dicetak SEKALI ke log container. Wajib diganti saat login pertama.
  console.warn(
    fromEnv
      ? `[auth] Akun admin "${username}" dibuat dari ADMIN_INITIAL_PASSWORD. Wajib ganti password saat login pertama.`
      : `[auth] Akun admin "${username}" dibuat. Password awal: ${password}  (wajib diganti saat login pertama)`,
  );
}

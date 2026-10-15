import { defineConfig } from 'drizzle-kit';

// Hanya untuk `npm run db:generate` (membuat file migrasi SQL di ./drizzle).
// Migrasi dijalankan otomatis oleh aplikasi saat start (src/instrumentation.ts).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
});

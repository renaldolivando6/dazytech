// Next.js memanggil register() sekali saat server start.
// Pola `if (NEXT_RUNTIME === 'nodejs') await import(...)` wajib persis begini:
// file ini juga di-bundle untuk Edge runtime, dan hanya dengan pola ini
// modul Node (better-sqlite3, fs) dibuang dari bundle Edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}

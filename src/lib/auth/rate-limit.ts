// Pembatas percobaan login, disimpan di memori proses. Cukup karena app ini
// jalan sebagai SATU container; kalau nanti di-scale ke >1 instance, pindahkan
// ke tabel SQLite/Redis.

type Bucket = { failures: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
// Per IP ketat. Per username lebih longgar, supaya orang iseng tidak bisa
// mengunci akun admin hanya dengan sengaja salah password 5x.
const MAX_FAILURES = { ip: 5, user: 30 } as const;
const buckets = new Map<string, Bucket>();

function bucket(key: string, now: number): Bucket {
  const b = buckets.get(key);
  if (b && b.resetAt > now) return b;
  const fresh = { failures: 0, resetAt: now + WINDOW_MS };
  buckets.set(key, fresh);
  return fresh;
}

// Dicek per IP DAN per username: menebak satu akun dari banyak IP, atau banyak
// akun dari satu IP, sama-sama tertahan.
function keys(ip: string, username: string) {
  return [`ip:${ip}`, `user:${username.toLowerCase()}`];
}

export function loginBlockedFor(ip: string, username: string, now = Date.now()): number {
  let waitMs = 0;
  for (const key of keys(ip, username)) {
    const b = bucket(key, now);
    const max = key.startsWith('ip:') ? MAX_FAILURES.ip : MAX_FAILURES.user;
    if (b.failures >= max) waitMs = Math.max(waitMs, b.resetAt - now);
  }
  return waitMs;
}

export function recordLoginFailure(ip: string, username: string, now = Date.now()): void {
  for (const key of keys(ip, username)) bucket(key, now).failures++;
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
}

export function clearLoginFailures(ip: string, username: string): void {
  for (const key of keys(ip, username)) buckets.delete(key);
}

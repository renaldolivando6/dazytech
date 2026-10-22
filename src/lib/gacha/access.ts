import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { clientIp } from '@/lib/auth/session';
import type { DB } from '@/lib/db/open';
import { GACHA_PATH, PIN_LENGTH, type GachaState } from './config';
import { getCampaign, getState, isReady, normalizePin } from './service';

// Akses halaman hadiah: PIN 6 angka -> cookie berisi HMAC(secret kampanye,
// slug + PIN). Ganti PIN atau reset kampanye (secret baru) = cookie lama gugur.
// Bagian murni (tanda tangan, pembanding, rate limit) tidak menyentuh Next,
// jadi bisa dites langsung.

export const ACCESS_COOKIE = 'gacha_jajo_eng';
const ACCESS_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------- tanda tangan

export function signAccess(secret: string, slug: string, pin: string): string {
  return createHmac('sha256', secret).update(`${slug}:${pin}`).digest('base64url');
}

// Bandingkan dua string tanpa bocor lewat waktu eksekusi. Di-hash dulu supaya
// panjangnya sama (timingSafeEqual menolak panjang berbeda).
export function safeEqual(a: string, b: string): boolean {
  const digest = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function verifyAccess(token: string | undefined, secret: string, slug: string, pin: string): boolean {
  return !!token && safeEqual(token, signAccess(secret, slug, pin));
}

export function accessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    // Tanpa garis miring akhir: cocok untuk /...-gift dan /...-gift/ (beserta
    // server action yang dikirim ke URL halaman), tidak terkirim ke halaman lain.
    path: GACHA_PATH.replace(/\/$/, ''),
    maxAge: Math.floor(ACCESS_TTL_MS / 1000),
  };
}

// ---------------------------------------------------------------- rate limit

// Di memori proses, sama seperti lib/auth/rate-limit.ts (app = satu container).
// 5 salah per IP per 15 menit, plus batas total 30 per 15 menit dari semua IP
// supaya PIN tidak bisa ditebak dari banyak IP sekaligus.
type Bucket = { failures: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = { ip: 5, global: 30 } as const;
const GLOBAL_KEY = 'global';
const buckets = new Map<string, Bucket>();

function bucket(key: string, now: number): Bucket {
  const b = buckets.get(key);
  if (b && b.resetAt > now) return b;
  const fresh = { failures: 0, resetAt: now + WINDOW_MS };
  buckets.set(key, fresh);
  return fresh;
}

// Sisa waktu tunggu dalam ms (0 = boleh mencoba).
export function pinBlockedFor(ip: string, now = Date.now()): number {
  let waitMs = 0;
  for (const [key, max] of [
    [`ip:${ip}`, MAX_FAILURES.ip],
    [GLOBAL_KEY, MAX_FAILURES.global],
  ] as const) {
    const b = bucket(key, now);
    if (b.failures >= max) waitMs = Math.max(waitMs, b.resetAt - now);
  }
  return waitMs;
}

export function recordPinFailure(ip: string, now = Date.now()): void {
  bucket(`ip:${ip}`, now).failures++;
  bucket(GLOBAL_KEY, now).failures++;
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
}

// PIN benar: hitungan IP ini dihapus. Hitungan global tetap (habis sendiri).
export function clearPinFailures(ip: string): void {
  buckets.delete(`ip:${ip}`);
}

// ---------------------------------------------------------------- dengan Next (cookie & IP)

export async function hasAccess(db: DB): Promise<boolean> {
  const campaign = getCampaign(db);
  if (!campaign) return false;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return verifyAccess(token, campaign.secret, campaign.slug, campaign.pin);
}

// State yang boleh dilihat pengunjung saat ini: belum siap -> not_ready,
// tanpa cookie valid -> locked, selain itu isi lengkap (hanya putaran yang sudah dibuka).
export async function viewerState(db: DB): Promise<GachaState> {
  if (!isReady(db)) return { status: 'not_ready' };
  if (!(await hasAccess(db))) return { status: 'locked' };
  return getState(db);
}

export type UnlockOutcome = { ok: true } | { ok: false; error: string; retryAfterSec?: number; notReady?: boolean };

export async function unlock(db: DB, input: string, now = Date.now()): Promise<UnlockOutcome> {
  const campaign = getCampaign(db);
  if (!campaign || !isReady(db)) return { ok: false, error: 'Hadiahnya lagi disiapin. Coba lagi nanti ya.', notReady: true };

  // Isian yang formatnya salah tidak mungkin benar, jadi tidak dihitung gagal.
  const pin = normalizePin(input);
  if (!pin) return { ok: false, error: `PIN-nya ${PIN_LENGTH} angka ya.` };

  const ip = await clientIp();
  const waitMs = pinBlockedFor(ip, now);
  if (waitMs > 0) {
    const retryAfterSec = Math.ceil(waitMs / 1000);
    return { ok: false, error: `Kebanyakan salah. Tunggu ${Math.ceil(retryAfterSec / 60)} menit lagi ya.`, retryAfterSec };
  }

  if (!safeEqual(pin, campaign.pin)) {
    recordPinFailure(ip, now);
    const left = pinBlockedFor(ip, now);
    if (left > 0) {
      const retryAfterSec = Math.ceil(left / 1000);
      return { ok: false, error: `PIN salah. Kebanyakan salah, tunggu ${Math.ceil(retryAfterSec / 60)} menit lagi ya.`, retryAfterSec };
    }
    return { ok: false, error: 'PIN salah, coba lagi.' };
  }

  clearPinFailures(ip);
  (await cookies()).set(ACCESS_COOKIE, signAccess(campaign.secret, campaign.slug, pin), accessCookieOptions());
  return { ok: true };
}

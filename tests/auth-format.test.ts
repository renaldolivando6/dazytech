import { describe, expect, it } from 'vitest';
import { safeAdminPath } from '@/lib/auth/constants';
import { generatePassword, hashPassword, verifyPassword } from '@/lib/auth/password';
import { clearLoginFailures, loginBlockedFor, recordLoginFailure } from '@/lib/auth/rate-limit';
import { defaultCutoff, formatRupiah, isIsoDate, jakartaToday } from '@/lib/format';

describe('password', () => {
  it('hash bisa diverifikasi, password salah ditolak', async () => {
    const hash = await hashPassword('rahasia-sekali');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('rahasia-sekali', hash)).toBe(true);
    expect(await verifyPassword('rahasia-sekalI', hash)).toBe(false);
    expect(await verifyPassword('apa saja', 'format-rusak')).toBe(false);
  });

  it('password awal hasil generate cukup panjang dan acak', () => {
    const a = generatePassword();
    expect(a).toHaveLength(16);
    expect(a).not.toBe(generatePassword());
  });
});

describe('rate limit login', () => {
  it('memblokir IP setelah 5 kali gagal, dan reset setelah berhasil', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) recordLoginFailure('1.2.3.4', 'admin', now);
    expect(loginBlockedFor('1.2.3.4', 'admin', now)).toBeGreaterThan(0);
    expect(loginBlockedFor('5.6.7.8', 'admin', now)).toBe(0);
    clearLoginFailures('1.2.3.4', 'admin');
    expect(loginBlockedFor('1.2.3.4', 'admin', now)).toBe(0);
  });
});

describe('safeAdminPath', () => {
  it('hanya mengizinkan path admin internal', () => {
    expect(safeAdminPath('/admin/komisi/')).toBe('/admin/komisi/');
    expect(safeAdminPath('https://evil.com')).toBeNull();
    expect(safeAdminPath('//evil.com/admin/')).toBeNull();
    expect(safeAdminPath('/admin/login/')).toBeNull();
  });
});

describe('format & tanggal', () => {
  it('cutoff default = tanggal 15 terakhir yang sudah lewat', () => {
    expect(defaultCutoff('2026-10-15')).toBe('2026-10-15');
    expect(defaultCutoff('2026-10-20')).toBe('2026-10-15');
    expect(defaultCutoff('2026-10-14')).toBe('2026-09-15');
    expect(defaultCutoff('2026-01-03')).toBe('2025-12-15');
  });

  it('hari ini dihitung dalam WIB', () => {
    // 2026-10-14 18:00 UTC = 2026-10-15 01:00 WIB
    expect(jakartaToday(new Date('2026-10-14T18:00:00Z'))).toBe('2026-10-15');
  });

  it('format rupiah & validasi tanggal', () => {
    expect(formatRupiah(193560)).toBe('Rp 193.560');
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-02-28')).toBe(true);
  });
});

import type { PrizeKind } from '@/lib/gacha/config';

// Format angka dan teks kecil untuk halaman hadiah. Pure, tanpa DOM, aman di
// server maupun client (dan dites di tests/gacha-engine.test.ts).

/** 1500000 -> "Rp1.500.000" (tanpa spasi, titik ribuan, tidak tergantung locale). */
export function formatRp(n: number): string {
  const v = Number.isFinite(n) ? Math.round(n) : 0;
  const digits = Math.abs(v)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${v < 0 ? '-' : ''}Rp${digits}`;
}

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

const join = (...parts: string[]) => parts.filter(Boolean).join(' ');

function below1000(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) return join(`${SATUAN[Math.floor(n / 10)]} puluh`, below1000(n % 10));
  if (n < 200) return join('seratus', below1000(n - 100));
  return join(`${SATUAN[Math.floor(n / 100)]} ratus`, below1000(n % 100));
}

const SCALES: readonly [number, string][] = [
  [1e12, 'triliun'],
  [1e9, 'miliar'],
  [1e6, 'juta'],
];

/** Terbilang bahasa Indonesia, tanpa "rupiah": 1500000 -> "satu juta lima ratus ribu". */
export function terbilang(n: number): string {
  if (!Number.isFinite(n)) return '';
  let rest = Math.floor(Math.abs(n));
  if (rest === 0) return 'nol';
  const out: string[] = [];
  for (const [size, word] of SCALES) {
    const g = Math.floor(rest / size);
    if (g > 0) out.push(`${terbilang(g)} ${word}`);
    rest %= size;
  }
  const ribu = Math.floor(rest / 1000);
  if (ribu === 1) out.push('seribu');
  else if (ribu > 1) out.push(`${below1000(ribu)} ribu`);
  out.push(below1000(rest % 1000));
  return `${n < 0 ? 'minus ' : ''}${join(...out)}`;
}

/** "X032K-WER44-432RE" -> ["X032K", "WER44", "432RE"]. Input tanpa strip dipecah per 5 karakter. */
export function codeGroups(code: string): string[] {
  const parts = code.split('-').filter(Boolean);
  if (parts.length > 1) return parts;
  const clean = code.replace(/[^0-9A-Za-z]/g, '');
  return clean.match(/.{1,5}/g) ?? [];
}

/** Ejaan per karakter untuk pembaca layar: "X 0 3 2 K, W E R 4 4, 4 3 2 R E". */
export function spellCode(code: string): string {
  return codeGroups(code)
    .map((g) => g.split('').join(' '))
    .join(', ');
}

/** "Tiket Amerika... eh" -> ["Tiket Amerika...", "eh"]; kalimat lain -> [kalimat, null] (DESIGN 6.8). */
export function splitTease(line: string): [string, string | null] {
  const m = /^(.*\.\.\.)\s+(\S.*)$/.exec(line);
  return m ? [m[1], m[2]] : [line, null];
}

export type TypingStep = { t: number; upTo: number };

/**
 * Jadwal efek ketik untuk teks tease finale (DESIGN 6.8): huruf pertama di
 * `startMs`, lalu 45ms per huruf, dan jeda 220ms setelah setiap titik.
 * `upTo` = jumlah karakter yang tampil mulai `t` (ms sejak awal hold).
 */
export function typingSchedule(text: string, { startMs = 100, charMs = 45, dotMs = 220 } = {}): TypingStep[] {
  const steps: TypingStep[] = [];
  let t = startMs;
  for (let i = 0; i < text.length; i++) {
    if (i > 0) t += text[i - 1] === '.' ? dotMs : charMs;
    steps.push({ t, upTo: i + 1 });
  }
  return steps;
}

/** 905 detik -> "15:05" (hitung mundur loket PIN). */
export function formatMmSs(totalSec: number): string {
  const s = Math.max(0, Math.ceil(Number.isFinite(totalSec) ? totalSec : 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/** Label pendek hadiah: "600K", "100K", "ZONK" (dok, chip, kalimat {LAND}). */
export function prizeShort(kind: PrizeKind): '600K' | '100K' | 'ZONK' {
  return kind === 'steam_600k' ? '600K' : kind === 'steam_100k' ? '100K' : 'ZONK';
}

'use server';

import { getDb } from '@/lib/db/client';
import { unlock, viewerState } from '@/lib/gacha/access';
import { TOTAL_SPINS, type RevealResult, type SpinResult, type UnlockResult } from '@/lib/gacha/config';
import { getState, markRevealed, spin } from '@/lib/gacha/service';

// Server action halaman hadiah. Setiap action memeriksa akses lagi (cookie PIN):
// action bisa dipanggil langsung tanpa lewat halaman. Hasil putaran dan kode
// voucher hanya keluar dari spinAction, setelah putarannya tercatat.

export async function unlockAction(pin: string): Promise<UnlockResult> {
  if (typeof pin !== 'string' || pin.length > 32) return { ok: false, error: 'PIN-nya 6 angka ya.' };
  const db = getDb();
  const result = await unlock(db, pin);
  if (!result.ok) {
    return result.notReady
      ? { ok: false, error: result.error, state: { status: 'not_ready' } }
      : { ok: false, error: result.error, retryAfterSec: result.retryAfterSec };
  }
  return { ok: true, state: getState(db) };
}

export async function spinAction(): Promise<SpinResult> {
  const db = getDb();
  const state = await viewerState(db);
  if (state.status === 'not_ready') return { ok: false, error: 'Hadiahnya lagi disiapin. Coba lagi nanti ya.', state };
  if (state.status === 'locked') return { ok: false, error: 'Masukin PIN dulu ya.', state };

  const outcome = spin(db);
  if (outcome.status === 'spun') return { ok: true, result: outcome.reveal, replay: outcome.replay };
  if (outcome.status === 'done') return { ok: false, error: 'Jatah putarannya udah abis, Jo.', state: getState(db) };
  return { ok: false, error: 'Hadiahnya lagi disiapin. Coba lagi nanti ya.', state: { status: 'not_ready' } };
}

export async function revealAction(spinNo: number): Promise<RevealResult> {
  if (!Number.isInteger(spinNo) || spinNo < 1 || spinNo > TOTAL_SPINS) return { ok: false, error: 'Putaran tidak dikenal.' };
  const db = getDb();
  const state = await viewerState(db);
  if (state.status !== 'open') return { ok: false, error: state.status === 'locked' ? 'Masukin PIN dulu ya.' : 'Hadiahnya lagi disiapin.', state };

  if (!markRevealed(db, spinNo)) return { ok: false, error: 'Putaran ini belum diputar.', state };
  return { ok: true, state: getState(db) };
}

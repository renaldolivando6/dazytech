import type { RowStatus } from '@/lib/komisi/import';
import type { LineFilter } from '@/lib/komisi/queries';

type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'indigo';

export const ROW_STATUS: Record<RowStatus, { label: string; tone: Tone; hint: string }> = {
  new: { label: 'Baru', tone: 'green', hint: 'Belum pernah ada, akan dimasukkan.' },
  updated: { label: 'Diperbarui', tone: 'blue', hint: 'Sudah ada & belum dikomisikan; datanya berubah (mis. jadi lunas).' },
  duplicate: { label: 'Duplikat', tone: 'gray', hint: 'Sudah ada dari import sebelumnya, tidak berubah. Dilewati.' },
  locked: { label: 'Sudah dikomisikan', tone: 'indigo', hint: 'Duplikat dari baris yang sudah dihitung komisinya. Dilewati.' },
  conflict: { label: 'Konflik', tone: 'amber', hint: 'Sudah dikomisikan tapi data di file berbeda. Tidak diubah, cek manual.' },
  error: { label: 'Error', tone: 'red', hint: 'Baris tidak valid. Dilewati.' },
};

export const ROW_STATUS_ORDER: RowStatus[] = ['new', 'updated', 'duplicate', 'locked', 'conflict', 'error'];

export const LINE_STATE: Record<Exclude<LineFilter, 'all'>, { label: string; tone: Tone }> = {
  ready: { label: 'Siap dihitung', tone: 'green' },
  unpaid: { label: 'Belum lunas', tone: 'amber' },
  no_rate: { label: 'Tanpa tarif', tone: 'red' },
  done: { label: 'Dikomisikan', tone: 'indigo' },
};

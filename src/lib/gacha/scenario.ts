import 'server-only';
import type { PrizeKind, SliceId } from './config';

// Urutan hasil 7 putaran. Apa pun yang dilakukan di browser, hasilnya selalu
// ini, berurutan. Server-only: urutan ini tidak boleh sampai ke browser sebelum
// putarannya terjadi (lihat getState & spin di service.ts).
//
// `tease`: roda melambat dan sempat berhenti di potong ini, lalu merayap ke
// potong sebelahnya (`land`). Kode voucher dibagikan berurutan per nominal
// (600K pertama ke putaran 600K pertama, dst.) oleh setupCampaign.

export type ScenarioStep = {
  spinNo: number;
  prize: PrizeKind;
  land: SliceId;
  tease: SliceId | null;
  teaseLine: string | null;
  title: string;
  note: string;
};

export const SCENARIO: readonly ScenarioStep[] = [
  {
    spinNo: 1,
    prize: 'steam_100k',
    land: 's100a',
    tease: null,
    teaseLine: null,
    title: 'Steam Wallet Rp100.000',
    note: 'Pemanasan dulu. Ini beneran ya, bukan prank: kodenya asli dan bisa langsung dituker.',
  },
  {
    spinNo: 2,
    prize: 'zonk',
    land: 'zonka',
    tease: 'emas',
    teaseLine: 'DIKIT LAGI EMAS 200 GRAM...',
    title: 'Kupon cuci piring 1 tahun',
    note: 'Berlaku mulai malam ini. Diterbitkan oleh Eng.',
  },
  {
    spinNo: 3,
    prize: 'steam_100k',
    land: 's100b',
    tease: null,
    teaseLine: null,
    title: 'Steam Wallet Rp100.000',
    note: 'Lumayan buat game diskonan. Sabar, yang gede masih ada.',
  },
  {
    spinNo: 4,
    prize: 'steam_600k',
    land: 's600b',
    tease: 'zonkb',
    teaseLine: 'Yah, ZONK lagi...',
    title: 'Steam Wallet Rp600.000',
    note: 'Tadi udah keliatan ZONK, eh nyelonong ke 600K. Hoki pengantin baru emang beda.',
  },
  {
    spinNo: 5,
    prize: 'zonk',
    land: 'zonka',
    tease: 'kingkoil',
    teaseLine: 'Kasur King Koil udah di depan mata...',
    title: 'Doa restu sekampung',
    note: 'Gratis, tapi nilainya nggak kebeli.',
  },
  {
    spinNo: 6,
    prize: 'steam_100k',
    land: 's100a',
    tease: null,
    teaseLine: null,
    title: 'Steam Wallet Rp100.000',
    note: 'Satu lagi buat jajan DLC. Tinggal satu putaran, siap-siap.',
  },
  {
    spinNo: 7,
    prize: 'steam_600k',
    land: 's600a',
    tease: 'amerika',
    teaseLine: 'Tiket Amerika... eh',
    title: 'Steam Wallet Rp600.000',
    note: 'Tiket Amerika-nya belum rezeki. Yang ini paling gede, dan beneran bisa dipake.',
  },
];

export function stepOf(spinNo: number): ScenarioStep | undefined {
  return SCENARIO.find((s) => s.spinNo === spinNo);
}

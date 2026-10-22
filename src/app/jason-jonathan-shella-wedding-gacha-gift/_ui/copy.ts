import {
  COUPLE,
  FROM_NAME,
  PIN_LENGTH,
  SLICES,
  STEAM_REDEEM_URL,
  TOTAL_SPINS,
  type SliceId,
} from '@/lib/gacha/config';
import { formatRp, terbilang } from './format';

// Semua teks client halaman hadiah (DESIGN 15). Teks dari server (judul, catatan,
// kalimat tease) TIDAK di sini. Aturan: tidak ada teks yang dipilih berdasarkan
// nomor putaran; nama dari COUPLE, pengirim dari FROM_NAME, jumlah putaran dari
// TOTAL_SPINS, nominal dari formatRp. Tanpa em dash.

const JAJO = COUPLE.groom.nick;
const ENG = COUPLE.bride.nick;
// Panggilan akrab buat Jajo di kalimat.
const JO = 'Jo';
const PAIR = `${JAJO} & ${ENG}`;
const MONOGRAM = `${JAJO[0]}&${ENG[0]}`;

/** Petunjuk PIN, boleh diganti tanpa menyentuh kode lain. */
export const PIN_HINT = 'tanggal lahir, format DDMMYY';

// ---------------------------------------------------------------- 15.1 metadata

export const META = {
  title: `${PAIR} · Wedding Gacha`,
  description: `${TOTAL_SPINS} putaran hadiah nikahan buat ${PAIR}. Siapin jempol, hoki pengantin baru diuji.`,
  ogAlt: `Roda Restu, hadiah nikahan ${PAIR}`,
  ogOverline: 'EDISI PENGANTIN · 1 DARI 1',
  ogNames: PAIR,
  ogSubline: `Wedding Gacha · ${TOTAL_SPINS} putaran`,
} as const;

// ---------------------------------------------------------------- 15.2 cover

export const COVER = {
  overline: 'EDISI PENGANTIN · 1 DARI 1',
  names: PAIR,
  ctaLocked: 'Buka hadiah',
  ctaOpen: 'Mulai',
  soundHint: 'Nyalain suara biar afdol. Di iPhone, matiin mode senyap dulu.',
  footer: `Dari ${FROM_NAME} · Rahasia negara, jangan diforward ke grup keluarga.`,
  footerCompact: `Nyalain suara biar afdol · Dari ${FROM_NAME}`,
} as const;

// ---------------------------------------------------------------- 15.3 PIN

export const PIN = {
  title: `Masukin PIN dulu, ${JO}`,
  body: 'Biar yang buka beneran lu.',
  hint: `Petunjuk: ${PIN_HINT}.`,
  label: `PIN ${PIN_LENGTH} angka`,
  cta: 'Buka',
  close: 'Tutup',
  checking: 'Bentar, gw cek...',
  stampWrong: 'TIDAK SAH',
  wrong: 'PIN-nya nggak cocok. Coba inget-inget lagi.',
  stampLock: 'LOKET TUTUP',
  lockout: `Kebanyakan salah, loketnya tutup dulu. Tanya ${ENG} aja, biasanya dia lebih inget.`,
  lockoutCapsule: (mmss: string) => `Buka lagi dalam ${mmss}`,
  lockoutSr: (minutes: number) => `PIN dikunci sementara. Coba lagi dalam ${minutes} menit.`,
  lockoutEnd: 'Loket udah buka lagi. Pelan-pelan ya.',
  stampOk: 'SAH',
  success: 'Masuk. Selamat datang, pengantin baru.',
  network: 'Sinyalnya lagi ngambek. Coba lagi ya.',
  sessionExpired: 'Sesi lu abis. Masukin PIN lagi ya.',
} as const;

// ---------------------------------------------------------------- 15.4 stage

export const STAGE = {
  srTitle: `Roda hadiah ${PAIR}`,
  wheelLabel: `Roda ${SLICES.length} potong: ${SLICES.map((s) => s.label).join(', ')}.`,
  soundOff: 'Matiin suara',
  soundOn: 'Nyalain suara',
  hapticsOff: 'Matiin getar',
  hapticsOn: 'Nyalain getar',
  skip: 'Skip',
  hubLabel: 'sisa',
  /** Keterangan warna roda, cuma untuk pembaca layar (legend di layar sudah dihapus). */
  legendAll: 'Biru & emas: Steam beneran · Mutiara: hadiah lain · Hitam: ZONK',
  cta: 'Putar',
  ctaLast: 'Putar terakhir',
  ctaBusy: 'Lagi muter...',
  ctaPending: 'Lanjutin putaran',
  launch: 'Muter...',
  replayPrefix: 'Diputer ulang ya, hasilnya sama kayak tadi.',
  waiting: 'Sinyal lagi seret, rodanya nungguin...',
  slow: 'Pelan... pelan...',
  spinError: 'Putarannya gagal nyambung. Tenang, jatah lu aman. Coba lagi.',
  offline: `Kayaknya lagi offline. Sambungin internet dulu, ${JO}.`,
  skipToasts: ['Nggak bisa di-skip. Nikmatin aja.', 'Resepsi aja nggak bisa di-skip, apalagi ini.', `Masih nyoba? Sabar, ${JO}.`],
  dockTitle: 'Kantong hadiah',
  hardPity: 'HARD PITY?',
  dockAria: (filled: number) => `Buka kantong hadiah, ${filled} dari ${TOTAL_SPINS} terisi`,
  dockSlot: (n: number, what: string) => `Putaran ${n}: ${what}`,
  dockSlotStatus: {
    steam_100k: '100K',
    steam_600k: '600K',
    zonk: 'ZONK',
    empty: 'belum diputar',
    pending: 'belum ditonton',
    flight: 'lagi muter',
  },
  /** Panel kanan desktop (wireframe 4.4): "SISA PUTARAN" + "5 dari 7". */
  remainingTitle: 'Sisa putaran',
  remainingOf: (n: number) => `${n} dari ${TOTAL_SPINS}`,
  pendingTitle: 'Putaran tadi belum kelar',
  pendingBody: 'Rodanya belum sempat berhenti waktu lu cabut. Hasilnya tetap yang tadi, jatah lu nggak berkurang.',
  /** Pengumuman pembaca layar saat roda mulai berputar. */
  announceSpin: 'Roda muter.',
} as const;

/** Kalimat status saat diam (DESIGN 15.4), dipilih oleh reactions.idleLine. */
export const IDLE_LINES = {
  // Sengaja kosong: sebelum putaran pertama tidak ada kalimat status.
  first: '',
  after100: (n: number) => `Masuk kantong. Sisa ${n} putaran, gas.`,
  after600: (n: number) => `${ENG} langsung ngelirik dompet Steam lu. Sisa ${n} putaran.`,
  afterZonk: (n: number) => `Sabar. Hadiah hiburan juga hadiah. Sisa ${n} putaran.`,
  twoLeft: `Dua lagi. ${ENG} boleh gantian mencet.`,
  lastOne: 'Terakhir. Kalau mau berdoa, sekarang waktunya.',
} as const;

/** Kalimat status saat roda merayap dari potong tease (DESIGN 15.4). */
export const CREEP_LINES = {
  lebayBack: 'Lho... lho... kok mundur?',
  lebayForward: 'Eh... eh... geser...',
  zonkTease: 'EH? EH? EH?',
  // Finale sengaja kosong: diamnya itu lucunya.
  finale: '',
} as const;

/** Kalimat status saat roda berhenti (DESIGN 15.4). {LAND} = "600K" / "100K". */
export const LAND_LINES = {
  plain100: 'Steam 100K. Beneran masuk.',
  plain600: '600K!! Langsung, tanpa drama.',
  plainZonk: 'ZONK. Ya udah.',
  lebayZonkBack: (tease: string) => `${tease} ditarik lagi. ZONK.`,
  lebayZonkForward: (tease: string) => `${tease} kabur. ZONK.`,
  zonkVoucherBack: (land: string) => `EH, MUNDUR! MUNDUR KE ${land}!`,
  zonkVoucherForward: (land: string) => `EH, GESER! GESER KE ${land}!`,
  lebayVoucher: (land: string) => `NYELONONG KE ${land}!`,
  voucherZonk: 'Dikit lagi... ZONK.',
  voucherVoucher: (land: string) => `Geser dikit, tetep ${land}!`,
} as const;

/** S&K per potong roda, tampil saat potong roda di-tap. */
export const FINE_PRINT: Record<SliceId, string> = {
  s600a: 'Steam Wallet Rp600.000. Asli, ada kodenya.',
  s600b: 'Steam Wallet Rp600.000. Asli, ada kodenya.',
  s100a: 'Steam Wallet Rp100.000. Asli juga, sumpah.',
  s100b: 'Steam Wallet Rp100.000. Asli juga, sumpah.',
  amerika: 'Tiket ke Amerika. Kelas imajinasi, bagasi harapan.',
  emas: 'Emas 200 gram. Kadarnya 24 karat khayalan.',
  kingkoil: 'Kasur King Koil. Empuknya cuma bisa dibayangin.',
  maldives: 'Honeymoon Maldives. Sunset termasuk, tiket nggak.',
  pik: 'Rumah di PIK. Cicilan ditanggung pemenang.',
  lambo: 'Lamborghini. Ada kok, di wallpaper HP.',
  zonka: 'ZONK. Nilainya nol, kenangannya awet.',
  zonkb: 'ZONK. Nilainya nol, kenangannya awet.',
};

// ---------------------------------------------------------------- 15.5 reveal

export const REVEAL = {
  overlineRare: (n: number) => `BENERAN · PUTARAN ${n}/${TOTAL_SPINS}`,
  overlineLegendary: (n: number) => `LEGENDARIS · PUTARAN ${n}/${TOTAL_SPINS}`,
  overlineLastLegendary: 'PUTARAN TERAKHIR · LEGENDARIS',
  overlineZonk: (n: number) => `ZONK · PUTARAN ${n}/${TOTAL_SPINS}`,
  chipReplay: 'REPLAY',
  chipNearMiss: (tease: string) => `Nyaris: ${tease}`,
  chipUpgrade: (land: string) => `UPGRADE! ZONK jadi ${land}`,
  chipHardPity: 'HARD PITY TERPENUHI',
  amountSub: 'Steam Wallet',
  cardOverline: 'STEAM WALLET',
  cardMonogram: MONOGRAM,
  cardFooter: (n: number) => `Putaran ${n}/${TOTAL_SPINS} · Edisi 1/1`,
  cardBack: `${MONOGRAM} · Edisi 1/1`,
  codeLabel: 'Kode voucher',
  copy: 'Salin',
  copied: 'Kesalin',
  copyAria: (nominal: string) => `Salin kode ${nominal}`,
  copiedLive: 'Kode kesalin.',
  copyFail: 'Tahan kodenya, terus pilih Salin ya.',
  redeem: 'Tukerin di Steam',
  redeemHelp: 'Login Steam, tempel kodenya, saldo langsung masuk.',
  ctaVoucher: 'Masukin kantong',
  ctaZonk: 'Terima nasib',
  ctaLast: 'Lihat semua hadiah',
  ticketMeta: `Nilai tukar: ${formatRp(0)} · Kode: nggak perlu`,
  zonkFoot: 'Masuk kantong sebagai bonus non-tunai.',
  stamp: 'SAH',
  stampArc: 'ZONK RESMI',
  announceVoucher: (n: number, title: string) => `Putaran ${n}: ${title}. Kodenya ada di layar, ada tombol salin.`,
  announceZonk: (n: number, title: string, note: string) => `Putaran ${n}: ZONK. ${title}. ${note}`,
} as const;

// ---------------------------------------------------------------- 15.6 kantong, toast, achievement

export const POCKET = {
  title: 'Kantong hadiah',
  count: (k: number) => `${k} dari ${TOTAL_SPINS} kebuka`,
  total: 'Terkumpul',
  empty: 'Masih kosong. Kayak dompet abis bayar katering.',
  rowUnrevealed: (n: number) => `Putaran ${n} · belum diputar`,
  rowPending: (n: number) => `Putaran ${n} · belum ditonton`,
  rowZonkMeta: 'Bonus non-tunai',
  rowMeta: (n: number) => `putaran ${n}`,
  close: 'Tutup',
} as const;

export type AchievementId = 'firstZonk' | 'upgrade' | 'denial';

export const ACHIEVEMENT_OVERLINE = 'ACHIEVEMENT TERBUKA';

export const ACHIEVEMENTS = {
  firstZonk: { name: 'ZONK Pertama', desc: 'Semua gamer pernah. Selamat, lu resmi gamer.' },
  upgrade: { name: 'Bintang Berubah Emas', desc: (land: string) => `ZONK jadi ${land}. Langka, kayak nemu ${ENG}.` },
  denial: { name: 'Nggak Terima Kenyataan', desc: `Mencet Putar lagi lima kali. Udah, ${JO}.` },
} as const;

// ---------------------------------------------------------------- 15.7 final

export const FINAL = {
  overline: `${TOTAL_SPINS} DARI ${TOTAL_SPINS} · BERES`,
  title: 'GAS JAS GACHA ARCANA WKWKWKKW',
  lead: `Pada hari ini, ${TOTAL_SPINS} putaran sudah dilaksanakan dengan jujur, dan adil.`,
  totalLabel: 'Total Steam Wallet',
  /** Terbilang total, tampil kapital lewat CSS: "satu juta lima ratus ribu rupiah". */
  totalWords: (idr: number) => `${terbilang(idr)} rupiah`,
  totalSub: (vouchers: number, bonus: number) => `${vouchers} voucher + ${bonus} bonus non-tunai`,
  copyAll: 'Salin semua kode',
  copiedAll: (k: number) => `${k} kode kesalin`,
  redeem: 'Tukerin di Steam',
  letterHeader: `Buat ${PAIR}`,
  signature: FROM_NAME,
  signRow: [
    { label: 'PENERIMA', name: JAJO },
    { label: 'SAKSI', name: ENG },
    { label: 'DARI', name: FROM_NAME },
  ],
  attachments: (vouchers: number, bonus: number) =>
    `Lampiran: ${vouchers} kode Steam Wallet, ${bonus} bonus non-tunai, 1 meterai restu (${formatRp(0)}).`,
  vouchers: 'VOUCHER',
  bonus: 'BONUS NON-TUNAI',
  again: 'Putar lagi',
  refusals: [
    `Udah abis, ${JO}.`,
    'Beneran abis. Gw udah cek dua kali.',
    'Top up? Nggak ada menu top up di sini.',
    `${ENG}, tolong pegangin tangannya.`,
    'Gacha-nya udah kelar. Nikahnya yang lanjut.',
    'Banner rerun: Anniversary ke-1. Pantengin.',
  ],
  againDisabled: 'Sampai ketemu di anniversary',
  footnote1: 'Halaman ini bisa dibuka lagi kapan aja pakai PIN yang sama. Kodenya tetap di sini.',
  footnote2: 'Kodenya jangan dipamerin di story ya.',
  copyAllHeader: `Hadiah nikahan ${PAIR} (Steam Wallet)`,
  copyAllRedeem: `Tukerin di: ${STEAM_REDEEM_URL}`,
} as const;

// ---------------------------------------------------------------- 15.8 not ready, umum

export const NOT_READY = {
  overline: 'SEBENTAR',
  title: 'Hadiahnya lagi dibungkus',
  body: `${FROM_NAME} masih ngiket pitanya. Buka lagi nanti ya, ${JO}.`,
  compensation: 'Kompensasi: doa restu, dikirim duluan.',
  cta: 'Cek lagi',
} as const;

export const GENERIC_ERROR = 'Ada yang error. Coba lagi bentar ya.';

// ---------------------------------------------------------------- 9.3 caption suara

export type CaptionKey =
  | 'whoosh'
  | 'ticks'
  | 'sparkle'
  | 'pad'
  | 'heartbeat'
  | 'creak'
  | 'snap'
  | 'wahwah'
  | 'scratch'
  | 'upgrade'
  | 'impact'
  | 'chime100'
  | 'fanfare600'
  | 'finale'
  | 'stamp'
  | 'nope';

export type CaptionTone = 'neutral' | 'zonk' | 'gold';

/**
 * Teks yang terlihat untuk setiap suara (tetap tampil walau suara dimatikan).
 * `continuous`: tetap tampil sampai suaranya berhenti; selain itu hilang
 * setelah 1,4 detik.
 */
export const CAPTIONS: Record<CaptionKey, { text: string; tone: CaptionTone; continuous: boolean }> = {
  whoosh: { text: '[wuuush]', tone: 'neutral', continuous: false },
  ticks: { text: '[tik... tik... tik...]', tone: 'neutral', continuous: true },
  sparkle: { text: '[bling bling]', tone: 'neutral', continuous: true },
  pad: { text: '[musik ngarep]', tone: 'neutral', continuous: true },
  heartbeat: { text: '[deg-degan]', tone: 'neutral', continuous: true },
  creak: { text: '[kriet...]', tone: 'neutral', continuous: true },
  snap: { text: '[klik]', tone: 'neutral', continuous: false },
  wahwah: { text: '[trombon sedih]', tone: 'zonk', continuous: true },
  scratch: { text: '[rekaman ngerem]', tone: 'neutral', continuous: false },
  upgrade: { text: '[TING!]', tone: 'gold', continuous: false },
  impact: { text: '[DUM]', tone: 'gold', continuous: false },
  chime100: { text: '[ting-ting]', tone: 'neutral', continuous: false },
  fanfare600: { text: '[fanfare]', tone: 'gold', continuous: false },
  finale: { text: '[fanfare, versi niat]', tone: 'gold', continuous: false },
  stamp: { text: '[jedug]', tone: 'zonk', continuous: false },
  nope: { text: '[tetot]', tone: 'zonk', continuous: false },
};

/** Berapa lama caption sekali-bunyi tampil (ms). */
export const CAPTION_HOLD_MS = 1400;

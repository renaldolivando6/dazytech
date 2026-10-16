import {
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ClipboardList,
  Coffee,
  Cookie,
  CupSoda,
  Droplets,
  Egg,
  FileText,
  Handshake,
  LayoutGrid,
  Milk,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  Search,
  ShoppingBasket,
  ShoppingCart,
  Timer,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

// Ilustrasi tampilan aplikasi desktop, dibuat dengan kode (bukan gambar).
// Semua contoh memakai satu perusahaan fiktif, CV Mitra Pangan (distributor
// sembako), dan dokumen yang sama: pesanan SO-2026-0142 untuk Toko Sumber Rejeki
// terlihat di ERP, stoknya di gudang, dan toko itu sendiri memakai kasir.
// Ukuran memakai cqw (persen lebar bingkai), jadi isi ikut mengecil bersama bingkai.

export type ShowcaseKey = 'erp' | 'inventory' | 'pos' | 'crm' | 'hris';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export const T = {
  xs: 'text-[length:0.85cqw]',
  sm: 'text-[length:0.98cqw]',
  base: 'text-[length:1.12cqw]',
  md: 'text-[length:1.35cqw]',
  lg: 'text-[length:1.75cqw]',
  xl: 'text-[length:2.1cqw]',
};
export const ICON = 'size-[1.25cqw] shrink-0';
export const card = 'rounded-[1cqw] border border-black/[0.07] bg-white';

// ---------------------------------------------------------------- kerangka

// `aspect`: tinggi bingkai disesuaikan isinya, supaya tidak ada ruang kosong besar.
export function AppFrame({ url, label, aspect = 'aspect-[16/10]', children }: { url: string; label: string; aspect?: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="@container w-full">
      <div
        className={cx(
          'flex select-none flex-col overflow-hidden rounded-[1.4cqw] bg-white leading-[1.35] tracking-[-0.01em] text-ink',
          aspect,
          'shadow-[3px_5px_30px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.06]',
          T.base,
        )}
      >
        <div className="flex h-[3.2cqw] shrink-0 items-center gap-[0.7cqw] border-b border-black/[0.06] bg-[#f6f6f8] px-[1.4cqw]">
          <span className="size-[0.95cqw] rounded-full bg-[#ff5f57]" />
          <span className="size-[0.95cqw] rounded-full bg-[#febc2e]" />
          <span className="size-[0.95cqw] rounded-full bg-[#28c840]" />
          <span className={cx('mx-auto flex h-[1.9cqw] w-[34%] items-center justify-center rounded-[0.6cqw] bg-black/[0.05] text-muted', T.xs)}>
            {url}
          </span>
          <span className="w-[3.7cqw]" />
        </div>
        <div className="flex min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function Sidebar({ items, active }: { items: [string, LucideIcon][]; active: number }) {
  return (
    <div className="flex w-[14cqw] shrink-0 flex-col gap-[0.25cqw] border-r border-black/[0.06] bg-pearl p-[1.2cqw]">
      <div className="mb-[1.2cqw] flex items-center gap-[0.7cqw]">
        <span className={cx('grid size-[2.2cqw] shrink-0 place-items-center rounded-[0.6cqw] bg-[#1f6f43] font-semibold text-white', T.sm)}>M</span>
        <span className={cx('truncate font-semibold', T.sm)}>CV Mitra Pangan</span>
      </div>
      {items.map(([label, Icon], i) => (
        <span
          key={label}
          className={cx(
            'flex items-center gap-[0.7cqw] rounded-[0.6cqw] px-[0.8cqw] py-[0.6cqw]',
            T.sm,
            i === active ? 'bg-black/[0.06] font-semibold text-ink' : 'text-muted',
          )}
        >
          <Icon className={ICON} strokeWidth={1.8} />
          <span className="truncate">{label}</span>
        </span>
      ))}
    </div>
  );
}

export const ERP_MENU: [string, LucideIcon][] = [
  ['Dasbor', LayoutGrid],
  ['Penjualan', ShoppingCart],
  ['Gudang', Warehouse],
  ['Pengiriman', Truck],
  ['Keuangan', Wallet],
  ['Laporan', BarChart3],
];

export function Header({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[1cqw]">
      <div className="min-w-0">
        <p className={cx('font-semibold tracking-[-0.02em]', T.lg)}>{title}</p>
        {sub && <p className={cx('text-muted', T.sm)}>{sub}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-[0.7cqw]">{children}</div>}
    </div>
  );
}

export function Btn({ children, full, quiet }: { children: ReactNode; full?: boolean; quiet?: boolean }) {
  return (
    <span
      className={cx(
        'rounded-full px-[1.3cqw] py-[0.65cqw] text-center font-medium',
        T.sm,
        quiet ? 'border border-accent text-accent' : 'bg-accent text-white',
        full && 'block',
      )}
    >
      {children}
    </span>
  );
}

export function SearchBox({ children, width = 'w-[15cqw]' }: { children: string; width?: string }) {
  return (
    <span className={cx('flex items-center gap-[0.6cqw] rounded-full border border-black/[0.1] bg-white px-[1.1cqw] py-[0.55cqw] text-faint', width, T.sm)}>
      <Search className={ICON} strokeWidth={1.8} />
      {children}
    </span>
  );
}

function Chip({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cx(
        'flex items-center gap-[0.5cqw] whitespace-nowrap rounded-full px-[1.1cqw] py-[0.55cqw]',
        T.sm,
        active ? 'bg-ink text-white' : 'border border-black/[0.1] text-ink-80',
      )}
    >
      {children}
    </span>
  );
}

export type Tone = 'green' | 'orange' | 'red' | 'gray' | 'blue';
const dotTone: Record<Tone, string> = {
  green: 'bg-status-green',
  orange: 'bg-status-orange',
  red: 'bg-status-red',
  gray: 'bg-status-gray',
  blue: 'bg-accent',
};

export function Dot({ tone }: { tone: Tone }) {
  return <span className={cx('inline-block size-[0.7cqw] shrink-0 rounded-full', dotTone[tone])} />;
}

export function Status({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-[0.5cqw] whitespace-nowrap text-ink-80', T.sm)}>
      <Dot tone={tone} />
      {children}
    </span>
  );
}

function Avatar({ initials, tone = 0 }: { initials: string; tone?: number }) {
  const bg = ['bg-[#e8eefc] text-[#1f4fb8]', 'bg-[#f2ebe4] text-[#7a4b22]', 'bg-[#e6f4ea] text-[#1c6e33]', 'bg-[#f1e8f7] text-[#6b2f8f]'][tone % 4];
  return <span className={cx('grid size-[2.2cqw] shrink-0 place-items-center rounded-full font-semibold', T.xs, bg)}>{initials}</span>;
}

function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <p className={cx('font-semibold', T.base)}>{children}</p>
      {right && <span className={cx('text-muted', T.xs)}>{right}</span>}
    </div>
  );
}

// ---------------------------------------------------------------- stok & gudang

function InventoryMockup() {
  const rows: [string, string, string, string, string, Tone, boolean?][] = [
    ['Beras Premium 5 kg', 'BRS-001', '1.240', '40', '1.200 sak', 'green'],
    ['Minyak Goreng 2 L', 'MYK-014', '146', '60', '86 dus', 'orange', true],
    ['Gula Pasir 1 kg', 'GLA-007', '2.310', '180', '2.130 pak', 'green'],
    ['Tepung Terigu 1 kg', 'TPG-022', '0', '0', '0 pak', 'red'],
    ['Kecap Manis 600 ml', 'KCP-003', '412', '24', '388 btl', 'green'],
    ['Susu UHT 1 L', 'SSU-011', '54', '0', '54 dus', 'orange'],
  ];
  const moves: [string, string, string, boolean][] = [
    ['16 Okt 10.05', 'Alokasi SO-2026-0142', '−60', true],
    ['15 Okt 14.20', 'Terima PO-2026-0077', '+120', false],
    ['14 Okt 09.30', 'Kirim DO-0381 · Toko Makmur', '−45', false],
    ['12 Okt 16.10', 'Transfer ke Gudang Bekasi', '−30', false],
  ];
  return (
    <AppFrame url="gudang.namausaha.id" aspect="aspect-[2/1]" label="Contoh tampilan aplikasi gudang: stok fisik, dialokasikan, dan tersedia per barang">
      <Sidebar
        active={1}
        items={[
          ['Ringkasan', LayoutGrid],
          ['Barang', Boxes],
          ['Gudang', Warehouse],
          ['Barang masuk', PackagePlus],
          ['Barang keluar', PackageMinus],
          ['Stok opname', PackageCheck],
        ]}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[1.3cqw] p-[1.8cqw]">
        <Header title="Stok barang" sub="Gudang Cikarang · diperbarui 2 menit lalu">
          <SearchBox>Cari SKU atau nama…</SearchBox>
          <Chip>Gudang: Cikarang</Chip>
        </Header>
        <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr] gap-[1cqw]">
          <div className={cx(card, 'min-h-0 overflow-hidden')}>
            <div className={cx('grid grid-cols-[1.7fr_0.7fr_0.7fr_0.9fr] border-b border-black/[0.06] bg-pearl px-[1.2cqw] py-[0.7cqw] text-muted', T.xs)}>
              <span>Barang</span>
              <span className="text-right">Fisik</span>
              <span className="text-right">Alokasi</span>
              <span className="text-right">Tersedia</span>
            </div>
            {rows.map(([name, sku, fisik, alok, avail, tone, selected]) => (
              <div
                key={sku}
                className={cx(
                  'grid grid-cols-[1.7fr_0.7fr_0.7fr_0.9fr] items-center border-b border-divider px-[1.2cqw] py-[0.7cqw] last:border-b-0',
                  T.sm,
                  selected && 'bg-accent/[0.05]',
                )}
              >
                <span className="min-w-0">
                  <span className={cx('block truncate', selected && 'font-semibold')}>{name}</span>
                  <span className={cx('block text-faint', T.xs)}>{sku}</span>
                </span>
                <span className="text-right tabular-nums text-ink-80">{fisik}</span>
                <span className="text-right tabular-nums text-muted">{alok}</span>
                <span className="flex items-center justify-end gap-[0.5cqw] tabular-nums">
                  <Dot tone={tone} />
                  {avail}
                </span>
              </div>
            ))}
          </div>
          <div className={cx(card, 'flex min-h-0 flex-col gap-[1cqw] p-[1.3cqw]')}>
            <div>
              <p className={cx('font-semibold tracking-[-0.02em]', T.md)}>Minyak Goreng 2 L</p>
              <p className={cx('text-muted', T.xs)}>MYK-014 · Gudang Cikarang · satuan dus (6 botol)</p>
            </div>
            <div className="grid grid-cols-3 gap-[0.6cqw]">
              {[
                ['Stok fisik', '146'],
                ['Dialokasikan', '60'],
                ['Tersedia', '86'],
              ].map(([k, v], i) => (
                <div key={k} className={cx('rounded-[0.7cqw] px-[0.9cqw] py-[0.7cqw]', i === 2 ? 'bg-accent/10' : 'bg-parchment')}>
                  <p className={cx('text-muted', T.xs)}>{k}</p>
                  <p className={cx('font-semibold tabular-nums tracking-[-0.02em]', T.lg, i === 2 && 'text-accent')}>{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-[0.8cqw] rounded-[0.7cqw] bg-[#fff8eb] px-[1cqw] py-[0.7cqw]">
              <span className={cx('text-[#7a4f00]', T.xs)}>Di bawah minimum 140 dus · saran beli 54 dus</span>
              <Btn>Buat PO</Btn>
            </div>
            <div className="min-h-0">
              <p className={cx('mb-[0.3cqw] text-muted', T.xs)}>Mutasi terakhir</p>
              {moves.map(([time, label, qty, reserve]) => (
                <div key={time} className={cx('flex items-center gap-[0.8cqw] border-b border-divider py-[0.55cqw] last:border-b-0', T.xs)}>
                  <span className="w-[7.5cqw] shrink-0 tabular-nums text-muted">{time}</span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <span className={cx('tabular-nums font-semibold', qty.startsWith('+') ? 'text-[#248a3d]' : reserve ? 'text-muted' : 'text-ink')}>
                    {qty}
                    {reserve && ' (alokasi)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

// ---------------------------------------------------------------- kasir (pelanggan CV Mitra Pangan)

function PosMockup() {
  const menu: [string, string, LucideIcon][] = [
    ['Beras Premium 5 kg', '72.000', Wheat],
    ['Minyak Goreng 2 L', '38.000', Droplets],
    ['Gula Pasir 1 kg', '18.500', Package],
    ['Telur Ayam 1 kg', '29.000', Egg],
    ['Susu UHT 1 L', '19.500', Milk],
    ['Air Mineral 1,5 L', '6.000', CupSoda],
    ['Kopi Sachet (10)', '15.000', Coffee],
    ['Biskuit Kaleng', '45.000', Cookie],
    ['Tepung Terigu 1 kg', '13.000', Wheat],
    ['Kecap Manis 600 ml', '24.000', Droplets],
    ['Mie Instan (5)', '17.500', ShoppingBasket],
    ['Teh Celup (25)', '7.000', Coffee],
  ];
  const cart: [string, string, string][] = [
    ['2×', 'Minyak Goreng 2 L', '76.000'],
    ['1×', 'Beras Premium 5 kg', '72.000'],
    ['1×', 'Gula Pasir 1 kg', '18.500'],
  ];
  const stock: [string, string][] = [
    ['Minyak Goreng 2 L', '24 → 22'],
    ['Beras Premium 5 kg', '15 → 14'],
    ['Gula Pasir 1 kg', '40 → 39'],
  ];
  return (
    <AppFrame url="kasir.namausaha.id" label="Contoh tampilan aplikasi kasir: transaksi tersimpan dan stok toko langsung berkurang">
      <div className="flex min-w-0 flex-1 flex-col gap-[1.2cqw] bg-parchment/60 p-[1.8cqw]">
        <div className="flex items-center gap-[0.7cqw]">
          <SearchBox width="w-[14cqw]">Cari barang…</SearchBox>
          <Chip active>Semua</Chip>
          <Chip>Sembako</Chip>
          <Chip>Minuman</Chip>
          <Chip>Bumbu</Chip>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-3 gap-[0.9cqw]">
          {menu.map(([name, price, Icon], i) => (
            <div key={name} className={cx(card, 'flex flex-col gap-[0.4cqw] p-[0.9cqw]', i === 1 && 'ring-2 ring-accent')}>
              <div className="grid min-h-0 flex-1 place-items-center rounded-[0.7cqw] bg-parchment text-faint">
                <Icon className="size-[2.2cqw]" strokeWidth={1.5} />
              </div>
              <p className={cx('truncate font-semibold', T.xs)}>{name}</p>
              <p className={cx('tabular-nums text-muted', T.xs)}>Rp{price}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-[25cqw] shrink-0 flex-col gap-[0.9cqw] border-l border-black/[0.06] bg-white p-[1.6cqw]">
        <div>
          <p className={cx('font-semibold tracking-[-0.02em]', T.md)}>Toko Sumber Rejeki</p>
          <p className={cx('text-muted', T.xs)}>Transaksi #TS-2041 · Kasir: Ayu</p>
        </div>
        <div className="space-y-[0.7cqw] border-y border-black/[0.06] py-[0.9cqw]">
          {cart.map(([qty, name, price]) => (
            <div key={name} className={cx('flex gap-[0.6cqw]', T.sm)}>
              <span className="text-muted">{qty}</span>
              <span className="min-w-0 flex-1 truncate">{name}</span>
              <span className="tabular-nums">{price}</span>
            </div>
          ))}
        </div>
        <div className="flex items-baseline justify-between">
          <span className={T.sm}>Total · QRIS</span>
          <span className={cx('font-semibold tabular-nums tracking-[-0.03em]', T.xl)}>Rp166.500</span>
        </div>
        <div className="rounded-[0.8cqw] bg-[#f0faf2] p-[1cqw]">
          <p className={cx('flex items-center gap-[0.5cqw] font-semibold text-[#1c6e33]', T.sm)}>
            <Check className="size-[1.2cqw]" strokeWidth={3} />
            Tersimpan · stok diperbarui
          </p>
          <div className="mt-[0.5cqw] space-y-[0.3cqw]">
            {stock.map(([name, change]) => (
              <div key={name} className={cx('flex justify-between text-[#1c6e33]/80', T.xs)}>
                <span className="truncate">{name}</span>
                <span className="tabular-nums">{change}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <Btn full>Transaksi baru</Btn>
        </div>
      </div>
    </AppFrame>
  );
}

// ---------------------------------------------------------------- CRM (tim sales CV Mitra Pangan)

function CrmMockup() {
  const columns: { name: string; total: string; cards: [string, string, string, number, [Tone, string]?, boolean?][] }[] = [
    {
      name: 'Prospek baru',
      total: 'Rp183 jt',
      cards: [
        ['Toko Barokah', 'Rp45 jt', 'RA', 0],
        ['Minimarket Cahaya', 'Rp120 jt', 'DS', 1],
        ['Warung Bu Siti', 'Rp18 jt', 'RA', 0],
      ],
    },
    {
      name: 'Dihubungi',
      total: 'Rp305 jt',
      cards: [
        ['Koperasi Sentosa', 'Rp210 jt', 'MF', 2, ['orange', 'Follow-up hari ini']],
        ['Toko Bintang', 'Rp95 jt', 'DS', 1],
      ],
    },
    {
      name: 'Penawaran',
      total: 'Rp335 jt',
      cards: [
        ['Minimarket Sejahtera', 'Rp260 jt', 'RA', 0, ['orange', 'Telepon 14.00'], true],
        ['Toko Sinar Abadi', 'Rp75 jt', 'MF', 2],
      ],
    },
  ];
  const history: [string, string][] = [
    ['14 Okt', 'Penawaran v2 dikirim, diskon grosir 3%'],
    ['10 Okt', 'Kunjungan ke toko, bertemu pemilik'],
    ['7 Okt', 'Prospek dari referensi Toko Sumber Rejeki'],
  ];
  return (
    <AppFrame url="crm.namausaha.id" aspect="aspect-[2/1]" label="Contoh tampilan CRM: pipeline prospek dan tindakan follow-up berikutnya">
      <Sidebar
        active={1}
        items={[
          ['Dasbor', LayoutGrid],
          ['Prospek', Handshake],
          ['Pelanggan', Users],
          ['Penawaran', FileText],
          ['Aktivitas', ClipboardList],
          ['Laporan', BarChart3],
        ]}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[1.3cqw] p-[1.8cqw]">
        <Header title="Pipeline penjualan" sub="Rp823 jt prospek aktif · win rate 90 hari: 34%">
          <Chip>Semua sales</Chip>
          <Btn>+ Prospek</Btn>
        </Header>
        <div className="grid min-h-0 flex-1 grid-cols-[1.55fr_1fr] gap-[1cqw]">
          <div className="grid min-h-0 grid-cols-3 gap-[0.8cqw]">
            {columns.map((col) => (
              <div key={col.name} className="flex min-h-0 flex-col gap-[0.7cqw] rounded-[1cqw] bg-parchment p-[0.8cqw]">
                <div className={cx('flex items-baseline justify-between px-[0.3cqw]', T.xs)}>
                  <span className="font-semibold">
                    {col.name} <span className="font-normal text-muted">{col.cards.length}</span>
                  </span>
                  <span className="tabular-nums text-muted">{col.total}</span>
                </div>
                {col.cards.map(([name, value, owner, tone, tag, selected]) => (
                  <div key={name} className={cx(card, 'space-y-[0.5cqw] p-[0.9cqw]', selected && 'ring-2 ring-accent')}>
                    <p className={cx('truncate font-semibold', T.xs)}>{name}</p>
                    <p className={cx('tabular-nums text-muted', T.xs)}>{value}</p>
                    <div className="flex items-center justify-between gap-[0.4cqw]">
                      {tag ? <Status tone={tag[0]}>{tag[1]}</Status> : <span />}
                      <Avatar initials={owner} tone={tone} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className={cx(card, 'flex min-h-0 flex-col gap-[1cqw] p-[1.3cqw]')}>
            <div className="flex items-start justify-between">
              <div>
                <p className={cx('font-semibold tracking-[-0.02em]', T.md)}>Minimarket Sejahtera</p>
                <p className={cx('text-muted', T.xs)}>Tahap penawaran · sales: Rina A.</p>
              </div>
              <span className={cx('font-semibold tabular-nums', T.sm)}>Rp260 jt</span>
            </div>
            <div className="rounded-[0.8cqw] bg-accent/[0.07] p-[1cqw] ring-1 ring-accent/30">
              <p className={cx('font-semibold text-accent', T.xs)}>Tindakan berikutnya · hari ini 14.00</p>
              <p className={cx('mt-[0.3cqw]', T.sm)}>Telepon pemilik, tanyakan keputusan harga grosir.</p>
            </div>
            <div>
              <p className={cx('mb-[0.3cqw] text-muted', T.xs)}>Riwayat</p>
              {history.map(([date, text]) => (
                <div key={date} className={cx('flex gap-[0.8cqw] border-b border-divider py-[0.6cqw] last:border-b-0', T.xs)}>
                  <span className="w-[4cqw] shrink-0 tabular-nums text-muted">{date}</span>
                  <span className="min-w-0 flex-1">{text}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto flex gap-[0.6cqw]">
              <Btn>Catat aktivitas</Btn>
              <Btn quiet>Buat pesanan</Btn>
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

// ---------------------------------------------------------------- HRIS & payroll (karyawan CV Mitra Pangan)

function HrisMockup() {
  const requests: [string, string, string, string, Tone, string][] = [
    ['DS', 'Dimas Saputra', 'Gudang · 14 Okt 17.00–19.00', '2 jam', 'green', 'Disetujui'],
    ['DS', 'Dimas Saputra', 'Gudang · 15 Okt 17.00–19.00', '2 jam', 'green', 'Disetujui'],
    ['DS', 'Dimas Saputra', 'Gudang · 16 Okt 17.00–19.00', '2 jam', 'green', 'Disetujui'],
    ['AP', 'Andi Pratama', 'Pengiriman · 16 Okt 18.00–20.00', '2 jam', 'orange', 'Menunggu'],
    ['ML', 'Maya Lestari', 'Admin · 13 Okt 17.00–18.00', '1 jam', 'gray', 'Ditolak'],
  ];
  const slip: [string, string, boolean?][] = [
    ['Gaji pokok', 'Rp5.200.000'],
    ['Lembur 6 jam (3 hari)', 'Rp315.600', true],
    ['BPJS Kesehatan 1%', '−Rp52.000'],
    ['BPJS JHT 2%', '−Rp104.000'],
    ['BPJS JP 1%', '−Rp52.000'],
    ['PPh 21 (TER)', '−Rp28.800'],
  ];
  return (
    <AppFrame url="hr.namausaha.id" aspect="aspect-[16/8.6]" label="Contoh tampilan HRIS: lembur yang disetujui masuk ke slip gaji">
      <Sidebar
        active={3}
        items={[
          ['Dasbor', LayoutGrid],
          ['Absensi', Timer],
          ['Cuti & izin', CalendarDays],
          ['Lembur', ClipboardList],
          ['Karyawan', Users],
          ['Payroll', Wallet],
        ]}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[1.3cqw] p-[1.8cqw]">
        <Header title="Lembur & payroll" sub="Periode 1–31 Oktober 2026">
          <Chip>Semua divisi</Chip>
        </Header>
        <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_1fr] gap-[1cqw]">
          <div className={cx(card, 'flex min-h-0 flex-col p-[1.3cqw]')}>
            <CardTitle right="1 menunggu persetujuan">Pengajuan lembur</CardTitle>
            <div className="mt-[0.5cqw] flex flex-col">
              {requests.map(([ini, name, detail, hours, tone, status], i) => (
                <div key={i} className="flex items-center gap-[0.9cqw] border-b border-divider py-[0.75cqw] last:border-b-0">
                  <Avatar initials={ini} tone={i < 3 ? 1 : i} />
                  <div className="min-w-0 flex-1">
                    <p className={cx('truncate font-semibold', T.sm)}>{name}</p>
                    <p className={cx('truncate text-muted', T.xs)}>{detail}</p>
                  </div>
                  <span className={cx('tabular-nums text-ink-80', T.sm)}>{hours}</span>
                  <span className="w-[7.5cqw] text-right">
                    <Status tone={tone}>{status}</Status>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={cx(card, 'flex min-h-0 flex-col gap-[0.9cqw] p-[1.3cqw]')}>
            <div>
              <p className={cx('font-semibold tracking-[-0.02em]', T.md)}>Slip gaji Oktober</p>
              <p className={cx('text-muted', T.xs)}>Dimas Saputra · Staf gudang</p>
            </div>
            <div>
              {slip.map(([label, value, highlight]) => (
                <div
                  key={label}
                  className={cx(
                    'flex items-center justify-between border-b border-divider py-[0.55cqw]',
                    T.sm,
                    highlight && '-mx-[0.6cqw] rounded-[0.6cqw] border-transparent bg-accent/[0.07] px-[0.6cqw]',
                  )}
                >
                  <span className={highlight ? 'font-semibold text-accent' : 'text-ink-80'}>{label}</span>
                  <span className="tabular-nums">{value}</span>
                </div>
              ))}
              <p className={cx('mt-[0.3cqw] text-muted', T.xs)}>Lembur dari 3 pengajuan yang disetujui Kepala Gudang.</p>
            </div>
            <div className="mt-auto flex items-baseline justify-between border-t border-black/[0.08] pt-[0.8cqw]">
              <span className={T.sm}>Diterima</span>
              <span className={cx('font-semibold tabular-nums tracking-[-0.03em]', T.xl)}>Rp5.278.800</span>
            </div>
            <Btn full>Kirim slip</Btn>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

// ERP memakai demo interaktif (erp-demo.tsx), bukan ilustrasi statis.
export const MOCKUPS: Record<Exclude<ShowcaseKey, 'erp'>, () => ReactNode> = {
  inventory: InventoryMockup,
  pos: PosMockup,
  crm: CrmMockup,
  hris: HrisMockup,
};

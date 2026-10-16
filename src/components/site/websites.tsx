import { Building2, Menu, Store, Warehouse, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// Konsep desain website company profile: tampilan desktop di bingkai browser +
// versi HP. Kedua konsep sengaja berbeda cara kerjanya, bukan cuma warnanya:
// distributor = katalog & minta daftar harga, jasa = proyek, area, & minta penawaran.
// Ukuran memakai cqw, jadi tiap bingkai punya skala sendiri.

export type WebsiteConceptKey = 'distributor' | 'service';

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

function BrowserShell({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="@container w-full">
      <div className="flex aspect-[16/10] select-none flex-col overflow-hidden rounded-[1.4cqw] bg-white text-[length:1.15cqw] leading-[1.3] tracking-[-0.01em] shadow-[3px_5px_30px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.06]">
        <div className="flex h-[3.2cqw] shrink-0 items-center gap-[0.7cqw] border-b border-black/[0.06] bg-[#f6f6f8] px-[1.4cqw]">
          <span className="size-[0.95cqw] rounded-full bg-[#ff5f57]" />
          <span className="size-[0.95cqw] rounded-full bg-[#febc2e]" />
          <span className="size-[0.95cqw] rounded-full bg-[#28c840]" />
          <span className="mx-auto flex h-[1.9cqw] w-[34%] items-center justify-center rounded-[0.6cqw] bg-black/[0.05] text-[length:0.85cqw] text-muted">{url}</span>
          <span className="w-[3.7cqw]" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

// Versi HP. `bezel`: dengan bingkai perangkat (dipakai bertumpuk di layar lebar);
// tanpa bezel = cuplikan halaman dengan batas sederhana (dipakai di layar HP).
function PhoneShell({ bezel, children }: { bezel: boolean; children: ReactNode }) {
  if (!bezel) {
    return (
      <div className="@container w-full">
        <div className="aspect-[9/15] select-none overflow-hidden rounded-[22px] bg-white text-[length:4.6cqw] leading-[1.3] tracking-[-0.01em] shadow-[3px_5px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08]">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="@container w-full">
      <div className="aspect-[9/19] select-none overflow-hidden rounded-[13cqw] bg-[#1d1d1f] p-[2.6cqw] shadow-[3px_5px_30px_rgba(0,0,0,0.25)]">
        <div className="h-full overflow-hidden rounded-[10.5cqw] bg-white pt-[7cqw] text-[length:5cqw] leading-[1.3] tracking-[-0.01em]">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- konsep 1: distributor

const GREEN = 'bg-[#1f6f43]';

// Kemasan produk sederhana (SVG): karung beras, botol minyak, pak gula.
function ProductPacks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" className={className} aria-hidden>
      <ellipse cx="150" cy="186" rx="130" ry="9" fill="#1f6f43" opacity="0.12" />
      {/* karung beras */}
      <path d="M38 62 Q40 48 56 46 L104 46 Q120 48 122 62 L128 168 Q128 184 110 184 L50 184 Q32 184 32 168 Z" fill="#efe4cc" />
      <path d="M52 46 Q80 30 108 46" fill="none" stroke="#c9b48a" strokeWidth="5" strokeLinecap="round" />
      <rect x="40" y="98" width="80" height="44" rx="6" fill="#1f6f43" />
      <text x="80" y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">BERAS</text>
      <text x="80" y="134" textAnchor="middle" fontSize="10" fill="#d9efe2" fontFamily="system-ui, sans-serif">Premium 5 kg</text>
      {/* botol minyak */}
      <rect x="152" y="40" width="22" height="16" rx="3" fill="#1f6f43" />
      <path d="M150 56 L176 56 L178 74 Q196 84 196 104 L196 172 Q196 184 184 184 L142 184 Q130 184 130 172 L130 104 Q130 84 148 74 Z" fill="#f2c14e" />
      <rect x="134" y="112" width="58" height="40" rx="6" fill="#fff" />
      <text x="163" y="130" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f6f43" fontFamily="system-ui, sans-serif">MINYAK</text>
      <text x="163" y="144" textAnchor="middle" fontSize="9" fill="#6e6e73" fontFamily="system-ui, sans-serif">Goreng 2 L</text>
      {/* pak gula */}
      <path d="M210 84 L272 84 L268 74 L214 74 Z" fill="#dfe8e2" />
      <rect x="208" y="84" width="66" height="100" rx="5" fill="#f7f8f4" stroke="#dfe3dc" strokeWidth="2" />
      <rect x="214" y="112" width="54" height="34" rx="5" fill="#1f6f43" />
      <text x="241" y="128" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">GULA</text>
      <text x="241" y="140" textAnchor="middle" fontSize="9" fill="#d9efe2" fontFamily="system-ui, sans-serif">Pasir 1 kg</text>
    </svg>
  );
}

const catalog: [string, string, string][] = [
  ['Beras Premium 5 kg', 'Sak', 'min. 10 sak'],
  ['Minyak Goreng 2 L', 'Dus isi 6', 'min. 5 dus'],
  ['Gula Pasir 1 kg', 'Bal isi 20', 'min. 3 bal'],
  ['Tepung Terigu 1 kg', 'Dus isi 12', 'min. 5 dus'],
];

function DistributorDesktop() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-[3cqw] py-[1.2cqw]">
        <span className="flex items-center gap-[0.8cqw] font-semibold">
          <span className={cx('grid size-[2.4cqw] place-items-center rounded-[0.6cqw] text-white', GREEN)}>M</span>
          Mitra Pangan
        </span>
        <span className="flex items-center gap-[2.2cqw] text-[length:1cqw] text-ink-80">
          <span>Produk</span>
          <span>Area layanan</span>
          <span>Tentang</span>
          <span className={cx('rounded-full px-[1.3cqw] py-[0.6cqw] text-white', GREEN)}>Minta daftar harga</span>
        </span>
      </div>
      <div className="grid grid-cols-[1.05fr_1fr] items-center gap-[2cqw] px-[3cqw] pb-[1cqw] pt-[2.2cqw]">
        <div>
          <p className="text-[length:1cqw] font-semibold text-[#1f6f43]">Distributor sembako · Jabodetabek</p>
          <p className="mt-[0.6cqw] text-[length:2.8cqw] font-semibold leading-[1.08] tracking-[-0.03em]">Pasokan sembako rutin untuk toko dan minimarket.</p>
          <p className="mt-[1cqw] text-[length:1.15cqw] text-muted">Dari 3 gudang di Cikarang, Tangerang, dan Bekasi. Dikirim setiap hari kerja.</p>
          <div className="mt-[1.4cqw] flex gap-[0.8cqw] text-[length:1.05cqw]">
            <span className={cx('rounded-full px-[1.6cqw] py-[0.7cqw] text-white', GREEN)}>Minta daftar harga</span>
            <span className="rounded-full border border-[#1f6f43] px-[1.6cqw] py-[0.7cqw] text-[#1f6f43]">Lihat katalog</span>
          </div>
        </div>
        <div className="rounded-[1.6cqw] bg-[#eaf4ee] px-[1.6cqw] pt-[1.2cqw]">
          <ProductPacks className="w-full" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1.7fr_1fr] gap-[1.6cqw] px-[3cqw] pb-[2cqw] pt-[1cqw]">
        <div className="rounded-[1cqw] border border-black/[0.08]">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-[1.4cqw] py-[0.8cqw]">
            <span className="font-semibold">Katalog Oktober 2026</span>
            <span className="text-[length:0.9cqw] text-muted">120+ produk · 6 kategori</span>
          </div>
          {catalog.map(([name, pack, min]) => (
            <div key={name} className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center border-b border-divider px-[1.4cqw] py-[0.6cqw] text-[length:1cqw] last:border-b-0">
              <span className="font-medium">{name}</span>
              <span className="text-muted">{pack}</span>
              <span className="text-muted">{min}</span>
              <span className="text-[#1f6f43]">Minta harga ›</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col rounded-[1cqw] bg-[#1f6f43] p-[1.4cqw] text-white">
          <p className="font-semibold">Daftar harga grosir</p>
          <p className="mt-[0.3cqw] text-[length:0.9cqw] text-white/75">Dikirim ke WhatsApp Anda dalam jam kerja.</p>
          {['Nama toko', 'Kota'].map((f) => (
            <div key={f} className="mt-[0.8cqw] rounded-[0.5cqw] bg-white/15 px-[0.8cqw] py-[0.55cqw] text-[length:0.9cqw] text-white/70">
              {f}
            </div>
          ))}
          <span className="mt-auto rounded-full bg-white py-[0.6cqw] text-center text-[length:1cqw] font-semibold text-[#1f6f43]">Kirim daftar harga</span>
        </div>
      </div>
    </div>
  );
}

function DistributorMobile() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-[6cqw] py-[3.5cqw]">
        <span className="flex items-center gap-[2cqw] font-semibold">
          <span className={cx('grid size-[7cqw] place-items-center rounded-[2cqw] text-white', GREEN)}>M</span>
          Mitra Pangan
        </span>
        <Menu className="size-[6.5cqw]" strokeWidth={1.8} />
      </div>
      <div className="px-[6cqw] pt-[2cqw]">
        <p className="text-[length:3.8cqw] font-semibold text-[#1f6f43]">Distributor sembako · Jabodetabek</p>
        <p className="mt-[1.5cqw] text-[length:8.2cqw] font-semibold leading-[1.08] tracking-[-0.03em]">Pasokan sembako rutin untuk toko.</p>
        <div className="mt-[4cqw] rounded-[5cqw] bg-[#eaf4ee] px-[4cqw] pt-[3cqw]">
          <ProductPacks className="w-full" />
        </div>
        <span className={cx('mt-[4cqw] block rounded-full py-[3cqw] text-center text-[length:4.4cqw] text-white', GREEN)}>Minta daftar harga</span>
      </div>
      <div className="mx-[6cqw] mt-[5cqw] rounded-[4cqw] border border-black/[0.08]">
        {catalog.slice(0, 3).map(([name, , min]) => (
          <div key={name} className="flex items-center justify-between border-b border-divider px-[4cqw] py-[2.6cqw] last:border-b-0">
            <span className="text-[length:3.9cqw] font-medium">{name}</span>
            <span className="text-[length:3.4cqw] text-muted">{min}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- konsep 2: usaha jasa

const NAVY = 'bg-[#16304f]';
const ORANGE = 'bg-[#e8742a]';
const areas = ['Jakarta Barat', 'Tangerang', 'Bekasi'];
const projects: [string, string, string, LucideIcon][] = [
  ['Gedung kantor 8 lantai', 'Perawatan berkala 42 unit AC', 'Tangerang · Sep 2026', Building2],
  ['Ruko 3 lantai', 'Instalasi panel & jalur listrik baru', 'Jakarta Barat · Agu 2026', Store],
  ['Gudang logistik', 'Servis genset 250 kVA', 'Bekasi · Jul 2026', Warehouse],
];

function ServiceDesktop() {
  return (
    <div className="flex h-full flex-col">
      <div className={cx('flex items-center justify-between px-[3cqw] py-[1.2cqw] text-white', NAVY)}>
        <span className="flex items-center gap-[0.8cqw] font-semibold">
          <span className={cx('grid size-[2.4cqw] place-items-center rounded-full', ORANGE)}>A</span>
          Arsa Teknik
        </span>
        <span className="flex items-center gap-[2.2cqw] text-[length:1cqw] text-white/80">
          <span>Layanan</span>
          <span>Proyek</span>
          <span>Area</span>
          <span className={cx('rounded-[0.6cqw] px-[1.3cqw] py-[0.6cqw] text-white', ORANGE)}>Minta penawaran</span>
        </span>
      </div>
      <div className={cx('grid grid-cols-[1.25fr_1fr] gap-[3cqw] px-[3cqw] pb-[2.6cqw] pt-[2.2cqw] text-white', NAVY)}>
        <div className="flex flex-col justify-center">
          <p className="text-[length:1cqw] font-semibold text-[#f5a35e]">AC & kelistrikan gedung</p>
          <p className="mt-[0.6cqw] text-[length:2.8cqw] font-semibold leading-[1.08] tracking-[-0.03em]">Perawatan AC dan kelistrikan untuk kantor & gedung.</p>
          <p className="mt-[1cqw] text-[length:1.15cqw] text-white/70">Jadwal perawatan berkala, laporan setiap kunjungan, dan teknisi darurat di hari kerja.</p>
          <div className="mt-[1.4cqw] flex flex-wrap items-center gap-[0.6cqw] text-[length:0.95cqw]">
            <span className="text-white/60">Area layanan:</span>
            {areas.map((a) => (
              <span key={a} className="rounded-full bg-white/10 px-[0.9cqw] py-[0.35cqw]">
                {a}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-[1.2cqw] bg-white p-[1.6cqw] text-ink">
          <p className="text-[length:1.35cqw] font-semibold">Minta penawaran</p>
          <p className="text-[length:0.9cqw] text-muted">Balasan berisi estimasi biaya & jadwal survei.</p>
          {[
            ['Perusahaan', 'PT …'],
            ['Jenis layanan', 'Perawatan AC berkala ▾'],
            ['Jumlah unit / luas', 'mis. 20 unit'],
          ].map(([f, v]) => (
            <div key={f} className="mt-[0.8cqw]">
              <p className="text-[length:0.85cqw] text-muted">{f}</p>
              <div className="mt-[0.25cqw] rounded-[0.6cqw] border border-black/[0.12] px-[0.8cqw] py-[0.5cqw] text-[length:0.95cqw] text-faint">{v}</div>
            </div>
          ))}
          <span className={cx('mt-[1.1cqw] block rounded-[0.6cqw] py-[0.7cqw] text-center text-[length:1.05cqw] text-white', ORANGE)}>Kirim permintaan</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 px-[3cqw] py-[1.8cqw]">
        <p className="font-semibold">Proyek terbaru</p>
        <div className="mt-[0.9cqw] grid grid-cols-3 gap-[1.2cqw]">
          {projects.map(([name, work, meta, Icon]) => (
            <div key={name} className="overflow-hidden rounded-[1cqw] border border-black/[0.08]">
              <div className="flex h-[4.2cqw] items-center bg-[#eef2f7] px-[1.2cqw]">
                <Icon className="size-[2.2cqw] text-[#16304f]" strokeWidth={1.5} />
              </div>
              <div className="p-[1.1cqw]">
                <p className="font-semibold">{name}</p>
                <p className="text-[length:0.95cqw] text-ink-80">{work}</p>
                <p className="mt-[0.3cqw] text-[length:0.85cqw] text-muted">{meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceMobile() {
  return (
    <div className="flex h-full flex-col">
      <div className={cx('px-[6cqw] pb-[6cqw] pt-[3.5cqw] text-white', NAVY)}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-[2cqw] font-semibold">
            <span className={cx('grid size-[7cqw] place-items-center rounded-full', ORANGE)}>A</span>
            Arsa Teknik
          </span>
          <Menu className="size-[6.5cqw]" strokeWidth={1.8} />
        </div>
        <p className="mt-[6cqw] text-[length:8cqw] font-semibold leading-[1.08] tracking-[-0.03em]">Perawatan AC & listrik gedung.</p>
        <div className="mt-[3cqw] flex flex-wrap gap-[1.5cqw] text-[length:3.3cqw]">
          {areas.map((a) => (
            <span key={a} className="rounded-full bg-white/10 px-[2.5cqw] py-[1cqw]">
              {a}
            </span>
          ))}
        </div>
        <span className={cx('mt-[5cqw] block rounded-[3cqw] py-[3cqw] text-center text-[length:4.4cqw]', ORANGE)}>Minta penawaran</span>
      </div>
      <div className="px-[6cqw] pt-[5cqw]">
        <p className="text-[length:4.4cqw] font-semibold">Proyek terbaru</p>
        <div className="mt-[2.5cqw] space-y-[2.5cqw]">
          {projects.slice(0, 2).map(([name, work, meta, Icon]) => (
            <div key={name} className="flex items-start gap-[3cqw] rounded-[4cqw] border border-black/[0.08] p-[3.5cqw]">
              <span className="grid size-[10cqw] shrink-0 place-items-center rounded-[3cqw] bg-[#eef2f7]">
                <Icon className="size-[5.5cqw] text-[#16304f]" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <p className="text-[length:4cqw] font-semibold">{name}</p>
                <p className="text-[length:3.5cqw] text-ink-80">{work}</p>
                <p className="text-[length:3.2cqw] text-muted">{meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- komposisi desktop + HP

const CONCEPTS: Record<WebsiteConceptKey, { url: string; desktop: () => ReactNode; mobile: () => ReactNode }> = {
  distributor: { url: 'mitrapangan.co.id', desktop: DistributorDesktop, mobile: DistributorMobile },
  service: { url: 'arsateknik.co.id', desktop: ServiceDesktop, mobile: ServiceMobile },
};

export function WebsiteConcept({ concept, label }: { concept: WebsiteConceptKey; label: string }) {
  const { url, desktop: Desktop, mobile: Mobile } = CONCEPTS[concept];
  return (
    <div role="img" aria-label={label} className="relative">
      {/* Layar lebar: desktop + HP bertumpuk. Layar HP: cuplikan versi HP tanpa bingkai perangkat. */}
      <div className="hidden pb-[5%] pr-[15%] sm:block">
        <BrowserShell url={url}>
          <Desktop />
        </BrowserShell>
      </div>
      <div className="absolute bottom-0 right-0 hidden w-[22%] sm:block">
        <PhoneShell bezel>
          <Mobile />
        </PhoneShell>
      </div>
      <div className="sm:hidden">
        <PhoneShell bezel={false}>
          <Mobile />
        </PhoneShell>
      </div>
    </div>
  );
}

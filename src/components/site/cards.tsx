import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SiteCopy } from '@/i18n';
import type { ShowcaseKey } from './mockups';

// Kartu ilustrasi berukuran asli (bukan bingkai desktop yang diperkecil):
// kartu "pesanan terhubung" (cadangan visual hero) dan kartu ringkas pengganti
// bingkai aplikasi di layar HP. Data sama dengan mockups.tsx (CV Mitra Pangan).

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

const surface = 'rounded-[22px] bg-white ring-1 ring-black/[0.06] shadow-[3px_5px_30px_rgba(0,0,0,0.12)]';

// ---------------------------------------------------------------- hero

export function ErpFlowCard({ flow }: { flow: SiteCopy['flow'] }) {
  return (
    <figure className="w-full">
      <div role="img" aria-label={flow.label} className={cx(surface, 'p-5 sm:p-6')}>
        <div className="flex items-start justify-between gap-4 border-b border-divider pb-4">
          <div className="min-w-0">
            <p className="text-[17px] font-semibold tabular-nums tracking-[-0.01em]">{flow.order}</p>
            <p className="mt-0.5 truncate text-[13px] text-muted">
              {flow.customer} · {flow.summary}
            </p>
          </div>
          <p className="shrink-0 text-[17px] font-semibold tabular-nums">{flow.amount}</p>
        </div>
        <ol className="pt-4">
          {flow.steps.map((step, i) => (
            <li
              key={step.module}
              className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-x-3 motion-safe:animate-[dz-step_0.5s_ease-out_both]"
              style={{ animationDelay: `${150 + i * 120}ms` }}
            >
              <div className="flex flex-col items-center">
                <span
                  className={cx(
                    'relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full',
                    step.state === 'done' && 'bg-accent text-white',
                    step.state === 'current' && 'bg-white ring-2 ring-accent',
                    step.state === 'pending' && 'border border-dashed border-black/25',
                  )}
                >
                  {step.state === 'done' && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                  {step.state === 'current' && (
                    <>
                      <span className="absolute size-2.5 rounded-full bg-accent motion-safe:animate-ping" />
                      <span className="relative size-2.5 rounded-full bg-accent" />
                    </>
                  )}
                </span>
                {i < flow.steps.length - 1 && <span className={cx('my-1 w-px flex-1', step.state === 'done' ? 'bg-accent/50' : 'bg-black/10')} />}
              </div>
              <div className={cx('min-w-0', i < flow.steps.length - 1 && 'pb-4')}>
                <p className="text-[12px] text-muted">{step.module}</p>
                <p className={cx('text-[15px] font-semibold leading-[1.3]', step.state === 'pending' && 'text-ink-80', step.state === 'current' && 'text-accent')}>
                  {step.status}
                </p>
                <p className="mt-0.5 text-[13px] leading-[1.4] text-muted">{step.detail}</p>
              </div>
              <p className="pt-4 text-[12px] tabular-nums text-muted">{step.time}</p>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------- kartu ringkas (HP)

function MiniCard({ app, label, children }: { app: string; label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className={cx(surface, 'p-5 text-[14px] leading-[1.4] tracking-[-0.01em]')}>
      <p className="mb-3 flex items-center gap-2 text-[12px] text-muted">
        <span className="grid size-5 place-items-center rounded-md bg-[#1f6f43] text-[10px] font-semibold text-white">M</span>
        {app} · CV Mitra Pangan
      </p>
      {children}
    </div>
  );
}

function Row({ left, right, sub, strong }: { left: ReactNode; right: ReactNode; sub?: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-divider py-2 last:border-b-0">
      <div className="min-w-0">
        <p className={cx('truncate', strong && 'font-semibold')}>{left}</p>
        {sub && <p className="truncate text-[12px] text-muted">{sub}</p>}
      </div>
      <p className="shrink-0 tabular-nums">{right}</p>
    </div>
  );
}

function InventoryHighlight() {
  return (
    <MiniCard app="Gudang" label="Contoh aplikasi gudang: stok fisik, dialokasikan, dan tersedia untuk Minyak Goreng 2 L">
      <p className="text-[16px] font-semibold">Minyak Goreng 2 L</p>
      <p className="text-[12px] text-muted">Gudang Cikarang · dus (6 botol)</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ['Fisik', '146'],
          ['Dialokasikan', '60'],
          ['Tersedia', '86'],
        ].map(([k, v], i) => (
          <div key={k} className={cx('rounded-xl px-3 py-2', i === 2 ? 'bg-accent/10' : 'bg-parchment')}>
            <p className="text-[11px] text-muted">{k}</p>
            <p className={cx('text-[20px] font-semibold tabular-nums', i === 2 && 'text-accent')}>{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-xl bg-[#fff8eb] px-3 py-2 text-[12px] text-[#7a4f00]">Di bawah minimum 140 dus · saran beli 54 dus</p>
      <div className="mt-2">
        <Row left="Alokasi SO-2026-0142" sub="16 Okt 10.05" right="−60" />
        <Row left="Terima PO-2026-0077" sub="15 Okt 14.20" right={<span className="text-[#248a3d]">+120</span>} />
      </div>
    </MiniCard>
  );
}

function PosHighlight() {
  return (
    <MiniCard app="Kasir" label="Contoh aplikasi kasir: transaksi tersimpan dan stok toko berkurang otomatis">
      <p className="text-[16px] font-semibold">Toko Sumber Rejeki</p>
      <p className="text-[12px] text-muted">Transaksi #TS-2041 · QRIS</p>
      <div className="mt-2">
        <Row left="2× Minyak Goreng 2 L" right="76.000" />
        <Row left="1× Beras Premium 5 kg" right="72.000" />
        <Row left="1× Gula Pasir 1 kg" right="18.500" />
        <Row left="Total" right="Rp166.500" strong />
      </div>
      <div className="mt-3 rounded-xl bg-[#f0faf2] px-3 py-2 text-[12px] text-[#1c6e33]">
        <p className="flex items-center gap-1.5 font-semibold">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
          Tersimpan · stok diperbarui
        </p>
        <p className="mt-1">Minyak Goreng 24 → 22 · Beras 15 → 14 · Gula 40 → 39</p>
      </div>
    </MiniCard>
  );
}

function CrmHighlight() {
  return (
    <MiniCard app="CRM" label="Contoh CRM: daftar follow-up hari ini dengan tindakan berikutnya">
      <div className="flex items-baseline justify-between">
        <p className="text-[16px] font-semibold">Follow-up hari ini</p>
        <p className="text-[12px] text-muted">3 prospek</p>
      </div>
      <div className="mt-2">
        <Row left="Minimarket Sejahtera" sub="Telepon pemilik, tanyakan harga grosir" right="14.00" strong />
        <Row left="Koperasi Sentosa" sub="Kirim katalog & daftar harga" right="15.30" />
        <Row left="Toko Barokah" sub="Kunjungan pertama" right="Besok" />
      </div>
      <p className="mt-3 text-[12px] text-muted">Rp823 jt prospek aktif · win rate 90 hari: 34%</p>
    </MiniCard>
  );
}

function HrisHighlight() {
  return (
    <MiniCard app="HRIS" label="Contoh HRIS: lembur yang disetujui masuk ke slip gaji">
      <p className="text-[16px] font-semibold">Slip gaji Oktober</p>
      <p className="text-[12px] text-muted">Dimas Saputra · Staf gudang</p>
      <div className="mt-2">
        <Row left="Gaji pokok" right="5.200.000" />
        <Row left={<span className="font-semibold text-accent">Lembur 6 jam</span>} sub="3 pengajuan disetujui Kepala Gudang" right="315.600" />
        <Row left="BPJS & PPh 21" right="−236.800" />
        <Row left="Diterima" right="Rp5.278.800" strong />
      </div>
    </MiniCard>
  );
}

// ERP di HP memakai demo interaktif (erp-demo.tsx).
export const HIGHLIGHTS: Record<Exclude<ShowcaseKey, 'erp'>, () => ReactNode> = {
  inventory: InventoryHighlight,
  pos: PosHighlight,
  crm: CrmHighlight,
  hris: HrisHighlight,
};

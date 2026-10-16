'use client';

import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { SiteCopy } from '@/i18n';
import { AppFrame, Btn, ERP_MENU, Header, SearchBox, Sidebar, Status, T, card, cx, type Tone } from './mockups';

// Demo ERP interaktif: pengunjung memajukan satu pesanan (SO-2026-0142) langkah
// demi langkah dan melihat akibatnya di bagian lain: stok tersedia berkurang
// saat dialokasikan, surat jalan dan tagihan terbentuk, piutang pelanggan naik.
// Tidak berjalan otomatis; pengunjung yang mengendalikan langkahnya.
// Isi aplikasi tetap bahasa Indonesia (sama dengan ilustrasi lain).

type DemoCopy = SiteCopy['showcase']['demo'];

const ORDER_STATUS: [string, Tone][] = [
  ['Baru', 'gray'],
  ['Dialokasikan', 'orange'],
  ['Dalam pengiriman', 'blue'],
  ['Ditagih', 'green'],
];

// Stok tersedia di Gudang Cikarang sebelum & sesudah alokasi (fisik − dialokasikan).
const ITEMS: [string, string, string, string, string][] = [
  ['Beras Premium 5 kg', '40 sak', '1.240 sak', '1.200 sak', 'Rp2.740.000'],
  ['Minyak Goreng 2 L', '60 dus', '146 dus', '86 dus', 'Rp12.600.000'],
  ['Gula Pasir 1 kg', '180 pak', '2.310 pak', '2.130 pak', 'Rp3.060.000'],
];

const DETAIL = [
  'Batas kredit pelanggan cukup · menunggu alokasi stok',
  'Gudang Cikarang · 3 dari 3 barang dialokasikan',
  'DO-0388 · B 9124 KXT · tiba ±14.20',
  'INV-0291 · jatuh tempo 15 Nov 2026',
];

function docsAt(step: number): [string, string, 'done' | 'current' | 'pending'][] {
  const state = (i: number) => (i < step ? 'done' : i === step ? 'current' : 'pending');
  return [
    ['SO-2026-0142', 'Pesanan', state(0)],
    ['ALK-0142', 'Alokasi stok', state(1)],
    ['DO-0388', step > 2 ? 'Diterima' : step === 2 ? 'Dalam perjalanan' : 'Surat jalan', state(2)],
    ['INV-0291', step === 3 ? 'Jatuh tempo 15 Nov' : 'Tagihan', state(3)],
  ];
}

// Piutang Toko Sumber Rejeki: Rp12,8 jt sebelum tagihan, +Rp18,4 jt setelah ditagih.
const creditAt = (step: number) => (step === 3 ? { used: 'Rp31,2 jt', pct: 62 } : { used: 'Rp12,8 jt', pct: 26 });

// Nilai yang baru berubah di langkah ini disorot sebentar.
function Flash({ on, children, className }: { on: boolean; children: ReactNode; className?: string }) {
  return <span className={cx('rounded-[0.4cqw] px-[0.3cqw]', on && 'motion-safe:animate-[dz-flash_1.2s_ease-out]', className)}>{children}</span>;
}

function Controls({ copy, step, setStep }: { copy: DemoCopy; step: number; setStep: (n: number) => void }) {
  const last = copy.steps.length - 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Langkah demo" className="flex flex-wrap gap-1.5">
        {copy.steps.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-pressed={i === step}
            onClick={() => setStep(i)}
            className={cx(
              'flex items-center gap-2 rounded-full px-1.5 py-1.5 text-[13px] transition-colors sm:px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus',
              i === step ? 'bg-ink text-white' : i < step ? 'bg-black/[0.06] text-ink-80' : 'text-muted hover:bg-black/[0.04] hover:text-ink',
            )}
          >
            <span
              className={cx(
                'grid size-5 place-items-center rounded-full text-[11px] tabular-nums',
                i === step ? 'bg-white/20' : i < step ? 'bg-ink/80 text-white' : 'border border-black/15',
              )}
            >
              {i < step ? <Check className="size-3" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            {/* HP: label hanya untuk langkah aktif supaya kontrol muat satu baris. */}
            <span className={cx(i !== step && 'sr-only sm:not-sr-only')}>{label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setStep(step === last ? 0 : step + 1)}
        className="rounded-full bg-accent px-4 py-1.5 text-[13px] text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-95"
      >
        {step === last ? copy.restart : `${copy.next} ›`}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- desktop

function Desktop({ step }: { step: number }) {
  const [status, tone] = ORDER_STATUS[step];
  const counts = [4, 7, 5, 9].map((n, i) => (i === step ? n + 1 : n));
  const credit = creditAt(step);
  const orders: [string, string, string, Tone, string, boolean?][] = [
    ['SO-2026-0142', 'Toko Sumber Rejeki', 'Rp18,4 jt', tone, status, true],
    ['SO-2026-0141', 'Toko Lancar Jaya', 'Rp9,2 jt', 'orange', 'Dialokasikan'],
    ['SO-2026-0140', 'Toko Makmur', 'Rp6,8 jt', 'gray', 'Ditagih'],
    ['SO-2026-0139', 'UD Berkah Jaya', 'Rp12,1 jt', 'green', 'Lunas'],
    ['SO-2026-0138', 'Toko Harapan Baru', 'Rp4,5 jt', 'gray', 'Baru'],
  ];

  return (
    <AppFrame url="erp.namausaha.id" aspect="aspect-[16/8.8]" label={`Demo ERP: pesanan SO-2026-0142, status ${status}`}>
      <Sidebar items={ERP_MENU} active={1} />
      <div className="flex min-w-0 flex-1 flex-col gap-[1.3cqw] bg-parchment/60 p-[1.8cqw]">
        <Header title="Pesanan penjualan" sub="Oktober 2026 · semua gudang">
          <SearchBox width="w-[13cqw]">Cari pesanan…</SearchBox>
          <Btn>+ Pesanan</Btn>
        </Header>
        <div className="grid grid-cols-4 gap-[0.8cqw]">
          {(['Baru', 'Dialokasikan', 'Dikirim', 'Ditagih'] as const).map((label, i) => (
            <div key={label} className={cx(card, 'flex items-center justify-between px-[1.1cqw] py-[0.8cqw]')}>
              <Status tone={ORDER_STATUS[i][1]}>{label}</Status>
              <Flash key={`${label}-${step}`} on={i === step && step > 0} className={cx('font-semibold tabular-nums', T.md)}>
                {counts[i]}
              </Flash>
            </div>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[0.85fr_1.6fr] gap-[1cqw]">
          <div className={cx(card, 'flex min-h-0 flex-col overflow-hidden')}>
            {orders.map(([no, cust, amount, t, s, selected]) => (
              <div key={no} className={cx('border-b border-divider px-[1.1cqw] py-[0.85cqw] last:border-b-0', selected && 'border-l-[0.3cqw] border-l-accent bg-accent/[0.05]')}>
                <div className={cx('flex justify-between', T.sm)}>
                  <span className="font-semibold tabular-nums">{no}</span>
                  <span className="tabular-nums text-ink-80">{amount}</span>
                </div>
                <div className="mt-[0.2cqw] flex items-center justify-between gap-[0.5cqw]">
                  <span className={cx('truncate text-muted', T.xs)}>{cust}</span>
                  <Status tone={t}>{s}</Status>
                </div>
              </div>
            ))}
          </div>
          <div className={cx(card, 'flex min-h-0 flex-col gap-[1cqw] p-[1.3cqw]')}>
            <div className="flex items-start justify-between">
              <div>
                <p className={cx('font-semibold tabular-nums tracking-[-0.02em]', T.md)}>SO-2026-0142</p>
                <p className={cx('text-muted', T.xs)}>Toko Sumber Rejeki · 16 Okt 2026 · Sales: Rina</p>
              </div>
              <Status tone={tone}>{status}</Status>
            </div>
            <div>
              <div className={cx('grid grid-cols-[1.6fr_0.7fr_1fr_1fr] border-b border-black/[0.06] pb-[0.5cqw] text-muted', T.xs)}>
                <span>Barang</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Tersedia (Cikarang)</span>
                <span className="text-right">Subtotal</span>
              </div>
              {ITEMS.map(([name, qty, before, after, sub]) => (
                <div key={name} className={cx('grid grid-cols-[1.6fr_0.7fr_1fr_1fr] border-b border-divider py-[0.6cqw]', T.sm)}>
                  <span className="truncate">{name}</span>
                  <span className="text-right tabular-nums">{qty}</span>
                  <span className="text-right">
                    <Flash key={`${name}-${step}`} on={step === 1} className={cx('tabular-nums', step >= 1 ? 'text-ink' : 'text-muted')}>
                      {step >= 1 ? after : before}
                    </Flash>
                  </span>
                  <span className="text-right tabular-nums">{sub}</span>
                </div>
              ))}
              <div className={cx('flex justify-between pt-[0.6cqw] font-semibold', T.sm)}>
                <span>Total</span>
                <span className="tabular-nums">Rp18.400.000</span>
              </div>
            </div>
            <p className={cx('text-muted', T.xs)}>{DETAIL[step]}</p>
            <div className="flex items-center gap-[0.5cqw]">
              {docsAt(step).map(([no, label, state], i) => (
                <div key={no} className="flex min-w-0 flex-1 items-center gap-[0.5cqw]">
                  <div
                    className={cx(
                      'min-w-0 flex-1 rounded-[0.7cqw] px-[0.8cqw] py-[0.55cqw] transition-colors duration-500',
                      state === 'current' ? 'bg-accent/10 ring-1 ring-accent' : state === 'done' ? 'bg-parchment' : 'border border-dashed border-black/[0.15] opacity-60',
                    )}
                  >
                    <p className={cx('truncate font-semibold tabular-nums', T.xs, state === 'current' && 'text-accent')}>{no}</p>
                    <p className={cx('truncate text-muted', T.xs)}>{label}</p>
                  </div>
                  {i < 3 && <span className={cx('text-faint', T.xs)}>›</span>}
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <div className={cx('flex justify-between', T.xs)}>
                <span className="text-muted">Piutang Toko Sumber Rejeki</span>
                <Flash key={`credit-${step}`} on={step === 3} className="tabular-nums">
                  {credit.used} dari Rp50 jt
                </Flash>
              </div>
              <div className="mt-[0.4cqw] h-[0.55cqw] rounded-full bg-black/[0.06]">
                <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${credit.pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

// ---------------------------------------------------------------- HP

function Mobile({ step }: { step: number }) {
  const [status] = ORDER_STATUS[step];
  const credit = creditAt(step);
  return (
    <div role="img" aria-label={`Demo ERP: pesanan SO-2026-0142, status ${status}`} className="rounded-[22px] bg-white p-5 text-[14px] leading-[1.4] ring-1 ring-black/[0.06] shadow-[3px_5px_30px_rgba(0,0,0,0.12)]">
      <div className="flex items-baseline justify-between">
        <p className="text-[16px] font-semibold tabular-nums">SO-2026-0142</p>
        <p className="text-[12px] font-semibold text-accent">{status}</p>
      </div>
      <p className="text-[12px] text-muted">Toko Sumber Rejeki · Rp18,4 jt</p>
      <div className="mt-3">
        {ITEMS.map(([name, qty, before, after]) => (
          <div key={name} className="flex items-start justify-between gap-3 border-b border-divider py-2 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate">{name}</p>
              <p className="text-[12px] text-muted">
                Tersedia:{' '}
                <Flash key={`${name}-${step}`} on={step === 1} className="tabular-nums text-ink-80">
                  {step >= 1 ? after : before}
                </Flash>
              </p>
            </div>
            <p className="shrink-0 tabular-nums">{qty}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-muted">{DETAIL[step]}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {docsAt(step).map(([no, , state]) => (
          <span
            key={no}
            className={cx(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors duration-500',
              state === 'current' ? 'bg-accent/10 text-accent ring-1 ring-accent' : state === 'done' ? 'bg-parchment text-ink-80' : 'border border-dashed border-black/15 text-faint',
            )}
          >
            {no}
          </span>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[12px]">
        <span className="text-muted">Piutang pelanggan</span>
        <span className="tabular-nums">{credit.used} / Rp50 jt</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${credit.pct}%` }} />
      </div>
    </div>
  );
}

export function ErpDemo({ copy, variant }: { copy: DemoCopy; variant: 'desktop' | 'mobile' }) {
  const [step, setStep] = useState(0);
  return (
    <div className="space-y-4">
      <Controls copy={copy} step={step} setStep={setStep} />
      {variant === 'desktop' ? <Desktop step={step} /> : <Mobile step={step} />}
      <p className="text-[13px] text-muted">{copy.hint}</p>
    </div>
  );
}

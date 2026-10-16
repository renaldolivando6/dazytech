'use client';

import { Check } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type ShowcaseTab = {
  key: string;
  name: string;
  title: string;
  body: string;
  features: string[];
  // Satu kalimat yang menjelaskan apa yang terjadi di ilustrasi (boleh kosong).
  story: string;
  // Ilustrasi layar lebar dan versi HP.
  visual: ReactNode;
  highlight: ReactNode;
};

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

// Tab ala WAI-ARIA: pindah tab dengan klik/sentuh atau panah kiri-kanan, Home, End.
// Tidak berganti otomatis. Teks semua panel tetap ada di HTML (panel tidak aktif
// memakai `hidden`), ilustrasi hanya dirender untuk tab aktif.
//
// Tata letak panel: desktop = judul | penjelasan di atas, ilustrasi selebar
// container di bawah (supaya detailnya terbaca). HP = judul, ilustrasi, penjelasan.
export function Showcase({ tabs, label }: { tabs: ShowcaseTab[]; label: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = tabs.length - 1;
    const next = e.key === 'ArrowRight' ? (i === last ? 0 : i + 1) : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap justify-center gap-1.5">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              'rounded-full px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus sm:px-4 sm:py-2 sm:text-[14px]',
              i === active ? 'bg-ink text-white' : 'bg-black/[0.05] text-ink-80 hover:bg-black/[0.08] hover:text-ink',
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      {tabs.map((t, i) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${baseId}-panel-${i}`}
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== active}
          className="mt-8 grid grid-cols-1 gap-x-12 gap-y-6 sm:mt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        >
          <h3 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[34px] lg:col-start-1 lg:row-start-1">{t.title}</h3>

          {i === active && (
            <div className="motion-safe:animate-[dz-fade_0.4s_ease-out_both] lg:col-span-2 lg:row-start-2 lg:mt-2">
              <div className="hidden lg:block">{t.visual}</div>
              <div className="mx-auto max-w-[440px] lg:hidden">{t.highlight}</div>
              {t.story && <p className="mx-auto mt-4 max-w-[440px] text-[14px] leading-[1.45] text-muted lg:max-w-none">{t.story}</p>}
            </div>
          )}

          <div className="lg:col-start-2 lg:row-start-1">
            <p className="text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">{t.body}</p>
            <ul className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[15px] leading-[1.4] text-ink-80">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={2.2} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

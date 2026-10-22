'use client';

import { BedDouble, CarFront, Gamepad2, House, Plane, TreePalm, type LucideIcon } from 'lucide-react';
import { memo } from 'react';
import { SLICES, type SliceId } from '@/lib/gacha/config';
import styles from '../gacha.module.css';

// Wajah rotor (DESIGN 5.3, 5.4): SVG statis viewBox 1000, pusat 500,500. Potong
// i digambar di jam 12 lalu diputar 30*i, jadi potong di bawah jarum terbaca
// tegak. Tanpa filter SVG, knurl satu path, memo tanpa props: tidak pernah
// di-render ulang. Sorotan potong (`hl`) dinyalakan lewat atribut data-tone
// oleh wheel.tsx, bukan lewat React.

const C = 500;
const FACE = 440;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Titik di jari-jari r, sudut a derajat searah jarum jam dari jam 12. */
function p(r: number, a: number): string {
  const rad = (a * Math.PI) / 180;
  return `${r2(C + r * Math.sin(rad))} ${r2(C - r * Math.cos(rad))}`;
}

const WEDGE = `M${C} ${C} L${p(FACE, -15)} A${FACE} ${FACE} 0 0 1 ${p(FACE, 15)} Z`;
const HL = `M${p(145, -15)} L${p(435, -15)} A435 435 0 0 1 ${p(435, 15)} L${p(145, 15)} A145 145 0 0 0 ${p(145, -15)} Z`;

// Knurl: 180 garis radial (2 derajat) di pita 486..498, satu path.
const KNURL = Array.from({ length: 180 }, (_, i) => `M${p(486, i * 2)} L${p(498, i * 2)}`).join('');

// Kilau enamel emas: garis radial tipis di dalam potong.
const GOLD_LINES = [-11, -6, 6, 11].map((a) => `M${p(160, a)} L${p(436, a)}`).join('');

type Art = {
  material: 'gold' | 'ice' | 'pearl' | 'zonk';
  overline?: string;
  overSize?: number;
  main: string;
  size: number;
  icon?: LucideIcon | 'goldbar';
};

const ART: Record<SliceId, Art> = {
  s600a: { material: 'gold', overline: 'STEAM', main: '600K', size: 50, icon: Gamepad2 },
  amerika: { material: 'pearl', overline: 'TIKET KE*', main: 'Amerika', size: 38, icon: Plane },
  s100a: { material: 'ice', overline: 'STEAM', main: '100K', size: 50, icon: Gamepad2 },
  emas: { material: 'pearl', overline: 'EMAS*', main: '200 gram', size: 36, icon: 'goldbar' },
  zonka: { material: 'zonk', main: 'ZONK', size: 54 },
  kingkoil: { material: 'pearl', overline: 'KASUR*', main: 'King Koil', size: 36, icon: BedDouble },
  s100b: { material: 'ice', overline: 'STEAM', main: '100K', size: 50, icon: Gamepad2 },
  maldives: { material: 'pearl', overline: 'HONEYMOON*', overSize: 22, main: 'Maldives', size: 36, icon: TreePalm },
  zonkb: { material: 'zonk', main: 'ZONK', size: 54 },
  s600b: { material: 'gold', overline: 'STEAM', main: '600K', size: 50, icon: Gamepad2 },
  pik: { material: 'pearl', overline: 'RUMAH*', main: 'di PIK', size: 38, icon: House },
  lambo: { material: 'pearl', overline: 'MOBIL*', main: 'Lambo', size: 40, icon: CarFront },
};

const INK = {
  gold: { main: '#2B1C06', over: '#2B1C06' },
  ice: { main: '#06223D', over: '#06223D' },
  pearl: { main: '#2A211B', over: '#5E5249' },
  zonk: { main: '#FF7A66', over: '#FF7A66' },
} as const;

// Tint mutiara dikalikan (multiply) ke dua stop glasir, dihitung sekali di sini
// supaya SVG tidak perlu blend mode.
const TINT: Partial<Record<SliceId, string>> = {
  amerika: '#ECE4F6',
  emas: '#F4EAD2',
  kingkoil: '#F5EEE2',
  maldives: '#DFF1EA',
  pik: '#F7E6DA',
  lambo: '#F5E0E5',
};

function multiply(a: string, b: string): string {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round((((x >> s) & 255) * ((y >> s) & 255)) / 255);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

const FONT = { fontFamily: 'var(--g-font-ui), system-ui, sans-serif' };

function GoldBar() {
  return (
    <g strokeLinejoin="round">
      <path d="M-26 14 L26 14 L18 -12 L-18 -12 Z" fill="#D9B15E" stroke="#2B1C06" strokeWidth={2.5} />
      <path d="M-18 -12 L18 -12 L15 -5 L-15 -5 Z" fill="#F3D58E" stroke="#2B1C06" strokeWidth={2.5} />
    </g>
  );
}

function Slice({ id, index }: { id: SliceId; index: number }) {
  const art = ART[id];
  const ink = INK[art.material];
  const fill =
    art.material === 'gold' ? 'url(#gwGold)' : art.material === 'ice' ? 'url(#gwIce)' : art.material === 'zonk' ? 'url(#gwZonk)' : `url(#gwPearl-${id})`;
  const Icon = art.icon;
  return (
    <g transform={`rotate(${30 * index} ${C} ${C})`}>
      <path d={WEDGE} fill={fill} />
      {art.material === 'gold' && <path d={GOLD_LINES} stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} fill="none" />}
      {art.material === 'ice' && <path d={WEDGE} fill="url(#gwIceSheen)" />}
      {art.material === 'pearl' && <path d={WEDGE} fill="url(#gwPearlSheen)" />}
      {art.material === 'zonk' && <path d={WEDGE} fill="url(#gwDots)" />}
      {/* Alur di tepi kanan potong: garis gelap 3u + garis terang 1u. */}
      <path d={`M${p(150, 15)} L${p(FACE, 15)}`} stroke="rgba(0,0,0,0.28)" strokeWidth={3} />
      <path d={`M${p(150, 15)} L${p(FACE, 15)}`} stroke="rgba(255,255,255,0.22)" strokeWidth={1} transform="translate(1.45 0.39)" />
      <path className={styles.hl} data-hl={index} d={HL} />
      {art.material === 'zonk' ? (
        <text
          x={C}
          y={218}
          textAnchor="middle"
          fontSize={art.size}
          fontWeight={800}
          fill={ink.main}
          transform={`rotate(-8 ${C} 200)`}
          style={FONT}
        >
          {art.main}
        </text>
      ) : (
        <>
          <text
            x={C}
            y={C - 392}
            textAnchor="middle"
            fontSize={art.overSize ?? 26}
            fontWeight={700}
            letterSpacing={(art.overSize ?? 26) * 0.12}
            fill={ink.over}
            style={FONT}
          >
            {art.overline}
          </text>
          <text
            x={C}
            y={C - 322}
            textAnchor="middle"
            fontSize={art.size}
            fontWeight={art.size >= 50 ? 800 : 700}
            letterSpacing={art.size >= 50 ? -1 : -0.4}
            fill={ink.main}
            style={FONT}
          >
            {art.main}
          </text>
          <g transform={`translate(${C} ${C - 250})`}>
            {Icon === 'goldbar' ? (
              <GoldBar />
            ) : Icon ? (
              <Icon x={-28} y={-28} width={56} height={56} strokeWidth={2.25} color={ink.main} aria-hidden="true" />
            ) : null}
          </g>
        </>
      )}
      {/* Pasak kuningan di batas potong (r 462), bayangannya simetris radial. */}
      <circle
        cx={r2(C + 462 * Math.sin(Math.PI / 12))}
        cy={r2(C - 462 * Math.cos(Math.PI / 12))}
        r={11}
        fill="url(#gwPeg)"
        stroke="rgba(40,26,8,0.7)"
        strokeWidth={1.5}
      />
    </g>
  );
}

function WheelArtImpl() {
  return (
    <svg className={styles.rotorSvg} viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="gwGold" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={FACE}>
          <stop offset="0.3" stopColor="#C99A48" />
          <stop offset="1" stopColor="#F2D08A" />
        </radialGradient>
        <radialGradient id="gwIce" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={FACE}>
          <stop offset="0.3" stopColor="#4E9AD8" />
          <stop offset="1" stopColor="#A3D6F9" />
        </radialGradient>
        <linearGradient id="gwIceSheen" gradientUnits="userSpaceOnUse" x1="380" y1="80" x2="620" y2="330">
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.48" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="0.64" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gwPearlSheen" gradientUnits="userSpaceOnUse" x1="380" y1="60" x2="620" y2="420">
          <stop offset="0" stopColor="#FFD2E4" stopOpacity="0.08" />
          <stop offset="0.35" stopColor="#D0E6FF" stopOpacity="0.08" />
          <stop offset="0.7" stopColor="#D6FFE8" stopOpacity="0.08" />
          <stop offset="1" stopColor="#FFF2D0" stopOpacity="0.08" />
        </linearGradient>
        {Object.entries(TINT).map(([id, tint]) => (
          <radialGradient key={id} id={`gwPearl-${id}`} gradientUnits="userSpaceOnUse" cx={C} cy={C} r={FACE}>
            <stop offset="0.3" stopColor={multiply('#E3D7C8', tint)} />
            <stop offset="1" stopColor={multiply('#FBF6EF', tint)} />
          </radialGradient>
        ))}
        <radialGradient id="gwZonk" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={FACE}>
          <stop offset="0.3" stopColor="#171414" />
          <stop offset="1" stopColor="#2A2625" />
        </radialGradient>
        <pattern id="gwDots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1" fill="#FFFFFF" fillOpacity="0.05" />
        </pattern>
        <radialGradient id="gwPeg" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4D8" />
          <stop offset="0.55" stopColor="#D9B676" />
          <stop offset="1" stopColor="#8A6A2E" />
        </radialGradient>
      </defs>
      {SLICES.map((s, i) => (
        <Slice key={s.id} id={s.id} index={i} />
      ))}
      <circle cx={C} cy={C} r={150} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} />
      <circle cx={C} cy={C} r={152.5} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
      <path d={KNURL} stroke="rgba(0,0,0,0.22)" strokeWidth={1.4} fill="none" />
    </svg>
  );
}

/** Wajah rotor. Tidak punya props dan tidak pernah berubah. */
export const WheelArt = memo(WheelArtImpl);

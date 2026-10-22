// Ilustrasi pasangan tanpa wajah (gaya undangan modern): pria berjas di kiri,
// wanita bergaun putih dengan kerudung dan buket di kanan, bergandengan.
// SVG statis, digambar dari belakang ke depan.

const SKIN = '#EBCBB5';
const SUIT = '#34333E';
const SUIT_DARK = '#25242D';
const SHOE = '#18171C';
const HAIR_M = '#2B2522';
const HAIR_F = '#4A3328';
const GOWN = '#FFFFFF';
const GOWN_LINE = '#DCD1C5';
const FOLD = '#ECE4DA';

export function CoupleArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="8 6 220 252" aria-hidden="true">
      {/* bayangan lantai */}
      <ellipse cx="124" cy="250" rx="72" ry="4.5" fill="#3A2A22" fillOpacity="0.06" />

      {/* kerudung, di belakang semuanya */}
      <path d="M147 32C164 42 172 96 181 206C172 211 160 211 151 206C154 144 152 84 143 46Z" fill={GOWN} fillOpacity="0.8" stroke={GOWN_LINE} strokeWidth="0.8" />

      {/* ---------- pengantin pria */}
      <path d="M66 134H98L96 243H86L82 162L78 243H68Z" fill={SUIT_DARK} />
      <path d="M66 243H79V248H63ZM85 243H98L100 248H85Z" fill={SHOE} />
      <path d="M63 66Q55 98 58 130H65Q64 100 70 72Z" fill={SUIT} />
      <circle cx="61.5" cy="133" r="3.6" fill={SKIN} />
      <rect x="77.5" y="48" width="9" height="11" rx="2" fill={SKIN} />
      <path d="M64 62Q82 54 100 62L104 70L99 138H65L60 70Z" fill={SUIT} />
      <path d="M76 57H88L82 88Z" fill={GOWN} />
      <path d="M76 57L82 98L71 66ZM88 57L82 98L93 66Z" fill={SUIT_DARK} />
      <path d="M77 59.5L82 62L77 64.5ZM87 59.5L82 62L87 64.5Z" fill={SHOE} />
      <circle cx="82" cy="62" r="1.3" fill={SHOE} />
      <path d="M90 77H97L95.5 73.5Z" fill={GOWN} />
      <circle cx="82" cy="106" r="1.3" fill={SHOE} />
      <circle cx="82" cy="117" r="1.3" fill={SHOE} />
      {/* lengan kanan menggandeng pengantin wanita */}
      <path d="M100 67L107 100L118 110" fill="none" stroke={SUIT} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="82" cy="38" r="13.5" fill={SKIN} />
      <path d="M68.5 38C68 25 75 20.5 82.5 20.5C91 20.5 96.5 26.5 95.8 36C92 31 86.5 29 80.5 29.8C75 30.6 71.5 33.5 68.5 38Z" fill={HAIR_M} />

      {/* ---------- pengantin wanita */}
      <rect x="131.5" y="54" width="9" height="12" rx="2" fill={SKIN} />
      <path d="M122 68Q136 59 150 68L148 74H124Z" fill={SKIN} />
      <path d="M127.5 103C122 150 109 200 99 246Q139 254 181 246C171 200 152 150 144.5 103Z" fill={GOWN} stroke={GOWN_LINE} strokeWidth="0.8" />
      <path d="M133 106C130 160 124 210 120 248.5M139 106C142 160 150 210 157 249.5M136 106V250" fill="none" stroke={FOLD} strokeWidth="0.8" />
      <path d="M125 73Q130.5 69 136 73Q141.5 69 147 73L144.5 103H127.5Z" fill={GOWN} stroke={GOWN_LINE} strokeWidth="0.8" />
      <path d="M127.5 100H144.5L145 104.5H127Z" fill="#EADBCB" />
      <path d="M149 70Q154 92 150.5 113" fill="none" stroke={SKIN} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M124 70Q117 92 127 110" fill="none" stroke={SKIN} strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="147.5" cy="35" r="6.5" fill={HAIR_F} />
      <circle cx="136" cy="43" r="12.5" fill={SKIN} />
      <path d="M123.5 44C122.5 31 130 29.5 136 29.5C143.5 29.5 149.5 34.5 148.6 44.5C145.5 38.5 141 35.8 135 36.5C130 37.2 126.5 40 123.5 44Z" fill={HAIR_F} />
      <circle cx="143.5" cy="31.5" r="1.6" fill={GOWN} stroke={GOWN_LINE} strokeWidth="0.5" />

      {/* buket */}
      <path d="M134 118L130 136M135 118L138 135" stroke="#E2C6B6" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="126" cy="116" rx="4.5" ry="2" transform="rotate(-30 126 116)" fill="#B7BFAE" />
      <ellipse cx="142" cy="116" rx="4.5" ry="2" transform="rotate(30 142 116)" fill="#B7BFAE" />
      <circle cx="130.5" cy="110.5" r="5" fill="#EDC3BD" />
      <circle cx="138" cy="109" r="4.6" fill="#F6E1D3" />
      <circle cx="134.5" cy="115.5" r="4.4" fill="#DFA9A6" />
      <circle cx="140.5" cy="114.5" r="3.4" fill="#FBEFE7" />
    </svg>
  );
}

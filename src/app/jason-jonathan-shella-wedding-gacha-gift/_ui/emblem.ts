import { SLICES, type SliceKind } from '@/lib/gacha/config';

// Lambang roda sebagai string SVG (DESIGN 16.6): dipakai header Final (32px)
// dan gambar OG (300px, lewat data URI). Warna datar per jenis potong, tanpa
// label: tidak ada nama hadiah, kode, atau urutan. Pure, tanpa DOM.

const FLAT: Record<SliceKind, string> = {
  steam_600k: '#E8C07A',
  steam_100k: '#7BC2F5',
  lebay: '#F3ECE2',
  zonk: '#2A2625',
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Titik pada sudut a (derajat, searah jarum jam dari jam 12) dan jari-jari r. */
function xy(cx: number, cy: number, r: number, a: number): [number, number] {
  const rad = (a * Math.PI) / 180;
  return [r1(cx + r * Math.sin(rad)), r1(cy - r * Math.cos(rad))];
}

const pt = (cx: number, cy: number, r: number, a: number) => xy(cx, cy, r, a).join(',');

export function emblemSvg(size: number, opts: { pointer?: boolean } = {}): string {
  const pointer = opts.pointer ?? false;
  // viewBox 1000x1000. Dengan jarum, roda turun sedikit supaya jarum muat.
  const cx = 500;
  const cy = pointer ? 545 : 500;
  const face = pointer ? 395 : 430;
  const ringW = pointer ? 56 : 60;
  const ringR = face + ringW / 2;
  const n = SLICES.length;
  const step = 360 / n;

  const wedges = SLICES.map((s, i) => {
    const a = step * i;
    return `<path d="M${cx},${cy} L${pt(cx, cy, face, a - step / 2)} A${face},${face} 0 0 1 ${pt(cx, cy, face, a + step / 2)} Z" fill="${FLAT[s.kind]}"/>`;
  }).join('');

  // Garis antar potong dan pasak kuningan di setiap tepi potong.
  const seams = SLICES.map((_, i) => {
    const [x, y] = xy(cx, cy, face, step * i + step / 2);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(0,0,0,0.28)" stroke-width="4"/>`;
  }).join('');

  const pegs = SLICES.map((_, i) => {
    const [x, y] = xy(cx, cy, face + 22, step * i + step / 2);
    return `<circle cx="${x}" cy="${y}" r="13" fill="#D9B676" stroke="#8A6A2E" stroke-width="3"/>`;
  }).join('');

  const hubR = r1(face * 0.3);
  const hub = `<circle cx="${cx}" cy="${cy}" r="${hubR}" fill="#2A2320" stroke="#C9AE84" stroke-width="8"/><circle cx="${r1(cx - hubR * 0.3)}" cy="${r1(cy - hubR * 0.35)}" r="${r1(hubR * 0.28)}" fill="rgba(255,255,255,0.18)"/>`;

  const ring = `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="#C9AE84" stroke-width="${ringW}"/><circle cx="${cx}" cy="${cy}" r="${ringR + ringW / 2 - 3}" fill="none" stroke="#8C7253" stroke-width="6"/>`;

  // Jarum: daun mutiara tergantung dari sekrup, ujungnya masuk ke wajah roda.
  const top = cy - ringR - ringW / 2; // tepi atas roda
  const tip = cy - face + 48;
  const pivot = top - 6;
  const ptr = pointer
    ? `<path d="M500,${r1(tip)} C462,${r1(tip - 70)} 456,${r1(pivot + 30)} 500,${r1(pivot - 4)} C544,${r1(pivot + 30)} 538,${r1(tip - 70)} 500,${r1(tip)} Z" fill="#F6EFE7" stroke="#B8873A" stroke-width="8" stroke-linejoin="round"/>` +
      `<circle cx="500" cy="${r1(pivot + 26)}" r="20" fill="#E5484D" stroke="#8A1F22" stroke-width="4"/><circle cx="494" cy="${r1(pivot + 20)}" r="6" fill="#FFFFFF"/>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1000 1000">` +
    `${wedges}${seams}${ring}${pegs}${hub}${ptr}</svg>`
  );
}

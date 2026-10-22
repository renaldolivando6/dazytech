// Partikel canvas 2D tanpa dependensi (DESIGN 11). Satu sistem per canvas:
// percikan di stage, foil di takeover 600K, debu di sheet ZONK. Canvas
// fixed selayar penuh, pointer-events none, aria-hidden (diatur pemanggil).
// Loop rAF sendiri, berhenti dan membersihkan canvas kalau tidak ada yang hidup.
// Pemanggil yang menghormati reduced motion: jangan panggil sama sekali.

const MAX_ALIVE = 140;
const MAX_DPR = 2;
const FOIL_COLORS = ['#E8C07A', '#FFE6B0', '#F6EFE7', '#B8873A'];
const SPARK_COLORS = ['#7BC2F5', '#A3D6F9', '#FFFFFF'];
const DUST_COLOR = '#9A8F86';
const SHADES = 6; // tingkat kecerahan foil (dihitung sekali)

type Kind = 'foil' | 'spark' | 'dust';

type Particle = {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  w: number; // foil: lebar; spark/dust: radius
  h: number; // foil: tinggi
  phi: number;
  dphi: number;
  rot: number;
  seed: number;
  color: number;
  retiring: boolean;
};

export type ParticleSystem = {
  /** Hujan foil emas. `top`: dari atas layar; `corners`: dari dua sudut bawah (count per sudut). Balikan = jumlah yang lahir. */
  foil(opts?: { count?: number; from?: 'top' | 'corners' }): number;
  /** Percikan biru 100K dari titik (ujung jarum), kerucut 120 derajat ke atas. */
  sparks(x: number, y: number, count?: number): number;
  /** Kepulan debu stempel ZONK. */
  dust(x: number, y: number, count?: number): number;
  clear(): void;
  destroy(): void;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Jumlah foil default: 120, atau 80 di perangkat 4 core ke bawah. */
export function defaultFoilCount(): number {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0;
  return cores && cores <= 4 ? 80 : 120;
}

function shade(hex: string, b: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * b);
  const g = Math.round(((n >> 8) & 255) * b);
  const bl = Math.round((n & 255) * b);
  return `rgb(${r},${g},${bl})`;
}

const FOIL_SHADES = FOIL_COLORS.map((c) => Array.from({ length: SHADES }, (_, i) => shade(c, 0.55 + (0.45 * i) / (SHADES - 1))));

export function createParticles(canvas: HTMLCanvasElement): ParticleSystem {
  const ctx = canvas.getContext('2d');
  let parts: Particle[] = [];
  let raf = 0;
  let last = 0;
  let clock = 0;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let destroyed = false;

  const resize = () => {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    dpr = Math.min(MAX_DPR, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
  };

  const onResize = () => {
    if (raf) resize();
  };
  if (typeof window !== 'undefined') window.addEventListener('resize', onResize, { passive: true });

  const alive = () => parts.reduce((n, p) => n + (p.retiring ? 0 : 1), 0);

  /** Beri tempat: partikel tertua memudar cepat (250ms) daripada hilang mendadak. */
  const makeRoom = (want: number): number => {
    let room = MAX_ALIVE - alive();
    if (room >= want) return want;
    const oldest = parts.filter((p) => !p.retiring).sort((a, b) => b.age / b.life - a.age / a.life);
    for (const p of oldest) {
      if (room >= want) break;
      p.retiring = true;
      p.life = Math.min(p.life, p.age + 0.25);
      room++;
    }
    return Math.max(0, Math.min(want, room));
  };

  const start = () => {
    if (destroyed || !ctx) return false;
    resize();
    if (W === 0 || H === 0) return false;
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    return true;
  };

  const spawn = (p: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y' | 'vx' | 'vy' | 'life'>) => {
    parts.push({ age: 0, w: 4, h: 4, phi: 0, dphi: 0, rot: 0, seed: rand(0, Math.PI * 2), color: 0, retiring: false, ...p });
  };

  function frame(now: number) {
    raf = 0;
    if (destroyed || !ctx) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt;
    const drag = 0.985 ** (dt * 60);
    const next: Particle[] = [];
    for (const p of parts) {
      p.age += dt;
      if (p.age >= p.life) continue;
      if (p.kind === 'foil') {
        p.vy += 1400 * dt;
        if (p.vy > 520) p.vy = 520;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt + Math.sin(clock * 3 + p.seed) * 20 * dt;
        p.y += p.vy * dt;
        p.phi += p.dphi * dt;
        if (p.y > H + 40) continue;
      } else if (p.kind === 'spark') {
        p.vy += 600 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else {
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      next.push(p);
    }
    parts = next;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (parts.length === 0) return;

    for (const p of parts) {
      const fadeOut = Math.min(1, (p.life - p.age) / 0.4);
      if (p.kind === 'foil') {
        const c = Math.cos(p.phi);
        const level = Math.min(SHADES - 1, Math.round(Math.abs(c) * (SHADES - 1)));
        const hh = Math.max(0.6, p.h * Math.abs(c));
        const cr = Math.cos(p.rot);
        const sr = Math.sin(p.rot);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = fadeOut;
        ctx.fillStyle = FOIL_SHADES[p.color][level];
        ctx.setTransform(dpr * cr, dpr * sr, -dpr * sr, dpr * cr, dpr * p.x, dpr * p.y);
        ctx.fillRect(-p.w / 2, -hh / 2, p.w, hh);
      } else if (p.kind === 'spark') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
        ctx.fillStyle = SPARK_COLORS[p.color];
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.w, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const u = p.age / p.life;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.25 * (1 - u);
        ctx.fillStyle = DUST_COLOR;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.w * (1 + 0.8 * u), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }

  return {
    foil({ count, from = 'top' } = {}) {
      if (!start()) return 0;
      if (from === 'top') {
        const n = makeRoom(count ?? defaultFoilCount());
        for (let i = 0; i < n; i++) {
          spawn({
            kind: 'foil',
            x: rand(0, W),
            y: rand(-H * 0.25, -10),
            vx: rand(-80, 80),
            vy: rand(0, 260),
            life: 3.2,
            w: rand(7, 11),
            h: rand(4, 6),
            phi: rand(0, Math.PI * 2),
            dphi: rand(8, 14) * (Math.random() < 0.5 ? -1 : 1),
            rot: rand(0, Math.PI),
            color: Math.floor(Math.random() * FOIL_COLORS.length),
          });
        }
        return n;
      }
      const per = count ?? 60;
      const n = makeRoom(per * 2);
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0;
        const a = (rand(55, 80) * Math.PI) / 180;
        const speed = Math.sqrt(2 * 1400 * H * rand(0.45, 0.75));
        spawn({
          kind: 'foil',
          x: left ? rand(0, 20) : W - rand(0, 20),
          y: H + rand(0, 10),
          vx: Math.cos(a) * speed * (left ? 1 : -1),
          vy: -Math.sin(a) * speed,
          life: 3.2,
          w: rand(7, 11),
          h: rand(4, 6),
          phi: rand(0, Math.PI * 2),
          dphi: rand(8, 14) * (Math.random() < 0.5 ? -1 : 1),
          rot: rand(0, Math.PI),
          color: Math.floor(Math.random() * FOIL_COLORS.length),
        });
      }
      return n;
    },
    sparks(x, y, count = 24) {
      if (!start()) return 0;
      const n = makeRoom(count);
      for (let i = 0; i < n; i++) {
        const a = (rand(-150, -30) * Math.PI) / 180;
        const s = rand(260, 520);
        spawn({
          kind: 'spark',
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.9,
          w: rand(1.5, 3),
          color: Math.floor(Math.random() * SPARK_COLORS.length),
        });
      }
      return n;
    },
    dust(x, y, count = 10) {
      if (!start()) return 0;
      const n = makeRoom(count);
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2);
        const s = rand(40, 120);
        spawn({ kind: 'dust', x: x + rand(-12, 12), y: y + rand(-8, 8), vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, w: rand(6, 14) });
      }
      return n;
    },
    clear() {
      parts = [];
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    destroy() {
      this.clear();
      destroyed = true;
      if (typeof window !== 'undefined') window.removeEventListener('resize', onResize);
    },
  };
}

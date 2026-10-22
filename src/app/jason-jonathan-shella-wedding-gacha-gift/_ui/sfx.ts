import { CAPTIONS, type CaptionKey, type CaptionTone } from './copy';
import { smooth } from './engine';

// Efek suara halaman hadiah (DESIGN 9). WebAudio murni, tanpa file audio.
// - AudioContext dibuat dan di-resume di dalam gesture pertama (unlock()).
//   Sebelum itu, dan kalau browser menolak, semua panggilan jadi no-op.
// - Setiap suara yang punya caption memancarkan event caption (9.3) walau
//   suara dimatikan atau AudioContext tidak ada: lelucon tidak boleh hilang
//   karena tombol senyap iPhone.
// - Graf: voice -> dry ----------------\
//         voice -> send -> Convolver ---> Compressor -> master -> destination

const DEFAULT_SEND = 0.18;
const MASTER = 0.8;
const FLOOR = 0.0001; // target exponentialRamp (tidak boleh 0)

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export type CaptionEvent = {
  key: CaptionKey;
  text: string;
  tone: CaptionTone;
  continuous: boolean;
  phase: 'start' | 'end';
};

export type Voice = { stop(fadeMs?: number): void };
export type WhirVoice = Voice & { set(w: number): void };
export type HopeVoice = Voice & { droop(): void };
export type PadVoice = Voice & { cut(): void };
export type CreakVoice = Voice & { dip(): void };
export type HeartbeatVoice = Voice & { setBpm(bpm: number, rampMs?: number): void };
export type TromboneVoice = Voice & { tapeStop(): void };

type Chain = {
  bus: GainNode;
  add<T extends AudioNode>(node: T): T;
  src<T extends AudioScheduledSourceNode>(node: T): T;
};

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

/** Nada C mayor C5..C6 untuk boot (DESIGN 9.2). */
const BOOT_NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
const WAHWAH = [
  { f: 293.66, ms: 360 },
  { f: 277.18, ms: 360 },
  { f: 261.63, ms: 360 },
  { f: 246.94, ms: 1100 },
];
const FANFARE_ARP = [523.25, 659.25, 783.99, 1174.66, 1318.51, 1567.98];
const FANFARE_PAD = [261.63, 329.63, 392, 493.88, 587.33];
const WHOLE_STEP = 2 ** (2 / 12);

export class SfxEngine {
  private ctx: AudioContext | null = null;
  private failed = false;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private hiddenSuspend = false;
  private lastTick = -1;
  private listeners = new Set<(e: CaptionEvent) => void>();
  private live = new Set<Voice>();
  private periodic: PeriodicWave | null = null;

  // ------------------------------------------------------------ siklus hidup

  /** Panggil di dalam handler gesture (tap/klik/ketik). Aman dipanggil berulang. */
  unlock(): void {
    if (typeof window === 'undefined' || this.failed) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
        if (!AC) {
          this.failed = true;
          return;
        }
        // Campur dengan musik yang lagi diputar dan hormati tombol senyap iPhone.
        const nav = navigator as AudioSessionNavigator;
        if ('audioSession' in navigator && nav.audioSession) nav.audioSession.type = 'ambient';
        this.ctx = new AC({ latencyHint: 'interactive' });
        this.build(this.ctx);
      }
      const ctx = this.ctx;
      if (ctx.state !== 'running') void ctx.resume().catch(() => {});
      // Buffer senyap 1 sampel untuk iOS lama.
      const silent = ctx.createBufferSource();
      silent.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      silent.connect(ctx.destination);
      silent.onended = () => silent.disconnect();
      silent.start(0);
    } catch {
      this.failed = true;
      this.ctx = null;
    }
  }

  private build(ctx: AudioContext) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 6;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER;
    comp.connect(this.master).connect(ctx.destination);
    this.dry = ctx.createGain();
    this.dry.connect(comp);
    this.reverb = ctx.createConvolver();
    this.reverb.connect(comp);

    // Noise putih mono 2 detik, dipakai semua suara (offset acak).
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Impulse response: noise stereo x exp(-t / 0.45), 1,6 detik.
    const irLen = Math.floor(ctx.sampleRate * 1.6);
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / ctx.sampleRate / 0.45);
    }
    this.reverb.buffer = ir;

    this.periodic = ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0]), new Float32Array([0, 1, 0.5, 0.33, 0.25]));
  }

  get available(): boolean {
    return !!this.ctx && !this.failed;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Senyap: master turun dalam ~40ms, whir dan loop berhenti. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    const ctx = this.ctx;
    if (ctx && this.master) this.master.gain.setTargetAtTime(muted ? 0 : MASTER, ctx.currentTime, 0.015);
    if (muted) this.stopAll(40);
  }

  /** Tab disembunyikan: jeda jam audio (dipasangkan dengan jeda timeline roda). */
  suspend(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    this.hiddenSuspend = true;
    void ctx.suspend().catch(() => {});
  }

  resume(): void {
    const ctx = this.ctx;
    if (!ctx || !this.hiddenSuspend) return;
    this.hiddenSuspend = false;
    void ctx.resume().catch(() => {});
  }

  /** Hentikan semua suara berkelanjutan (whir, trombon, pad, heartbeat, creak, hope). */
  stopAll(fadeMs = 60): void {
    for (const v of [...this.live]) v.stop(fadeMs);
    this.live.clear();
  }

  // ------------------------------------------------------------ caption

  /** Langganan caption; balikan = fungsi berhenti langganan. */
  onCaption(fn: (e: CaptionEvent) => void): () => void {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  /** Pancarkan caption tanpa suara (mis. `ticks` pada cue slow). */
  caption(key: CaptionKey, phase: 'start' | 'end' = 'start'): void {
    const c = CAPTIONS[key];
    const e: CaptionEvent = { key, text: c.text, tone: c.tone, continuous: c.continuous, phase };
    for (const fn of this.listeners) {
      try {
        fn(e);
      } catch {
        // pendengar rusak tidak boleh menghentikan suara
      }
    }
  }

  // ------------------------------------------------------------ perkakas graf

  /** Context yang siap bunyi, atau null (belum unlock, gagal, atau senyap). */
  private live_(): AudioContext | null {
    if (this.muted || !this.ctx || this.failed || !this.dry) return null;
    return this.ctx;
  }

  private chain(ctx: AudioContext, send = DEFAULT_SEND, dest: AudioNode = this.dry!): Chain {
    const bus = ctx.createGain();
    bus.connect(dest);
    const nodes: AudioNode[] = [bus];
    if (send > 0 && this.reverb) {
      const s = ctx.createGain();
      s.gain.value = send;
      bus.connect(s).connect(this.reverb);
      nodes.push(s);
    }
    let pending = 0;
    return {
      bus,
      add(node) {
        nodes.push(node);
        return node;
      },
      src(node) {
        nodes.push(node);
        pending++;
        node.onended = () => {
          if (--pending > 0) return;
          for (const n of nodes) {
            try {
              n.disconnect();
            } catch {
              // sudah terputus
            }
          }
        };
        return node;
      },
    };
  }

  private noiseSrc(ctx: AudioContext, c: Chain, loop = false): AudioBufferSourceNode {
    const s = c.src(ctx.createBufferSource());
    s.buffer = this.noise;
    s.loop = loop;
    return s;
  }

  /** Mulai noise di offset acak. Tanpa dur = loop (whir, jet). Buffer 2 detik, jadi dur maksimal ~1,9. */
  private startNoise(s: AudioBufferSourceNode, t: number, dur?: number) {
    if (dur === undefined) {
      s.start(t, rand(0, 1.9));
      return;
    }
    const d = Math.min(dur, 1.9);
    s.start(t, rand(0, 1.95 - d), d);
  }

  private filter(ctx: AudioContext, c: Chain, type: BiquadFilterType, freq: number, q = 1): BiquadFilterNode {
    const f = c.add(ctx.createBiquadFilter());
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  private gain(ctx: AudioContext, c: Chain, v = 0): GainNode {
    const g = c.add(ctx.createGain());
    g.gain.value = v;
    return g;
  }

  /** Nada sederhana: osc -> gain (attack linear, decay eksponensial) -> tujuan. */
  private tone(
    ctx: AudioContext,
    c: Chain,
    t: number,
    o: { type?: OscillatorType; f: number; f2?: number; glide?: number; peak: number; attack?: number; decay: number; to?: AudioNode },
  ): OscillatorNode {
    const osc = c.src(ctx.createOscillator());
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2 !== undefined) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide ?? o.decay));
    const g = this.gain(ctx, c);
    const a = o.attack ?? 0.003;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.peak, t + a);
    g.gain.exponentialRampToValueAtTime(FLOOR, t + a + o.decay);
    osc.connect(g).connect(o.to ?? c.bus);
    osc.start(t);
    osc.stop(t + a + o.decay + 0.03);
    return osc;
  }

  /** Klik noise berpita sempit (inti dari tick, windup, copy). */
  private click(ctx: AudioContext, c: Chain, t: number, g: number, freq: number, q = 6, tc = 0.012) {
    const s = this.noiseSrc(ctx, c);
    const bp = this.filter(ctx, c, 'bandpass', freq, q);
    const env = this.gain(ctx, c);
    env.gain.setValueAtTime(g, t);
    env.gain.setTargetAtTime(0, t, tc);
    s.connect(bp).connect(env).connect(c.bus);
    this.startNoise(s, t, tc * 6);
  }

  private track<T extends Voice>(v: T): T {
    this.live.add(v);
    return v;
  }

  private release(v: Voice) {
    this.live.delete(v);
  }

  /**
   * Handle tanpa suara (senyap, belum unlock, atau WebAudio tidak ada): tetap
   * menutup caption saat berhenti, dan otomatis setelah autoEndMs kalau ada.
   */
  private silent<T extends Voice>(key: CaptionKey | null, make: (stop: () => void) => Omit<T, 'stop'>, autoEndMs?: number): T {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stop = () => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      if (key) this.caption(key, 'end');
    };
    if (autoEndMs !== undefined) timer = setTimeout(stop, autoEndMs);
    return { ...make(stop), stop } as T;
  }

  // ------------------------------------------------------------ resep (DESIGN 9.2)

  /** Tik pasak. w = kecepatan roda (derajat/detik). Dilewati di atas 700, minimal 35ms antar tik. */
  tick(w: number): void {
    const ctx = this.live_();
    if (!ctx || Math.abs(w) > 700) return;
    const t = ctx.currentTime;
    if (this.lastTick >= 0 && t - this.lastTick < 0.035) return;
    this.lastTick = t;
    const g = 0.08 + 0.22 * (1 - smooth(80, 700, Math.abs(w)));
    const c = this.chain(ctx);
    this.click(ctx, c, t, g, 2600 * (1 + rand(-0.05, 0.05)));
    this.tone(ctx, c, t, { f: 1100, peak: 0.3 * g, attack: 0.001, decay: 0.01 });
  }

  /** Dengung putaran; set(w) dipanggil per frame (dibatasi 30Hz oleh roda). */
  whir(): WhirVoice {
    const ctx = this.live_();
    if (!ctx) return this.silent<WhirVoice>(null, () => ({ set: () => {} }));
    const c = this.chain(ctx, 0);
    const s = this.noiseSrc(ctx, c, true);
    const lp = this.filter(ctx, c, 'lowpass', 180);
    const g = this.gain(ctx, c, 0);
    s.connect(lp).connect(g).connect(c.bus);
    this.startNoise(s, ctx.currentTime);
    let stopped = false;
    const v: WhirVoice = {
      set: (w) => {
        if (stopped) return;
        const now = ctx.currentTime;
        const a = Math.abs(w);
        lp.frequency.setTargetAtTime(180 + 1.1 * a, now, 0.03);
        g.gain.setTargetAtTime(0.05 * smooth(100, 810, a), now, 0.03);
      },
      stop: (fadeMs = 200) => {
        if (stopped) return;
        stopped = true;
        this.release(v);
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0, now, fadeMs / 3000);
        s.stop(now + fadeMs / 1000 + 0.05);
      },
    };
    return this.track(v);
  }

  /** Tekan tombol utama. */
  press(): void {
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0);
    this.tone(ctx, c, t, { f: 620, peak: 0.08, attack: 0.002, decay: 0.03 });
    this.click(ctx, c, t, 0.03, 3000, 2, 0.002);
  }

  /** Ketik digit PIN. */
  key(): void {
    const ctx = this.live_();
    if (!ctx) return;
    this.tone(ctx, this.chain(ctx, 0), ctx.currentTime, { f: 880, peak: 0.06, attack: 0.002, decay: 0.025 });
  }

  /** Ratchet wind-up: tiga klik 70ms, tiap klik 5% lebih rendah. */
  windup(): void {
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0.1);
    for (let i = 0; i < 3; i++) this.click(ctx, c, t + i * 0.07, 0.12, 1900 * 0.95 ** i, 6, 0.01);
  }

  /** Whoosh saat roda lepas. Caption [wuuush]. */
  whoosh(): void {
    this.caption('whoosh');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx);
    const s = this.noiseSrc(ctx, c);
    const bp = this.filter(ctx, c, 'bandpass', 250, 1.2);
    bp.frequency.setValueAtTime(250, t);
    bp.frequency.exponentialRampToValueAtTime(1600, t + 0.28);
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.04);
    g.gain.linearRampToValueAtTime(0, t + 0.44);
    s.connect(bp).connect(g).connect(c.bus);
    this.startNoise(s, t, 0.45);
  }

  /** Not boot. Tanpa argumen: tangga C mayor penuh 45ms per not; dengan i: satu not. */
  boot(i?: number): void {
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx);
    const notes = i === undefined ? BOOT_NOTES : [BOOT_NOTES[((i % 8) + 8) % 8]];
    notes.forEach((f, n) => this.tone(ctx, c, t + n * 0.045, { f, peak: 0.06, attack: 0.003, decay: 0.12 }));
  }

  /** "Ting" berhenti palsu saat hold. rescue = nada lebih rendah. */
  land(rescue = false): void {
    const ctx = this.live_();
    if (!ctx) return;
    this.tone(ctx, this.chain(ctx), ctx.currentTime, { f: rescue ? 659 : 1318, peak: 0.06, attack: 0.002, decay: 0.06 });
  }

  /** Empat kilau acak. Captionnya dari hope(). */
  sparkle(): void {
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0.3);
    const notes = [1760, 2217, 2637, 2960].sort(() => Math.random() - 0.5);
    notes.forEach((f, n) => this.tone(ctx, c, t + n * 0.09, { f, peak: 0.05, attack: 0.003, decay: 0.3 }));
  }

  /** Nada harapan yang ditahan selama hold; droop() saat creep. Caption [bling bling]. */
  hope(): HopeVoice {
    this.caption('sparkle');
    const ctx = this.live_();
    if (!ctx) return this.silent<HopeVoice>('sparkle', (stop) => ({ droop: stop }));
    const c = this.chain(ctx, 0.25);
    const t = ctx.currentTime;
    const osc = c.src(ctx.createOscillator());
    osc.frequency.value = 880;
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.04, t + 0.3);
    osc.connect(g).connect(c.bus);
    osc.start(t);
    let done = false;
    const end = (fade: number, droop: boolean) => {
      if (done) return;
      done = true;
      this.release(v);
      this.caption('sparkle', 'end');
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      if (droop) osc.frequency.exponentialRampToValueAtTime(830, now + 0.6);
      g.gain.linearRampToValueAtTime(0, now + fade);
      osc.stop(now + fade + 0.05);
    };
    const v: HopeVoice = { droop: () => end(0.6, true), stop: (fadeMs = 60) => end(fadeMs / 1000, false) };
    return this.track(v);
  }

  /** Pad finale (A mayor) + sapuan jet, naik selama swellMs. cut() = putus 10ms. Caption [musik ngarep]. */
  pad(swellMs = 1800): PadVoice {
    this.caption('pad');
    const ctx = this.live_();
    if (!ctx) return this.silent<PadVoice>('pad', (stop) => ({ cut: stop }));
    const c = this.chain(ctx, 0.3);
    const t = ctx.currentTime;
    const swell = Math.max(0.1, swellMs / 1000);
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + swell);
    g.connect(c.bus);
    const oscs = [220, 277.18, 329.63].map((f) => {
      const o = c.src(ctx.createOscillator());
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(g);
      o.start(t);
      return o;
    });
    const jet = this.noiseSrc(ctx, c, true);
    const lp = this.filter(ctx, c, 'lowpass', 400);
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.linearRampToValueAtTime(1200, t + swell);
    const jg = this.gain(ctx, c);
    jg.gain.setValueAtTime(0, t);
    jg.gain.linearRampToValueAtTime(0.03, t + swell);
    jet.connect(lp).connect(jg).connect(c.bus);
    this.startNoise(jet, t);
    let done = false;
    const end = (fade: number) => {
      if (done) return;
      done = true;
      this.release(v);
      this.caption('pad', 'end');
      const now = ctx.currentTime;
      for (const p of [g.gain, jg.gain]) {
        p.cancelScheduledValues(now);
        p.setValueAtTime(p.value, now);
        p.linearRampToValueAtTime(0, now + fade);
      }
      for (const o of oscs) o.stop(now + fade + 0.03);
      jet.stop(now + fade + 0.03);
    };
    const v: PadVoice = { cut: () => end(0.01), stop: (fadeMs = 300) => end(fadeMs / 1000) };
    return this.track(v);
  }

  /** Detak jantung dengan penjadwal lookahead (setInterval 25ms, 100ms ke depan). Caption [deg-degan]. */
  heartbeat(bpm = 72): HeartbeatVoice {
    this.caption('heartbeat');
    const ctx = this.live_();
    if (!ctx) return this.silent<HeartbeatVoice>('heartbeat', () => ({ setBpm: () => {} }));
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(this.dry!);
    let from = bpm;
    let to = bpm;
    let rampAt = ctx.currentTime;
    let rampDur = 0;
    const bpmAt = (time: number) => (rampDur <= 0 ? to : from + (to - from) * Math.min(1, Math.max(0, (time - rampAt) / rampDur)));
    const beat = (time: number) => {
      const c = this.chain(ctx, 0, bus);
      this.tone(ctx, c, time, { f: 58, peak: 0.5, attack: 0.004, decay: 0.09 });
      this.tone(ctx, c, time + 0.18, { f: 52, peak: 0.38, attack: 0.004, decay: 0.07 });
    };
    let next = ctx.currentTime + 0.05;
    const timer = setInterval(() => {
      const now = ctx.currentTime;
      if (next < now) next = now + 0.02;
      while (next < now + 0.1) {
        beat(next);
        next += 60 / Math.max(20, bpmAt(next));
      }
    }, 25);
    let done = false;
    const v: HeartbeatVoice = {
      setBpm: (b, rampMs = 1000) => {
        from = bpmAt(ctx.currentTime);
        to = b;
        rampAt = ctx.currentTime;
        rampDur = rampMs / 1000;
      },
      stop: (fadeMs = 10) => {
        if (done) return;
        done = true;
        clearInterval(timer);
        this.release(v);
        this.caption('heartbeat', 'end');
        const now = ctx.currentTime;
        bus.gain.setTargetAtTime(0, now, Math.max(0.001, fadeMs / 3000));
        setTimeout(() => {
          try {
            bus.disconnect();
          } catch {
            // sudah terputus
          }
        }, fadeMs + 600);
      },
    };
    return this.track(v);
  }

  /** Derit saat rayapan/struggle, naik ke `peak` dalam rampMs; dip() saat backslip. Caption [kriet...]. */
  creak({ peak = 0.1, rampMs = 1350 }: { peak?: number; rampMs?: number } = {}): CreakVoice {
    this.caption('creak');
    const ctx = this.live_();
    if (!ctx) return this.silent<CreakVoice>('creak', () => ({ dip: () => {} }));
    const c = this.chain(ctx, 0.15);
    const t = ctx.currentTime;
    const saw = c.src(ctx.createOscillator());
    saw.type = 'sawtooth';
    saw.frequency.value = 82;
    const lfo = c.src(ctx.createOscillator());
    lfo.frequency.value = 9;
    const depth = this.gain(ctx, c, 6);
    lfo.connect(depth).connect(saw.frequency);
    const bp = this.filter(ctx, c, 'bandpass', 700, 9);
    const g = this.gain(ctx, c);
    const rampEnd = t + Math.max(0.05, rampMs / 1000);
    const level = (time: number) => peak * Math.min(1, Math.max(0, (time - t) / (rampEnd - t)));
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, rampEnd);
    saw.connect(bp).connect(g).connect(c.bus);
    saw.start(t);
    lfo.start(t);
    let done = false;
    const v: CreakVoice = {
      dip: () => {
        if (done) return;
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(level(now), now);
        g.gain.linearRampToValueAtTime(level(now + 0.04) * 0.6, now + 0.04);
        g.gain.linearRampToValueAtTime(level(now + 0.12), now + 0.12);
        if (rampEnd > now + 0.12) g.gain.linearRampToValueAtTime(peak, rampEnd);
      },
      stop: (fadeMs = 30) => {
        if (done) return;
        done = true;
        this.release(v);
        this.caption('creak', 'end');
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(level(now), now);
        g.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
        saw.stop(now + fadeMs / 1000 + 0.03);
        lfo.stop(now + fadeMs / 1000 + 0.03);
      },
    };
    return this.track(v);
  }

  /** Klik jatuh ke potong land. Caption [klik]. */
  snap(): void {
    this.caption('snap');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx);
    this.click(ctx, c, t, 0.5, 2600);
    this.tone(ctx, c, t, { f: 160, f2: 70, glide: 0.09, peak: 0.35, attack: 0.002, decay: 0.12 });
    const s = this.noiseSrc(ctx, c);
    const hp = this.filter(ctx, c, 'highpass', 5000);
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.025);
    s.connect(hp).connect(g).connect(c.bus);
    this.startNoise(s, t, 0.03);
  }

  /** Scratch piringan hitam. Caption [rekaman ngerem]. */
  scratch(): void {
    this.caption('scratch');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0.1);
    const s = this.noiseSrc(ctx, c);
    const bp = this.filter(ctx, c, 'bandpass', 2800, 8);
    bp.frequency.setValueAtTime(2800, t);
    bp.frequency.exponentialRampToValueAtTime(350, t + 0.16);
    bp.frequency.exponentialRampToValueAtTime(1800, t + 0.26);
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0.4, t);
    g.gain.linearRampToValueAtTime(0, t + 0.28);
    s.connect(bp).connect(g).connect(c.bus);
    this.startNoise(s, t, 0.3);
    this.tone(ctx, c, t, { type: 'sawtooth', f: 900, f2: 120, glide: 0.2, peak: 0.08, attack: 0.002, decay: 0.2 });
  }

  /**
   * Trombon sedih (D4, C#4, C4, B3 panjang dengan vibrato), mulai delayMs dari
   * sekarang. tapeStop() memotongnya seperti kaset direm. Caption [trombon sedih].
   */
  wahwah(delayMs = 0): TromboneVoice {
    const delay = Math.max(0, delayMs);
    let capStarted = false;
    const startCaption = () => {
      capStarted = true;
      this.caption('wahwah');
    };
    const capTimer = delay > 0 ? setTimeout(startCaption, delay) : null;
    if (!capTimer) startCaption();
    // Caption "end" hanya kalau "start" sudah keluar (tidak ada caption nyangkut).
    const endCaption = () => {
      if (capTimer) clearTimeout(capTimer);
      if (capStarted) this.caption('wahwah', 'end');
      capStarted = false;
    };
    const total = WAHWAH.reduce((sum, n) => sum + n.ms, 0) + 200;
    const ctx = this.live_();
    if (!ctx) {
      // Tanpa suara: caption tetap jalan sepanjang durasi trombon.
      let over = false;
      const finishSilent = () => {
        if (over) return;
        over = true;
        clearTimeout(autoEnd);
        endCaption();
      };
      const autoEnd = setTimeout(finishSilent, delay + total);
      return {
        tapeStop: () => {
          if (over) return;
          finishSilent();
          this.caption('scratch');
        },
        stop: finishSilent,
      };
    }
    const c = this.chain(ctx, 0.15);
    const t0 = ctx.currentTime + delay / 1000;
    const osc = c.src(ctx.createOscillator());
    osc.type = 'sawtooth';
    const lp = this.filter(ctx, c, 'lowpass', 350, 6);
    const g = this.gain(ctx, c);
    const lfo = c.src(ctx.createOscillator());
    lfo.frequency.value = 5.5;
    const vib = this.gain(ctx, c, 0);
    lfo.connect(vib).connect(osc.frequency);

    let t = t0;
    const starts: { t: number; f: number }[] = [];
    g.gain.setValueAtTime(0, t0);
    WAHWAH.forEach((n, i) => {
      const dur = n.ms / 1000;
      starts.push({ t, f: n.f });
      if (i === 0) {
        osc.frequency.setValueAtTime(n.f, t);
      } else {
        // Portamento 30ms: jangkar di nada sebelumnya supaya ramp tidak sepanjang not.
        osc.frequency.setValueAtTime(WAHWAH[i - 1].f, t);
        osc.frequency.linearRampToValueAtTime(n.f, t + 0.03);
      }
      lp.frequency.setValueAtTime(350, t);
      lp.frequency.linearRampToValueAtTime(1400, t + 0.08);
      lp.frequency.linearRampToValueAtTime(600, t + dur);
      g.gain.linearRampToValueAtTime(0.22, t + 0.02);
      if (i < WAHWAH.length - 1) g.gain.linearRampToValueAtTime(0.16, t + dur - 0.01);
      t += dur;
    });
    const last = starts[starts.length - 1];
    // Vibrato 18 cent di not terakhir, mulai +200ms.
    vib.gain.setValueAtTime(0, last.t + 0.2);
    vib.gain.linearRampToValueAtTime(last.f * (2 ** (18 / 1200) - 1), last.t + 0.35);
    g.gain.setTargetAtTime(0, t - 0.15, 0.06);
    osc.connect(lp).connect(g).connect(c.bus);
    osc.start(t0);
    lfo.start(t0);
    const endAt = t + 0.2;
    osc.stop(endAt);
    lfo.stop(endAt);
    const freqAt = (time: number) => {
      let f = starts[0].f;
      for (const s of starts) if (time >= s.t) f = s.f;
      return f;
    };
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(endTimer);
      this.release(v);
      endCaption();
    };
    const endTimer = setTimeout(finish, Math.max(0, (endAt - ctx.currentTime) * 1000));
    const v: TromboneVoice = {
      tapeStop: () => {
        if (done) return;
        finish();
        this.caption('scratch');
        const now = ctx.currentTime;
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.setValueAtTime(freqAt(now), now);
        osc.frequency.setTargetAtTime(freqAt(now) * 0.35, now, 0.09);
        vib.gain.cancelScheduledValues(now);
        vib.gain.setValueAtTime(0, now);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(now < t0 ? 0 : 0.22, now);
        g.gain.linearRampToValueAtTime(0, now + 0.32);
        try {
          osc.stop(now + 0.36);
          lfo.stop(now + 0.36);
        } catch {
          // sudah dijadwalkan berhenti
        }
        // Gesekan pita: noise lowpass 200Hz 200ms.
        const c2 = this.chain(ctx, 0);
        const s = this.noiseSrc(ctx, c2);
        const lp2 = this.filter(ctx, c2, 'lowpass', 200);
        const g2 = this.gain(ctx, c2);
        g2.gain.setValueAtTime(0.25, now);
        g2.gain.linearRampToValueAtTime(0, now + 0.2);
        s.connect(lp2).connect(g2).connect(c2.bus);
        this.startNoise(s, now, 0.22);
      },
      stop: (fadeMs = 120) => {
        if (done) return;
        finish();
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(now < t0 ? 0 : 0.22, now);
        g.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
        try {
          osc.stop(now + fadeMs / 1000 + 0.03);
          lfo.stop(now + fadeMs / 1000 + 0.03);
        } catch {
          // sudah dijadwalkan berhenti
        }
      },
    };
    return this.track(v);
  }

  /** ZONK naik jadi voucher: glissando + ding. Caption [TING!]. */
  upgrade(): void {
    this.caption('upgrade');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx);
    this.tone(ctx, c, t, { f: 600, f2: 1800, glide: 0.3, peak: 0.14, attack: 0.02, decay: 0.34 });
    this.tone(ctx, c, t, { type: 'triangle', f: 1200, f2: 3600, glide: 0.3, peak: 0.06, attack: 0.02, decay: 0.34 });
    this.tone(ctx, this.chain(ctx, 0.3), t + 0.3, { f: 2637, peak: 0.12, attack: 0.002, decay: 0.6 });
  }

  /** Lonceng 100K. Caption [ting-ting]. */
  chime100(): void {
    this.caption('chime100');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0.25);
    [659.25, 830.61, 987.77, 1318.51].forEach((f, i) =>
      this.tone(ctx, c, t + i * 0.06, { type: 'triangle', f, peak: 0.12, attack: 0.004, decay: 0.38 }),
    );
    // Kilau E7 dengan tremolo 6Hz.
    const osc = c.src(ctx.createOscillator());
    osc.frequency.value = 2637;
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.04, t + 0.05);
    g.gain.linearRampToValueAtTime(0, t + 0.6);
    const trem = c.src(ctx.createOscillator());
    trem.frequency.value = 6;
    const depth = this.gain(ctx, c, 0.02);
    trem.connect(depth).connect(g.gain);
    osc.connect(g).connect(c.bus);
    osc.start(t);
    trem.start(t);
    osc.stop(t + 0.62);
    trem.stop(t + 0.62);
  }

  /** Dentum 600K. Caption [DUM]. */
  impact(): void {
    this.caption('impact');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0.2);
    this.tone(ctx, c, t, { f: 70, f2: 42, glide: 0.22, peak: 0.6, attack: 0.004, decay: 0.42 });
    const s = this.noiseSrc(ctx, c);
    const hp = this.filter(ctx, c, 'highpass', 3000);
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.9);
    s.connect(hp).connect(g).connect(c.bus);
    this.startNoise(s, t, 0.92);
  }

  /** Tik penghitung angka (setiap 50.000 atau 100.000). */
  counterTick(): void {
    const ctx = this.live_();
    if (!ctx) return;
    this.click(ctx, this.chain(ctx, 0), ctx.currentTime, 0.07, 3400);
  }

  private arp(ctx: AudioContext, c: Chain, t: number, notes: readonly number[], step: number, peak: number) {
    const lp = this.filter(ctx, c, 'lowpass', 3200);
    lp.connect(c.bus);
    notes.forEach((f, i) => {
      const at = t + i * step;
      const osc = c.src(ctx.createOscillator());
      if (this.periodic) osc.setPeriodicWave(this.periodic);
      osc.frequency.value = f;
      const g = this.gain(ctx, c);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.005);
      g.gain.exponentialRampToValueAtTime(FLOOR, at + 0.5);
      osc.connect(g).connect(lp);
      osc.start(at);
      osc.stop(at + 0.53);
    });
  }

  private padChord(ctx: AudioContext, c: Chain, t: number, releaseS: number) {
    const lp = this.filter(ctx, c, 'lowpass', 1600);
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.25);
    g.gain.setValueAtTime(0.08, t + 0.85);
    g.gain.linearRampToValueAtTime(0, t + 0.85 + releaseS);
    lp.connect(g).connect(c.bus);
    for (const f of FANFARE_PAD) {
      for (const cents of [-6, 6]) {
        const o = c.src(ctx.createOscillator());
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = cents;
        const og = this.gain(ctx, c, 0.35);
        o.connect(og).connect(lp);
        o.start(t);
        o.stop(t + 0.9 + releaseS);
      }
    }
  }

  private fanfareCore(ctx: AudioContext, t: number, padRelease: number) {
    const c = this.chain(ctx, 0.3);
    this.arp(ctx, c, t, FANFARE_ARP, 0.055, 0.1);
    this.padChord(ctx, c, t + FANFARE_ARP.length * 0.055, padRelease);
  }

  /** Fanfare 600K, sekitar 2,6 detik. Caption [fanfare]. */
  fanfare600(): void {
    this.caption('fanfare600');
    const ctx = this.live_();
    if (!ctx) return;
    this.fanfareCore(ctx, ctx.currentTime, 1.6);
  }

  /** Fanfare finale: fanfare + arpeggio naik satu nada + 3 lonceng FM, sekitar 4 detik. Caption [fanfare, versi niat]. */
  finale(): void {
    this.caption('finale');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.fanfareCore(ctx, t, 3);
    const c = this.chain(ctx, 0.35);
    const t2 = t + 0.4;
    this.arp(
      ctx,
      c,
      t2,
      FANFARE_ARP.map((f) => f * WHOLE_STEP),
      0.055,
      0.09,
    );
    for (const off of [0, 0.18, 0.36]) {
      const at = t2 + off;
      const car = c.src(ctx.createOscillator());
      car.frequency.value = 1046.5;
      const modOsc = c.src(ctx.createOscillator());
      const mf = 1046.5 * 3.5;
      modOsc.frequency.value = mf;
      const idx = this.gain(ctx, c);
      idx.gain.setValueAtTime(6 * mf, at);
      idx.gain.linearRampToValueAtTime(0, at + 1.2);
      modOsc.connect(idx).connect(car.frequency);
      const g = this.gain(ctx, c);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.07, at + 0.003);
      g.gain.exponentialRampToValueAtTime(FLOOR, at + 1.4);
      car.connect(g).connect(c.bus);
      car.start(at);
      modOsc.start(at);
      car.stop(at + 1.45);
      modOsc.stop(at + 1.45);
    }
  }

  /** Stempel karet. Caption [jedug]. */
  stamp(): void {
    this.caption('stamp');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0.12);
    this.tone(ctx, c, t, { f: 110, f2: 55, glide: 0.12, peak: 0.4, attack: 0.002, decay: 0.16 });
    const s = this.noiseSrc(ctx, c);
    const lp = this.filter(ctx, c, 'lowpass', 600);
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.08);
    s.connect(lp).connect(g).connect(c.bus);
    this.startNoise(s, t, 0.09);
  }

  /** Hadiah masuk slot dok. */
  pop(): void {
    const ctx = this.live_();
    if (!ctx) return;
    this.tone(ctx, this.chain(ctx, 0), ctx.currentTime, { f: 880, f2: 1320, glide: 0.06, peak: 0.06, attack: 0.003, decay: 0.07 });
  }

  /** PIN benar. */
  pinOk(): void {
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx);
    this.click(ctx, c, t, 0.25, 2600);
    this.tone(ctx, c, t, { f: 783.99, peak: 0.08, attack: 0.003, decay: 0.09 });
    this.tone(ctx, c, t + 0.09, { f: 1174.66, peak: 0.08, attack: 0.003, decay: 0.12 });
  }

  /** PIN salah. Caption [tetot]. */
  pinWrong(): void {
    this.caption('nope');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0);
    const lp = this.filter(ctx, c, 'lowpass', 900);
    lp.connect(c.bus);
    this.square(ctx, c, t, 150, 0.09, 0.12, lp);
    this.square(ctx, c, t + 0.15, 120, 0.12, 0.12, lp);
  }

  private square(ctx: AudioContext, c: Chain, t: number, f: number, dur: number, peak: number, to: AudioNode) {
    const o = c.src(ctx.createOscillator());
    o.type = 'square';
    o.frequency.value = f;
    const g = this.gain(ctx, c);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.setValueAtTime(peak, t + dur - 0.01);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(to);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Kode tersalin: dua tik 40ms. */
  copy(): void {
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0);
    this.click(ctx, c, t, 0.12, 4200);
    this.click(ctx, c, t + 0.04, 0.12, 4200);
  }

  /**
   * Penolakan (Putar lagi, Skip). soft = versi pelan untuk Skip, tanpa caption
   * (kembarannya toast, dan caption putaran yang sedang jalan tidak tertimpa).
   */
  nope(soft = false): void {
    if (!soft) this.caption('nope');
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0);
    const lp = this.filter(ctx, c, 'lowpass', 1200);
    lp.connect(c.bus);
    const peak = soft ? 0.05 : 0.09;
    this.square(ctx, c, t, 440, 0.11, peak, lp);
    this.square(ctx, c, t + 0.11, 329.63, 0.11, peak, lp);
  }

  /** Achievement terbuka. */
  achievement(): void {
    const ctx = this.live_();
    if (!ctx) return;
    const t = ctx.currentTime;
    const c = this.chain(ctx, 0.25);
    this.tone(ctx, c, t, { type: 'triangle', f: 1318.5, peak: 0.08, attack: 0.003, decay: 0.3 });
    this.tone(ctx, c, t + 0.1, { type: 'triangle', f: 1975.5, peak: 0.08, attack: 0.003, decay: 0.3 });
  }
}

/** Satu mesin suara per tab. Tidak menyentuh window sampai unlock() dipanggil. */
export const sfx = new SfxEngine();

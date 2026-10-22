'use client';

import { AnimatePresence, m } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react';
import { PIN_LENGTH, type GachaState } from '@/lib/gacha/config';
import styles from '../gacha.module.css';
import { unlockAction } from '../actions';
import { PIN } from './copy';
import { formatMmSs } from './format';
import { haptics } from './haptics';
import { sfx } from './sfx';
import { PinStamp, type PinStampKind } from './stamp';

// Kartu PIN (DESIGN 4.3). Selalu ter-mount selama status `locked`, juga di
// cover (tak terlihat tapi bisa difokus), supaya fokus sinkron dari tombol
// cover membuka keyboard iOS dalam satu tap. Satu <input> asli direntang di
// atas baris slot; slot hanya cermin aria-hidden.

type Status = 'idle' | 'checking' | 'wrong' | 'lock' | 'ok';
type Tone = 'neutral' | 'error' | 'ok';

const AUTO_SUBMIT_MS = 120;
const STAMP_HOLD_MS = 900;
const STAMP_LIFT_MS = 240;
const CLEAR_STEP_MS = 40;
const OK_HOLD_MS = 360;
const SHAKE = [0, -14, 12, -9, 6, -3, 0];

export type PinCardProps = {
  visible: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Pesan awal (mis. sesi habis di tengah jalan). */
  notice: string | null;
  reduced: boolean;
  onClose(): void;
  /** Dipanggil 360ms setelah SAH; kartu lalu keluar lewat AnimatePresence pemanggil. */
  onUnlocked(state: GachaState): void;
  onNotReady(): void;
  /** Wilayah aria-live assertive (PIN salah, loket tutup). */
  alert(msg: string): void;
};

export function PinCard(p: PinCardProps) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [stamp, setStamp] = useState<PinStampKind | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: Tone } | null>(p.notice ? { text: p.notice, tone: 'neutral' } : null);
  const [focused, setFocused] = useState(false);
  const [popAt, setPopAt] = useState<{ i: number; n: number } | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(0);

  const titleId = useId();
  const hintId = useId();
  const msgId = useId();
  const rowRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const lastMinuteRef = useRef<number | null>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
      if (submitTimer.current) clearTimeout(submitTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (p.notice) setMessage({ text: p.notice, tone: 'neutral' });
  }, [p.notice]);

  // Hitung mundur loket (satu-satunya timer saat diam), dari selisih Date.now().
  useEffect(() => {
    if (lockedUntil === null) return;
    const step = () => {
      const now = Date.now();
      setNowTs(now);
      const left = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
      const minutes = Math.ceil(left / 60);
      if (left > 0 && minutes !== lastMinuteRef.current) {
        lastMinuteRef.current = minutes;
        p.alert(PIN.lockoutSr(minutes));
      }
      if (left <= 0) {
        setLockedUntil(null);
        lastMinuteRef.current = null;
        setStamp(null);
        setStatus('idle');
        setValue('');
        setMessage({ text: PIN.lockoutEnd, tone: 'neutral' });
        busyRef.current = false;
        requestAnimationFrame(() => p.inputRef.current?.focus({ preventScroll: true }));
      }
    };
    step();
    const id = setInterval(step, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]); // eslint-disable-line react-hooks/exhaustive-deps

  const shake = () => {
    const row = rowRef.current;
    if (!row || p.reduced || typeof row.animate !== 'function') return;
    row.animate(
      SHAKE.map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 420, easing: 'ease-out' },
    );
  };

  const clearRightToLeft = (from: string, done: () => void) => {
    let n = from.length;
    if (n === 0) return done();
    const tick = () => {
      n -= 1;
      setValue(from.slice(0, n));
      if (n > 0) later(tick, CLEAR_STEP_MS);
      else done();
    };
    later(tick, 0);
  };

  async function submit(pin: string) {
    if (busyRef.current || pin.length !== PIN_LENGTH) return;
    busyRef.current = true;
    setStatus('checking');
    setMessage({ text: PIN.checking, tone: 'neutral' });
    let res: Awaited<ReturnType<typeof unlockAction>>;
    try {
      res = await unlockAction(pin);
    } catch {
      busyRef.current = false;
      setStatus('idle');
      setMessage({ text: PIN.network, tone: 'error' });
      return;
    }
    if (res.ok) {
      setStatus('ok');
      setStamp('ok');
      setMessage({ text: PIN.success, tone: 'ok' });
      sfx.pinOk();
      haptics.play('pinOk');
      p.inputRef.current?.blur();
      const state = res.state;
      later(() => p.onUnlocked(state), OK_HOLD_MS);
      return;
    }
    if (res.state?.status === 'not_ready') {
      busyRef.current = false;
      p.onNotReady();
      return;
    }
    if (res.retryAfterSec && res.retryAfterSec > 0) {
      setStatus('lock');
      setStamp('lock');
      setMessage({ text: PIN.lockout, tone: 'error' });
      sfx.pinWrong();
      haptics.play('pinWrong');
      shake();
      lastMinuteRef.current = null;
      setLockedUntil(Date.now() + res.retryAfterSec * 1000);
      return;
    }
    // PIN salah: stempel TIDAK SAH, getar, lalu digit dihapus kanan ke kiri.
    setStatus('wrong');
    setStamp('wrong');
    setMessage({ text: PIN.wrong, tone: 'error' });
    p.alert(PIN.wrong);
    sfx.pinWrong();
    haptics.play('pinWrong');
    shake();
    later(() => {
      setStamp(null);
      later(
        () =>
          clearRightToLeft(pin, () => {
            setStatus('idle');
            busyRef.current = false;
            p.inputRef.current?.focus({ preventScroll: true });
          }),
        STAMP_LIFT_MS,
      );
    }, STAMP_HOLD_MS);
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (busyRef.current) return;
    const digits = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    sfx.unlock();
    if (digits.length > value.length) {
      sfx.key();
      setPopAt({ i: digits.length - 1, n: (popAt?.n ?? 0) + 1 });
    }
    setValue(digits);
    if (status === 'idle' && message?.tone === 'error') setMessage(null);
    if (submitTimer.current) clearTimeout(submitTimer.current);
    submitTimer.current = null;
    if (digits.length === PIN_LENGTH) {
      // Jeda 120ms supaya digit keenam sempat terlihat.
      submitTimer.current = setTimeout(() => void submit(digits), AUTO_SUBMIT_MS);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sfx.unlock();
    if (submitTimer.current) clearTimeout(submitTimer.current);
    submitTimer.current = null;
    if (value.length === PIN_LENGTH) void submit(value);
    else p.inputRef.current?.focus({ preventScroll: true });
  };

  const locked = status === 'lock';
  const leftSec = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - (nowTs || Date.now())) / 1000)) : 0;
  const active = focused && status === 'idle' ? Math.min(value.length, PIN_LENGTH - 1) : -1;

  return (
    <m.section
      className={styles.pinCard}
      aria-labelledby={titleId}
      data-visible={p.visible ? '' : undefined}
      initial={false}
      animate={p.visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.24, ease: 'easeOut' } }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className={styles.pinHead}>
          <h2 id={titleId} className={styles.tTitle2}>
            {PIN.title}
          </h2>
          <button type="button" className={styles.iconButton} aria-label={PIN.close} onClick={p.onClose} tabIndex={p.visible ? 0 : -1}>
            <X size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <p className={`${styles.tBody} ${styles.text2}`}>{PIN.body}</p>
        <p id={hintId} className={`${styles.tFootnote} ${styles.text3}`}>
          {PIN.hint}
        </p>
        <label htmlFor="pin" className={`${styles.tOverline} ${styles.text2} ${styles.pinLabel}`}>
          {PIN.label}
        </label>
        <div className={styles.pinRowWrap}>
          <div ref={rowRef} className={styles.pinRow} data-status={status} aria-hidden="true">
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <span
                key={popAt?.i === i ? `p${popAt.n}` : `s${i}`}
                className={`${styles.pinSlot} ${styles.tPin} ${popAt?.i === i ? styles.pinSlotPop : ''}`}
                data-active={i === active ? '' : undefined}
                data-filled={i < value.length ? '' : undefined}
                style={{ transitionDelay: status === 'ok' ? `${i * 40}ms` : undefined }}
              >
                {value[i] ?? ''}
                {i === active && value.length < PIN_LENGTH && <span className={`${styles.pinCaret} ${styles.fxCaret}`} />}
              </span>
            ))}
            {status === 'checking' && <span className={`${styles.pinScan} ${styles.fxPinScan}`} />}
          </div>
          <input
            ref={p.inputRef}
            id="pin"
            name="pin"
            className={styles.pinInput}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            enterKeyHint="go"
            // Lebih longgar dari 6 supaya tempel "12 09 91" atau "123-456" tidak terpotong
            // browser sebelum onChange membuang yang bukan angka.
            maxLength={PIN_LENGTH * 2}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            readOnly={status === 'checking' || status === 'wrong' || status === 'ok'}
            disabled={locked}
            tabIndex={p.visible ? 0 : -1}
            aria-describedby={`${hintId} ${msgId}`}
            spellCheck={false}
            autoCorrect="off"
          />
          <AnimatePresence>{stamp && <PinStamp key={stamp} kind={stamp} />}</AnimatePresence>
        </div>
        <div className={styles.pinMsgRow}>
          <p id={msgId} className={`${styles.tFootnote} ${styles.pinMsg}`} data-tone={message?.tone}>
            {message?.text ?? ''}
          </p>
          {locked && lockedUntil && (
            <span className={`${styles.lockCapsule} ${styles.tFootnote}`} aria-hidden="true">
              <Lock size={14} strokeWidth={1.75} />
              {PIN.lockoutCapsule(formatMmSs(leftSec))}
            </span>
          )}
        </div>
        <button
          type="submit"
          className={`${styles.cta} ${styles.ctaCompact}`}
          aria-disabled={value.length < PIN_LENGTH || status !== 'idle' ? 'true' : undefined}
          disabled={locked}
          tabIndex={p.visible ? 0 : -1}
        >
          {PIN.cta}
        </button>
      </form>
    </m.section>
  );
}

/**
 * Keyboard virtual terbuka (layar PIN di HP): visualViewport jauh lebih pendek
 * dari tinggi jendela terbesar yang pernah terlihat. Dipakai untuk melipat bar atas.
 */
export function useKeyboardOpen(enabled: boolean): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!enabled || !vv) {
      setOpen(false);
      return;
    }
    let maxH = window.innerHeight;
    const check = () => {
      maxH = Math.max(maxH, window.innerHeight);
      setOpen(vv.height < maxH * 0.75);
    };
    const onOrient = () => {
      maxH = window.innerHeight;
      check();
    };
    check();
    vv.addEventListener('resize', check);
    window.addEventListener('orientationchange', onOrient);
    return () => {
      vv.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', onOrient);
    };
  }, [enabled]);
  return open;
}

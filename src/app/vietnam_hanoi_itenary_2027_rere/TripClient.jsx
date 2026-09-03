"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Backpack,
    Car,
    Check,
    ChevronDown,
    Map,
    RotateCcw,
    Share2,
    Sparkles,
    Umbrella,
    UtensilsCrossed,
    Wallet,
    X,
} from "lucide-react";

import {
    BUDGET,
    CONTINGENCY,
    DAYS,
    FOOD_SECTIONS,
    HERO_IMG,
    OWN_PHOTOS,
    PACKING,
    PHOTO_CREDITS,
    SCAM_CREDIT,
    SCAMS,
    SIFAT,
    TIPS,
    TRIP,
} from "./data";

/* ============================ helpers ============================ */

const STORE_KEY = "vn-rere-2027:v1";
const cx = (...c) => c.filter(Boolean).join(" ");

/* Semua foto disimpan dua versi: "<nama>.jpg" (besar, untuk lightbox)
   dan "<nama>-t.jpg" (256x256, untuk thumbnail kartu). */
const IMG = (n) => `/vietnam-2027/${n}.jpg`;
const THUMB = (n) => `/vietnam-2027/${n}-t.jpg`;

const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const rp = (n) => "Rp " + group(n);
const vnd = (n) => "₫ " + group(n);

function localISO(d = new Date()) {
    const p = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const TABS = [
    { id: "trip", label: "Rute", Icon: Map, emoji: "🗺️" },
    { id: "food", label: "Kuliner", Icon: UtensilsCrossed, emoji: "🍜" },
    { id: "budget", label: "Budget", Icon: Wallet, emoji: "💸" },
    { id: "prep", label: "Persiapan", Icon: Backpack, emoji: "🎒" },
    { id: "planb", label: "Plan B", Icon: Umbrella, emoji: "🌧️" },
];

const TOTAL_ITEMS = DAYS.reduce((a, d) => a + d.items.length, 0);

/* ============================ page ============================ */

export default function TripClient() {
    const [mounted, setMounted] = useState(false);
    const [tab, setTab] = useState("trip");
    const [activeDay, setActiveDay] = useState(1);
    const [checks, setChecks] = useState({});
    const [now, setNow] = useState(null);
    const [toast, setToast] = useState("");
    const [burst, setBurst] = useState(null);
    const [zoom, setZoom] = useState(null); // { photo, caption, own } — foto yang dibuka penuh

    const stripRef = useRef(null);
    const chipRefs = useRef({});
    const prevDone = useRef(null);

    /* --- boot: restore progress + lompat ke hari ini --- */
    useEffect(() => {
        setMounted(true);
        setNow(Date.now());
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) setChecks(JSON.parse(raw) || {});
        } catch {
            /* localStorage diblok / private mode — jalan tanpa progress tersimpan */
        }
        const today = localISO();
        const d = DAYS.find((x) => x.date === today);
        if (d) setActiveDay(d.id);
    }, []);

    /* --- jam hidup buat countdown --- */
    useEffect(() => {
        if (!mounted) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [mounted]);

    /* --- geser chip hari yang aktif ke tengah --- */
    useEffect(() => {
        const el = chipRefs.current[activeDay];
        const c = stripRef.current;
        if (!el || !c) return;
        c.scrollTo({
            left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2,
            behavior: "smooth",
        });
    }, [activeDay, tab]);

    const toggle = useCallback((key) => {
        setChecks((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            if (!next[key]) delete next[key];
            try {
                localStorage.setItem(STORE_KEY, JSON.stringify(next));
            } catch {
                /* abaikan */
            }
            return next;
        });
    }, []);

    const resetAll = useCallback(() => {
        setChecks({});
        try {
            localStorage.removeItem(STORE_KEY);
        } catch {
            /* abaikan */
        }
        setToast("Progress direset 🧼");
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(""), 2200);
        return () => clearTimeout(t);
    }, [toast]);

    const day = DAYS.find((d) => d.id === activeDay) ?? DAYS[0];

    const dayDone = day.items.filter((_, i) => checks[`d${day.id}-${i}`]).length;
    const dayPct = Math.round((dayDone / day.items.length) * 100);

    const totalDone = useMemo(
        () =>
            DAYS.reduce(
                (a, d) => a + d.items.filter((_, i) => checks[`d${d.id}-${i}`]).length,
                0
            ),
        [checks]
    );

    /* --- confetti kalau satu hari kelar 100% --- */
    useEffect(() => {
        if (!mounted) return;
        const key = `${day.id}:${dayDone}`;
        if (prevDone.current === null) {
            prevDone.current = key;
            return;
        }
        const [prevDay, prevCount] = prevDone.current.split(":");
        prevDone.current = key;
        if (
            Number(prevDay) === day.id &&
            Number(prevCount) === day.items.length - 1 &&
            dayDone === day.items.length
        ) {
            setBurst(Date.now());
            setTimeout(() => setBurst(null), 1800);
        }
    }, [dayDone, day, mounted]);

    const share = useCallback(async () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        const data = {
            title: `${TRIP.title} — ${TRIP.dateLabel}`,
            text: "Itinerary lengkap Vietnam North Trip 🇻🇳",
            url,
        };
        try {
            if (navigator.share) {
                await navigator.share(data);
                return;
            }
            await navigator.clipboard.writeText(url);
            setToast("Link disalin 📋");
        } catch {
            setToast("Salin manual dari address bar ya");
        }
    }, []);

    /* --- status trip --- */
    const status = useMemo(() => {
        if (!mounted || now === null) return null;
        const today = localISO(new Date(now));
        const target = new Date(TRIP.countdownISO).getTime();
        const diff = target - now;
        if (today > TRIP.endISO) return { phase: "done" };
        const idx = DAYS.findIndex((d) => d.date === today);
        if (idx >= 0) return { phase: "live", dayId: DAYS[idx].id, dayIdx: idx + 1 };
        if (diff <= 0) return { phase: "live", dayId: 1, dayIdx: 1 };
        return {
            phase: "before",
            d: Math.floor(diff / 86400000),
            h: Math.floor(diff / 3600000) % 24,
            m: Math.floor(diff / 60000) % 60,
            s: Math.floor(diff / 1000) % 60,
        };
    }, [mounted, now]);

    return (
        // catatan: jangan tambahkan overflow-x-hidden di root — position:sticky jadi mati
        <div
            className="vn-root relative min-h-[100dvh] bg-[#FFF6EC] text-[#221C16] antialiased"
            style={{ fontFamily: "var(--font-jakarta), ui-sans-serif, system-ui, sans-serif" }}
        >
            <PageStyles />
            <Backdrop />

            {/* ---------------- header ---------------- */}
            <header className="sticky top-0 z-40 border-b border-[#EFE0CE] bg-[#FFF6EC]/85 backdrop-blur-xl">
                {/* halaman sudah tampil sebelum JS selesai; bar ini menandakan masih menyiapkan */}
                {!mounted && (
                    <span
                        aria-hidden
                        className="vn-loadbar absolute inset-x-0 bottom-[-1px] block h-[2px] overflow-hidden"
                    />
                )}
                <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#221C16] text-lg">
                        🇻🇳
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="vn-display truncate text-[15px] font-bold leading-tight">
                            Vietnam North Trip
                        </p>
                        <p className="truncate text-[10.5px] font-medium text-[#8B7B6B]">
                            13–21 Feb 2027 · {TRIP.owner}
                        </p>
                    </div>

                    {status?.phase === "live" && (
                        <button
                            onClick={() => {
                                setTab("trip");
                                setActiveDay(status.dayId);
                            }}
                            className="vn-pulse shrink-0 rounded-full bg-[#E11D48] px-2.5 py-1.5 text-[10px] font-extrabold tracking-wide text-white"
                        >
                            HARI INI
                        </button>
                    )}
                    {status?.phase === "before" && (
                        <span className="shrink-0 rounded-full border border-[#EFDCC4] bg-white px-2.5 py-1.5 text-[10px] font-extrabold tabular-nums text-[#C0362C]">
                            D-{status.d}
                        </span>
                    )}

                    <button
                        onClick={share}
                        aria-label="Bagikan link"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[#EFDCC4] bg-white text-[#221C16] active:scale-95"
                    >
                        <Share2 size={16} strokeWidth={2.4} />
                    </button>
                </div>
            </header>

            {/* ---------------- content ---------------- */}
            <main className="mx-auto max-w-3xl px-4 pb-32 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        {tab === "trip" && (
                            <TripTab
                                day={day}
                                activeDay={activeDay}
                                setActiveDay={setActiveDay}
                                checks={checks}
                                toggle={toggle}
                                dayDone={dayDone}
                                dayPct={dayPct}
                                totalDone={totalDone}
                                status={status}
                                stripRef={stripRef}
                                chipRefs={chipRefs}
                                mounted={mounted}
                                onZoom={setZoom}
                            />
                        )}
                        {tab === "food" && (
                            <FoodTab checks={checks} toggle={toggle} onZoom={setZoom} />
                        )}
                        {tab === "budget" && <BudgetTab />}
                        {tab === "prep" && (
                            <PrepTab checks={checks} toggle={toggle} onZoom={setZoom} />
                        )}
                        {tab === "planb" && <PlanBTab />}
                    </motion.div>
                </AnimatePresence>

                <Footer onReset={resetAll} />
            </main>

            {/* ---------------- bottom nav ---------------- */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-3"
                style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
                <div className="flex w-full max-w-sm items-center gap-0.5 rounded-[26px] border border-[#EADCC8] bg-white/95 p-1.5 shadow-[0_10px_30px_-8px_rgba(80,50,20,0.35)] backdrop-blur-xl">
                    {TABS.map((t) => {
                        const on = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setTab(t.id);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className={cx(
                                    "relative flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2 transition-colors",
                                    on ? "text-white" : "text-[#8B7B6B] active:bg-[#FFF1E0]"
                                )}
                            >
                                {on && (
                                    <motion.span
                                        layoutId="vn-nav"
                                        className="absolute inset-0 rounded-[20px] bg-[#221C16]"
                                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                    />
                                )}
                                <t.Icon size={17} strokeWidth={2.4} className="relative z-10" />
                                <span className="relative z-10 text-[9.5px] font-bold tracking-tight">
                                    {t.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ---------------- toast + confetti ---------------- */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#221C16] px-4 py-2 text-[12px] font-bold text-white shadow-lg"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {burst && <Confetti seed={burst} />}

            <Lightbox item={zoom} onClose={() => setZoom(null)} />
        </div>
    );
}

/* ============================ lightbox ============================ */
/* Thumbnail memang di-crop supaya rapi; di sini fotonya ditampilkan utuh
   (object-contain) jadi tidak ada bagian yang hilang. */
function Lightbox({ item, onClose }) {
    const [loaded, setLoaded] = useState(false);

    // versi penuh bisa ratusan KB — reset tiap ganti foto biar spinner-nya muncul lagi
    useEffect(() => setLoaded(false), [item?.photo]);

    useEffect(() => {
        if (!item) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [item, onClose]);

    return (
        <AnimatePresence>
            {item && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
                >
                    <button
                        onClick={onClose}
                        aria-label="Tutup foto"
                        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white active:scale-90"
                        style={{ top: "max(16px, env(safe-area-inset-top))" }}
                    >
                        <X size={20} strokeWidth={2.6} />
                    </button>

                    <motion.figure
                        initial={{ scale: 0.94, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.96, y: 8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-2xl"
                    >
                        {!loaded && (
                            <span className="flex flex-col items-center gap-2.5 px-10 py-20">
                                <span className="vn-spin block h-8 w-8 rounded-full border-[3px] border-white/25 border-t-white" />
                                <span className="text-[11px] font-semibold text-white/55">
                                    Memuat foto…
                                </span>
                            </span>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            key={item.photo}
                            src={IMG(item.photo)}
                            alt={item.caption || ""}
                            onLoad={() => setLoaded(true)}
                            onError={() => setLoaded(true)}
                            className={cx(
                                "max-h-[74vh] w-auto rounded-2xl object-contain",
                                loaded ? "block" : "hidden"
                            )}
                        />
                        <figcaption className="mt-3 text-center text-[12px] font-semibold leading-snug text-white/80">
                            {item.caption}
                            {!item.own && (
                                <span className="mt-1 block text-[10px] font-medium text-white/45">
                                    Foto ilustrasi — bukan foto tempatnya langsung
                                </span>
                            )}
                        </figcaption>
                    </motion.figure>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ============================ trip tab ============================ */

function TripTab({
    day,
    activeDay,
    setActiveDay,
    checks,
    toggle,
    dayDone,
    dayPct,
    totalDone,
    status,
    stripRef,
    chipRefs,
    mounted,
    onZoom,
}) {
    return (
        <div>
            <Hero status={status} totalDone={totalDone} mounted={mounted} />

            {/* strip hari */}
            <div className="sticky top-14 z-30 -mx-4 mt-5 bg-[#FFF6EC]/92 px-4 py-2.5 backdrop-blur-md">
                <div ref={stripRef} className="vn-noscroll flex gap-2 overflow-x-auto pb-0.5">
                    {DAYS.map((d) => {
                        const on = d.id === activeDay;
                        const done = d.items.filter((_, i) => checks[`d${d.id}-${i}`]).length;
                        const full = done === d.items.length;
                        const today = status?.phase === "live" && status.dayId === d.id;
                        return (
                            <button
                                key={d.id}
                                ref={(el) => (chipRefs.current[d.id] = el)}
                                onClick={() => setActiveDay(d.id)}
                                className={cx(
                                    "relative shrink-0 rounded-2xl border-2 px-3 py-1.5 text-left transition-all active:scale-95",
                                    on
                                        ? "border-transparent text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)]"
                                        : "border-[#EFDCC4] bg-white text-[#221C16]"
                                )}
                                style={on ? { background: d.accent } : undefined}
                            >
                                {today && (
                                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#FFF6EC] bg-[#E11D48]" />
                                )}
                                <span className="flex items-center gap-1.5">
                                    <span className="text-[13px] leading-none">{d.emoji}</span>
                                    <span className="text-[11px] font-extrabold leading-none">
                                        DAY {d.id}
                                    </span>
                                    {mounted && full && (
                                        <Check
                                            size={11}
                                            strokeWidth={3.5}
                                            className={on ? "text-white" : "text-[#10B981]"}
                                        />
                                    )}
                                </span>
                                <span
                                    className={cx(
                                        "mt-0.5 block text-[9.5px] font-semibold leading-none",
                                        on ? "text-white/80" : "text-[#9C8A78]"
                                    )}
                                >
                                    {d.dayLabel.split(", ")[1]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* kartu hari */}
            <section className="mt-3">
                <div className="rounded-[26px] border border-[#EFDCC4] bg-white p-3.5 shadow-[0_2px_0_#EFDCC4]">
                    <div className="flex items-start gap-3">
                        {day.photo ? (
                            /* Sengaja kecil (132px): sebagian foto sumbernya cuma ~450px,
                               kalau dibentang full-width jadi pecah. Versi penuhnya di lightbox. */
                            <button
                                onClick={() =>
                                    onZoom({
                                        photo: day.photo,
                                        caption: `Day ${day.id} · ${day.imgCaption || day.title}`,
                                        own: OWN_PHOTOS.includes(day.photo),
                                    })
                                }
                                aria-label="Lihat foto ukuran penuh"
                                className="relative w-[132px] shrink-0 overflow-hidden rounded-2xl active:scale-95 sm:w-[172px]"
                            >
                                <Photo
                                    src={THUMB(day.photo)}
                                    alt={day.imgCaption || day.title}
                                    fallback={day.emoji}
                                    eager
                                    className="aspect-[4/3] w-full"
                                />
                                <span className="absolute bottom-1 right-1 rounded-md bg-black/55 px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wide text-white">
                                    perbesar
                                </span>
                            </button>
                        ) : (
                            <span
                                className="vn-float grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl"
                                style={{ background: `${day.accent}1F` }}
                            >
                                {day.emoji}
                            </span>
                        )}

                        <div className="min-w-0 flex-1">
                            <p
                                className="text-[10px] font-extrabold uppercase tracking-[0.12em]"
                                style={{ color: day.accent }}
                            >
                                {day.emoji} Day {day.id} · {day.dayLabel}
                            </p>
                            <h2 className="vn-display mt-0.5 text-[18px] font-bold leading-tight">
                                {day.title}
                            </h2>
                            <p className="mt-1 text-[11px] font-medium leading-snug text-[#8B7B6B]">
                                {day.tag}
                            </p>
                        </div>
                    </div>

                    {day.imgCaption && (
                        <p className="mt-2 text-[10.5px] font-medium leading-snug text-[#9C8A78]">
                            📍 {day.imgCaption}
                        </p>
                    )}

                    <div className="mt-2.5 rounded-2xl bg-[#FBF3E8] px-3 py-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px]">🧭</span>
                            <p className="truncate text-[11px] font-semibold text-[#6F6055]">
                                {day.city}
                            </p>
                            <span className="ml-auto shrink-0 text-[11px] font-extrabold tabular-nums text-[#8B7B6B]">
                                {mounted ? dayDone : 0}/{day.items.length} selesai
                            </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EFE0CE]">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${mounted ? dayPct : 0}%`,
                                    background: day.accent,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* timeline */}
            <section className="relative mt-4 pl-1">
                <div
                    className="absolute bottom-6 left-4 top-4 w-[2px] rounded-full opacity-25"
                    style={{ background: day.accent }}
                />
                <ul className="space-y-2.5">
                    {day.items.map((it, i) => (
                        <TimelineItem
                            key={`${day.id}-${i}`}
                            item={it}
                            accent={day.accent}
                            done={!!checks[`d${day.id}-${i}`]}
                            onToggle={() => toggle(`d${day.id}-${i}`)}
                            index={i}
                        />
                    ))}
                </ul>
            </section>

            <p className="mt-4 rounded-2xl border border-dashed border-[#E3D2BC] px-3.5 py-3 text-[11px] font-medium leading-relaxed text-[#8B7B6B]">
                <span className="font-extrabold text-[#221C16]">Rule of thumb — </span>
                {TRIP.ruleOfThumb}
            </p>
        </div>
    );
}

function TimelineItem({ item, accent, done, onToggle, index }) {
    const [open, setOpen] = useState(false);
    const s = SIFAT[item.sifat] ?? SIFAT.FLEX;

    return (
        <li className="relative pl-8" style={{ animation: `vn-in .3s ease-out ${index * 0.03}s both` }}>
            <span
                className={cx(
                    "absolute left-[7px] top-[18px] h-3 w-3 rounded-full border-[2.5px] transition-all",
                    done ? "scale-90" : "bg-white"
                )}
                style={{ borderColor: accent, background: done ? accent : undefined }}
            />
            <article
                className={cx(
                    "rounded-[22px] border bg-white p-3.5 transition-all",
                    done
                        ? "border-[#E7EFE9] bg-[#F7FBF8]"
                        : "border-[#EFDCC4] shadow-[0_2px_0_#F0E3D2]"
                )}
            >
                <div className="flex items-start gap-3">
                    <button
                        onClick={onToggle}
                        aria-label={done ? "Batalkan tanda selesai" : "Tandai selesai"}
                        className={cx(
                            "mt-0.5 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90",
                            done
                                ? "border-[#10B981] bg-[#10B981] text-white"
                                : "border-[#DDCDB8] bg-white text-transparent"
                        )}
                        style={done ? { animation: "vn-pop .3s ease-out" } : undefined}
                    >
                        <Check size={14} strokeWidth={3.5} />
                    </button>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <time
                                className="text-[11.5px] font-extrabold tabular-nums"
                                style={{ color: done ? "#9BB0A2" : accent }}
                            >
                                {item.time}
                            </time>
                            <span
                                className="rounded-full border px-1.5 py-[1px] text-[8.5px] font-extrabold tracking-wide"
                                style={{ background: s.bg, color: s.fg, borderColor: s.border }}
                            >
                                {s.emoji} {s.label}
                            </span>
                        </div>

                        <p
                            className={cx(
                                "mt-1 text-[14px] font-bold leading-snug",
                                done && "text-[#93A398] line-through decoration-[#BFD3C6]"
                            )}
                        >
                            {item.act}
                        </p>

                        {(item.food || item.trans) && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {item.food && (
                                    <span
                                        className={cx(
                                            "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold",
                                            item.foodStar
                                                ? "bg-[#FFEFC2] text-[#8A5A00] ring-1 ring-[#F7D98A]"
                                                : "bg-[#FBF3E8] text-[#7A6A5A]"
                                        )}
                                    >
                                        {item.foodStar ? "⭐" : "🍽️"} {item.food}
                                    </span>
                                )}
                                {item.trans && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#F1F5FB] px-2 py-1 text-[10.5px] font-semibold text-[#5F708A]">
                                        <Car size={11} strokeWidth={2.6} /> {item.trans}
                                    </span>
                                )}
                            </div>
                        )}

                        {item.note && (
                            <>
                                <button
                                    onClick={() => setOpen((o) => !o)}
                                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#FBF3E8] px-2 py-1 text-[10px] font-extrabold text-[#8B7B6B] active:scale-95"
                                >
                                    Plan B & catatan
                                    <ChevronDown
                                        size={12}
                                        strokeWidth={3}
                                        className={cx("transition-transform", open && "rotate-180")}
                                    />
                                </button>
                                <AnimatePresence initial={false}>
                                    {open && (
                                        <motion.p
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <span className="mt-2 block rounded-xl border border-dashed border-[#E3D2BC] bg-[#FFFCF7] px-2.5 py-2 text-[11.5px] font-medium leading-relaxed text-[#6F6055]">
                                                {item.note}
                                            </span>
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>
            </article>
        </li>
    );
}

/* ============================ hero ============================ */

function Hero({ status, totalDone, mounted }) {
    const pct = Math.round((totalDone / TOTAL_ITEMS) * 100);

    return (
        <section className="relative overflow-hidden rounded-[30px] text-white shadow-[0_16px_40px_-18px_rgba(120,50,20,0.7)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={HERO_IMG}
                alt="Ha Long Bay"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A3C]/85 via-[#E11D48]/80 to-[#7C2D12]/90" />
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

            <span className="vn-float absolute right-3 top-2.5 text-xl opacity-90">🏮</span>

            <div className="relative p-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.16em] backdrop-blur">
                    <Sparkles size={10} strokeWidth={3} /> Trip Plan · {TRIP.owner}
                </span>

                <h1 className="vn-display mt-1.5 text-[25px] font-bold leading-none tracking-tight sm:text-[31px]">
                    Vietnam North Trip
                </h1>
                <p className="mt-1 text-[11.5px] font-semibold text-white/85">
                    {TRIP.dateLabel} · Hanoi → Sapa → Ha Long
                </p>

                {/* countdown — satu baris saja biar hero tetap pendek */}
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-black/30 px-3 py-2 backdrop-blur-sm">
                    {!mounted || !status ? (
                        <span className="text-[11.5px] font-bold text-white/60">
                            Menghitung mundur…
                        </span>
                    ) : status.phase === "before" ? (
                        <>
                            <span className="text-[13px]">⏳</span>
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/70">
                                Berangkat
                            </span>
                            <span className="ml-auto text-[15px] font-extrabold tabular-nums">
                                {status.d}
                                <span className="text-[10px] font-bold text-white/60">h </span>
                                {String(status.h).padStart(2, "0")}:
                                {String(status.m).padStart(2, "0")}:
                                {String(status.s).padStart(2, "0")}
                            </span>
                        </>
                    ) : status.phase === "live" ? (
                        <span className="w-full text-center text-[13px] font-extrabold">
                            🔥 Lagi jalan — hari ke-{status.dayIdx} dari {DAYS.length}
                        </span>
                    ) : (
                        <span className="w-full text-center text-[13px] font-extrabold">
                            🎉 Trip selesai — makasih Vietnam!
                        </span>
                    )}
                </div>

                {/* progress global */}
                <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                        <div
                            className="h-full rounded-full bg-white transition-all duration-500"
                            style={{ width: `${mounted ? pct : 0}%` }}
                        />
                    </div>
                    <span className="shrink-0 text-[10px] font-bold tabular-nums text-white/80">
                        {mounted ? totalDone : 0}/{TOTAL_ITEMS} agenda
                    </span>
                </div>
            </div>
        </section>
    );
}

/* ============================ food tab ============================ */

function FoodTab({ checks, toggle, onZoom }) {
    const [sec, setSec] = useState("hanoi");
    const active = FOOD_SECTIONS.find((s) => s.id === sec) ?? FOOD_SECTIONS[0];
    const tried = active.items.filter((i) => checks[`f-${i.id}`]).length;

    return (
        <div>
            <SectionHead
                emoji="🍜"
                title="Kuliner & Tempat"
                sub="Daftar buruan — centang kalau sudah dicoba"
            />

            <div className="vn-noscroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
                {FOOD_SECTIONS.map((s) => {
                    const on = s.id === sec;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setSec(s.id)}
                            className={cx(
                                "shrink-0 rounded-2xl border-2 px-3 py-2 text-[12px] font-extrabold transition-all active:scale-95",
                                on
                                    ? "border-transparent text-white"
                                    : "border-[#EFDCC4] bg-white text-[#221C16]"
                            )}
                            style={on ? { background: s.accent } : undefined}
                        >
                            {s.emoji} {s.label}
                            <span
                                className={cx(
                                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] tabular-nums",
                                    on ? "bg-white/25" : "bg-[#FBF3E8] text-[#9C8A78]"
                                )}
                            >
                                {s.items.length}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#EFDCC4] bg-white px-3.5 py-2.5">
                <span className="text-base">{active.emoji}</span>
                <p className="text-[12px] font-bold">{active.subtitle}</p>
                <span className="ml-auto text-[11px] font-extrabold tabular-nums text-[#8B7B6B]">
                    {tried}/{active.items.length} dicoba
                </span>
            </div>

            <p className="mt-2 rounded-2xl border border-[#F7D98A] bg-[#FFF7E0] px-3 py-2 text-[10.5px] font-semibold leading-snug text-[#8A5A00]">
                🚨 Tanya harga dulu sebelum makan. Tawaran “cobain gratis” dan camilan yang
                tiba-tiba muncul di meja itu tetap ditagih — detailnya di tab Persiapan.
            </p>

            {/* Semua kartu tingginya sama: thumbnail kotak 68px, entah foto atau emoji. */}
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {active.items.map((it, i) => {
                    const key = `f-${it.id}`;
                    const on = !!checks[key];
                    return (
                        <article
                            key={it.id}
                            style={{ animation: `vn-in .3s ease-out ${i * 0.03}s both` }}
                            className={cx(
                                "flex items-center gap-2.5 rounded-[20px] border p-2.5 transition-all",
                                on
                                    ? "border-[#BFE6D3] bg-[#F5FBF7]"
                                    : "border-[#EFDCC4] bg-white shadow-[0_2px_0_#F0E3D2]"
                            )}
                        >
                            {it.photo ? (
                                <button
                                    onClick={() =>
                                        onZoom({
                                            photo: it.photo,
                                            caption: it.name,
                                            own: it.real,
                                        })
                                    }
                                    aria-label={`Lihat foto ${it.name}`}
                                    className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl bg-[#FBF3E8] active:scale-95"
                                >
                                    <Photo
                                        src={THUMB(it.photo)}
                                        alt={it.name}
                                        fallback={it.emoji}
                                        className="h-full w-full"
                                    />
                                    {it.real && (
                                        <span className="absolute bottom-0.5 right-0.5 rounded-md bg-black/60 px-1 text-[8px] leading-[14px] text-white">
                                            📷
                                        </span>
                                    )}
                                </button>
                            ) : (
                                <span className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-2xl bg-[#FBF3E8] text-3xl">
                                    {it.emoji}
                                </span>
                            )}

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-1.5">
                                    <p
                                        className={cx(
                                            "text-[13px] font-bold leading-snug",
                                            on && "text-[#7FA391] line-through"
                                        )}
                                    >
                                        {it.name}
                                    </p>
                                    {it.must && (
                                        <span className="mt-0.5 shrink-0 rounded-md bg-[#FFD84D] px-1.5 py-[1px] text-[8.5px] font-extrabold text-[#6B4E00]">
                                            WAJIB
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                    <span className="rounded-md bg-[#FBF3E8] px-1.5 py-[2px] text-[9.5px] font-bold text-[#8B7B6B]">
                                        {it.cat}
                                    </span>
                                    {it.price && (
                                        <span className="rounded-md bg-[#EAF6F0] px-1.5 py-[2px] text-[9.5px] font-extrabold text-[#0B7A5A]">
                                            {it.price}
                                        </span>
                                    )}
                                    {it.day && (
                                        <span
                                            className="rounded-md px-1.5 py-[2px] text-[9.5px] font-extrabold text-white"
                                            style={{
                                                background:
                                                    DAYS.find((d) => d.id === it.day)?.accent ??
                                                    "#8B7B6B",
                                            }}
                                        >
                                            Day {it.day}
                                        </span>
                                    )}
                                </div>
                                {it.note && (
                                    <p className="mt-1 line-clamp-2 text-[10.5px] font-medium leading-snug text-[#8B7B6B]">
                                        {it.note}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => toggle(key)}
                                aria-label="Tandai sudah dicoba"
                                className={cx(
                                    "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90",
                                    on
                                        ? "border-[#10B981] bg-[#10B981] text-white"
                                        : "border-[#DDCDB8] bg-white text-transparent"
                                )}
                            >
                                <Check size={13} strokeWidth={3.5} />
                            </button>
                        </article>
                    );
                })}
            </div>

            <p className="mt-3 rounded-2xl border border-dashed border-[#E3D2BC] px-3.5 py-2.5 text-[10.5px] font-medium leading-relaxed text-[#9C8A78]">
                Ketuk foto untuk lihat ukuran penuh. Foto bertanda 📷 diambil sendiri; sisanya
                foto ilustrasi kategori, bukan foto tempatnya langsung.
            </p>
        </div>
    );
}

/* ============================ budget tab ============================ */

function BudgetTab() {
    const [cur, setCur] = useState("rp");
    const isRp = cur === "rp";
    const fmt = (o) => (o.rp === null ? "—" : isRp ? rp(o.rp) : vnd(o.vnd));

    const planTotal = isRp ? BUDGET.planTotal.rp : BUDGET.planTotal.vnd;
    const actTotal = isRp ? BUDGET.actualTotal.rp : BUDGET.actualTotal.vnd;
    const sisa = planTotal - actTotal;
    const paidPct = Math.round((actTotal / planTotal) * 100);
    const maxPlan = Math.max(...BUDGET.plan.map((p) => p.rp));

    return (
        <div>
            <SectionHead emoji="💸" title="Budget" sub="Rencana vs realisasi" />

            <div className="mt-3 flex items-center gap-2">
                <div className="flex rounded-2xl border-2 border-[#EFDCC4] bg-white p-1">
                    {[
                        ["rp", "Rupiah"],
                        ["vnd", "Dong"],
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            onClick={() => setCur(id)}
                            className={cx(
                                "rounded-xl px-3 py-1.5 text-[11.5px] font-extrabold transition-all",
                                cur === id ? "bg-[#221C16] text-white" : "text-[#8B7B6B]"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <span className="rounded-xl bg-[#FBF3E8] px-2.5 py-1.5 text-[10.5px] font-bold text-[#8B7B6B]">
                    Kurs 1 ₫ = Rp {String(BUDGET.kurs).replace(".", ",")}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                    { l: "Rencana", v: planTotal, c: "#221C16", bg: "#FFFFFF" },
                    { l: "Sudah keluar", v: actTotal, c: "#0B7A5A", bg: "#EAF6F0" },
                    { l: "Estimasi sisa", v: sisa, c: "#C0362C", bg: "#FFEFEB" },
                ].map((s) => (
                    <div
                        key={s.l}
                        className="rounded-[20px] border border-[#EFDCC4] p-2.5"
                        style={{ background: s.bg }}
                    >
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#9C8A78]">
                            {s.l}
                        </p>
                        <p
                            className="mt-1 text-[12.5px] font-extrabold leading-tight tabular-nums"
                            style={{ color: s.c }}
                        >
                            {isRp ? rp(s.v) : vnd(s.v)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-3 rounded-[22px] border border-[#EFDCC4] bg-white p-3.5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#8B7B6B]">Terbayar dari total rencana</span>
                    <span className="tabular-nums">{paidPct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#F3E8DA]">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#0EA5E9] transition-all duration-700"
                        style={{ width: `${paidPct}%` }}
                    />
                </div>
            </div>

            {/* rencana */}
            <h3 className="vn-display mt-5 text-[15px] font-bold">📋 Rencana budget</h3>
            <div className="mt-2 space-y-2">
                {BUDGET.plan.map((p, i) => (
                    <div
                        key={p.id}
                        style={{ animation: `vn-in .3s ease-out ${i * 0.03}s both` }}
                        className="rounded-[20px] border border-[#EFDCC4] bg-white p-3 shadow-[0_2px_0_#F0E3D2]"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#FBF3E8] text-base">
                                {p.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-bold">{p.item}</p>
                                <p className="truncate text-[10.5px] font-medium text-[#9C8A78]">
                                    {p.desc}
                                </p>
                            </div>
                            <p className="shrink-0 text-[12.5px] font-extrabold tabular-nums">
                                {fmt(p)}
                            </p>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F6EEE3]">
                            <div
                                className="h-full rounded-full bg-[#FFB84D]"
                                style={{ width: `${(p.rp / maxPlan) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="flex items-center justify-between rounded-[20px] bg-[#221C16] px-4 py-3 text-white">
                    <span className="text-[12px] font-bold">TOTAL RENCANA</span>
                    <span className="text-[15px] font-extrabold tabular-nums">
                        {isRp ? rp(BUDGET.planTotal.rp) : vnd(BUDGET.planTotal.vnd)}
                    </span>
                </div>
            </div>

            {/* realisasi */}
            <h3 className="vn-display mt-5 text-[15px] font-bold">✅ Realisasi</h3>
            <div className="mt-2 space-y-2">
                {BUDGET.actual.map((p) => (
                    <div
                        key={p.id}
                        className="rounded-[20px] border border-[#CDE9DA] bg-[#F5FBF7] p-3"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-base">
                                {p.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate text-[13px] font-bold">{p.item}</p>
                                    {p.status && (
                                        <span className="shrink-0 rounded-md bg-[#0B7A5A] px-1.5 py-[1px] text-[8.5px] font-extrabold text-white">
                                            {p.status}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10.5px] font-medium leading-snug text-[#7A8A80]">
                                    {p.desc}
                                </p>
                            </div>
                            <p className="shrink-0 text-[12.5px] font-extrabold tabular-nums text-[#0B7A5A]">
                                {fmt(p)}
                            </p>
                        </div>
                    </div>
                ))}
                <div className="flex items-center justify-between rounded-[20px] bg-[#0B7A5A] px-4 py-3 text-white">
                    <span className="text-[12px] font-bold">TOTAL REALISASI</span>
                    <span className="text-[15px] font-extrabold tabular-nums">
                        {isRp ? rp(BUDGET.actualTotal.rp) : vnd(BUDGET.actualTotal.vnd)}
                    </span>
                </div>
            </div>

            <p className="mt-3 rounded-2xl border border-dashed border-[#E3D2BC] px-3.5 py-3 text-[11px] font-medium leading-relaxed text-[#8B7B6B]">
                ℹ️ {BUDGET.footnote}
            </p>
        </div>
    );
}

/* ============================ prep tab ============================ */

function PrepTab({ checks, toggle, onZoom }) {
    const packed = PACKING.filter((p) => checks[`p-${p.id}`]).length;
    const pct = Math.round((packed / PACKING.length) * 100);

    return (
        <div>
            <SectionHead
                emoji="🎒"
                title="Persiapan"
                sub="Checklist packing + reminder penting"
            />

            <div className="mt-3 rounded-[26px] border border-[#EFDCC4] bg-white p-4 shadow-[0_2px_0_#EFDCC4]">
                <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFF0D6] text-2xl">
                        🧳
                    </span>
                    <div className="flex-1">
                        <p className="vn-display text-[15px] font-bold">Barang bawaan</p>
                        <p className="text-[11px] font-semibold text-[#8B7B6B]">
                            {packed} dari {PACKING.length} sudah masuk tas
                        </p>
                    </div>
                    <span className="text-[17px] font-extrabold tabular-nums">{pct}%</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#F3E8DA]">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FFB84D] to-[#FF5A3C] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                    />
                </div>

                <ul className="mt-3 space-y-1.5">
                    {PACKING.map((p) => {
                        const key = `p-${p.id}`;
                        const on = !!checks[key];
                        return (
                            <li key={p.id}>
                                <button
                                    onClick={() => toggle(key)}
                                    className={cx(
                                        "flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all active:scale-[0.99]",
                                        on
                                            ? "border-[#CDE9DA] bg-[#F5FBF7]"
                                            : "border-[#F0E3D2] bg-[#FFFCF7]"
                                    )}
                                >
                                    <span
                                        className={cx(
                                            "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2",
                                            on
                                                ? "border-[#10B981] bg-[#10B981] text-white"
                                                : "border-[#DDCDB8] text-transparent"
                                        )}
                                    >
                                        <Check size={12} strokeWidth={3.5} />
                                    </span>
                                    <span className="text-base">{p.emoji}</span>
                                    <span
                                        className={cx(
                                            "text-[12.5px] font-bold",
                                            on && "text-[#7FA391] line-through"
                                        )}
                                    >
                                        {p.name}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <ScamSection onZoom={onZoom} />

            <h3 className="vn-display mt-5 text-[15px] font-bold">💡 Tips & reminder</h3>
            <div className="mt-2 space-y-2">
                {TIPS.map((t, i) => (
                    <div
                        key={i}
                        className={cx(
                            "overflow-hidden rounded-[20px] border",
                            t.star
                                ? "border-[#F7D98A] bg-[#FFF7E0]"
                                : "border-[#EFDCC4] bg-white shadow-[0_2px_0_#F0E3D2]"
                        )}
                    >
                        <div className="flex gap-2.5 p-3">
                            <span
                                className={cx(
                                    "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold",
                                    t.star ? "bg-[#FFD84D] text-[#6B4E00]" : "bg-[#FBF3E8] text-[#8B7B6B]"
                                )}
                            >
                                {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[12.5px] font-semibold leading-relaxed">
                                    {t.star && "🚨 "}
                                    {t.text}
                                </p>
                                {t.sub && (
                                    <p className="mt-1 text-[11px] font-medium leading-snug text-[#8B7B6B]">
                                        {t.sub}
                                    </p>
                                )}
                                {t.photo && (
                                    <button
                                        onClick={() =>
                                            onZoom({
                                                photo: t.photo,
                                                caption: t.sub || t.text,
                                                own: true,
                                            })
                                        }
                                        aria-label="Lihat foto ukuran penuh"
                                        // aspectRatio disamakan dengan rasio filenya supaya tidak terpotong
                                        style={{ aspectRatio: t.photoRatio || "16 / 10" }}
                                        className="mt-2 block w-full max-w-[300px] overflow-hidden rounded-xl border border-[#EFDCC4] active:scale-[0.98]"
                                    >
                                        <Photo
                                            src={IMG(t.photo)}
                                            alt={t.text}
                                            fallback="🏦"
                                            className="h-full w-full"
                                        />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 rounded-[20px] border border-dashed border-[#E3D2BC] bg-[#FFFCF7] p-3.5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C8A78]">
                    Asumsi & info
                </p>
                <p className="mt-1.5 text-[11.5px] font-medium leading-relaxed text-[#6F6055]">
                    {TRIP.assumptions}
                </p>
            </div>
        </div>
    );
}

/* ============================ awas scam ============================ */

function ScamSection({ onZoom }) {
    const [open, setOpen] = useState(null);

    return (
        <section className="mt-5">
            <div className="flex items-center gap-2">
                <h3 className="vn-display text-[15px] font-bold">🚨 Awas scam</h3>
                <span className="rounded-full bg-[#FFE7E2] px-2 py-[2px] text-[9.5px] font-extrabold text-[#C0362C]">
                    {SCAMS.length} modus
                </span>
            </div>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#8B7B6B]">
                Aturan umum: jangan pegang barang orang, jangan makan apa pun sebelum tahu
                harganya, dan bayar hanya lewat aplikasi atau harga yang sudah disepakati.
            </p>

            <div className="mt-2.5 space-y-2">
                {SCAMS.map((s, i) => {
                    const on = open === s.id;
                    return (
                        <div
                            key={s.id}
                            className={cx(
                                "overflow-hidden rounded-[20px] border transition-all",
                                on
                                    ? "border-[#F3ADA2] bg-[#FFF8F6]"
                                    : "border-[#EFDCC4] bg-white shadow-[0_2px_0_#F0E3D2]"
                            )}
                        >
                            <button
                                onClick={() => setOpen(on ? null : s.id)}
                                className="flex w-full items-center gap-2.5 p-2.5 text-left"
                            >
                                {s.photo ? (
                                    <Photo
                                        src={THUMB(s.photo)}
                                        alt=""
                                        fallback={s.emoji}
                                        className="h-14 w-14 shrink-0 rounded-xl"
                                    />
                                ) : (
                                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#FFECE8] text-2xl">
                                        {s.emoji}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-bold leading-snug">
                                        <span className="text-[#C0362C]">{i + 1}.</span> {s.title}
                                    </p>
                                    {!on && (
                                        <p className="mt-0.5 line-clamp-2 text-[10.5px] font-medium leading-snug text-[#9C8A78]">
                                            {s.modus}
                                        </p>
                                    )}
                                </div>
                                <ChevronDown
                                    size={16}
                                    strokeWidth={3}
                                    className={cx(
                                        "shrink-0 text-[#9C8A78] transition-transform",
                                        on && "rotate-180"
                                    )}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {on && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-2 px-2.5 pb-2.5">
                                            <div className="rounded-xl bg-[#FFECE8] px-3 py-2">
                                                <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#C0362C]">
                                                    Modusnya
                                                </p>
                                                <p className="mt-0.5 text-[11.5px] font-medium leading-relaxed text-[#5C4A44]">
                                                    {s.modus}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-[#EAF6F0] px-3 py-2">
                                                <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0B7A5A]">
                                                    Cara aman
                                                </p>
                                                <p className="mt-0.5 text-[11.5px] font-semibold leading-relaxed text-[#33544A]">
                                                    {s.fix}
                                                </p>
                                            </div>
                                            {s.photo && (
                                                <button
                                                    onClick={() =>
                                                        onZoom({
                                                            photo: s.photo,
                                                            caption: `${s.title} — infografik ${SCAM_CREDIT.author}`,
                                                            own: true,
                                                        })
                                                    }
                                                    className="w-full rounded-xl border border-dashed border-[#E3D2BC] py-2 text-[10.5px] font-extrabold text-[#8B7B6B] active:scale-[0.98]"
                                                >
                                                    Lihat infografik aslinya
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <p className="mt-2 text-right text-[9.5px] font-medium text-[#B5A492]">
                Infografik:{" "}
                <a
                    href={SCAM_CREDIT.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                >
                    {SCAM_CREDIT.author}
                </a>
            </p>
        </section>
    );
}

/* ============================ plan b tab ============================ */

function PlanBTab() {
    const [open, setOpen] = useState(null);

    return (
        <div>
            <SectionHead emoji="🌧️" title="Plan B" sub="Kalau rencana A tidak jalan" />

            <div className="mt-3 rounded-[22px] bg-[#221C16] p-4 text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/50">
                    Rule of thumb
                </p>
                <p className="mt-1.5 text-[13px] font-bold leading-relaxed">{TRIP.ruleOfThumb}</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {Object.entries(SIFAT).map(([k, s]) => (
                        <div key={k} className="rounded-xl bg-white/10 p-2 text-center">
                            <p className="text-[13px]">{s.emoji}</p>
                            <p className="mt-0.5 text-[9px] font-extrabold">{s.label}</p>
                            <p className="mt-0.5 text-[8.5px] font-medium leading-tight text-white/60">
                                {s.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {CONTINGENCY.map((c, i) => {
                    const on = open === c.id;
                    return (
                        <div
                            key={c.id}
                            style={{ animation: `vn-in .3s ease-out ${i * 0.03}s both` }}
                            className={cx(
                                "overflow-hidden rounded-[22px] border transition-all",
                                on
                                    ? "border-[#FFB84D] bg-[#FFFCF5]"
                                    : "border-[#EFDCC4] bg-white shadow-[0_2px_0_#F0E3D2]"
                            )}
                        >
                            <button
                                onClick={() => setOpen(on ? null : c.id)}
                                className="flex w-full items-center gap-2.5 p-3.5 text-left"
                            >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#FBF3E8] text-xl">
                                    {c.emoji}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13.5px] font-bold leading-tight">{c.title}</p>
                                    <p className="mt-0.5 truncate text-[10.5px] font-medium text-[#9C8A78]">
                                        Trigger: {c.trigger}
                                    </p>
                                </div>
                                <ChevronDown
                                    size={16}
                                    strokeWidth={3}
                                    className={cx(
                                        "shrink-0 text-[#9C8A78] transition-transform",
                                        on && "rotate-180"
                                    )}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {on && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-2 px-3.5 pb-3.5">
                                            <Row label="Respons utama" value={c.respons} tone="#0B7A5A" />
                                            <Row label="Alternatif" value={c.alternatif} tone="#2563EB" />
                                            <Row label="Yang di-drop dulu" value={c.drop} tone="#C0362C" />
                                            <Row label="Batas keputusan" value={c.batas} tone="#8A5A00" />
                                            <div className="rounded-xl border border-dashed border-[#E3D2BC] bg-white px-3 py-2">
                                                <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#9C8A78]">
                                                    Catatan
                                                </p>
                                                <p className="mt-1 text-[11.5px] font-medium leading-relaxed text-[#6F6055]">
                                                    {c.catatan}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Row({ label, value, tone }) {
    return (
        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#F0E3D2]">
            <p
                className="text-[9.5px] font-extrabold uppercase tracking-wider"
                style={{ color: tone }}
            >
                {label}
            </p>
            <p className="mt-0.5 text-[11.5px] font-semibold leading-relaxed text-[#4A4038]">
                {value}
            </p>
        </div>
    );
}

/* ============================ bits ============================ */

/* Semua gambar lewat sini supaya perilaku loading-nya seragam:
   - skeleton shimmer selama belum ke-load (penting di internet lemot)
   - state di-reset tiap src berubah, jadi ganti hari tidak menahan foto lama
   - fallback emoji kalau filenya gagal dimuat */
function Photo({ src, alt, className, fallback = "🖼️", eager = false, imgClassName }) {
    const [state, setState] = useState("loading");
    const ref = useRef(null);

    useEffect(() => {
        setState("loading");
        const el = ref.current;
        // gambar yang sudah ada di cache kadang selesai sebelum onLoad terpasang
        if (el && el.complete && el.naturalWidth > 0) setState("ok");
    }, [src]);

    return (
        <span className={cx("relative block overflow-hidden bg-[#F3E8DA]", className)}>
            {state === "loading" && <span className="vn-shimmer absolute inset-0" />}
            {state === "error" ? (
                <span className="absolute inset-0 grid place-items-center text-2xl opacity-40">
                    {fallback}
                </span>
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    ref={ref}
                    src={src}
                    alt={alt}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                    onLoad={() => setState("ok")}
                    onError={() => setState("error")}
                    className={cx(
                        "h-full w-full object-cover transition-opacity duration-300",
                        state === "ok" ? "opacity-100" : "opacity-0",
                        imgClassName
                    )}
                />
            )}
        </span>
    );
}

function SectionHead({ emoji, title, sub }) {
    return (
        <div className="flex items-center gap-3">
            <span className="vn-float grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-[0_2px_0_#EFDCC4] ring-1 ring-[#EFDCC4]">
                {emoji}
            </span>
            <div>
                <h2 className="vn-display text-[21px] font-bold leading-tight">{title}</h2>
                <p className="text-[11.5px] font-medium text-[#8B7B6B]">{sub}</p>
            </div>
        </div>
    );
}

function Footer({ onReset }) {
    const [showCredits, setShowCredits] = useState(false);

    return (
        <footer className="mt-8 border-t border-dashed border-[#E3D2BC] pt-5 text-center">
            <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EFDCC4] bg-white px-3.5 py-2 text-[11px] font-extrabold text-[#8B7B6B] active:scale-95"
            >
                <RotateCcw size={12} strokeWidth={3} /> Reset semua centang
            </button>

            <p className="mt-4 text-[11px] font-semibold text-[#9C8A78]">
                Checklist tersimpan otomatis di HP kamu 📱
            </p>

            <button
                onClick={() => setShowCredits((s) => !s)}
                className="mt-3 text-[10px] font-bold text-[#B5A492] underline underline-offset-2"
            >
                Kredit foto
            </button>
            {showCredits && (
                <ul className="vn-noscroll mx-auto mt-2 max-h-56 max-w-md space-y-1 overflow-y-auto text-left text-[9.5px] leading-relaxed text-[#B5A492]">
                    <li className="font-bold">Koleksi pribadi</li>
                    <li className="pl-2">
                        Pho 10, Viettrekking Coffee, VPBank, dan referensi prewedding (Amory
                        Studio).
                    </li>
                    <li className="pt-1.5 font-bold">Wikimedia Commons</li>
                    {PHOTO_CREDITS.map((c) => (
                        <li key={c.file} className="pl-2">
                            {c.file} —{" "}
                            <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                {c.author}
                            </a>
                            , {c.license}
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-4 text-[10.5px] font-bold text-[#C6B7A5]">
                dibuat buat Rere 💛 · dazytech
            </p>
        </footer>
    );
}

function Backdrop() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#FFD9A8]/40 blur-3xl" />
            <div className="absolute -right-20 top-80 h-64 w-64 rounded-full bg-[#FFC9C0]/40 blur-3xl" />
            <div className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-[#BFE9D8]/35 blur-3xl" />
        </div>
    );
}

function Confetti({ seed }) {
    const bits = useMemo(() => {
        const emo = ["🎉", "✨", "🍜", "🏮", "💛", "🎊", "⭐"];
        return Array.from({ length: 16 }, (_, i) => ({
            id: `${seed}-${i}`,
            emoji: emo[i % emo.length],
            left: Math.random() * 100,
            delay: Math.random() * 0.5,
            size: 16 + Math.random() * 18,
        }));
    }, [seed]);

    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
            {bits.map((b) => (
                <span
                    key={b.id}
                    className="absolute bottom-24"
                    style={{
                        left: `${b.left}%`,
                        fontSize: b.size,
                        animation: `vn-rise 1.5s ease-out ${b.delay}s both`,
                    }}
                >
                    {b.emoji}
                </span>
            ))}
        </div>
    );
}

function PageStyles() {
    return (
        <style>{`
      /* halaman ini selalu tema terang, walau HP-nya dark mode */
      html, body { background: #FFF6EC; color-scheme: light; }

      .vn-display { font-family: var(--font-fredoka), ui-rounded, "Segoe UI Rounded", system-ui, sans-serif; letter-spacing: -0.01em; }
      .vn-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
      .vn-noscroll::-webkit-scrollbar { display: none; }
      .vn-root ::selection { background: #FFD84D; color: #221C16; }

      @keyframes vn-in { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes vn-pop { 0% { transform: scale(.55) } 60% { transform: scale(1.15) } 100% { transform: scale(1) } }
      @keyframes vn-float { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-5px) rotate(4deg) } }
      @keyframes vn-rise { 0% { transform: translateY(0) scale(.5); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(-70vh) scale(1.1) rotate(22deg); opacity: 0 } }
      @keyframes vn-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(225,29,72,.55) } 50% { box-shadow: 0 0 0 7px rgba(225,29,72,0) } }

      .vn-float { animation: vn-float 3.6s ease-in-out infinite; }
      .vn-pulse { animation: vn-pulse 2s ease-in-out infinite; }

      /* ---- state loading ---- */
      @keyframes vn-shim { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      .vn-shimmer {
        background: linear-gradient(100deg, #F1E4D3 28%, #FCF5EC 50%, #F1E4D3 72%);
        background-size: 200% 100%;
        animation: vn-shim 1.25s linear infinite;
      }

      @keyframes vn-spin { to { transform: rotate(360deg) } }
      .vn-spin { animation: vn-spin .7s linear infinite; }

      @keyframes vn-load { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
      .vn-loadbar { background: #F3E8DA; }
      .vn-loadbar::after {
        content: ""; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, #FF5A3C, transparent);
        animation: vn-load 1.1s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .vn-float, .vn-pulse { animation: none !important; }
        .vn-root *, .vn-root *::before, .vn-root *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        /* loop cepat malah bikin kedip — dibuat diam saja */
        .vn-shimmer { animation: none !important; background: #F1E4D3; }
        .vn-spin { animation: none !important; }
        .vn-loadbar::after { animation: none !important; opacity: .5; }
      }
    `}</style>
    );
}

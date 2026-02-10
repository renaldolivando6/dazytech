"use client";
import { useEffect, useRef, useState } from "react";

/* ===================== CONFIG ===================== */
const CLOUD_NAME = "dcz9mai5a";
const UPLOAD_PRESET = "valentine";

const DEFAULTS = {
  btnCorrect: "💋 Cium",
  btnDecoy: "💰 Rp 50.000.000",
  resultEmoji: "😘",
  resultTitle: "50 juta mah lewat ya, Yang penting cium",
  resultMsg: "Sebagai hadiah, kita AYCE bareng yaa! 🥰🥩",
  resultChecks: "Cium: ✅   AYCE: ✅",
  resultFooter: "Rp 50 juta? Tetap di rekening aku ya~ 😂💕",
};

/* ===================== CLOUDINARY UPLOAD ===================== */
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

/* ===================== ROUTER ===================== */
export default function ValentinePage() {
  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    const img = params.get("img");
    const cfg = params.get("c");

    if (to) {
      setConfig({ nama: to, img: img || "", ...DEFAULTS });
    } else if (cfg) {
      try { setConfig(JSON.parse(decodeURIComponent(cfg))); } catch {}
    }
    setReady(true);
  }, []);

  if (!ready) return <div style={s.body}><p style={{ color: "white" }}>Loading...</p></div>;
  if (config) return <ValentineCard config={config} />;
  return <ValentineGenerator />;
}

/* ===================== GENERATOR ===================== */
function ValentineGenerator() {
  const [mode, setMode] = useState(null);
  const [nama, setNama] = useState("");
  const [simpleImg, setSimpleImg] = useState("");
  const [simpleUploading, setSimpleUploading] = useState(false);
  const [form, setForm] = useState({ nama: "", img: "", ...DEFAULTS });
  const [customUploading, setCustomUploading] = useState(false);
  const [step, setStep] = useState(0);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (file, onUrl, setLoading) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB ya!"); return; }
    setLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      onUrl(url);
    } catch { alert("Upload gagal, coba lagi"); }
    setLoading(false);
  };

  const generateSimple = () => {
    if (!nama.trim()) return;
    let url = `${window.location.origin}/valentine/?to=${encodeURIComponent(nama.trim())}`;
    if (mode === "photo" && simpleImg) url += `&img=${encodeURIComponent(simpleImg)}`;
    setLink(url);
    setCopied(false);
  };

  const generateCustom = () => {
    if (!form.nama.trim()) return;
    const json = JSON.stringify(form);
    const url = `${window.location.origin}/valentine/?c=${encodeURIComponent(json)}`;
    setLink(url);
    setCopied(false);
    setStep(4);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); } catch {
      const ta = document.createElement("textarea");
      ta.value = link; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canNext = () => {
    if (step === 0) return form.nama.trim();
    if (step === 1) return true;
    if (step === 2) return form.btnCorrect.trim() && form.btnDecoy.trim();
    if (step === 3) return form.resultTitle.trim();
    return true;
  };

  const reset = () => {
    setMode(null); setNama(""); setSimpleImg(""); setLink("");
    setForm({ nama: "", img: "", ...DEFAULTS }); setStep(0);
  };

  const linkResult = (
    <div style={s.resultBox}>
      <p style={s.resultLabel}>Link kamu siap! 🎉</p>
      <div style={s.linkRow}>
        <input type="text" value={link} readOnly style={s.linkInput} />
        <button onClick={copyLink} style={s.btnCopy}>
          {copied ? "Copied! ✅" : "Copy 📋"}
        </button>
      </div>
      <div style={{ marginTop: "14px", display: "flex", gap: "10px", justifyContent: "center" }}>
        <a href={link} target="_blank" rel="noopener noreferrer" style={s.preview}>Preview →</a>
        <button onClick={reset} style={s.resetBtn}>Buat Lagi</button>
      </div>
    </div>
  );

  return (
    <div style={s.body}>
      <div style={s.card}>
        <h1 style={s.title}>Valentine Card Generator 💝</h1>
        <p style={s.brand}>by <strong>Dazytech</strong></p>

        {mode === null && (
          <div>
            <p style={s.sub}>Pilih cara buat kartu:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <button onClick={() => setMode("simple")} style={s.modeBtn}>
                <span style={s.modeBtnIcon}>⚡</span>
                <span>
                  <strong style={{ display: "block", marginBottom: "2px" }}>Quick</strong>
                  <span style={{ fontSize: "0.8em", color: "#999" }}>Cuma isi nama, langsung jadi</span>
                </span>
              </button>
              <button onClick={() => setMode("photo")} style={s.modeBtn}>
                <span style={s.modeBtnIcon}>📷</span>
                <span>
                  <strong style={{ display: "block", marginBottom: "2px" }}>Quick + Foto</strong>
                  <span style={{ fontSize: "0.8em", color: "#999" }}>Nama + upload foto bareng</span>
                </span>
              </button>
              <button onClick={() => setMode("custom")} style={s.modeBtn}>
                <span style={s.modeBtnIcon}>🎨</span>
                <span>
                  <strong style={{ display: "block", marginBottom: "2px" }}>Full Custom</strong>
                  <span style={{ fontSize: "0.8em", color: "#999" }}>Atur semua: tombol, pesan, foto, emoji</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {mode === "simple" && !link && (
          <div>
            <p style={s.sub}>Masukkan nama yang dituju</p>
            <input type="text" placeholder="Nama dia..." value={nama}
              onChange={(e) => setNama(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && nama.trim() && generateSimple()}
              style={s.input} autoFocus />
            <div style={s.nav}>
              <button onClick={() => setMode(null)} style={s.btnBack}>← Kembali</button>
              <button onClick={generateSimple} disabled={!nama.trim()}
                style={{ ...s.btnNext, opacity: nama.trim() ? 1 : 0.5, cursor: nama.trim() ? "pointer" : "not-allowed" }}>
                Generate Link ✨
              </button>
            </div>
          </div>
        )}
        {mode === "simple" && link && linkResult}

        {mode === "photo" && !link && (
          <div>
            <p style={s.sub}>Masukkan nama & upload foto</p>
            <input type="text" placeholder="Nama dia..." value={nama}
              onChange={(e) => setNama(e.target.value)} style={s.input} autoFocus />
            <div style={{ marginTop: "14px" }}>
              <label style={s.label}>Foto</label>
              {simpleImg ? (
                <div style={s.imgPreviewWrap}>
                  <img src={simpleImg} style={s.imgPreview} alt="preview" />
                  <button onClick={() => setSimpleImg("")} style={s.imgRemove}>✕</button>
                </div>
              ) : (
                <label style={s.uploadBox}>
                  <input type="file" accept="image/*" hidden
                    onChange={(e) => handleUpload(e.target.files[0], setSimpleImg, setSimpleUploading)} />
                  {simpleUploading ? "Uploading... ⏳" : "📷 Pilih Foto"}
                </label>
              )}
            </div>
            <div style={s.nav}>
              <button onClick={() => setMode(null)} style={s.btnBack}>← Kembali</button>
              <button onClick={generateSimple} disabled={!nama.trim() || simpleUploading}
                style={{ ...s.btnNext, opacity: nama.trim() && !simpleUploading ? 1 : 0.5, cursor: nama.trim() && !simpleUploading ? "pointer" : "not-allowed" }}>
                Generate Link ✨
              </button>
            </div>
          </div>
        )}
        {mode === "photo" && link && linkResult}

        {mode === "custom" && step < 4 && (
          <div>
            <div style={s.progress}>
              {["Nama", "Foto", "Tombol", "Pesan"].map((label, i) => (
                <div key={i} style={{
                  ...s.dot,
                  background: i <= step ? "linear-gradient(135deg,#ec4899,#e11d48)" : "#e5e7eb",
                  color: i <= step ? "white" : "#aaa",
                }}>{i < step ? "✓" : i + 1}
                  <span style={s.dotLabel}>{label}</span>
                </div>
              ))}
            </div>

            {step === 0 && (
              <div style={s.stepBox}>
                <label style={s.label}>Nama yang dituju</label>
                <input type="text" placeholder="Nama dia..." value={form.nama}
                  onChange={(e) => set("nama", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canNext() && setStep(1)}
                  style={s.input} autoFocus />
              </div>
            )}

            {step === 1 && (
              <div style={s.stepBox}>
                <label style={s.label}>Foto (opsional)</label>
                {form.img ? (
                  <div style={s.imgPreviewWrap}>
                    <img src={form.img} style={s.imgPreview} alt="preview" />
                    <button onClick={() => set("img", "")} style={s.imgRemove}>✕</button>
                  </div>
                ) : (
                  <label style={s.uploadBox}>
                    <input type="file" accept="image/*" hidden
                      onChange={(e) => handleUpload(e.target.files[0], (url) => set("img", url), setCustomUploading)} />
                    {customUploading ? "Uploading... ⏳" : "📷 Pilih Foto"}
                  </label>
                )}
                <p style={{ fontSize: "0.8em", color: "#aaa", marginTop: "8px" }}>Skip juga boleh~</p>
              </div>
            )}

            {step === 2 && (
              <div style={s.stepBox}>
                <label style={s.label}>Tombol yang "benar" (bisa diklik)</label>
                <input type="text" placeholder="💋 Cium" value={form.btnCorrect}
                  onChange={(e) => set("btnCorrect", e.target.value)} style={s.input} />
                <label style={{ ...s.label, marginTop: "16px" }}>Tombol yang kabur-kaburan</label>
                <input type="text" placeholder="💰 Rp 50.000.000" value={form.btnDecoy}
                  onChange={(e) => set("btnDecoy", e.target.value)} style={s.input} />
              </div>
            )}

            {step === 3 && (
              <div style={s.stepBox}>
                <label style={s.label}>Emoji</label>
                <input type="text" placeholder="😘" value={form.resultEmoji}
                  onChange={(e) => set("resultEmoji", e.target.value)} style={s.input} />
                <label style={{ ...s.label, marginTop: "12px" }}>Judul</label>
                <input type="text" placeholder="50 juta mah lewat ya..." value={form.resultTitle}
                  onChange={(e) => set("resultTitle", e.target.value)} style={s.input} />
                <label style={{ ...s.label, marginTop: "12px" }}>Pesan utama</label>
                <input type="text" placeholder="Sebagai hadiah, kita AYCE bareng yaa!" value={form.resultMsg}
                  onChange={(e) => set("resultMsg", e.target.value)} style={s.input} />
                <label style={{ ...s.label, marginTop: "12px" }}>Checklist</label>
                <input type="text" placeholder="Cium: ✅   AYCE: ✅" value={form.resultChecks}
                  onChange={(e) => set("resultChecks", e.target.value)} style={s.input} />
                <label style={{ ...s.label, marginTop: "12px" }}>Footer (bold)</label>
                <input type="text" placeholder="Rp 50 juta? Tetap di rekening aku ya~" value={form.resultFooter}
                  onChange={(e) => set("resultFooter", e.target.value)} style={s.input} />
              </div>
            )}

            <div style={s.nav}>
              <button onClick={() => step === 0 ? setMode(null) : setStep(step - 1)} style={s.btnBack}>← Kembali</button>
              <button onClick={() => step === 3 ? generateCustom() : setStep(step + 1)}
                disabled={!canNext() || customUploading}
                style={{ ...s.btnNext, opacity: canNext() && !customUploading ? 1 : 0.5, cursor: canNext() && !customUploading ? "pointer" : "not-allowed" }}>
                {step === 3 ? "Generate Link ✨" : "Lanjut →"}
              </button>
            </div>
          </div>
        )}
        {mode === "custom" && step === 4 && linkResult}
      </div>
    </div>
  );
}

/* ===================== CARD (FIXED HOOKS ORDER) ===================== */
function ValentineCard({ config }) {
  const { nama, img, btnCorrect, btnDecoy, resultEmoji, resultTitle, resultMsg, resultChecks, resultFooter } = config;

  // ✅ ALL hooks declared BEFORE any conditional return
  const moneyRef = useRef(null);
  const esc = useRef(false);
  const first = useRef(false);
  const cur = useRef({ x: -9999, y: -9999 });
  const alive = useRef(true);
  const [done, setDone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.innerWidth <= 768 && "ontouchstart" in window);
    setIsMobile(check);
  }, []);

  useEffect(() => {
    if (isMobile || done) return;
    const btn = moneyRef.current;
    if (!btn) return;

    const TF = 60, TA = 220, MD = 250;
    const trig = () => (first.current ? TA : TF);

    const rndEsc = (mx, my, bw, bh) => {
      const p = 20, W = window.innerWidth, H = window.innerHeight;
      let nx, ny, t = 0;
      do {
        nx = p + Math.random() * (W - bw - p * 2);
        ny = p + Math.random() * (H - bh - p * 2);
        t++;
      } while (Math.hypot(nx + bw / 2 - mx, ny + bh / 2 - my) < MD && t < 30);
      return [nx, ny];
    };

    const teleport = (mx, my) => {
      if (!alive.current) return;
      const r = btn.getBoundingClientRect();
      if (!esc.current) {
        btn.style.left = r.left + "px";
        btn.style.top = r.top + "px";
        btn.style.width = r.width + "px";
        btn.style.position = "fixed";
        esc.current = true;
      }
      const [nx, ny] = rndEsc(mx, my, r.width, r.height);
      btn.style.left = nx + "px";
      btn.style.top = ny + "px";
    };

    let raf;
    const loop = () => {
      if (!alive.current) return;
      const r = btn.getBoundingClientRect();
      const { x: mx, y: my } = cur.current;
      const d = Math.hypot(mx - r.left - r.width / 2, my - r.top - r.height / 2);
      if (d < trig()) { first.current = true; teleport(mx, my); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onM = (e) => { cur.current = { x: e.clientX, y: e.clientY }; };
    const onTM = (e) => { cur.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTS = (e) => {
      const t = e.touches[0];
      cur.current = { x: t.clientX, y: t.clientY };
      const r = btn.getBoundingClientRect();
      if (Math.hypot(t.clientX - r.left - r.width / 2, t.clientY - r.top - r.height / 2) < trig() + 50) {
        first.current = true; teleport(t.clientX, t.clientY);
      }
    };
    const onF = (e) => { e.preventDefault(); btn.blur(); };

    document.addEventListener("mousemove", onM);
    document.addEventListener("touchmove", onTM, { passive: true });
    document.addEventListener("touchstart", onTS, { passive: true });
    btn.addEventListener("focus", onF);
    btn.setAttribute("tabindex", "-1");

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onM);
      document.removeEventListener("touchmove", onTM);
      document.removeEventListener("touchstart", onTS);
      btn.removeEventListener("focus", onF);
    };
  }, [done, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const c = document.getElementById("hBg");
    if (!c) return;
    const sym = ["♥", "💕", "💗"];
    for (let i = 0; i < 10; i++) {
      const h = document.createElement("div");
      h.style.cssText = `
        position:absolute;opacity:0;animation:floatUp ${8 + Math.random() * 7}s linear infinite;
        left:${Math.random() * 100}%;font-size:${12 + Math.random() * 14}px;
        animation-delay:${Math.random() * 10}s;
      `;
      h.textContent = sym[i % sym.length];
      c.appendChild(h);
    }
  }, [isMobile]);

  const choose = () => {
    alive.current = false;
    setDone(true);
    if (moneyRef.current) moneyRef.current.style.display = "none";
    const c = document.getElementById("hBg");
    if (!c) return;
    for (let i = 0; i < 25; i++) {
      setTimeout(() => {
        const h = document.createElement("div");
        h.style.cssText = `
          position:absolute;opacity:0;animation:floatUp ${4 + Math.random() * 4}s linear infinite;
          left:${Math.random() * 100}%;font-size:${16 + Math.random() * 22}px;animation-delay:0s;
        `;
        h.textContent = "💖";
        c.appendChild(h);
      }, i * 90);
    }
  };

  // ✅ Conditional return AFTER all hooks
  if (isMobile) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg,#fbc2eb 0%,#e77a9e 50%,#f472b6 100%)",
        fontFamily: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif", padding: "20px",
      }}>
        <div style={{
          textAlign: "center", background: "rgba(255,255,255,0.92)",
          padding: "50px 35px", borderRadius: "28px",
          boxShadow: "0 16px 50px rgba(180,60,100,0.25)",
          maxWidth: "400px", width: "90%",
        }}>
          <div style={{ fontSize: "3.5em", marginBottom: "16px" }}>💻</div>
          <h2 style={{ fontSize: "1.5em", color: "#e11d48", marginBottom: "12px" }}>
            Buka di PC ya!
          </h2>
          <p style={{ fontSize: "1em", color: "#888", lineHeight: 1.6 }}>
            Valentine card ini cuma bisa dibuka lewat PC / Laptop biar lebih seru~ 😘
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%{transform:translateY(100vh) scale(.8);opacity:0}
          8%{opacity:.35}85%{opacity:.25}
          100%{transform:translateY(-60px) scale(.4);opacity:0}
        }
        @keyframes slideIn{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(.75)}to{opacity:1;transform:scale(1)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
      `}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} id="hBg" />
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg,#fbc2eb 0%,#e77a9e 50%,#f472b6 100%)",
        overflow: "hidden", userSelect: "none",
        fontFamily: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif",
      }}>
        <div style={{
          textAlign: "center", background: "rgba(255,255,255,0.92)",
          padding: img ? "40px 40px 50px" : "50px 40px 55px", borderRadius: "28px",
          boxShadow: "0 16px 50px rgba(180,60,100,0.25)",
          maxWidth: "460px", width: "90%", position: "relative", zIndex: 10,
          animation: "slideIn 0.5s ease-out",
        }}>
          {!done ? (
            <div>
              {img && (
                <div style={{
                  width: "90%", maxWidth: "380px", aspectRatio: "1", borderRadius: "24px", overflow: "hidden",
                  margin: "0 auto 24px", border: "5px solid #f9a8d4",
                  boxShadow: "0 10px 30px rgba(236,72,153,0.3)",
                }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <h1 style={{
                fontSize: img ? "1.8em" : "2.3em", marginBottom: "8px",
                background: "linear-gradient(135deg,#ec4899,#e11d48)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Happy Valentine, {nama}! 💝
              </h1>
              <p style={{ fontSize: "1.1em", color: "#888", marginBottom: "32px" }}>
                Choose Your Gift Sayang~
              </p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <button onClick={choose} style={{
                  padding: "17px 40px", fontSize: "1.2em", fontWeight: "bold",
                  border: "none", borderRadius: "14px", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)", width: "270px",
                  background: "linear-gradient(135deg,#ec4899,#e11d48)", color: "white",
                }}>{btnCorrect}</button>
                <button ref={moneyRef} style={{
                  padding: "17px 40px", fontSize: "1.2em", fontWeight: "bold",
                  border: "none", borderRadius: "14px", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)", width: "270px",
                  background: "linear-gradient(135deg,#43e97b,#38d9a9)", color: "white",
                  zIndex: 1000, pointerEvents: "none",
                  transition: "left 0.18s ease-out, top 0.18s ease-out",
                }}>{btnDecoy}</button>
              </div>
            </div>
          ) : (
            <div style={{ animation: "popIn 0.6s ease-out" }}>
              <div style={{
                fontSize: "3.5em", margin: "10px 0", display: "inline-block",
                animation: "bounce 1.2s ease-in-out infinite",
              }}>{resultEmoji}</div>
              <h2 style={{ fontSize: "1.9em", color: "#e11d48", marginBottom: "16px" }}>{resultTitle}</h2>
              {resultMsg && <p style={{ fontSize: "1.1em", color: "#666", lineHeight: 1.7, marginBottom: "10px" }}>{resultMsg}</p>}
              {resultChecks && <p style={{ fontSize: "1.1em", color: "#666", lineHeight: 1.7, marginBottom: "10px" }}>{resultChecks}</p>}
              {resultFooter && <p style={{ fontSize: "1.1em", color: "#666", lineHeight: 1.7, fontWeight: "bold" }}>{resultFooter}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ===================== STYLES ===================== */
const s = {
  body: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#fbc2eb 0%,#e77a9e 50%,#f472b6 100%)",
    padding: "20px", fontFamily: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.95)", borderRadius: "24px",
    padding: "40px 32px", maxWidth: "480px", width: "100%",
    boxShadow: "0 16px 50px rgba(180,60,100,0.25)", textAlign: "center",
  },
  title: {
    fontSize: "1.7em",
    background: "linear-gradient(135deg,#ec4899,#e11d48)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "4px",
  },
  brand: { fontSize: "0.85em", color: "#bbb", marginBottom: "22px" },
  sub: { color: "#888", fontSize: "0.95em", marginBottom: "12px" },
  modeBtn: {
    display: "flex", alignItems: "center", gap: "14px", textAlign: "left",
    padding: "16px 20px", border: "2px solid #f0d0e0", borderRadius: "14px",
    background: "white", cursor: "pointer", width: "100%", fontSize: "0.95em",
  },
  modeBtnIcon: { fontSize: "1.8em" },
  progress: { display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" },
  dot: {
    width: "36px", height: "36px", borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "0.8em", fontWeight: "bold",
    position: "relative",
  },
  dotLabel: {
    position: "absolute", top: "42px", fontSize: "0.65em", whiteSpace: "nowrap",
    color: "#999", fontWeight: "normal",
  },
  stepBox: { textAlign: "left", marginBottom: "8px" },
  label: { display: "block", fontSize: "0.85em", color: "#777", marginBottom: "6px", fontWeight: "600" },
  input: {
    width: "100%", padding: "12px 14px", fontSize: "1em",
    border: "2px solid #f0b4cc", borderRadius: "10px", outline: "none",
  },
  uploadBox: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px", border: "2px dashed #f0b4cc", borderRadius: "12px",
    cursor: "pointer", color: "#ec4899", fontWeight: "bold", fontSize: "1em",
    background: "#fff5f8",
  },
  imgPreviewWrap: {
    position: "relative", display: "inline-block", borderRadius: "16px", overflow: "hidden",
  },
  imgPreview: {
    width: "160px", height: "160px", objectFit: "cover", borderRadius: "16px",
    border: "4px solid #f9a8d4",
  },
  imgRemove: {
    position: "absolute", top: "6px", right: "6px",
    width: "28px", height: "28px", borderRadius: "50%",
    background: "rgba(0,0,0,0.6)", color: "white", border: "none",
    cursor: "pointer", fontSize: "14px", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  nav: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" },
  btnBack: {
    padding: "11px 20px", fontSize: "0.95em", fontWeight: "bold",
    border: "2px solid #e5c0d0", borderRadius: "10px", background: "white",
    color: "#ec4899", cursor: "pointer",
  },
  btnNext: {
    padding: "11px 24px", fontSize: "0.95em", fontWeight: "bold",
    border: "none", borderRadius: "10px",
    background: "linear-gradient(135deg,#ec4899,#e11d48)",
    color: "white", boxShadow: "0 4px 14px rgba(225,29,72,0.3)", cursor: "pointer",
  },
  resultBox: {
    marginTop: "10px", padding: "20px", background: "#fff0f5",
    borderRadius: "14px", border: "1px solid #f9d1e0",
  },
  resultLabel: { fontSize: "1em", color: "#e11d48", marginBottom: "12px", fontWeight: "bold" },
  linkRow: { display: "flex", gap: "8px" },
  linkInput: {
    flex: 1, padding: "10px 12px", fontSize: "0.8em",
    border: "1px solid #e5c0d0", borderRadius: "8px", background: "white", outline: "none",
  },
  btnCopy: {
    padding: "10px 16px", fontSize: "0.9em", fontWeight: "bold",
    border: "none", borderRadius: "8px",
    background: "linear-gradient(135deg,#43e97b,#38d9a9)",
    color: "white", cursor: "pointer", whiteSpace: "nowrap",
  },
  preview: { color: "#ec4899", fontWeight: "bold", textDecoration: "none", fontSize: "0.9em" },
  resetBtn: {
    background: "none", border: "none", color: "#999",
    cursor: "pointer", fontSize: "0.9em", textDecoration: "underline",
  },
};
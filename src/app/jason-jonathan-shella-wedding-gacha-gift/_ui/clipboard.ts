// Salin teks (DESIGN 4.7.4). Urutan: Clipboard API -> textarea tersembunyi +
// execCommand('copy') (konteks tidak aman, mis. dev lewat LAN, atau WebView
// lama) -> pilih teks kode di layar supaya Jajo bisa tahan dan pilih Salin.
// Panggil langsung dari handler klik (gesture) supaya izin clipboard lolos.

export type CopyOutcome = 'ok' | 'manual';

export async function copyText(text: string, selectEl?: HTMLElement | null): Promise<CopyOutcome> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return 'ok';
    }
  } catch {
    // ditolak (izin, fokus, WebView): coba cara lama
  }
  if (legacyCopy(text)) return 'ok';
  if (selectEl) selectContents(selectEl);
  return 'manual';
}

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  // Di dalam <dialog> modal, elemen di luar dialog inert: taruh textarea di
  // dialog yang sedang terbuka supaya bisa dipilih.
  const host = active?.closest('dialog[open]') ?? document.body;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.setAttribute('aria-hidden', 'true');
  // 16px supaya iOS tidak zoom; di luar layar tapi tetap bisa dipilih.
  ta.style.cssText = 'position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;font-size:16px;padding:0;border:0;';
  host.appendChild(ta);
  let ok = false;
  try {
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    ta.remove();
    active?.focus({ preventScroll: true });
  }
  return ok;
}

/** Pilih isi elemen (fallback terakhir: Jajo tinggal tahan lalu Salin). */
export function selectContents(el: HTMLElement): void {
  try {
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    // abaikan
  }
}

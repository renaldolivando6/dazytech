// Data yang sama di kedua bahasa. Semua teks halaman ada di src/i18n/{id,en}.ts.

export const CONTACT = {
  whatsapp: '6285171571591',
  whatsappDisplay: '+62 851 7157 1591',
  email: 'dazytechsolutions@gmail.com',
  address: ['Jl. Permata, Kalideres', 'Jakarta Barat 11820'],
};

export function whatsappUrl(text: string) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

// Tombol WhatsApp diberi `data-cta` salah satu nilai ini; kliknya dicatat
// (lib/tracking.ts) supaya minat ERP dan website bisa dibedakan.
export type CtaKey = 'wa_erp' | 'wa_website' | 'wa_general';

import { clientIp } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { isLocale } from '@/i18n';
import { isCtaKey, recordClick, trackAllowed } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

// Dipanggil lewat navigator.sendBeacon saat tombol WhatsApp diklik (lihat SiteNav).
// Selalu 204: pengunjung tidak perlu tahu apakah kliknya tercatat.
export async function POST(req: Request) {
  try {
    const body = JSON.parse((await req.text()).slice(0, 1000)) as { cta?: unknown; locale?: unknown; path?: unknown };
    if (isCtaKey(body.cta) && isLocale(body.locale) && typeof body.path === 'string' && trackAllowed(await clientIp())) {
      recordClick(getDb(), { cta: body.cta, locale: body.locale, path: body.path });
    }
  } catch {
    // Body rusak: abaikan.
  }
  return new Response(null, { status: 204 });
}

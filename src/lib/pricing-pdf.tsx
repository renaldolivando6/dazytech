import fs from 'node:fs';
import path from 'node:path';
import { Document, Font, Image, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { CONTACT } from '@/components/site/content';
import type { Locale } from '@/i18n';
import {
  EXTRAS,
  PRICING,
  extraNote,
  extraPrice,
  formatIdr,
  packageAddons,
  packagePrice,
  packagesIn,
  pricingHref,
  type CategoryKey,
  type PackageData,
} from '@/i18n/pricing';

// Daftar harga sebagai PDF (A4), isi sama dengan halaman /harga/. Gaya mengikuti
// compro: ink near-black, hairline tipis, tanpa warna kedua. Font Helvetica bawaan
// PDF (tanpa file font tambahan), jadi hanya karakter WinAnsi: ceklis digambar SVG.

Font.registerHyphenationCallback((word) => [word]);

const C = {
  ink: '#1d1d1f',
  ink80: '#333333',
  muted: '#6e6e73',
  faint: '#86868b',
  hairline: '#e0e0e0',
  divider: '#f0f0f0',
  parchment: '#f5f5f7',
  pearl: '#fafafc',
};

const s = StyleSheet.create({
  // Tanpa lineHeight di `page`: nilainya terwarisi sebagai angka absolut (judul
  // besar bertumpuk) dan membuat teks `render` (nomor halaman) tidak tercetak.
  page: { paddingTop: 36, paddingBottom: 54, paddingHorizontal: 40, fontFamily: 'Helvetica', fontSize: 8, color: C.ink },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 0.75, borderBottomColor: C.hairline },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandName: { fontSize: 11, fontFamily: 'Helvetica-Bold', lineHeight: 1.2 },
  small: { fontSize: 7.5, color: C.muted, lineHeight: 1.35 },
  title: { fontSize: 26, fontFamily: 'Helvetica-Bold', letterSpacing: -0.6, marginTop: 18, lineHeight: 1.1 },
  subtitle: { fontSize: 9.5, color: C.muted, marginTop: 4, lineHeight: 1.3 },
  promises: { flexDirection: 'row', marginTop: 16, borderWidth: 0.75, borderColor: C.hairline, borderRadius: 8 },
  promise: { flex: 1, paddingVertical: 9, paddingHorizontal: 10 },
  promiseBorder: { borderLeftWidth: 0.75, borderLeftColor: C.hairline },
  promiseTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', lineHeight: 1.3 },
  promiseBody: { fontSize: 7, color: C.muted, marginTop: 2, lineHeight: 1.4 },
  sectionTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', letterSpacing: -0.3, marginTop: 18, lineHeight: 1.15 },
  sectionLead: { fontSize: 8.5, color: C.muted, marginTop: 3, marginBottom: 8, lineHeight: 1.35 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.hairline },
  labelCell: { paddingVertical: 5, paddingRight: 6, fontSize: 7, color: C.muted, lineHeight: 1.35 },
  cell: { paddingVertical: 5, paddingHorizontal: 6 },
  featured: { backgroundColor: C.pearl },
  pkgName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', letterSpacing: -0.1, lineHeight: 1.2 },
  tag: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: C.ink, color: '#ffffff', fontSize: 6, fontFamily: 'Helvetica-Bold', paddingVertical: 2, paddingHorizontal: 5, borderRadius: 6 },
  price: { fontSize: 12, fontFamily: 'Helvetica-Bold', letterSpacing: -0.2, lineHeight: 1.2 },
  text: { fontSize: 7.5, color: C.ink80, lineHeight: 1.35 },
  feature: { flexDirection: 'row', marginBottom: 2.5 },
  listTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 3, lineHeight: 1.2 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4.5, borderBottomWidth: 0.5, borderBottomColor: C.divider },
  listName: { fontSize: 8, fontFamily: 'Helvetica-Bold', lineHeight: 1.3 },
  listNote: { fontSize: 7, color: C.muted, marginTop: 1, lineHeight: 1.3 },
  listPrice: { fontSize: 8, textAlign: 'right', lineHeight: 1.3 },
  box: { marginTop: 18, padding: 12, borderRadius: 8, backgroundColor: C.parchment },
  footer: { position: 'absolute', bottom: 24, fontSize: 7, color: C.faint },
});

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? `{${k}}`);
}

function loadLogo(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'dazytech-logo-circle.png'));
  } catch {
    return null;
  }
}

function CheckIcon() {
  return (
    <Svg width={7} height={7} viewBox="0 0 24 24" style={{ marginTop: 1, marginRight: 4 }}>
      <Path d="M20 6 9 17l-5-5" stroke={C.muted} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Tabel perbandingan satu kategori: kolom = paket, baris = harga, perpanjangan, isi, rincian.
function CategoryTable({ locale, category }: { locale: Locale; category: CategoryKey }) {
  const p = PRICING[locale];
  const cat = p.categories[category];
  const packages = packagesIn(category);
  const labelWidth = category === 'website' ? 74 : 88;
  const colWidth = (515 - labelWidth) / packages.length;

  const Row = ({ label, render }: { label: string; render: (pkg: PackageData) => React.ReactNode }) => (
    <View style={s.row} wrap={false}>
      <Text style={[s.labelCell, { width: labelWidth }]}>{label}</Text>
      {packages.map((pkg) => (
        <View key={pkg.key} style={[s.cell, { width: colWidth }, pkg.featured ? s.featured : {}]}>
          {render(pkg)}
        </View>
      ))}
    </View>
  );

  return (
    <View>
      <Text style={s.sectionTitle}>{cat.title}</Text>
      <Text style={s.sectionLead}>{cat.lead}</Text>
      <View style={[s.row, { borderBottomColor: C.ink, borderBottomWidth: 0.75 }]} wrap={false}>
        <View style={{ width: labelWidth }} />
        {packages.map((pkg) => (
          <View key={pkg.key} style={[s.cell, { width: colWidth }, pkg.featured ? s.featured : {}]}>
            <Text style={s.pkgName}>{p.packages[pkg.key].name}</Text>
            {pkg.featured && <Text style={s.tag}>{p.labels.recommended.toUpperCase()}</Text>}
          </View>
        ))}
      </View>
      <Row label={p.labels.pdfPrice} render={(pkg) => <Text style={pkg.price === null ? [s.price, { fontSize: 9.5 }] : s.price}>{packagePrice(locale, pkg)}</Text>} />
      <Row
        label={p.labels.pdfRenewal}
        render={(pkg) => (
          <Text style={s.text}>
            {pkg.renewal
              ? [fill(p.labels.yearly, { price: formatIdr(locale, pkg.renewal.year) }), pkg.renewal.month && fill(p.labels.monthlyAlt, { price: formatIdr(locale, pkg.renewal.month) })]
                  .filter(Boolean)
                  .join(' ')
              : p.labels.byServer}
          </Text>
        )}
      />
      <Row label={p.labels.pdfAudience} render={(pkg) => <Text style={s.text}>{p.packages[pkg.key].audience}</Text>} />
      <Row
        label={p.labels.pdfIncluded}
        render={(pkg) => (
          <>
            {/* Daya tarik utama (gratis domain + hosting) ditulis tebal paling atas. */}
            <View style={s.feature}>
              <CheckIcon />
              <Text style={[s.text, { flex: 1, fontFamily: 'Helvetica-Bold', color: C.ink }]}>{p.packages[pkg.key].bonus}</Text>
            </View>
            {p.packages[pkg.key].features.map((f) => (
              <View key={f} style={s.feature}>
                <CheckIcon />
                <Text style={[s.text, { flex: 1 }]}>{f}</Text>
              </View>
            ))}
          </>
        )}
      />
      {cat.specLabels.map((label, i) => (
        <Row key={label} label={label} render={(pkg) => <Text style={s.text}>{p.packages[pkg.key].specs[i]}</Text>} />
      ))}
      <Row label={p.labels.addons} render={(pkg) => <Text style={s.text}>{packageAddons(locale, pkg) ?? '-'}</Text>} />
    </View>
  );
}

function ExtraList({ locale, group, title }: { locale: Locale; group: 'addon' | 'change'; title: string }) {
  const p = PRICING[locale];
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.listTitle}>{title}</Text>
      {EXTRAS.filter((e) => e.group === group).map((e) => {
        const note = extraNote(locale, e);
        return (
          <View key={e.key} style={s.listRow} wrap={false}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={s.listName}>{p.extras[e.key].name}</Text>
              {note && <Text style={s.listNote}>{note}</Text>}
            </View>
            <Text style={s.listPrice}>{extraPrice(locale, e)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PricingDocument({ locale, logo }: { locale: Locale; logo: Buffer | null }) {
  const p = PRICING[locale];
  const url = `dazytech.web.id${pricingHref(locale)}`;

  return (
    <Document title={`${p.labels.pdfTitle} · Dazytech Solutions`} author="Dazytech Solutions" creator="dazytech.web.id" subject={p.meta.title} language={locale}>
      <Page size="A4" style={s.page}>
        {/* Footer di setiap halaman. Dua <Text> absolut selebar halaman, bukan <View>
            absolut: View dengan `bottom` tidak tercetak di @react-pdf/layout 5.2. */}
        <Text style={[s.footer, { left: 40, right: 40 }]} fixed>
          Dazytech Solutions · {p.labels.pdfTitle} · {url}
        </Text>
        <Text
          style={[s.footer, { left: 40, right: 40, textAlign: 'right' }]}
          fixed
          render={({ pageNumber, totalPages }) => fill(p.labels.pdfPage, { page: String(pageNumber), total: String(totalPages) })}
        />

        <View style={s.header}>
          <View style={s.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image react-pdf, bukan <img>; tidak punya prop alt. */}
            {logo && <Image src={{ data: logo, format: 'png' }} style={{ width: 26, height: 26, marginRight: 8 }} />}
            <View>
              <Text style={s.brandName}>Dazytech Solutions</Text>
              <Text style={s.small}>dazytech.web.id</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.small}>WhatsApp {CONTACT.whatsappDisplay}</Text>
            <Text style={s.small}>{CONTACT.email}</Text>
          </View>
        </View>

        <Text style={s.title}>{p.labels.pdfTitle}</Text>
        <Text style={s.subtitle}>{p.labels.pdfSubtitle}</Text>

        <View style={s.promises}>
          {p.promises.map((item, i) => (
            <View key={item.title} style={[s.promise, i > 0 ? s.promiseBorder : {}]}>
              <Text style={s.promiseTitle}>{item.title}</Text>
              <Text style={s.promiseBody}>{item.body}</Text>
            </View>
          ))}
        </View>

        <CategoryTable locale={locale} category="website" />

        <View break>
          <CategoryTable locale={locale} category="app" />
        </View>

        {/* Satu blok utuh: kalau tidak muat, pindah ke halaman berikutnya bersama judulnya. */}
        <View wrap={false}>
          <Text style={s.sectionTitle}>{p.extrasSection.title}</Text>
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
            <ExtraList locale={locale} group="addon" title={p.extrasSection.addonTitle} />
            <ExtraList locale={locale} group="change" title={p.extrasSection.changeTitle} />
          </View>
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>{p.renewalSection.title}</Text>
          <Text style={s.sectionLead}>{p.renewalSection.lead}</Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {(['website', 'app'] as const).map((category) => (
              <View key={category} style={{ flex: 1 }}>
                <Text style={[s.listName, { marginBottom: 4 }]}>{p.renewalSection.includes[category].title}</Text>
                {p.renewalSection.includes[category].items.map((it) => (
                  <View key={it} style={s.feature}>
                    <CheckIcon />
                    <Text style={[s.text, { flex: 1 }]}>{it}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={s.box} wrap={false}>
          {p.notes.map((n) => (
            <Text key={n} style={[s.text, { color: C.muted, marginBottom: 2 }]}>
              {n}
            </Text>
          ))}
          <Text style={[s.text, { fontFamily: 'Helvetica-Bold', color: C.ink, marginTop: 4 }]}>{fill(p.labels.pdfContact, { wa: CONTACT.whatsappDisplay, url })}</Text>
        </View>
      </Page>
    </Document>
  );
}

// Isi PDF hanya berubah saat deploy, jadi cukup dibuat sekali per bahasa per proses.
const cache = new Map<Locale, Promise<Buffer>>();

export function renderPricingPdf(locale: Locale): Promise<Buffer> {
  let pdf = cache.get(locale);
  if (!pdf) {
    pdf = renderToBuffer(<PricingDocument locale={locale} logo={loadLogo()} />);
    pdf.catch(() => cache.delete(locale));
    cache.set(locale, pdf);
  }
  return pdf;
}

export function pricingPdfFileName(locale: Locale): string {
  return locale === 'en' ? 'dazytech-pricing.pdf' : 'paket-harga-dazytech.pdf';
}

// Dipakai route /harga/paket-harga-dazytech.pdf dan /en/pricing/dazytech-pricing.pdf.
// `inline`: di HP terbuka di viewer PDF; tombol di halaman memakai atribut download.
export async function pricingPdfResponse(locale: Locale): Promise<Response> {
  const pdf = await renderPricingPdf(locale);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${pricingPdfFileName(locale)}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

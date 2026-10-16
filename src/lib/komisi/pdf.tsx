import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '@/lib/format';
import type { getRun } from './runs';

// Laporan perhitungan komisi (A4). Gaya mengikuti admin: ink near-black,
// hairline tipis, satu aksen biru untuk angka total. Font Helvetica bawaan PDF
// (tanpa file font tambahan, aman di container read-only).

type RunData = NonNullable<ReturnType<typeof getRun>>;

// Jangan memenggal kata dengan tanda hubung ("ROKOK FIL-TER"): kata utuh pindah baris.
Font.registerHyphenationCallback((word) => [word]);

// '2026-07-16' -> '16/07/26' (muat satu baris di kolom sempit).
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;

const C = {
  ink: '#1d1d1f',
  muted: '#6e6e73',
  faint: '#86868b',
  hairline: '#e0e0e0',
  divider: '#f0f0f0',
  pearl: '#fafafc',
  accent: '#0066cc',
  danger: '#d70015',
};

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 36, fontFamily: 'Helvetica', fontSize: 8, color: C.ink },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginTop: 4, letterSpacing: -0.3 },
  subtitle: { fontSize: 9, color: C.muted, marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  company: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  small: { fontSize: 8, color: C.muted, marginTop: 2 },
  voidBanner: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fff2f2',
    color: C.danger,
    fontSize: 8.5,
  },
  strip: { flexDirection: 'row', marginTop: 16, borderWidth: 0.75, borderColor: C.hairline, borderRadius: 8 },
  stripCell: { flex: 1, paddingVertical: 9, paddingHorizontal: 11 },
  stripCellBorder: { borderLeftWidth: 0.75, borderLeftColor: C.hairline },
  stripLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stripValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 20, marginBottom: 6 },
  th: {
    flexDirection: 'row',
    borderTopWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: C.hairline,
    backgroundColor: C.pearl,
    paddingVertical: 4,
  },
  thText: { fontSize: 7, color: C.muted, paddingHorizontal: 4 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.divider, paddingVertical: 3.5 },
  // Rincian lebih rapat dari ringkasan supaya baris panjang tetap satu baris.
  trDetail: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.divider, paddingVertical: 3, fontSize: 7.5 },
  td: { paddingHorizontal: 4 },
  right: { textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.75, borderBottomColor: C.hairline },
  signatures: { flexDirection: 'row', marginTop: 28, gap: 16 },
  signBox: { flex: 1 },
  signLabel: { fontSize: 7.5, color: C.muted },
  signLine: { marginTop: 36, borderTopWidth: 0.75, borderTopColor: C.ink, paddingTop: 3, fontSize: 8 },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: C.faint,
  },
});

// Lebar kolom tabel rincian (jumlah = 100).
const DETAIL = [
  { key: 'no', label: '#', w: 4, right: true },
  { key: 'date', label: 'Tgl', w: 8 },
  { key: 'inv', label: 'No Inv', w: 11 },
  { key: 'customer', label: 'Konsumen', w: 19 },
  { key: 'item', label: 'Barang', w: 22 },
  { key: 'category', label: 'Kategori', w: 14 },
  { key: 'qty', label: 'Qty', w: 9, right: true },
  { key: 'rate', label: 'Tarif', w: 6, right: true },
  { key: 'amount', label: 'Komisi', w: 7, right: true },
] as const;

const SUMMARY = [
  { label: 'Kategori', w: 34 },
  { label: 'Baris', w: 10, right: true },
  { label: 'Qty', w: 22, right: true },
  { label: 'Tarif', w: 16, right: true },
  { label: 'Komisi', w: 18, right: true },
] as const;

function Cell({ w, right, bold, children, color }: { w: number; right?: boolean; bold?: boolean; color?: string; children: React.ReactNode }) {
  return (
    <Text style={[s.td, { width: `${w}%` }, right ? s.right : {}, bold ? s.bold : {}, color ? { color } : {}]}>{children}</Text>
  );
}

function CommissionReport({ data, companyName, printedAt }: { data: RunData; companyName: string; printedAt: Date }) {
  const { run, items, groups } = data;
  const isVoid = run.status === 'void';

  return (
    <Document title={`${run.label} · ${companyName}`} author="Dazytech" creator="Dazytech Commission Engine">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={[s.title, { marginTop: 0 }]}>{run.label}</Text>
            <Text style={s.subtitle}>
              Faktur s/d {formatDate(run.cutoffDate)} · lunas · belum pernah dikomisikan
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.company}>{companyName}</Text>
            <Text style={s.small}>Perhitungan #{run.id}</Text>
            <Text style={s.small}>
              Dibuat {formatDateTime(run.createdAt)} · {run.createdByName ?? '–'}
            </Text>
            <Text style={[s.small, { color: isVoid ? C.danger : C.ink, fontFamily: 'Helvetica-Bold' }]}>
              {isVoid ? 'DIBATALKAN' : 'FINAL'}
            </Text>
          </View>
        </View>

        {isVoid && (
          <Text style={s.voidBanner}>
            Perhitungan ini dibatalkan{run.voidedAt ? ` pada ${formatDateTime(run.voidedAt)}` : ''}
            {run.voidedByName ? ` oleh ${run.voidedByName}` : ''}. Alasan: {run.voidReason}. Dokumen hanya arsip, bukan dasar pembayaran.
          </Text>
        )}

        {/* Ringkasan angka */}
        <View style={s.strip}>
          <View style={s.stripCell}>
            <Text style={s.stripLabel}>Total komisi</Text>
            <Text style={[s.stripValue, { color: isVoid ? C.muted : C.accent, fontSize: 14 }]}>{formatRupiah(run.totalAmount)}</Text>
          </View>
          <View style={[s.stripCell, s.stripCellBorder]}>
            <Text style={s.stripLabel}>Baris faktur</Text>
            <Text style={s.stripValue}>{formatNumber(run.totalLines)}</Text>
          </View>
          <View style={[s.stripCell, s.stripCellBorder]}>
            <Text style={s.stripLabel}>Cutoff</Text>
            <Text style={s.stripValue}>{formatDate(run.cutoffDate)}</Text>
          </View>
          <View style={[s.stripCell, s.stripCellBorder]}>
            <Text style={s.stripLabel}>Kategori</Text>
            <Text style={s.stripValue}>{new Set(groups.map((g) => g.category)).size}</Text>
          </View>
        </View>

        {run.note && <Text style={[s.subtitle, { marginTop: 10 }]}>Catatan: {run.note}</Text>}

        {/* Per kategori */}
        <Text style={s.sectionTitle}>Ringkasan per kategori</Text>
        <View style={s.th}>
          {SUMMARY.map((c) => (
            <Text key={c.label} style={[s.thText, { width: `${c.w}%` }, 'right' in c ? s.right : {}]}>
              {c.label}
            </Text>
          ))}
        </View>
        {groups.map((g) => (
          <View key={`${g.category}|${g.unit}|${g.rate}|${g.factor}`} style={s.tr} wrap={false}>
            <Cell w={34} bold>
              {g.category}
            </Cell>
            <Cell w={10} right>
              {formatNumber(g.lines)}
            </Cell>
            <Cell w={22} right>
              {formatNumber(g.qty)} {g.unit}
              {g.factor !== 1 ? `  (= ${formatNumber(g.qty * g.factor)} ${g.baseUnit})` : ''}
            </Cell>
            <Cell w={16} right color={C.muted}>
              {formatRupiah(g.rate)}/{g.baseUnit}
            </Cell>
            <Cell w={18} right bold>
              {formatRupiah(g.amount)}
            </Cell>
          </View>
        ))}
        <View style={s.totalRow} wrap={false}>
          <Cell w={34} bold>
            Total
          </Cell>
          <Cell w={10} right bold>
            {formatNumber(run.totalLines)}
          </Cell>
          <Cell w={38}>{''}</Cell>
          <Cell w={18} right bold color={isVoid ? C.muted : C.accent}>
            {formatRupiah(run.totalAmount)}
          </Cell>
        </View>

        {/* Rincian */}
        <Text style={s.sectionTitle}>Rincian faktur ({formatNumber(items.length)} baris)</Text>
        <View style={s.th} fixed>
          {DETAIL.map((c) => (
            <Text key={c.key} style={[s.thText, { width: `${c.w}%` }, 'right' in c ? s.right : {}]}>
              {c.label}
            </Text>
          ))}
        </View>
        {items.map((it, i) => (
          <View key={it.lineId} style={s.trDetail} wrap={false}>
            <Cell w={4} right color={C.faint}>
              {i + 1}
            </Cell>
            <Cell w={8}>{shortDate(it.invoiceDate)}</Cell>
            <Cell w={11}>{it.invoiceNo}</Cell>
            <Cell w={19}>{it.customer ?? '–'}</Cell>
            <Cell w={22}>{it.itemName}</Cell>
            <Cell w={14} color={C.muted}>
              {it.category}
            </Cell>
            <Cell w={9} right>
              {formatNumber(it.qty)} {it.unit}
            </Cell>
            <Cell w={6} right color={C.muted}>
              {it.factor !== 1 ? `${it.factor}×` : ''}
              {formatNumber(it.rate)}
            </Cell>
            <Cell w={7} right>
              {formatNumber(it.amount)}
            </Cell>
          </View>
        ))}

        {/* Tanda tangan */}
        <View style={s.signatures} wrap={false}>
          {['Dibuat oleh', 'Diperiksa oleh', 'Disetujui oleh'].map((label, i) => (
            <View key={label} style={s.signBox}>
              <Text style={s.signLabel}>{label}</Text>
              <Text style={s.signLine}>{i === 0 ? (run.createdByName ?? ' ') : ' '}</Text>
            </View>
          ))}
        </View>

        <View style={s.footer} fixed>
          <Text>
            {companyName} · {run.label} · dicetak {formatDateTime(printedAt)} WIB
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function renderCommissionPdf(data: RunData, companyName: string): Promise<Buffer> {
  return renderToBuffer(<CommissionReport data={data} companyName={companyName} printedAt={new Date()} />);
}

// Rapikan spasi (termasuk non-breaking space dan baris baru dari sel Excel).
export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

// Untuk nilai yang dipakai sebagai kunci (kategori, satuan, header, line key):
// huruf besar supaya "Moti Ultra" dan "MOTI ULTRA" dianggap sama.
export function normalizeCode(value: string | null | undefined): string {
  return normalizeText(value).toUpperCase();
}

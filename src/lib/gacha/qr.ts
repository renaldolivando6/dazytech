import qrcode from 'qrcode-generator';

export type QrMatrix = { size: number; d: string };

// QR sebagai satu path SVG untuk kartu QR hadiah (/admin/hadiah/qr/). viewBox
// 0 0 size size tanpa quiet zone; modul gelap yang bersebelahan dalam satu baris
// digabung jadi satu persegi panjang. Level M (tahan rusak +-15%) cukup untuk
// gambar kartu dan membuat modulnya lebih besar daripada Q/H.
export function qrSvgPath(text: string): QrMatrix {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let d = '';
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!qr.isDark(row, col)) {
        col++;
        continue;
      }
      let len = 1;
      while (col + len < size && qr.isDark(row, col + len)) len++;
      d += `M${col} ${row}h${len}v1h-${len}z`;
      col += len;
    }
  }
  return { size, d };
}

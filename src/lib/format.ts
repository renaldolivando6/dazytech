const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatRupiah(n: number): string {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

// '2026-07-01' -> '1 Jul 2026'
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Tanggal hari ini di WIB, 'YYYY-MM-DD'.
export function jakartaToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
}

// Cutoff komisi = tanggal 15. Default-nya tanggal 15 terakhir yang sudah lewat
// (hari ini tanggal 15 -> hari ini).
export function defaultCutoff(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  if (d >= 15) return `${y}-${String(m).padStart(2, '0')}-15`;
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  return `${prevY}-${String(prevM).padStart(2, '0')}-15`;
}

export function defaultRunLabel(cutoff: string): string {
  return `Komisi s/d ${formatDate(cutoff)}`;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

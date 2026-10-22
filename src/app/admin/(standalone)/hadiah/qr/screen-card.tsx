import { COUPLE, FROM_NAME, GACHA_URL } from '@/lib/gacha/config';
import type { QrMatrix } from '@/lib/gacha/qr';
import { CoupleArt } from './couple-art';
import styles from './screen-card.module.css';

// Kartu versi screenshot: 360 x 640 (9:16), putih lembut seperti gaun. Judul
// "Happy Wedding" paling besar, nama kecil di bawahnya, ilustrasi pasangan,
// lalu QR besar.

export function ScreenCard({ qr }: { qr: QrMatrix }) {
  const { groom, bride } = COUPLE;
  return (
    <div className={styles.shot}>
      <p className={styles.happy}>Happy Wedding</p>
      <p className={styles.names}>
        {groom.nick} <span className={styles.amp}>&amp;</span> {bride.nick}
      </p>
      <div className={styles.couple}>
        <CoupleArt className={styles.coupleArt} />
      </div>
      <svg className={styles.qr} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" role="img" aria-label={`QR ke ${GACHA_URL}`}>
        <path d={qr.d} />
      </svg>
      <p className={styles.scan}>Scan buat buka hadiah</p>
      <p className={styles.from}>dari {FROM_NAME}</p>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, Badge, Page, Panel, Stat, StatStrip, Table, Td, Th, buttonClass, type Tone } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { COUPLE, GACHA_PATH, PRIZES } from '@/lib/gacha/config';
import { adminSummary, CODE_COUNT, codeField, type AdminSummary } from '@/lib/gacha/service';
import { GachaForm, ResetForm } from './forms';

export const metadata: Metadata = { title: 'Hadiah' };

function statusOf(s: AdminSummary): { label: string; tone: Tone } {
  if (!s.configured) return { label: 'Belum diatur', tone: 'gray' };
  if (!s.ready) return { label: 'Belum lengkap', tone: 'amber' };
  if (s.revealed === s.total) return { label: 'Selesai', tone: 'green' };
  if (s.spun > 0) return { label: 'Sedang diputar', tone: 'blue' };
  return { label: 'Siap dikirim', tone: 'green' };
}

// Hadiah nikahan Jajo & Eng (lib/gacha). Kode voucher & PIN asli hanya diisi
// di sini, tidak pernah di git.
export default async function HadiahPage() {
  await requireAdmin();
  const s = adminSummary(getDb());
  const status = statusOf(s);
  const { groom, bride } = COUPLE;

  const groups = (['steam_600k', 'steam_100k'] as const).map((prize) => ({
    title: `${CODE_COUNT[prize]} x ${PRIZES[prize].label}`,
    fields: Array.from({ length: CODE_COUNT[prize] }, (_, i) => ({
      name: codeField(prize, i),
      label: `Kode ${i + 1}`,
      value: (prize === 'steam_600k' ? s.codes600 : s.codes100)[i] ?? '',
    })),
  }));

  return (
    <Page
      title={`Hadiah ${groom.nick} & ${bride.nick}`}
      back={{ href: '/admin/', label: 'Portal' }}
      description={`Wedding gacha untuk ${groom.name} (${groom.nick}) dan ${bride.name} (${bride.nick}): 7 putaran dengan urutan hasil yang tetap. Halaman tidak diindeks dan hanya terbuka dengan PIN.`}
      actions={
        <>
          <Link href="/admin/hadiah/qr/" className={buttonClass('secondary')}>
            Kartu QR
          </Link>
          <a href={GACHA_PATH} target="_blank" rel="noopener" className={buttonClass('secondary')}>
            Buka halaman hadiah
          </a>
        </>
      }
    >
      {!s.configured && (
        <Alert tone="amber" title="Belum diatur">
          Isi PIN dan lima kode voucher di bawah. Sebelum itu halaman hadiah hanya menampilkan pesan hadiah sedang disiapkan.
        </Alert>
      )}

      <StatStrip cols={3}>
        <Stat label="Status" value={status.label} tone={status.tone} />
        <Stat
          label="Sudah diputar"
          value={`${s.spun}/${s.total}`}
          hint={s.pending ? 'Putaran terakhir belum selesai dibuka' : `${s.revealed} sudah dibuka`}
        />
        <Stat label="Voucher terbuka" value={formatRupiah(s.revealedValueIdr)} hint={`dari ${formatRupiah(s.totalValueIdr)}`} />
      </StatStrip>

      <Panel title="Putaran" description="Urutan hasil ditentukan server dan tidak bisa diubah dari halaman hadiah." flush>
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Hadiah</Th>
              <Th>Kode</Th>
              <Th>Diputar</Th>
              <Th>Dibuka</Th>
            </tr>
          </thead>
          <tbody>
            {s.spins.map((spin) => (
              <tr key={spin.spinNo}>
                <Td className="tabular-nums text-muted">{spin.spinNo}</Td>
                <Td>
                  <p className="font-semibold">{PRIZES[spin.prize].label}</p>
                  {spin.prize === 'zonk' && <p className="text-[12px] text-muted">{spin.title}</p>}
                </Td>
                <Td className="whitespace-nowrap font-mono">{spin.prize === 'zonk' ? <span className="text-faint">-</span> : spin.code || <Badge tone="amber">Belum diisi</Badge>}</Td>
                <Td className="whitespace-nowrap text-muted">{spin.spunAt ? formatDateTime(spin.spunAt) : '-'}</Td>
                <Td className="whitespace-nowrap text-muted">
                  {spin.revealedAt ? formatDateTime(spin.revealedAt) : spin.spunAt ? <Badge tone="amber">Belum selesai dibuka</Badge> : '-'}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel title="Kode voucher & PIN" description="Kode dibagikan berurutan: kode 600K pertama untuk putaran 600K pertama, dan seterusnya.">
        <GachaForm pin={s.pin ?? ''} groups={groups} />
      </Panel>

      <Panel title="Reset putaran" description="Untuk mencoba halaman hadiah sampai puas, lalu kembalikan ke 7 putaran utuh sebelum link dikirim.">
        <ResetForm disabled={!s.configured} />
      </Panel>
    </Page>
  );
}

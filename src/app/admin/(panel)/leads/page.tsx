import type { Metadata } from 'next';
import { EmptyRow, Page, Panel, Stat, StatStrip, Table, Tabs, Td, Th } from '@/components/admin/ui';
import { requireApp } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { formatDateTime } from '@/lib/format';
import { LEAD_STATUSES, LEAD_STATUS_LABEL, countLeadsByStatus, listLeads, type LeadStatus } from '@/lib/leads';
import { interestSince } from '@/lib/tracking';
import { LeadStatusSelect } from './status-select';

const STATUS_OPTIONS = LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABEL[s] }));

export const metadata: Metadata = { title: 'Leads' };

// '0812-3456 789' -> wa.me/628123456789; email -> mailto.
function contactHref(contact: string): string | null {
  if (contact.includes('@')) return `mailto:${contact}`;
  let digits = contact.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  return digits.length >= 9 ? `https://wa.me/${digits}` : null;
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireApp('website');
  const { status: rawStatus } = await searchParams;
  const status = rawStatus === 'all' ? null : LEAD_STATUSES.includes(rawStatus as LeadStatus) ? (rawStatus as LeadStatus) : 'new';

  const db = getDb();
  const counts = countLeadsByStatus(db);
  const leads = listLeads(db, status);
  const total = counts.new + counts.contacted + counts.closed;
  // Minat 30 hari terakhir: klik WhatsApp per jalur dan form yang benar-benar masuk.
  const interest = interestSince(db, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return (
    <Page title="Leads" back={{ href: '/admin/', label: 'Portal' }} description="Isian form kontak dari halaman utama dazytech.web.id. Klik kontak untuk membuka WhatsApp atau email.">
      <StatStrip cols={4}>
        <Stat label="Klik WA · ERP & aplikasi" value={interest.clicks.wa_erp} hint="30 hari terakhir" tone="blue" />
        <Stat label="Klik WA · website" value={interest.clicks.wa_website} hint="30 hari terakhir" tone="blue" />
        <Stat label="Klik WA · umum" value={interest.clicks.wa_general} hint="kontak, menu, footer" tone="gray" />
        <Stat
          label="Form masuk"
          value={interest.forms.website + interest.forms.other}
          hint={`${interest.forms.other} ERP/lainnya · ${interest.forms.website} website`}
          tone="green"
        />
      </StatStrip>
      <p className="-mt-3 text-[12px] text-muted">Klik belum tentu jadi percakapan. Teks pembuka WhatsApp berbeda per jalur, jadi chat yang masuk juga bisa dibedakan.</p>
      <Tabs
        items={[
          ...LEAD_STATUSES.map((s) => ({ href: `/admin/leads/?status=${s}`, label: LEAD_STATUS_LABEL[s], active: status === s, count: counts[s] })),
          { href: '/admin/leads/?status=all', label: 'Semua', active: status === null, count: total },
        ]}
      />
      <Panel flush>
        <Table>
          <thead>
            <tr>
              <Th>Masuk</Th>
              <Th>Nama</Th>
              <Th>Kontak</Th>
              <Th>Kebutuhan</Th>
              <Th>Pesan</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && <EmptyRow colSpan={6}>Belum ada lead di sini.</EmptyRow>}
            {leads.map((l) => {
              const href = contactHref(l.contact);
              return (
                <tr key={l.id} className="align-top">
                  <Td className="whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</Td>
                  <Td className="font-semibold">{l.name}</Td>
                  <Td className="whitespace-nowrap">
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {l.contact}
                      </a>
                    ) : (
                      l.contact
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-ink-80">{l.service ?? '-'}</Td>
                  <Td className="min-w-[240px] max-w-[420px] whitespace-pre-line text-ink-80">{l.message || <span className="text-faint">-</span>}</Td>
                  <Td>
                    <LeadStatusSelect id={l.id} status={l.status} options={STATUS_OPTIONS} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
    </Page>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, Badge, EmptyRow, Page, Panel, Table, Td, Th, buttonClass } from '@/components/admin/ui';
import { listAllArticles } from '@/lib/articles/queries';
import { requireApp } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Artikel' };

export default async function ArticlesAdminPage({ searchParams }: { searchParams: Promise<{ dihapus?: string }> }) {
  await requireApp('website');
  const { dihapus } = await searchParams;
  const articles = listAllArticles(getDb());

  return (
    <Page
      title="Artikel"
      back={{ href: '/admin/', label: 'Portal' }}
      description="Artikel yang terbit tampil di dazytech.web.id/artikel, masuk sitemap, dan muncul di menu samping halaman utama."
      actions={
        <Link href="/admin/artikel/baru/" className={buttonClass('primary')}>
          Tulis artikel
        </Link>
      }
    >
      {dihapus && <Alert tone="green">Artikel dihapus.</Alert>}
      <Panel flush>
        <Table>
          <thead>
            <tr>
              <Th>Judul</Th>
              <Th>Status</Th>
              <Th>Terbit</Th>
              <Th>Terakhir diubah</Th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <EmptyRow colSpan={4}>
                Belum ada artikel.{' '}
                <Link href="/admin/artikel/baru/" className="text-accent hover:underline">
                  Tulis yang pertama
                </Link>
                .
              </EmptyRow>
            )}
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-pearl">
                <Td className="max-w-[520px]">
                  <Link href={`/admin/artikel/${a.id}/`} className="block truncate font-semibold text-ink hover:text-accent">
                    {a.title}
                  </Link>
                  <span className="block truncate text-[12px] text-muted">/artikel/{a.slug}/</span>
                </Td>
                <Td>{a.status === 'published' ? <Badge tone="green">Terbit</Badge> : <Badge tone="gray">Draft</Badge>}</Td>
                <Td className="whitespace-nowrap text-muted">{a.publishedAt ? formatDateTime(a.publishedAt) : '-'}</Td>
                <Td className="whitespace-nowrap text-muted">{formatDateTime(a.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </Page>
  );
}

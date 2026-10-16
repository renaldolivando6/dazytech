import type { Metadata } from 'next';
import { Page, Panel, Table, Th } from '@/components/admin/ui';
import { APPS } from '@/lib/auth/apps';
import { requireAdmin } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { formatDateTime } from '@/lib/format';
import { listUsers } from '@/lib/users';
import { CreateUserButton, UserRow } from './forms';

export const metadata: Metadata = { title: 'Pengguna' };

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = listUsers(getDb());

  return (
    <Page
      title="Pengguna"
      back={{ href: '/admin/', label: 'Portal' }}
      description="Peran dan akses tersimpan otomatis saat diubah. Admin otomatis bisa membuka semua aplikasi; aplikasi tanpa akses tetap tampil di portal, tapi terkunci."
      actions={<CreateUserButton />}
    >
      <Panel flush>
        <Table>
          <thead>
            <tr>
              <Th>Pengguna</Th>
              <Th>Peran</Th>
              {APPS.map((app) => (
                <Th key={app.key} className="text-center">
                  {app.name}
                </Th>
              ))}
              <Th>Status</Th>
              <Th>Dibuat</Th>
              <Th className="text-right">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                isSelf={u.id === me.id}
                user={{
                  id: u.id,
                  username: u.username,
                  role: u.role,
                  apps: u.apps,
                  mustChangePassword: u.mustChangePassword,
                  createdAt: formatDateTime(u.createdAt),
                }}
              />
            ))}
          </tbody>
        </Table>
      </Panel>
    </Page>
  );
}

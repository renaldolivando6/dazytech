import type { Metadata } from 'next';
import { Alert, Page, Panel } from '@/components/admin/ui';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { requireUser } from '@/lib/auth/session';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Akun' };

export default async function AkunPage() {
  const user = await requireUser({ allowPendingPasswordChange: true });

  return (
    <Page title="Akun" back={{ href: '/admin/', label: 'Portal' }} narrow description={`Masuk sebagai ${user.username}.`}>
      <div className="space-y-4">
        {user.mustChangePassword && (
          <Alert tone="amber" title="Ganti password dulu">
            Akun ini masih memakai password awal. Ganti dulu sebelum memakai menu admin.
          </Alert>
        )}
        <Panel title="Ganti password">
          <PasswordForm minLength={MIN_PASSWORD_LENGTH} />
        </Panel>
      </div>
    </Page>
  );
}

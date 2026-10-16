'use client';

import { inputSmClass } from '@/components/admin/ui';
import { setLeadStatusAction } from './actions';

// Status langsung tersimpan saat pilihan diganti. Opsi dikirim dari server
// (lib/leads), supaya modul DB tidak ikut ke bundle browser.
export function LeadStatusSelect({ id, status, options }: { id: number; status: string; options: { value: string; label: string }[] }) {
  return (
    <form action={setLeadStatusAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Status lead"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`${inputSmClass} w-[120px]`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}

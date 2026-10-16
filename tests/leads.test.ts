import { describe, expect, it } from 'vitest';
import { countLeadsByStatus, createLead, leadAllowed, leadSchema, listLeads, setLeadStatus } from '@/lib/leads';
import { memoryDb } from './helpers';

describe('form kontak (leads)', () => {
  it('validasi: nomor WA atau email wajib masuk akal', () => {
    expect(leadSchema.safeParse({ name: 'Budi', contact: '0812 3456 789' }).success).toBe(true);
    expect(leadSchema.safeParse({ name: 'Budi', contact: 'budi@usaha.id' }).success).toBe(true);
    expect(leadSchema.safeParse({ name: 'Budi', contact: 'halo halo' }).success).toBe(false);
    expect(leadSchema.safeParse({ name: 'B', contact: '081234567890' }).success).toBe(false);
  });

  it('tersimpan sebagai lead baru lalu bisa diubah statusnya', () => {
    const db = memoryDb();
    const input = leadSchema.parse({ name: 'Budi', contact: '081234567890', service: 'Klinik', message: 'Butuh antrean online.' });
    const id = createLead(db, input, { ipAddress: '1.2.3.4', userAgent: 'test' });

    expect(listLeads(db, 'new').map((l) => l.id)).toEqual([id]);
    setLeadStatus(db, id, 'contacted');
    expect(listLeads(db, 'new')).toHaveLength(0);
    expect(countLeadsByStatus(db)).toEqual({ new: 0, contacted: 1, closed: 0 });
    expect(listLeads(db, null)[0]).toMatchObject({ name: 'Budi', service: 'Klinik', status: 'contacted' });
  });

  it('dibatasi 5 kiriman per IP per jam', () => {
    const now = 5_000_000;
    for (let i = 0; i < 5; i++) expect(leadAllowed('9.9.9.9', now)).toBe(true);
    expect(leadAllowed('9.9.9.9', now)).toBe(false);
    expect(leadAllowed('8.8.8.8', now)).toBe(true);
    expect(leadAllowed('9.9.9.9', now + 60 * 60 * 1000 + 1)).toBe(true);
  });
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR, openDatabase, runMigrations } from '@/lib/db/open';

// Migrasi 0002 membangun ulang tabel. Uji: data dari skema sebelum company
// tetap utuh, masuk ke company "Pangan", dan relasinya tidak putus.
function migrationsUpTo(count: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dz-mig-'));
  fs.mkdirSync(path.join(dir, 'meta'));
  const journal = JSON.parse(fs.readFileSync(path.join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8'));
  journal.entries = journal.entries.slice(0, count);
  fs.writeFileSync(path.join(dir, 'meta', '_journal.json'), JSON.stringify(journal));
  for (const e of journal.entries) fs.copyFileSync(path.join(MIGRATIONS_DIR, `${e.tag}.sql`), path.join(dir, `${e.tag}.sql`));
  return dir;
}

describe('migrasi 0002 (multi-company)', () => {
  it('memindahkan data lama ke Pangan tanpa kehilangan relasi', () => {
    const db = openDatabase(':memory:');
    runMigrations(db, migrationsUpTo(2)); // skema sebelum company
    const sqlite = db.$client;
    const now = Date.now();

    sqlite.prepare("INSERT INTO users (username, password_hash, created_at, updated_at) VALUES ('admin', 'x', ?, ?)").run(now, now);
    sqlite.prepare("INSERT INTO komisi_imports (file_name, file_hash, imported_by, rows_total, created_at) VALUES ('a.xlsx', 'h', 1, 2, ?)").run(now);
    sqlite.prepare("INSERT INTO komisi_import_rows (import_id, row_number, status) VALUES (1, 3, 'new'), (1, 4, 'new')").run();
    sqlite.prepare("INSERT INTO komisi_runs (label, cutoff_date, total_lines, total_amount, created_by, created_at) VALUES ('Jul', '2026-07-15', 1, 1000, 1, ?)").run(now);
    sqlite
      .prepare(
        `INSERT INTO komisi_lines (line_key, invoice_no, invoice_date, item_name, category, qty, unit, is_unpaid, first_import_id, last_import_id, commission_run_id, created_at, updated_at)
         VALUES ('FJ1|A|1', 'FJ1', '2026-07-02', 'A', 'ROKOK FILTER', 100, 'BKS', 0, 1, 1, 1, ?, ?),
                ('FJ2|B|1', 'FJ2', '2026-07-03', 'B', 'MOTI', 5, 'PCS', 1, 1, 1, NULL, ?, ?)`,
      )
      .run(now, now, now, now);
    sqlite.prepare("INSERT INTO komisi_run_items (run_id, line_id, category, unit, base_unit, qty, factor, rate, amount) VALUES (1, 1, 'ROKOK FILTER', 'BKS', 'BKS', 100, 1, 10, 1000)").run();

    runMigrations(db); // semua migrasi, termasuk 0002

    const companies = sqlite.prepare('SELECT id, name FROM companies ORDER BY id').all() as { id: number; name: string }[];
    expect(companies.map((c) => c.name)).toEqual(['Pangan', 'Test']);
    const pangan = companies[0].id;
    const test = companies[1].id;

    const count = (sql: string, ...args: unknown[]) => (sqlite.prepare(sql).get(...args) as { n: number }).n;
    expect(count('SELECT COUNT(*) n FROM komisi_lines WHERE company_id = ?', pangan)).toBe(2);
    expect(count('SELECT COUNT(*) n FROM komisi_imports WHERE company_id = ?', pangan)).toBe(1);
    expect(count('SELECT COUNT(*) n FROM komisi_runs WHERE company_id = ?', pangan)).toBe(1);
    // Anak-anak tidak terhapus oleh cascade saat tabel induk dibangun ulang.
    expect(count('SELECT COUNT(*) n FROM komisi_import_rows')).toBe(2);
    expect(count('SELECT COUNT(*) n FROM komisi_run_items')).toBe(1);
    expect(count('SELECT COUNT(*) n FROM komisi_lines WHERE commission_run_id = 1')).toBe(1);

    // Master tarif awal milik Pangan, dan Test dapat salinannya (+ konversi KTK).
    expect(count('SELECT COUNT(*) n FROM komisi_categories WHERE company_id = ?', pangan)).toBe(4);
    expect(count('SELECT COUNT(*) n FROM komisi_categories WHERE company_id = ?', test)).toBe(4);
    expect(
      count(
        'SELECT COUNT(*) n FROM komisi_unit_conversions u JOIN komisi_categories c ON c.id = u.category_id WHERE c.company_id = ?',
        test,
      ),
    ).toBe(1);

    // Kunci duplikat sekarang per company: line_key sama boleh di company lain.
    sqlite
      .prepare(
        "INSERT INTO komisi_lines (company_id, line_key, invoice_no, invoice_date, item_name, category, qty, unit, is_unpaid, created_at, updated_at) VALUES (?, 'FJ1|A|1', 'FJ1', '2026-07-02', 'A', 'X', 1, 'PCS', 0, ?, ?)",
      )
      .run(test, now, now);
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO komisi_lines (company_id, line_key, invoice_no, invoice_date, item_name, category, qty, unit, is_unpaid, created_at, updated_at) VALUES (?, 'FJ1|A|1', 'FJ1', '2026-07-02', 'A', 'X', 1, 'PCS', 0, ?, ?)",
        )
        .run(pangan, now, now),
    ).toThrow(/UNIQUE/);

    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
  });
});

import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Semua waktu disimpan sebagai epoch milidetik (UTC). Tanggal bisnis dari Excel
// (tanggal faktur, tanggal cutoff) disimpan sebagai teks 'YYYY-MM-DD' supaya
// bisa dibandingkan langsung tanpa urusan zona waktu.
const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date());
const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

// ---------------------------------------------------------------- auth

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  // true untuk akun dengan password awal hasil generate: wajib diganti dulu.
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = sqliteTable(
  'sessions',
  {
    // SHA-256 dari token di cookie. Token aslinya tidak pernah disimpan.
    id: text('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

// ---------------------------------------------------------------- company

// Setiap data komisi (faktur, import, perhitungan, master tarif) milik satu
// company. User memilih company aktif setelah login (cookie, lihat lib/company.ts).
export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: createdAt(),
});

const companyId = () =>
  integer('company_id')
    .notNull()
    .references(() => companies.id);

// ---------------------------------------------------------------- komisi: master tarif

// Satu baris per nilai kolom KATEGORI di Excel Accurate, per company.
export const komisiCategories = sqliteTable(
  'komisi_categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    companyId: companyId(),
    // Persis nilai kolom KATEGORI (dinormalisasi: huruf besar, spasi rapat).
    code: text('code').notNull(),
    label: text('label').notNull(),
    // Satuan yang menjadi dasar tarif, mis. BKS atau PCS.
    baseUnit: text('base_unit').notNull(),
    // Rupiah per 1 satuan dasar. Integer, tidak pernah float.
    rate: integer('rate').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('komisi_categories_company_code_uq').on(t.companyId, t.code)],
);

// Konversi satuan lain ke satuan dasar kategori, mis. SUPLEMEN: 1 KTK = 5 PCS.
export const komisiUnitConversions = sqliteTable(
  'komisi_unit_conversions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => komisiCategories.id, { onDelete: 'cascade' }),
    unit: text('unit').notNull(),
    factor: integer('factor').notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('komisi_unit_conversions_category_unit_uq').on(t.categoryId, t.unit)],
);

// ---------------------------------------------------------------- komisi: import

export const komisiImports = sqliteTable(
  'komisi_imports',
  {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: companyId(),
  fileName: text('file_name').notNull(),
  fileHash: text('file_hash').notNull(),
  importedBy: integer('imported_by').references(() => users.id, { onDelete: 'set null' }),
  rowsTotal: integer('rows_total').notNull().default(0),
  rowsNew: integer('rows_new').notNull().default(0),
  rowsUpdated: integer('rows_updated').notNull().default(0),
  rowsDuplicate: integer('rows_duplicate').notNull().default(0),
  rowsLocked: integer('rows_locked').notNull().default(0),
  rowsConflict: integer('rows_conflict').notNull().default(0),
  rowsError: integer('rows_error').notNull().default(0),
  createdAt: createdAt(),
  },
  (t) => [index('komisi_imports_company_idx').on(t.companyId)],
);

// Jejak per baris Excel untuk setiap import: baru / duplikat / diperbarui / dst.
export const komisiImportRows = sqliteTable(
  'komisi_import_rows',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    importId: integer('import_id')
      .notNull()
      .references(() => komisiImports.id, { onDelete: 'cascade' }),
    rowNumber: integer('row_number').notNull(),
    lineKey: text('line_key'),
    invoiceNo: text('invoice_no'),
    itemName: text('item_name'),
    status: text('status', {
      enum: ['new', 'updated', 'duplicate', 'locked', 'conflict', 'error'],
    }).notNull(),
    message: text('message'),
  },
  (t) => [index('komisi_import_rows_import_idx').on(t.importId)],
);

// ---------------------------------------------------------------- komisi: data faktur

// Satu baris detail faktur dari Excel. Kunci unik `line_key` menjamin baris
// yang sama tidak pernah masuk dua kali walau file diimport berulang.
export const komisiLines = sqliteTable(
  'komisi_lines',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    companyId: companyId(),
    // `NO INV|NAMA BARANG (dinormalisasi)|urutan kemunculan di faktur itu`.
    // Unik per company: faktur yang sama di company lain = data lain.
    lineKey: text('line_key').notNull(),
    invoiceNo: text('invoice_no').notNull(),
    invoiceDate: text('invoice_date').notNull(),
    customer: text('customer'),
    itemName: text('item_name').notNull(),
    category: text('category').notNull(),
    qty: real('qty').notNull(),
    unit: text('unit').notNull(),
    price: real('price'),
    total: real('total'),
    salesperson: text('salesperson'),
    // Kolom "blm.lunas": true = "Ya" (belum lunas), false = "Tidak" (sudah lunas).
    isUnpaid: integer('is_unpaid', { mode: 'boolean' }).notNull(),
    // Kapan baris ini pertama kali terlihat lunas.
    paidSeenAt: integer('paid_seen_at', { mode: 'timestamp_ms' }),
    firstImportId: integer('first_import_id').references(() => komisiImports.id, {
      onDelete: 'set null',
    }),
    lastImportId: integer('last_import_id').references(() => komisiImports.id, {
      onDelete: 'set null',
    }),
    // Terisi = sudah dihitung komisinya (terkunci). NULL = belum.
    commissionRunId: integer('commission_run_id').references(() => komisiRuns.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('komisi_lines_company_key_uq').on(t.companyId, t.lineKey),
    index('komisi_lines_invoice_idx').on(t.invoiceNo),
    index('komisi_lines_run_idx').on(t.commissionRunId),
    index('komisi_lines_pending_idx').on(t.companyId, t.commissionRunId, t.isUnpaid, t.invoiceDate),
  ],
);

// ---------------------------------------------------------------- komisi: perhitungan

export const komisiRuns = sqliteTable(
  'komisi_runs',
  {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: companyId(),
  label: text('label').notNull(),
  cutoffDate: text('cutoff_date').notNull(),
  status: text('status', { enum: ['final', 'void'] })
    .notNull()
    .default('final'),
  totalLines: integer('total_lines').notNull(),
  totalAmount: integer('total_amount').notNull(),
  note: text('note'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  voidedAt: integer('voided_at', { mode: 'timestamp_ms' }),
  voidedBy: integer('voided_by').references(() => users.id, { onDelete: 'set null' }),
  voidReason: text('void_reason'),
  },
  (t) => [index('komisi_runs_company_idx').on(t.companyId)],
);

// Snapshot tarif per baris saat perhitungan dikunci. Mengubah master tarif
// sesudahnya tidak mengubah perhitungan yang sudah ada.
export const komisiRunItems = sqliteTable(
  'komisi_run_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    runId: integer('run_id')
      .notNull()
      .references(() => komisiRuns.id, { onDelete: 'cascade' }),
    lineId: integer('line_id')
      .notNull()
      .references(() => komisiLines.id),
    category: text('category').notNull(),
    unit: text('unit').notNull(),
    baseUnit: text('base_unit').notNull(),
    qty: real('qty').notNull(),
    factor: integer('factor').notNull(),
    rate: integer('rate').notNull(),
    amount: integer('amount').notNull(),
  },
  (t) => [index('komisi_run_items_run_idx').on(t.runId), index('komisi_run_items_line_idx').on(t.lineId)],
);

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type KomisiLine = typeof komisiLines.$inferSelect;
export type KomisiCategory = typeof komisiCategories.$inferSelect;
export type KomisiRun = typeof komisiRuns.$inferSelect;

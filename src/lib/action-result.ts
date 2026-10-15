// Bentuk balikan server action yang dipakai form admin (useActionState).
//
// `values`: isian yang dikirim, dikembalikan saat gagal. React 19 mereset form
// setelah action selesai, jadi tanpa ini semua yang sudah diketik hilang
// begitu ada error validasi. Form memakainya sebagai defaultValue.
export type ActionState<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }
  | null;

export function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    out[key] ??= issue.message;
  }
  return out;
}

// Ambil isian teks dari FormData untuk dikembalikan ke form. Field rahasia
// (password) sengaja tidak pernah ikut.
export function submittedValues(formData: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = formData.get(key);
    if (typeof v === 'string') out[key] = v.slice(0, 500);
  }
  return out;
}

// Nilai awal sebuah field: isian terakhir kalau action gagal, selain itu fallback.
export function valueOf(state: ActionState<unknown>, key: string, fallback = ''): string {
  return state && !state.ok && state.values?.[key] !== undefined ? state.values[key] : fallback;
}

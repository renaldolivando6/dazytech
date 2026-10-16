'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { flushSync } from 'react-dom';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, Badge, Page, Panel, buttonClass, cx, labelClass, textareaClass } from '@/components/admin/ui';
import { readingMinutes, renderMarkdown } from '@/lib/articles/markdown';
import { slugify } from '@/lib/articles/slug';
import { deleteArticleAction, saveArticleAction } from './actions';

type EditorArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
};

type Tool = { label: string; title: string; before: string; after: string; sample: string; perLine: boolean };

// Tombol toolbar = sisipan Markdown di posisi kursor / teks yang dipilih.
const TOOLS: Tool[] = [
  { label: 'H2', title: 'Subjudul', before: '## ', after: '', sample: 'Subjudul', perLine: true },
  { label: 'H3', title: 'Sub-subjudul', before: '### ', after: '', sample: 'Sub-subjudul', perLine: true },
  { label: 'B', title: 'Tebal', before: '**', after: '**', sample: 'teks tebal', perLine: false },
  { label: 'I', title: 'Miring', before: '_', after: '_', sample: 'teks miring', perLine: false },
  { label: 'Link', title: 'Link', before: '[', after: '](https://)', sample: 'teks link', perLine: false },
  { label: '• Daftar', title: 'Daftar poin', before: '- ', after: '', sample: 'poin', perLine: true },
  { label: '1. Urut', title: 'Daftar bernomor', before: '1. ', after: '', sample: 'langkah', perLine: true },
  { label: '❝', title: 'Kutipan', before: '> ', after: '', sample: 'kutipan', perLine: true },
  { label: '</>', title: 'Kode', before: '`', after: '`', sample: 'kode', perLine: false },
];

export function ArticleEditor({ article, justCreated }: { article: EditorArticle | null; justCreated?: boolean }) {
  const [state, formAction, pending] = useActionState(saveArticleAction, null);
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  // Artikel baru: slug mengikuti judul sampai diubah manual.
  const [slugTouched, setSlugTouched] = useState(!!article);
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
  const [content, setContent] = useState(article?.content ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(article?.status ?? 'draft');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const preview = useMemo(() => (tab === 'preview' ? renderMarkdown(content) : ''), [tab, content]);
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const published = article?.status === 'published';

  useEffect(() => {
    if (state?.ok) setDirty(false);
  }, [state]);

  // Peringatan sebelum meninggalkan halaman dengan perubahan yang belum disimpan.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function submit() {
    const form = formRef.current;
    if (!form || pending) return;
    // Dikirim manual (bukan <form action>) supaya React tidak mereset isian
    // form setelah action selesai; isi artikel tetap di state editor.
    startTransition(() => formAction(new FormData(form)));
  }

  function insert(tool: Tool) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    let next: string;
    let selStart: number;
    let selEnd: number;

    if (tool.perLine) {
      // Awalan per baris (judul, daftar, kutipan) berlaku untuk baris utuh.
      const lineStart = content.lastIndexOf('\n', s - 1) + 1;
      const nl = content.indexOf('\n', e);
      const lineEnd = nl === -1 ? content.length : nl;
      const block = content.slice(lineStart, lineEnd) || tool.sample;
      const prefixed = block
        .split('\n')
        .map((line) => tool.before + line)
        .join('\n');
      next = content.slice(0, lineStart) + prefixed + content.slice(lineEnd);
      selStart = lineStart + tool.before.length;
      selEnd = lineStart + prefixed.length;
    } else {
      const body = content.slice(s, e) || tool.sample;
      next = content.slice(0, s) + tool.before + body + tool.after + content.slice(e);
      selStart = s + tool.before.length;
      selEnd = selStart + body.length;
    }

    // flushSync: textarea sudah berisi teks baru sebelum kursor dipindah,
    // jadi ketikan berikutnya langsung mengganti teks contoh yang terpilih.
    flushSync(() => {
      setContent(next);
      setDirty(true);
    });
    ta.focus();
    ta.setSelectionRange(selStart, selEnd);
  }

  return (
    <Page
      title={article ? 'Edit artikel' : 'Artikel baru'}
      back={{ href: '/admin/artikel/', label: 'Artikel' }}
      actions={
        <>
          {article && (published ? <Badge tone="green">Terbit</Badge> : <Badge tone="gray">Draft</Badge>)}
          {article && published && (
            <Link href={`/artikel/${article.slug}/`} target="_blank" className={buttonClass('ghost', 'sm')}>
              Lihat di situs ↗
            </Link>
          )}
          <button type="button" onClick={submit} disabled={pending} className={buttonClass('primary')}>
            {pending ? 'Menyimpan…' : status === 'published' ? (published ? 'Simpan' : 'Terbitkan') : 'Simpan draft'}
          </button>
        </>
      }
    >
      {justCreated && !state && <Alert tone="green">Artikel dibuat.</Alert>}
      {state?.ok && <Alert tone="green">{state.message}</Alert>}
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            submit();
          }
        }}
        onChange={() => setDirty(true)}
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        {article && <input type="hidden" name="id" value={article.id} />}
        <input type="hidden" name="slug" value={effectiveSlug} />
        <input type="hidden" name="status" value={status} />

        <Panel>
          <label htmlFor="article-title" className="sr-only">
            Judul
          </label>
          <input
            id="article-title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            placeholder="Judul artikel"
            className="w-full border-0 bg-transparent p-0 text-[28px] font-semibold leading-[1.14] tracking-[-0.02em] outline-none placeholder:text-faint"
          />
          {errors?.title && <p className="mt-1 text-[12px] text-danger">{errors.title}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-y border-divider py-2">
            <div className="inline-flex gap-0.5 rounded-lg bg-black/[0.05] p-0.5">
              {(['write', 'preview'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cx(
                    'rounded-md px-3 py-1 text-[12px] transition-colors',
                    tab === t ? 'bg-white font-semibold text-ink ring-1 ring-black/[0.06]' : 'text-ink-80 hover:text-ink',
                  )}
                >
                  {t === 'write' ? 'Tulis' : 'Pratinjau'}
                </button>
              ))}
            </div>
            {tab === 'write' && (
              <div className="flex flex-wrap gap-0.5">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.label}
                    type="button"
                    title={tool.title}
                    onClick={() => insert(tool)}
                    className="rounded-md px-2 py-1 text-[12px] font-semibold text-ink-80 hover:bg-black/[0.05] hover:text-ink"
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tab === 'write' ? (
            <textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'Mulai menulis…\n\nPakai ## untuk subjudul, **tebal**, _miring_, - untuk daftar, dan [teks](https://link) untuk link.'}
              className="mt-4 block min-h-[520px] w-full resize-y border-0 bg-transparent p-0 text-[15px] leading-[1.7] outline-none placeholder:text-faint"
            />
          ) : (
            <>
              <input type="hidden" name="content" value={content} />
              {content.trim() ? (
                // Pratinjau memakai renderer yang sama dengan halaman publik (html:false).
                <div className="article-body mt-6 min-h-[520px]" dangerouslySetInnerHTML={{ __html: preview }} />
              ) : (
                <p className="mt-6 min-h-[520px] text-[14px] text-muted">Belum ada isi.</p>
              )}
            </>
          )}
          {errors?.content && <p className="mt-2 text-[12px] text-danger">{errors.content}</p>}
          <p className="mt-4 border-t border-divider pt-3 text-[12px] text-muted">
            {words.toLocaleString('id-ID')} kata · ±{readingMinutes(content)} menit baca · Ctrl/⌘ + S untuk menyimpan
          </p>
        </Panel>

        <div className="space-y-6 lg:sticky lg:top-[120px]">
          <Panel title="Status">
            <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-black/[0.05] p-0.5">
              {(
                [
                  ['draft', 'Draft'],
                  ['published', 'Terbit'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={status === value}
                  onClick={() => {
                    setStatus(value);
                    setDirty(true);
                  }}
                  className={cx(
                    'rounded-md py-1.5 text-[13px] transition-colors',
                    status === value ? 'bg-white font-semibold text-ink ring-1 ring-black/[0.06]' : 'text-ink-80 hover:text-ink',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">
              {status === 'published' ? 'Tampil di situs dan masuk sitemap setelah disimpan.' : 'Hanya terlihat di admin.'}
            </p>
          </Panel>

          <Panel title="SEO">
            <div className="space-y-4">
              <div>
                <label htmlFor="article-slug" className={labelClass}>
                  Alamat (slug)
                </label>
                <div className="flex items-center rounded-lg border border-black/[0.12] bg-white focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
                  <span className="pl-3 text-[13px] text-faint">/artikel/</span>
                  <input
                    id="article-slug"
                    value={effectiveSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    maxLength={80}
                    className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-[14px] outline-none"
                  />
                </div>
                {errors?.slug ? (
                  <p className="mt-1 text-[12px] text-danger">{errors.slug}</p>
                ) : (
                  published && <p className="mt-1 text-[12px] text-muted">Mengubah slug artikel yang sudah terbit akan memutus link lama.</p>
                )}
              </div>
              <div>
                <label htmlFor="article-excerpt" className={labelClass}>
                  Ringkasan (meta description)
                </label>
                <textarea
                  id="article-excerpt"
                  name="excerpt"
                  rows={4}
                  maxLength={300}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="1–2 kalimat yang muncul di hasil Google."
                  className={textareaClass}
                />
                <p className={cx('mt-1 text-[12px]', excerpt.length > 160 ? 'text-[#c25e00]' : 'text-muted')}>
                  {excerpt.length}/160 karakter{excerpt.length > 160 && ' (Google biasanya memotong setelah ±160)'}
                </p>
                {errors?.excerpt && <p className="mt-1 text-[12px] text-danger">{errors.excerpt}</p>}
              </div>
            </div>
          </Panel>
        </div>
      </form>

      {article && (
        <form action={deleteArticleAction} className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-6">
          <input type="hidden" name="id" value={article.id} />
          <p className="text-[12px] text-muted">Menghapus artikel membuat alamatnya tidak bisa dibuka lagi.</p>
          <SubmitButton
            variant="danger"
            size="sm"
            pendingText="Menghapus…"
            confirm={{
              title: 'Hapus artikel ini?',
              message: 'Artikel dan alamatnya hilang permanen dari situs.',
              confirmLabel: 'Hapus',
              destructive: true,
            }}
          >
            Hapus artikel
          </SubmitButton>
        </form>
      )}
    </Page>
  );
}

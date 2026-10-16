import MarkdownIt from 'markdown-it';

// Dipakai di server (halaman artikel) DAN di browser (pratinjau editor admin),
// jadi jangan import modul server di sini.
//
// html: false -> tag HTML mentah di isi artikel ditampilkan sebagai teks, bukan
// dieksekusi. Link javascript:/vbscript:/data: ditolak oleh validateLink bawaan.
const md = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false });

// Link keluar dibuka di tab baru; link internal tetap di tab yang sama.
const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') ?? '';
  if (/^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?dazytech\.web\.id/i.test(href)) {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('loading', 'lazy');
  tokens[idx].attrSet('decoding', 'async');
  return self.renderToken(tokens, idx, options);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}

// Perkiraan waktu baca, 200 kata per menit, minimal 1 menit.
export function readingMinutes(source: string): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

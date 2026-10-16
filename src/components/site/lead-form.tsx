'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitLeadAction } from '@/app/actions';
import type { Locale, SiteCopy } from '@/i18n';
import { valueOf } from '@/lib/action-result';
import { whatsappUrl } from './content';

const field =
  'block w-full rounded-xl border border-black/[0.12] bg-white px-4 text-[17px] tracking-[-0.022em] text-ink outline-none transition-shadow ' +
  'placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15';
const label = 'mb-1.5 block text-[12px] text-muted';

function Submit({ text, pendingText }: { text: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent py-3 text-[17px] text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? pendingText : text}
    </button>
  );
}

export function LeadForm({ locale, copy, waText, privacyHref }: { locale: Locale; copy: SiteCopy['contact']['form']; waText: string; privacyHref: string }) {
  const [state, action] = useActionState(submitLeadAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  if (state?.ok) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center" role="status">
        <p className="text-[28px] font-semibold leading-[1.14] tracking-[-0.015em]">{copy.sentTitle}</p>
        <p className="mt-3 max-w-xs text-[17px] leading-[1.47] text-muted">{copy.sentBody.replace('{name}', state.data?.name || '').replace(/,\s*\./, '.')}</p>
        <a href={whatsappUrl(waText)} data-cta="wa_general" target="_blank" rel="noopener noreferrer" className="mt-6 text-[17px] text-accent hover:underline">
          {copy.continueWa}
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {state && !state.ok && !errors && (
        <p role="alert" className="rounded-xl bg-[#fff2f2] px-4 py-3 text-[14px] text-[#b0001a]">
          {state.error}
        </p>
      )}
      {/* Honeypot: tidak terlihat oleh manusia, sering diisi bot. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div>
        <label htmlFor="lead-name" className={label}>
          {copy.name}
        </label>
        <input id="lead-name" name="name" required maxLength={80} autoComplete="name" defaultValue={valueOf(state, 'name')} className={`${field} h-12`} />
        {errors?.name && <p className="mt-1 text-[12px] text-danger">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="lead-contact" className={label}>
          {copy.contact}
        </label>
        <input
          id="lead-contact"
          name="contact"
          required
          maxLength={120}
          placeholder={copy.contactPlaceholder}
          defaultValue={valueOf(state, 'contact')}
          className={`${field} h-12`}
        />
        {errors?.contact && <p className="mt-1 text-[12px] text-danger">{errors.contact}</p>}
      </div>
      <div>
        <label htmlFor="lead-service" className={label}>
          {copy.service}
        </label>
        <select id="lead-service" name="service" defaultValue={valueOf(state, 'service', copy.services[0].value)} className={`${field} h-12`}>
          {copy.services.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="lead-message" className={label}>
          {copy.message}
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder={copy.messagePlaceholder}
          defaultValue={valueOf(state, 'message')}
          className={`${field} py-3`}
        />
        {errors?.message && <p className="mt-1 text-[12px] text-danger">{errors.message}</p>}
      </div>
      <Submit text={copy.submit} pendingText={copy.submitting} />
      <p className="text-center text-[12px] leading-[1.5] text-muted">
        {copy.note}
        <br />
        {copy.privacyNote}{' '}
        <Link href={privacyHref} className="text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent">
          {copy.privacyLink}
        </Link>
      </p>
    </form>
  );
}

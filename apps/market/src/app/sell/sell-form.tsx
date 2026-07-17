'use client';

import { useActionState } from 'react';
import { createListing, type SellFormState } from './actions';

const FIELD =
  'mt-1 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint/70 focus:border-seal focus:outline-none';
const LABEL = 'block font-mono text-[12px] font-semibold uppercase tracking-wider text-ink-faint';

export function SellForm() {
  const [state, action, pending] = useActionState<SellFormState, FormData>(createListing, {
    error: null,
  });

  return (
    <form action={action} className="space-y-5 rounded-lg border border-rule p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={LABEL}>Name</span>
          <input name="name" required placeholder="Acme Search" className={FIELD} />
        </label>
        <label>
          <span className={LABEL}>Slug</span>
          <input
            name="slug"
            required
            pattern="[a-z0-9][a-z0-9-]{1,62}"
            placeholder="acme-search"
            className={FIELD}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Description</span>
        <textarea
          name="description"
          required
          rows={3}
          placeholder="What does a buyer's agent get per call?"
          className={FIELD}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Tools — one per line, &quot;name — description&quot;</span>
        <textarea
          name="tools"
          required
          rows={3}
          placeholder={'search — full-text search over the corpus\nfetch_page — retrieve one document'}
          className={`${FIELD} font-mono`}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={LABEL}>Price per call (cents)</span>
          <input
            name="price_cents"
            required
            type="number"
            min={0}
            step={1}
            placeholder="3"
            className={FIELD}
          />
        </label>
        <fieldset>
          <span className={LABEL}>Rails</span>
          <div className="mt-2 flex gap-5">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="rail_x402" defaultChecked className="accent-[#c2401b]" />
              x402 / USDC
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="rail_stripe" className="accent-[#c2401b]" />
              Stripe
            </label>
          </div>
        </fieldset>
      </div>

      <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
        <label>
          <span className={LABEL}>Transport</span>
          <select name="transport" className={FIELD}>
            <option value="stdio">stdio</option>
            <option value="url">url</option>
          </select>
        </label>
        <label>
          <span className={LABEL}>Endpoint — command or https URL</span>
          <input
            name="endpoint_value"
            required
            placeholder="npx -y @acme/search-mcp"
            className={`${FIELD} font-mono`}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={LABEL}>Spend-log URL (public, https)</span>
          <input
            name="spend_log_url"
            required
            type="url"
            placeholder="https://raw.githubusercontent.com/acme/receipts/main/spend.jsonl"
            className={`${FIELD} font-mono`}
          />
        </label>
        <label>
          <span className={LABEL}>Docs URL (optional)</span>
          <input name="docs_url" type="url" placeholder="https://acme.dev/docs" className={FIELD} />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-md border border-deny/50 bg-deny/[0.06] p-3 font-mono text-sm text-deny">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-seal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-seal-deep disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Submit for verification'}
      </button>
      <p className="font-mono text-[12px] leading-5 text-ink-faint">
        Submitting queues the prober: it lists your tools, makes one test-mode
        call under its own budget, and re-derives the price from your log.
        Nothing goes live unprobed.
      </p>
    </form>
  );
}

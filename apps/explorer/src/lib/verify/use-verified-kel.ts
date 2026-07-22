'use client';

import { useEffect, useState } from 'react';
import { validateKel } from './bridge';
import type { KelEvent, KeyState, KelReadResult } from './types';
import type { FetchStamp } from '@/lib/transport/stamp';

export type VerifiedKelState =
  | { status: 'loading' }
  /** The server can't serve the git-object KEL path yet (SDK < 0.1.16). */
  | { status: 'degraded'; reason: string }
  /** The witness (or explorer transport) couldn't be reached. */
  | { status: 'unreachable'; reason: string }
  /** Bytes arrived but the browser verifier rejected them — names what failed. */
  | { status: 'failed'; error: string; events: KelEvent[]; stamp: FetchStamp | null }
  /** Verified in the browser. */
  | {
      status: 'verified';
      keyState: KeyState;
      events: KelEvent[];
      tip: KelReadResult['tip'];
      source: string;
      stamp: FetchStamp | null;
    };

interface KelRouteOk extends KelReadResult {
  stamp: FetchStamp;
}
interface KelRouteErr {
  error: string;
  reason?: string;
}

/**
 * Fetch a member's raw KEL from the explorer's transport, then RE-VERIFY it in
 * this browser before returning anything as valid. The component that consumes
 * this renders only what `status: 'verified'` carries — key state the WASM
 * verifier computed here, never a value the server asserted.
 */
export function useVerifiedKel(witness: string, prefix: string, witnessUrl?: string): VerifiedKelState {
  const [state, setState] = useState<VerifiedKelState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      let body: KelRouteOk | KelRouteErr;
      let httpStatus: number;
      try {
        const qs = witnessUrl ? `?witness=${encodeURIComponent(witnessUrl)}` : '';
        const res = await fetch(
          `/api/node/${encodeURIComponent(witness)}/kel/${encodeURIComponent(prefix)}${qs}`,
        );
        httpStatus = res.status;
        body = await res.json();
      } catch {
        if (!cancelled) setState({ status: 'unreachable', reason: 'the explorer transport did not respond' });
        return;
      }

      if (cancelled) return;

      if (httpStatus === 501 && 'error' in body) {
        setState({
          status: 'degraded',
          reason: body.reason ?? 'this witness’s server KEL read needs @auths-dev/sdk ≥ 0.1.16',
        });
        return;
      }
      if (httpStatus !== 200 || 'error' in body) {
        const err = 'error' in body ? body.error : `HTTP ${httpStatus}`;
        setState({ status: 'unreachable', reason: err });
        return;
      }

      const ok = body as KelRouteOk;
      // The one place a verdict is minted: the browser recomputes the KEL.
      try {
        const keyState = await validateKel<KeyState>(
          JSON.stringify(ok.events),
          JSON.stringify(ok.attachments),
        );
        if (!cancelled) {
          setState({
            status: 'verified',
            keyState,
            events: ok.events,
            tip: ok.tip,
            source: ok.source,
            stamp: ok.stamp,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
            events: ok.events,
            stamp: ok.stamp,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [witness, prefix, witnessUrl]);

  return state;
}

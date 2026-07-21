import { InkTerminal, Prompt, Dim } from '@auths/ledger-ui';

export interface ParityLine {
  /** A `#`-comment shown dim above the command. */
  comment?: string;
  /** The command a visitor can actually run. */
  cmd: string;
}

/**
 * "Verify it yourself" (plan D2 — parity copy). Every explorer view shows the
 * offline commands that prove the same thing without the UI. The explorer is a
 * convenience over evidence anyone can check with the published CLI.
 */
export function OfflineParity({
  label = 'the same claim, without this page',
  lines,
}: {
  label?: string;
  lines: ParityLine[];
}) {
  const copy = lines.map((l) => l.cmd).join('\n');
  return (
    <InkTerminal label={label} tag="offline" copy={copy}>
      {lines.map((l, i) => (
        <div key={i}>
          {l.comment ? <Dim className={i > 0 ? 'pt-2' : ''}># {l.comment}</Dim> : null}
          <Prompt>{l.cmd}</Prompt>
        </div>
      ))}
    </InkTerminal>
  );
}

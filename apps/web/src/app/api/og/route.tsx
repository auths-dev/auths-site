import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const PAPER = '#f6f3ec';
const INK = '#1c1814';
const INK_SOFT = '#5b5448';
const INK_FAINT = '#8a8275';
const SEAL = '#c2401b';
const TERMINAL = '#15130f';
const DENY = '#c0442e';
const OK = '#e8845c';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title =
    searchParams.get('title') ?? 'Your agent can’t exceed its budget. And you can prove it.';
  const subtitle =
    searchParams.get('subtitle') ??
    'One command in front of any MCP server. Signed receipts anyone can verify.';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: PAPER,
          padding: '64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: SEAL,
            }}
          />
          <span
            style={{
              color: INK_FAINT,
              fontSize: '22px',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
            }}
          >
            auths.dev
          </span>
        </div>

        <div
          style={{
            marginTop: '52px',
            fontSize: '58px',
            fontWeight: 600,
            color: INK,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            maxWidth: '1000px',
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: '24px',
            fontSize: '26px',
            color: INK_SOFT,
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            backgroundColor: TERMINAL,
            borderRadius: '12px',
            padding: '24px 28px',
            fontFamily: 'monospace',
            fontSize: '21px',
            gap: '10px',
          }}
        >
          <span style={{ color: DENY }}>
            ✗ payments.charge $940.00 → usage-cap-exceeded · refused · rcpt_8f2a
          </span>
          <span style={{ color: OK }}>
            ✓ verify-spend → consistent — re-derived from signed costs, offline
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

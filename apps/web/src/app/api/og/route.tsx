import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') ?? 'Auths Registry';
  const subtitle = searchParams.get('subtitle') ?? 'Cryptographic Trust, Decentralized';
  const status = searchParams.get('status'); // 'verified' | 'unverified' | null

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#09090b', // zinc-950
          padding: '60px',
          fontFamily: 'monospace',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981', // emerald-500
            }}
          />
          <span style={{ color: '#10b981', fontSize: '20px', fontWeight: 600 }}>
            auths.dev
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 700,
            color: '#f4f4f5', // zinc-100
            lineHeight: 1.1,
            marginBottom: '20px',
            maxWidth: '900px',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '26px',
            color: '#71717a', // zinc-500
            marginBottom: '40px',
          }}
        >
          {subtitle}
        </div>

        {/* Status badge */}
        {status && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: status === 'verified' ? '#052e16' : '#1c1917',
              border: `1px solid ${status === 'verified' ? '#10b981' : '#44403c'}`,
              borderRadius: '8px',
              padding: '10px 20px',
              width: 'fit-content',
            }}
          >
            <span style={{ fontSize: '20px' }}>
              {status === 'verified' ? '✅' : '❌'}
            </span>
            <span
              style={{
                color: status === 'verified' ? '#10b981' : '#78716c',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              {status === 'verified' ? 'Verified Identity' : 'Unverified'}
            </span>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

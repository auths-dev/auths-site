/** Shadow DOM styles for <auths-verify> */
export const styles = `
  :host {
    /* Verified (green) */
    --auths-verified-bg: #ecfdf5;
    --auths-verified-fg: #065f46;
    --auths-verified-border: #6ee7b7;

    /* Invalid (red) */
    --auths-invalid-bg: #fef2f2;
    --auths-invalid-fg: #991b1b;
    --auths-invalid-border: #fca5a5;

    /* Expired (amber) */
    --auths-expired-bg: #fffbeb;
    --auths-expired-fg: #92400e;
    --auths-expired-border: #fcd34d;

    /* Revoked (red-orange) */
    --auths-revoked-bg: #fff7ed;
    --auths-revoked-fg: #9a3412;
    --auths-revoked-border: #fdba74;

    /* Error (gray) */
    --auths-error-bg: #f9fafb;
    --auths-error-fg: #4b5563;
    --auths-error-border: #d1d5db;

    /* Loading */
    --auths-loading-bg: #f9fafb;
    --auths-loading-fg: #6b7280;
    --auths-loading-border: #e5e7eb;

    /* Idle */
    --auths-idle-bg: #f9fafb;
    --auths-idle-fg: #9ca3af;
    --auths-idle-border: #e5e7eb;

    /* Typography & shape */
    --auths-font-family: system-ui, -apple-system, sans-serif;
    --auths-font-size: 13px;
    --auths-border-radius: 9999px;
    --auths-detail-border-radius: 8px;

    display: inline-block;
    font-family: var(--auths-font-family);
    font-size: var(--auths-font-size);
    line-height: 1;
  }

  /* ---------- Badge ---------- */

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px 3px 7px;
    border-radius: var(--auths-border-radius);
    border: 1px solid;
    white-space: nowrap;
    cursor: default;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }

  .badge svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }

  /* Sizes */
  :host([size="sm"]) .badge { padding: 2px 8px 2px 5px; font-size: 11px; }
  :host([size="sm"]) .badge svg { width: 12px; height: 12px; }
  :host([size="lg"]) .badge { padding: 5px 14px 5px 10px; font-size: 15px; }
  :host([size="lg"]) .badge svg { width: 18px; height: 18px; }

  /* State colors */
  :host([data-state="verified"]) .badge {
    background: var(--auths-verified-bg);
    color: var(--auths-verified-fg);
    border-color: var(--auths-verified-border);
  }
  :host([data-state="invalid"]) .badge {
    background: var(--auths-invalid-bg);
    color: var(--auths-invalid-fg);
    border-color: var(--auths-invalid-border);
  }
  :host([data-state="expired"]) .badge {
    background: var(--auths-expired-bg);
    color: var(--auths-expired-fg);
    border-color: var(--auths-expired-border);
  }
  :host([data-state="revoked"]) .badge {
    background: var(--auths-revoked-bg);
    color: var(--auths-revoked-fg);
    border-color: var(--auths-revoked-border);
  }
  :host([data-state="error"]) .badge {
    background: var(--auths-error-bg);
    color: var(--auths-error-fg);
    border-color: var(--auths-error-border);
  }
  :host([data-state="loading"]) .badge {
    background: var(--auths-loading-bg);
    color: var(--auths-loading-fg);
    border-color: var(--auths-loading-border);
  }
  :host([data-state="idle"]) .badge {
    background: var(--auths-idle-bg);
    color: var(--auths-idle-fg);
    border-color: var(--auths-idle-border);
  }

  /* ---------- Loading animation ---------- */

  @keyframes auths-pulse-anim {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .auths-pulse {
    animation: auths-pulse-anim 1.2s ease-in-out infinite;
  }

  /* ---------- Detail panel ---------- */

  .detail-panel {
    margin-top: 6px;
    border: 1px solid var(--auths-error-border);
    border-radius: var(--auths-detail-border-radius);
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.5;
    background: #fff;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
    padding-top: 0;
    padding-bottom: 0;
  }

  .detail-panel[aria-hidden="false"] {
    max-height: 400px;
    opacity: 1;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .detail-panel table {
    width: 100%;
    border-collapse: collapse;
  }

  .detail-panel th,
  .detail-panel td {
    text-align: left;
    padding: 3px 6px;
    border-bottom: 1px solid #f3f4f6;
  }

  .detail-panel th {
    font-weight: 600;
    color: #374151;
  }

  .chain-valid { color: var(--auths-verified-fg); }
  .chain-error { color: var(--auths-invalid-fg); }

  .warnings {
    margin-top: 8px;
    padding: 0;
    list-style: none;
  }

  .warnings li {
    padding: 2px 0;
    color: var(--auths-expired-fg);
  }

  .warnings li::before {
    content: "\\26A0  ";
  }

  /* ---------- Tooltip mode ---------- */

  .tooltip-wrapper {
    position: relative;
    display: inline-block;
  }

  .tooltip-panel {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    min-width: 200px;
    max-width: 320px;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: var(--auths-detail-border-radius);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.5;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .tooltip-wrapper:hover .tooltip-panel,
  .tooltip-wrapper:focus-within .tooltip-panel {
    opacity: 1;
    pointer-events: auto;
  }

  /* ---------- Accessibility ---------- */

  .badge:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .badge {
      border: 2px solid ButtonText;
    }
  }
`;

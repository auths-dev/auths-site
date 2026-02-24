/**
 * Narrative-driven mock data for testing every UI edge case.
 *
 * Six personas:
 * 1. The Sovereign Maintainer — maxed-out trust, multiple platforms, 3 keys
 * 2. The Autonomous Agent — AI bot delegated by a human, no platform claims
 * 3. The Ghost — unclaimed DID, tests the conversion funnel
 * 4. The XZ Utils Incident — compromised package with a revoked release
 * 5. The Kernel Co-maintainer — respected Linux contributor, 1 platform
 * 6. The Junior Contributor — new OSS dev, tests the invite loop
 *
 * Enable fixtures by setting `NEXT_PUBLIC_USE_FIXTURES=true` in `.env.local`.
 */

import type {
  ActiveIdentity,
  IdentityResponse,
  ArtifactQueryResponse,
  PubkeysResponse,
  PackageDetail,
  RecentActivity,
} from './registry';

// ---------------------------------------------------------------------------
// Persona 1: The Sovereign Maintainer
// ---------------------------------------------------------------------------

const SOVEREIGN_DID = 'did:keri:EKVn0mis9eWGpL2p_qbcMDpXBdH2EOwzNbtV97JdQR0u';

const SOVEREIGN_IDENTITY: ActiveIdentity = {
  status: 'active',
  did: SOVEREIGN_DID,
  platform_claims: [
    { platform: 'github', namespace: 'torvalds', verified: true },
    { platform: 'gitlab', namespace: 'torvalds', verified: true },
    { platform: 'radicle', namespace: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK', verified: true },
  ],
  public_keys: [
    {
      key_id: 'key-laptop-001',
      algorithm: 'Ed25519',
      public_key_hex: '8f7a9b2c4d6e1f3a5b7c9d0e2f4a6b8c1d3e5f7a9b0c2d4e6f8a1b3c5d7e9f0a',
      created_at: '2021-01-15T14:30:00Z',
    },
    {
      key_id: 'key-yubikey-002',
      algorithm: 'Ed25519',
      public_key_hex: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      created_at: '2023-06-01T09:00:00Z',
    },
    {
      key_id: 'key-backup-003',
      algorithm: 'Ed25519',
      public_key_hex: 'deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
      created_at: '2024-01-10T11:15:00Z',
    },
  ],
  artifacts: [
    { package_name: 'cargo:linux-kernel-rs', digest_algorithm: 'sha256', digest_hex: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890', signer_did: SOVEREIGN_DID, published_at: '2024-12-01T12:00:00Z' },
    { package_name: 'cargo:git-core', digest_algorithm: 'sha256', digest_hex: 'b2c3d4e5f6789012bcdef23456789012bcdef23456789012bcdef23456789012', signer_did: SOVEREIGN_DID, published_at: '2024-11-20T10:30:00Z' },
    { package_name: 'npm:git-hooks-toolkit', digest_algorithm: 'sha256', digest_hex: 'c3d4e5f67890123cdef345678901234cdef345678901234cdef345678901234c', signer_did: SOVEREIGN_DID, published_at: '2024-10-15T08:45:00Z' },
    { package_name: 'pypi:kernel-dev-tools', digest_algorithm: 'sha256', digest_hex: 'd4e5f678901234def456789012345def456789012345def456789012345def45', signer_did: SOVEREIGN_DID, published_at: '2024-09-01T16:20:00Z' },
    { package_name: 'npm:maintainer-dashboard', digest_algorithm: 'sha256', digest_hex: 'e5f6789012345ef567890123456ef567890123456ef567890123456ef5678901', signer_did: SOVEREIGN_DID, published_at: '2024-08-10T14:00:00Z' },
    { package_name: 'cargo:keri-did-resolver', digest_algorithm: 'sha256', digest_hex: 'f67890123456f67890123456f67890123456f67890123456f67890123456f678', signer_did: SOVEREIGN_DID, published_at: '2024-07-05T11:30:00Z' },
    { package_name: 'docker:dev-environment', digest_algorithm: 'sha256', digest_hex: '0789012345670789012345670789012345670789012345670789012345670789', signer_did: SOVEREIGN_DID, published_at: '2024-06-20T09:00:00Z' },
    { package_name: 'npm:auths-cli', digest_algorithm: 'sha256', digest_hex: '189012345678189012345678189012345678189012345678189012345678189a', signer_did: SOVEREIGN_DID, published_at: '2024-05-15T13:45:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Persona 2: The Autonomous Agent
// ---------------------------------------------------------------------------

const AGENT_DID = 'did:keri:EAgent_PR_Bot_99_Delegated_By_Sovereign_0001';

const AGENT_IDENTITY: ActiveIdentity = {
  status: 'active',
  did: AGENT_DID,
  platform_claims: [],
  public_keys: [
    {
      key_id: 'key-agent-ephemeral-001',
      algorithm: 'Ed25519',
      public_key_hex: 'aaabbbccc111222333444555666777888999000aaabbbccc111222333444555666',
      created_at: '2024-02-01T00:00:00Z',
    },
  ],
  artifacts: [
    { package_name: 'npm:react-agent-tools', digest_algorithm: 'sha256', digest_hex: 'f9e8d7c6b5a4938271fabcde0123456789abcdef0123456789abcdef01234567', signer_did: AGENT_DID, published_at: '2025-01-10T14:00:00Z' },
    { package_name: 'npm:pr-reviewer-action', digest_algorithm: 'sha256', digest_hex: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789', signer_did: AGENT_DID, published_at: '2025-01-05T11:30:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Persona 3: The Ghost (Unclaimed)
// ---------------------------------------------------------------------------

const GHOST_DID = 'did:keri:EUnclaimed_Developer_Ghost_No_Keys_404_000';

// ---------------------------------------------------------------------------
// Persona 4: The XZ Utils Backdoor Incident
// ---------------------------------------------------------------------------

const LASSE_DID = 'did:keri:ELasse_Collin_Original_XZ_Maintainer_0001';
const JIATAN_DID = 'did:keri:EJia_Tan_Backdoor_Compromised_Key_Revoked';

const LASSE_IDENTITY: ActiveIdentity = {
  status: 'active',
  did: LASSE_DID,
  platform_claims: [
    { platform: 'github', namespace: 'Larhzu', verified: true },
  ],
  public_keys: [
    {
      key_id: 'key-lasse-primary',
      algorithm: 'Ed25519',
      public_key_hex: 'cafe0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab',
      created_at: '2019-05-10T00:00:00Z',
    },
  ],
  artifacts: [
    { package_name: 'cargo:xz-utils', digest_algorithm: 'sha256', digest_hex: 'clean0123456789abcdef0123456789abcdef0123456789abcdef0123456789', signer_did: LASSE_DID, published_at: '2023-12-01T12:00:00Z' },
  ],
};

const JIATAN_IDENTITY: ActiveIdentity = {
  status: 'active',
  did: JIATAN_DID,
  platform_claims: [
    { platform: 'github', namespace: 'JiaT75', verified: true },
  ],
  public_keys: [
    {
      key_id: 'key-jiatan-compromised',
      algorithm: 'Ed25519',
      public_key_hex: 'bad0bad1bad2bad3bad4bad5bad6bad7bad8bad9badabadbbadcbaddbadebadf',
      created_at: '2022-01-15T00:00:00Z',
    },
  ],
  artifacts: [
    { package_name: 'cargo:xz-utils', digest_algorithm: 'sha256', digest_hex: 'malicious999xyz000backdoor111exploit222supply333chain444attack555', signer_did: JIATAN_DID, published_at: '2024-02-24T09:00:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Persona 5: The Kernel Co-maintainer (Greg Kroah-Hartman)
// ---------------------------------------------------------------------------

const GREGKH_DID = 'did:keri:EGregKH_Linux_Stable_Kernel_Maintainer_001';

const GREGKH_IDENTITY: ActiveIdentity = {
  status: 'active',
  did: GREGKH_DID,
  platform_claims: [
    { platform: 'github', namespace: 'gregkh', verified: true },
  ],
  public_keys: [
    {
      key_id: 'key-gregkh-yubikey-001',
      algorithm: 'Ed25519',
      public_key_hex: '7e3f8a1b2c4d6e9f0a5b7c9d1e3f5a7b9c0d2e4f6a8b1c3d5e7f9a0b2c4d6e8f',
      created_at: '2020-03-15T10:00:00Z',
    },
  ],
  artifacts: [
    { package_name: 'cargo:linux-kernel-rs', digest_algorithm: 'sha256', digest_hex: 'gregkh01a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12', signer_did: GREGKH_DID, published_at: '2024-11-15T16:30:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Persona 6: The Junior Contributor (Sarah Chen)
// ---------------------------------------------------------------------------

const SARAH_DID = 'did:keri:ESarahChen_Junior_OSS_Contributor_Dev_001';

const SARAH_IDENTITY: ActiveIdentity = {
  status: 'active',
  did: SARAH_DID,
  platform_claims: [
    { platform: 'github', namespace: 'sarahchen-dev', verified: true },
  ],
  public_keys: [
    {
      key_id: 'key-sarah-macbook-001',
      algorithm: 'Ed25519',
      public_key_hex: '5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
      created_at: '2024-03-01T08:00:00Z',
    },
  ],
  artifacts: [
    { package_name: 'npm:maintainer-dashboard', digest_algorithm: 'sha256', digest_hex: 'sarah01e5f6789012345ef567890123456ef567890123456ef567890123456ef', signer_did: SARAH_DID, published_at: '2024-10-22T11:15:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Package: cargo:xz-utils (The Backdoor Incident)
// ---------------------------------------------------------------------------

const XZ_PACKAGE: PackageDetail = {
  ecosystem: 'cargo',
  package_name: 'xz-utils',
  verified: true,
  signers: [
    {
      did: LASSE_DID,
      github_username: 'Larhzu',
      verified: true,
      signature_count: 47,
      last_signed: '2023-12-01T12:00:00Z',
    },
    {
      did: JIATAN_DID,
      github_username: 'JiaT75',
      verified: true,
      signature_count: 5,
      last_signed: '2024-02-24T09:00:00Z',
    },
  ],
  releases: [
    {
      version: '5.4.0',
      digest_algorithm: 'sha256',
      digest_hex: 'clean0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      signer_did: LASSE_DID,
      published_at: '2023-06-01T12:00:00Z',
      status: 'valid',
    },
    {
      version: '5.4.1',
      digest_algorithm: 'sha256',
      digest_hex: 'clean111222333444555666777888999000aaabbbccc111222333444555666777',
      signer_did: LASSE_DID,
      published_at: '2023-09-15T10:30:00Z',
      status: 'valid',
    },
    {
      version: '5.4.2',
      digest_algorithm: 'sha256',
      digest_hex: 'clean888999000111222333444555666777888999000aaabbbccc111222333444',
      signer_did: LASSE_DID,
      published_at: '2023-12-01T12:00:00Z',
      status: 'valid',
    },
    {
      version: '5.6.0',
      digest_algorithm: 'sha256',
      digest_hex: 'malicious999xyz000backdoor111exploit222supply333chain444attack555',
      signer_did: JIATAN_DID,
      published_at: '2024-02-24T09:00:00Z',
      status: 'revoked',
    },
    {
      version: '5.6.1',
      digest_algorithm: 'sha256',
      digest_hex: 'malicious666xyz000backdoor222exploit333supply444chain555attack666',
      signer_did: JIATAN_DID,
      published_at: '2024-03-09T08:15:00Z',
      status: 'revoked',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: npm:auths-cli (Happy-path flagship)
// ---------------------------------------------------------------------------

const HAPPY_PACKAGE: PackageDetail = {
  ecosystem: 'npm',
  package_name: 'auths-cli',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 23,
      last_signed: '2024-12-01T12:00:00Z',
    },
    {
      did: AGENT_DID,
      verified: false,
      signature_count: 8,
      last_signed: '2025-01-10T14:00:00Z',
    },
  ],
  releases: [
    {
      version: '1.0.0',
      digest_algorithm: 'sha256',
      digest_hex: 'aaa111bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee5',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-05-15T13:45:00Z',
      status: 'valid',
    },
    {
      version: '1.1.0',
      digest_algorithm: 'sha256',
      digest_hex: 'bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff6',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-08-20T10:00:00Z',
      status: 'valid',
    },
    {
      version: '1.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff666aaa1',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-12-01T12:00:00Z',
      status: 'valid',
    },
    {
      version: '1.2.1',
      digest_algorithm: 'sha256',
      digest_hex: 'ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff666aaa111bbb2',
      signer_did: AGENT_DID,
      published_at: '2025-01-10T14:00:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: cargo:linux-kernel-rs (Flagship Rust-for-Linux bindings)
// Co-maintained with gregkh. Mature project with 6 releases.
// ---------------------------------------------------------------------------

const LINUX_KERNEL_RS_PACKAGE: PackageDetail = {
  ecosystem: 'cargo',
  package_name: 'linux-kernel-rs',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 42,
      last_signed: '2024-12-01T12:00:00Z',
    },
    {
      did: GREGKH_DID,
      github_username: 'gregkh',
      verified: true,
      signature_count: 18,
      last_signed: '2024-11-15T16:30:00Z',
    },
  ],
  releases: [
    {
      version: '0.1.0',
      digest_algorithm: 'sha256',
      digest_hex: 'lkrs010aa1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef',
      signer_did: SOVEREIGN_DID,
      published_at: '2023-01-20T14:00:00Z',
      status: 'valid',
    },
    {
      version: '0.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'lkrs020bb2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef12',
      signer_did: SOVEREIGN_DID,
      published_at: '2023-06-15T10:30:00Z',
      status: 'valid',
    },
    {
      version: '0.3.0',
      digest_algorithm: 'sha256',
      digest_hex: 'lkrs030cc3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234',
      signer_did: GREGKH_DID,
      published_at: '2023-11-01T09:00:00Z',
      status: 'valid',
    },
    {
      version: '0.4.0',
      digest_algorithm: 'sha256',
      digest_hex: 'lkrs040dd4e5f67890abcdef1234567890abcdef1234567890abcdef123456',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-04-10T16:45:00Z',
      status: 'valid',
    },
    {
      version: '0.5.0',
      digest_algorithm: 'sha256',
      digest_hex: 'gregkh01a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12',
      signer_did: GREGKH_DID,
      published_at: '2024-11-15T16:30:00Z',
      status: 'valid',
    },
    {
      version: '0.6.0',
      digest_algorithm: 'sha256',
      digest_hex: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-12-01T12:00:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: cargo:git-core (Core Git operations in Rust)
// Solo-maintained by Sovereign. Stable library, 5 releases.
// ---------------------------------------------------------------------------

const GIT_CORE_PACKAGE: PackageDetail = {
  ecosystem: 'cargo',
  package_name: 'git-core',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 31,
      last_signed: '2024-11-20T10:30:00Z',
    },
  ],
  releases: [
    {
      version: '2.0.0',
      digest_algorithm: 'sha256',
      digest_hex: 'gitc200a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef',
      signer_did: SOVEREIGN_DID,
      published_at: '2023-03-10T08:00:00Z',
      status: 'valid',
    },
    {
      version: '2.1.0',
      digest_algorithm: 'sha256',
      digest_hex: 'gitc210b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef12',
      signer_did: SOVEREIGN_DID,
      published_at: '2023-08-22T15:20:00Z',
      status: 'valid',
    },
    {
      version: '2.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'gitc220c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-02-14T11:00:00Z',
      status: 'valid',
    },
    {
      version: '2.3.0',
      digest_algorithm: 'sha256',
      digest_hex: 'gitc230d4e5f67890abcdef1234567890abcdef1234567890abcdef123456',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-07-30T14:15:00Z',
      status: 'valid',
    },
    {
      version: '2.4.0',
      digest_algorithm: 'sha256',
      digest_hex: 'b2c3d4e5f6789012bcdef23456789012bcdef23456789012bcdef23456789012',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-11-20T10:30:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: npm:git-hooks-toolkit (JavaScript Git hooks framework)
// Human writes features, Agent bot publishes patch releases via CI.
// ---------------------------------------------------------------------------

const GIT_HOOKS_TOOLKIT_PACKAGE: PackageDetail = {
  ecosystem: 'npm',
  package_name: 'git-hooks-toolkit',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 15,
      last_signed: '2024-10-15T08:45:00Z',
    },
    {
      did: AGENT_DID,
      verified: false,
      signature_count: 6,
      last_signed: '2024-12-20T03:15:00Z',
    },
  ],
  releases: [
    {
      version: '3.0.0',
      digest_algorithm: 'sha256',
      digest_hex: 'ghkt300a1b2c3d4e5f6789012345678901234567890abcdef0123456789abcd',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-03-01T09:00:00Z',
      status: 'valid',
    },
    {
      version: '3.1.0',
      digest_algorithm: 'sha256',
      digest_hex: 'ghkt310b2c3d4e5f6789012345678901234567890abcdef0123456789abcdef',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-06-18T12:30:00Z',
      status: 'valid',
    },
    {
      version: '3.1.1',
      digest_algorithm: 'sha256',
      digest_hex: 'ghkt311agent0c3d4e5f6789012345678901234567890abcdef01234567890a',
      signer_did: AGENT_DID,
      published_at: '2024-06-25T03:00:00Z',
      status: 'valid',
    },
    {
      version: '3.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'c3d4e5f67890123cdef345678901234cdef345678901234cdef345678901234c',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-10-15T08:45:00Z',
      status: 'valid',
    },
    {
      version: '3.2.1',
      digest_algorithm: 'sha256',
      digest_hex: 'ghkt321agent0d4e5f6789012345678901234567890abcdef0123456789abcd',
      signer_did: AGENT_DID,
      published_at: '2024-12-20T03:15:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: pypi:kernel-dev-tools (Python kernel development utilities)
// Solo-maintained. Niche but critical tooling for kernel devs.
// ---------------------------------------------------------------------------

const KERNEL_DEV_TOOLS_PACKAGE: PackageDetail = {
  ecosystem: 'pypi',
  package_name: 'kernel-dev-tools',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 9,
      last_signed: '2024-09-01T16:20:00Z',
    },
  ],
  releases: [
    {
      version: '1.0.0',
      digest_algorithm: 'sha256',
      digest_hex: 'kdt100a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef12',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-01-15T10:00:00Z',
      status: 'valid',
    },
    {
      version: '1.1.0',
      digest_algorithm: 'sha256',
      digest_hex: 'kdt110b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-05-20T14:30:00Z',
      status: 'valid',
    },
    {
      version: '1.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'd4e5f678901234def456789012345def456789012345def456789012345def45',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-09-01T16:20:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: npm:maintainer-dashboard (Web dashboard for package health)
// Torvalds created it, Sarah Chen joined as a contributor. 5 releases.
// ---------------------------------------------------------------------------

const MAINTAINER_DASHBOARD_PACKAGE: PackageDetail = {
  ecosystem: 'npm',
  package_name: 'maintainer-dashboard',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 12,
      last_signed: '2024-08-10T14:00:00Z',
    },
    {
      did: SARAH_DID,
      github_username: 'sarahchen-dev',
      verified: true,
      signature_count: 4,
      last_signed: '2024-10-22T11:15:00Z',
    },
  ],
  releases: [
    {
      version: '0.8.0',
      digest_algorithm: 'sha256',
      digest_hex: 'mdsh080a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-02-10T09:00:00Z',
      status: 'valid',
    },
    {
      version: '0.9.0',
      digest_algorithm: 'sha256',
      digest_hex: 'mdsh090b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef12',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-05-05T15:30:00Z',
      status: 'valid',
    },
    {
      version: '1.0.0',
      digest_algorithm: 'sha256',
      digest_hex: 'e5f6789012345ef567890123456ef567890123456ef567890123456ef5678901',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-08-10T14:00:00Z',
      status: 'valid',
    },
    {
      version: '1.1.0',
      digest_algorithm: 'sha256',
      digest_hex: 'sarah01e5f6789012345ef567890123456ef567890123456ef567890123456ef',
      signer_did: SARAH_DID,
      published_at: '2024-10-22T11:15:00Z',
      status: 'valid',
    },
    {
      version: '1.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'mdsh120c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234',
      signer_did: SARAH_DID,
      published_at: '2024-12-05T10:45:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: cargo:keri-did-resolver (KERI DID method resolution library)
// Solo-maintained. Core infrastructure for the auths ecosystem.
// ---------------------------------------------------------------------------

const KERI_DID_RESOLVER_PACKAGE: PackageDetail = {
  ecosystem: 'cargo',
  package_name: 'keri-did-resolver',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 19,
      last_signed: '2024-07-05T11:30:00Z',
    },
  ],
  releases: [
    {
      version: '0.1.0',
      digest_algorithm: 'sha256',
      digest_hex: 'kdr010a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef12',
      signer_did: SOVEREIGN_DID,
      published_at: '2023-09-01T08:00:00Z',
      status: 'valid',
    },
    {
      version: '0.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'kdr020b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-01-20T13:00:00Z',
      status: 'valid',
    },
    {
      version: '0.3.0',
      digest_algorithm: 'sha256',
      digest_hex: 'kdr030c3d4e5f67890abcdef1234567890abcdef1234567890abcdef123456',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-04-15T10:30:00Z',
      status: 'valid',
    },
    {
      version: '0.4.0',
      digest_algorithm: 'sha256',
      digest_hex: 'f67890123456f67890123456f67890123456f67890123456f67890123456f678',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-07-05T11:30:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Package: docker:dev-environment (Reproducible dev containers)
// Sovereign writes Dockerfiles, Agent bot publishes nightly builds.
// ---------------------------------------------------------------------------

const DEV_ENVIRONMENT_PACKAGE: PackageDetail = {
  ecosystem: 'docker',
  package_name: 'dev-environment',
  verified: true,
  signers: [
    {
      did: SOVEREIGN_DID,
      github_username: 'torvalds',
      verified: true,
      signature_count: 7,
      last_signed: '2024-06-20T09:00:00Z',
    },
    {
      did: AGENT_DID,
      verified: false,
      signature_count: 52,
      last_signed: '2025-01-15T02:00:00Z',
    },
  ],
  releases: [
    {
      version: '1.0.0',
      digest_algorithm: 'sha256',
      digest_hex: 'denv100a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-02-01T10:00:00Z',
      status: 'valid',
    },
    {
      version: '1.1.0',
      digest_algorithm: 'sha256',
      digest_hex: '0789012345670789012345670789012345670789012345670789012345670789',
      signer_did: SOVEREIGN_DID,
      published_at: '2024-06-20T09:00:00Z',
      status: 'valid',
    },
    {
      version: '1.1.1-nightly.20240801',
      digest_algorithm: 'sha256',
      digest_hex: 'denv111nagent0d4e5f67890abcdef1234567890abcdef1234567890abcdef',
      signer_did: AGENT_DID,
      published_at: '2024-08-01T02:00:00Z',
      status: 'valid',
    },
    {
      version: '1.1.1-nightly.20241001',
      digest_algorithm: 'sha256',
      digest_hex: 'denv111nagent1e5f67890abcdef1234567890abcdef1234567890abcdef12',
      signer_did: AGENT_DID,
      published_at: '2024-10-01T02:00:00Z',
      status: 'valid',
    },
    {
      version: '1.2.0',
      digest_algorithm: 'sha256',
      digest_hex: 'denv120agent2f67890abcdef1234567890abcdef1234567890abcdef1234',
      signer_did: AGENT_DID,
      published_at: '2025-01-15T02:00:00Z',
      status: 'valid',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper: generate ARTIFACT_FIXTURES entries from a PackageDetail
// ---------------------------------------------------------------------------

function artifactsFromPackage(pkg: PackageDetail): ArtifactQueryResponse {
  const fullName = `${pkg.ecosystem}:${pkg.package_name}`;
  return {
    entries: pkg.releases.map((r) => ({
      package_name: fullName,
      digest_algorithm: r.digest_algorithm,
      digest_hex: r.digest_hex,
      signer_did: r.signer_did,
      published_at: r.published_at,
    })),
  };
}

// ---------------------------------------------------------------------------
// Lookup maps
// ---------------------------------------------------------------------------

const IDENTITY_FIXTURES: Record<string, IdentityResponse> = {
  [SOVEREIGN_DID]: SOVEREIGN_IDENTITY,
  [AGENT_DID]: AGENT_IDENTITY,
  [GHOST_DID]: { status: 'unclaimed', did: GHOST_DID },
  [LASSE_DID]: LASSE_IDENTITY,
  [JIATAN_DID]: JIATAN_IDENTITY,
  [GREGKH_DID]: GREGKH_IDENTITY,
  [SARAH_DID]: SARAH_IDENTITY,
};

const PACKAGE_FIXTURES: Record<string, PackageDetail> = {
  'cargo:xz-utils': XZ_PACKAGE,
  'npm:auths-cli': HAPPY_PACKAGE,
  'cargo:linux-kernel-rs': LINUX_KERNEL_RS_PACKAGE,
  'cargo:git-core': GIT_CORE_PACKAGE,
  'npm:git-hooks-toolkit': GIT_HOOKS_TOOLKIT_PACKAGE,
  'pypi:kernel-dev-tools': KERNEL_DEV_TOOLS_PACKAGE,
  'npm:maintainer-dashboard': MAINTAINER_DASHBOARD_PACKAGE,
  'cargo:keri-did-resolver': KERI_DID_RESOLVER_PACKAGE,
  'docker:dev-environment': DEV_ENVIRONMENT_PACKAGE,
};

// Pubkeys fixtures keyed by "platform:namespace"
function pubkeysFromIdentity(identity: ActiveIdentity): PubkeysResponse {
  return {
    did: identity.did,
    public_keys: identity.public_keys,
    platform_claims: identity.platform_claims,
  };
}

const PUBKEYS_FIXTURES: Record<string, PubkeysResponse> = {
  'github:torvalds': pubkeysFromIdentity(SOVEREIGN_IDENTITY),
  'gitlab:torvalds': pubkeysFromIdentity(SOVEREIGN_IDENTITY),
  'github:Larhzu': pubkeysFromIdentity(LASSE_IDENTITY),
  'github:JiaT75': pubkeysFromIdentity(JIATAN_IDENTITY),
  'github:gregkh': pubkeysFromIdentity(GREGKH_IDENTITY),
  'github:sarahchen-dev': pubkeysFromIdentity(SARAH_IDENTITY),
};

// ---------------------------------------------------------------------------
// Recent activity fixture (for the registry dashboard)
// ---------------------------------------------------------------------------

const RECENT_ACTIVITY: RecentActivity = {
  recent_packages: [
    { package_name: 'npm:auths-cli', signer_did: SOVEREIGN_DID, published_at: '2024-12-01T12:00:00Z' },
    { package_name: 'cargo:xz-utils', signer_did: JIATAN_DID, published_at: '2024-03-09T08:15:00Z' },
    { package_name: 'npm:react-agent-tools', signer_did: AGENT_DID, published_at: '2025-01-10T14:00:00Z' },
    { package_name: 'cargo:linux-kernel-rs', signer_did: SOVEREIGN_DID, published_at: '2024-12-01T12:00:00Z' },
    { package_name: 'cargo:git-core', signer_did: SOVEREIGN_DID, published_at: '2024-11-20T10:30:00Z' },
  ],
  recent_identities: [
    { did: SOVEREIGN_DID, platform: 'github', namespace: 'torvalds', registered_at: '2021-01-15T14:30:00Z' },
    { did: AGENT_DID, platform: 'github', namespace: '', registered_at: '2024-02-01T00:00:00Z' },
    { did: LASSE_DID, platform: 'github', namespace: 'Larhzu', registered_at: '2019-05-10T00:00:00Z' },
    { did: JIATAN_DID, platform: 'github', namespace: 'JiaT75', registered_at: '2022-01-15T00:00:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Artifact search fixture (for omni-search)
// ---------------------------------------------------------------------------

const ARTIFACT_FIXTURES: Record<string, ArtifactQueryResponse> = {
  'cargo:xz-utils': artifactsFromPackage(XZ_PACKAGE),
  'npm:auths-cli': artifactsFromPackage(HAPPY_PACKAGE),
  'cargo:linux-kernel-rs': artifactsFromPackage(LINUX_KERNEL_RS_PACKAGE),
  'cargo:git-core': artifactsFromPackage(GIT_CORE_PACKAGE),
  'npm:git-hooks-toolkit': artifactsFromPackage(GIT_HOOKS_TOOLKIT_PACKAGE),
  'pypi:kernel-dev-tools': artifactsFromPackage(KERNEL_DEV_TOOLS_PACKAGE),
  'npm:maintainer-dashboard': artifactsFromPackage(MAINTAINER_DASHBOARD_PACKAGE),
  'cargo:keri-did-resolver': artifactsFromPackage(KERI_DID_RESOLVER_PACKAGE),
  'docker:dev-environment': artifactsFromPackage(DEV_ENVIRONMENT_PACKAGE),
};

// ---------------------------------------------------------------------------
// Public fixture resolvers (called from registry.ts)
// ---------------------------------------------------------------------------

/** Simulated network delay for realistic skeleton testing. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolves a platform+namespace pubkeys query to a fixture, or returns null.
 */
export async function resolvePubkeysFixture(
  platform: string,
  namespace: string,
): Promise<PubkeysResponse | null> {
  const key = `${platform}:${namespace}`;
  const fixture = PUBKEYS_FIXTURES[key];
  if (fixture) {
    await delay(350);
    return fixture;
  }
  return null;
}

/**
 * Resolves a DID to a fixture identity, or returns null if not found.
 * Falls through to the real API when null.
 */
export async function resolveIdentityFixture(
  did: string,
): Promise<IdentityResponse | null> {
  const fixture = IDENTITY_FIXTURES[did];
  if (fixture) {
    await delay(400);
    return fixture;
  }
  // Pattern-match for convenience: any DID containing "unclaimed" → ghost
  if (did.toLowerCase().includes('unclaimed')) {
    await delay(300);
    return { status: 'unclaimed', did };
  }
  return null;
}

/**
 * Resolves a package to a fixture, or returns null to fall through.
 */
export async function resolvePackageFixture(
  ecosystem: string,
  name: string,
): Promise<PackageDetail | null> {
  const key = `${ecosystem}:${name}`;
  const fixture = PACKAGE_FIXTURES[key];
  if (fixture) {
    await delay(500);
    return fixture;
  }
  return null;
}

/**
 * Resolves artifact search to fixture data, or returns null to fall through.
 */
export async function resolveArtifactFixture(
  query: string,
): Promise<ArtifactQueryResponse | null> {
  const fixture = ARTIFACT_FIXTURES[query];
  if (fixture) {
    await delay(300);
    return fixture;
  }
  return null;
}

/**
 * Returns fixture recent activity for the dashboard.
 */
export async function resolveRecentActivityFixture(): Promise<RecentActivity> {
  await delay(200);
  return RECENT_ACTIVITY;
}

// ---------------------------------------------------------------------------
// Exported DIDs for easy navigation
// ---------------------------------------------------------------------------

export const FIXTURE_DIDS = {
  sovereign: SOVEREIGN_DID,
  agent: AGENT_DID,
  ghost: GHOST_DID,
  lasse: LASSE_DID,
  jiatan: JIATAN_DID,
  gregkh: GREGKH_DID,
  sarah: SARAH_DID,
} as const;

export const FIXTURE_PACKAGES = {
  xzUtils: { ecosystem: 'cargo', name: 'xz-utils' },
  authsCli: { ecosystem: 'npm', name: 'auths-cli' },
  linuxKernelRs: { ecosystem: 'cargo', name: 'linux-kernel-rs' },
  gitCore: { ecosystem: 'cargo', name: 'git-core' },
  gitHooksToolkit: { ecosystem: 'npm', name: 'git-hooks-toolkit' },
  kernelDevTools: { ecosystem: 'pypi', name: 'kernel-dev-tools' },
  maintainerDashboard: { ecosystem: 'npm', name: 'maintainer-dashboard' },
  keriDidResolver: { ecosystem: 'cargo', name: 'keri-did-resolver' },
  devEnvironment: { ecosystem: 'docker', name: 'dev-environment' },
} as const;

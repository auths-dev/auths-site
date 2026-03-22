export const REGISTRY_BASE_URL =
  process.env.NEXT_PUBLIC_REGISTRY_URL ?? 'https://auths-registry.fly.dev';

export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'https://auths-auth.fly.dev';

export const USE_FIXTURES =
  process.env.NEXT_PUBLIC_USE_FIXTURES === 'true';

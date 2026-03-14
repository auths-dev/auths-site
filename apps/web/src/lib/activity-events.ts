import type { ActivityEntryType } from '@/lib/api/registry';

export const ACTIVITY_EVENT_CONFIG: Record<
  ActivityEntryType,
  { label: string; dotClass: string }
> = {
  register: { label: 'REGISTER', dotClass: 'bg-emerald-400' },
  device_bind: { label: 'DEVICE', dotClass: 'bg-sky-400' },
  device_revoke: { label: 'REVOKE', dotClass: 'bg-red-400' },
  org_create: { label: 'ORG', dotClass: 'bg-teal-400' },
  org_add_member: { label: 'MEMBER+', dotClass: 'bg-teal-400' },
  org_revoke_member: { label: 'MEMBER-', dotClass: 'bg-red-400' },
  abandon: { label: 'ABANDON', dotClass: 'bg-zinc-400' },
  rotate: { label: 'ROTATE', dotClass: 'bg-amber-400' },
  attest: { label: 'ATTEST', dotClass: 'bg-violet-400' },
  namespace_claim: { label: 'NAMESPACE', dotClass: 'bg-violet-400' },
  namespace_delegate: { label: 'DELEGATE', dotClass: 'bg-indigo-400' },
  namespace_transfer: { label: 'TRANSFER', dotClass: 'bg-orange-400' },
  access_grant: { label: 'ACCESS+', dotClass: 'bg-lime-400' },
  access_revoke: { label: 'ACCESS-', dotClass: 'bg-red-400' },
};

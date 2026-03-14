// Radicle icon is now in brand-icon.tsx.
// This re-export kept for backwards compatibility.
import { BrandIcon } from './brand-icon';

export function RadicleIcon({ size = 24, className }: { size?: number; className?: string }) {
  return <BrandIcon name="radicle" size={size} className={className} />;
}

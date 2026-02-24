/**
 * Maps ecosystem names to their brand SVG icons from Simple Icons.
 *
 * Tree-shakable — only the icons actually used are bundled.
 * Falls back to `null` for unknown ecosystems.
 *
 * @param ecosystem - Lowercase ecosystem identifier (e.g. `"npm"`, `"pypi"`).
 * @param size      - Icon width/height in pixels (default 20).
 * @param className - Optional CSS class for colour/layout overrides.
 *
 * @example
 * <EcosystemIcon ecosystem="npm" size={24} className="text-red-500" />
 */

import {
  SiNpm,
  SiPypi,
  SiRust,
  SiDocker,
  SiGo,
  SiApachemaven,
  SiNuget,
} from '@icons-pack/react-simple-icons';
import type { ComponentType } from 'react';

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  npm: SiNpm,
  pypi: SiPypi,
  cargo: SiRust,
  docker: SiDocker,
  go: SiGo,
  maven: SiApachemaven,
  nuget: SiNuget,
};

export function EcosystemIcon({
  ecosystem,
  size = 20,
  className,
}: {
  ecosystem: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[ecosystem.toLowerCase()];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}

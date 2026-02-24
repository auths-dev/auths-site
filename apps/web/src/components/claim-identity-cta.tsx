'use client';

import { motion } from 'motion/react';
import type { ClaimIdentityProps } from '@/lib/registry';
import { generateCliInstructions } from '@/lib/registry';
import { TerminalBlock } from '@/components/terminal-block';

// ---------------------------------------------------------------------------
// ClaimIdentityCTA
// ---------------------------------------------------------------------------

export function ClaimIdentityCTA(props: ClaimIdentityProps) {
  const commands = generateCliInstructions(props);

  const isPlatformVariant = !!(props.platform && props.namespace);

  const heading = isPlatformVariant
    ? `@${props.namespace} has not been claimed on ${props.platform}`
    : 'This identity prefix has not been registered';

  const description = isPlatformVariant
    ? 'Establish your cryptographic identity and secure your artifacts by running:'
    : 'Register this DID on the public registry to claim ownership:';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-lg border border-dashed border-border p-8 text-center"
    >
      <h2 className="mb-2 text-xl font-semibold text-white">{heading}</h2>
      <p className="mb-6 text-muted">{description}</p>
      <TerminalBlock commands={commands} />
    </motion.div>
  );
}

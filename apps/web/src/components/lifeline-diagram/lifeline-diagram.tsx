'use client';

/**
 * CSS Grid-based UML sequence diagram for signing and verification flows.
 *
 * Renders actors as column headers with vertical lifelines, and steps as
 * rows with horizontal arrows spanning between actor columns. Supports
 * cross-highlighting on hover between actor headers and step rows.
 *
 * @example
 * <LifelineDiagram variant="gpg-sign" />
 * <LifelineDiagram variant="sigstore-verify" />
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { VARIANTS, type FlowColors, type Actor } from './lifeline-diagram-data';
import { resolveIcon } from './lifeline-diagram-icons';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const rowVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// SVG Arrowhead — inline SVG for crisp rendering at all zoom levels
// ---------------------------------------------------------------------------

/**
 * A small filled triangle used as an arrowhead at the destination end of an arrow.
 *
 * @param direction - Which way the arrowhead points
 * @param colorClass - Tailwind fill class (e.g., "fill-amber-400")
 */
function Arrowhead({ direction, colorClass }: { direction: 'left' | 'right'; colorClass: string }) {
  const points = direction === 'right' ? '0,0 6,3.5 0,7' : '6,0 0,3.5 6,7';
  return (
    <svg width={6} height={7} viewBox="0 0 6 7" className={`shrink-0 ${colorClass}`}>
      <polygon points={points} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Arrow cell sub-components
// ---------------------------------------------------------------------------

/**
 * Renders the lifeline segment present in every cell — a vertical line
 * running through the cell's horizontal center, full height.
 */
function Lifeline({ colorClass }: { colorClass: string }) {
  return (
    <div className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${colorClass}`} />
  );
}

/**
 * Origin cell: horizontal line from the lifeline center toward the destination,
 * with the label text positioned above the line.
 */
function OriginArrow({
  direction,
  label,
  accentBg,
}: {
  direction: 'left' | 'right';
  label: string;
  accentBg: string;
}) {
  return (
    <>
      <span
        className={`absolute bottom-[calc(50%+2px)] max-w-[180px] font-mono text-[10px] leading-tight text-zinc-300 ${
          direction === 'right' ? 'left-1/2 pl-1' : 'right-1/2 pr-1 text-right'
        }`}
        style={{ zIndex: 10 }}
      >
        {label}
      </span>
      {/* Horizontal line from center to edge */}
      <div
        className={`absolute top-1/2 h-px -translate-y-1/2 ${accentBg} ${
          direction === 'right' ? 'left-1/2 right-0' : 'left-0 right-1/2'
        }`}
        style={{ zIndex: 1 }}
      />
    </>
  );
}

/**
 * Destination cell: horizontal line from the edge to the lifeline center,
 * with an SVG arrowhead at the center pointing inward.
 */
function DestinationArrow({
  direction,
  accentBg,
  fillClass,
}: {
  direction: 'left' | 'right';
  accentBg: string;
  fillClass: string;
}) {
  return (
    <>
      {/* Horizontal line from edge to center */}
      <div
        className={`absolute top-1/2 h-px -translate-y-1/2 ${accentBg} ${
          direction === 'right' ? 'left-0 right-1/2' : 'left-1/2 right-0'
        }`}
        style={{ zIndex: 1 }}
      />
      {/* Arrowhead at the lifeline center */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${
          direction === 'right' ? 'right-[calc(50%-3px)]' : 'left-[calc(50%-3px)]'
        }`}
        style={{ zIndex: 2 }}
      >
        <Arrowhead direction={direction} colorClass={fillClass} />
      </div>
    </>
  );
}

/**
 * Pass-through cell: a full-width horizontal line at the vertical center.
 * Used for cells between the origin and destination columns.
 */
function PassThroughArrow({ accentBg }: { accentBg: string }) {
  return (
    <div
      className={`absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 ${accentBg}`}
      style={{ zIndex: 1 }}
    />
  );
}

/**
 * Self-action cell: a small bracket to the right of the lifeline
 * indicating an internal action, with a label above.
 */
function SelfActionArrow({
  label,
  accentBorder,
}: {
  label: string;
  accentBorder: string;
}) {
  return (
    <>
      <span
        className="absolute bottom-[calc(50%+6px)] left-[calc(50%+6px)] max-w-[180px] font-mono text-[10px] leading-tight text-zinc-300"
        style={{ zIndex: 10 }}
      >
        {label}
      </span>
      {/* Right bracket: top edge, right edge, bottom edge */}
      <div
        className={`absolute left-1/2 top-[calc(50%-6px)] h-3 w-2.5 border-r border-t border-b ${accentBorder}`}
        style={{ zIndex: 1 }}
      />
    </>
  );
}

/**
 * Inactive cell: no arrow content, only the lifeline (rendered by the parent).
 */
function InactiveCell() {
  return null;
}

// ---------------------------------------------------------------------------
// SequenceArrowCell — dispatcher
// ---------------------------------------------------------------------------

interface SequenceArrowCellProps {
  cellIndex: number;
  fromIndex: number;
  toIndex: number;
  label: string;
  accentBg: string;
  accentBorder: string;
  fillClass: string;
}

/**
 * Renders a single cell within a sequence diagram step row.
 * Determines its segment type (origin, destination, pass-through, self, inactive)
 * and direction (left-to-right, right-to-left) to render the correct arrow fragment.
 *
 * @example
 * <SequenceArrowCell
 *   cellIndex={1}
 *   fromIndex={0}
 *   toIndex={3}
 *   label="Verify OIDC"
 *   accentBg="bg-sky-400"
 *   fillClass="fill-sky-400"
 * />
 */
function SequenceArrowCell({ cellIndex, fromIndex, toIndex, label, accentBg, accentBorder, fillClass }: SequenceArrowCellProps) {
  const isSelf = fromIndex === toIndex && cellIndex === fromIndex;
  const isOrigin = cellIndex === fromIndex && !isSelf;
  const isDestination = cellIndex === toIndex && !isSelf;

  const minIndex = Math.min(fromIndex, toIndex);
  const maxIndex = Math.max(fromIndex, toIndex);
  const isPassThrough = !isSelf && cellIndex > minIndex && cellIndex < maxIndex;

  const direction: 'left' | 'right' = fromIndex <= toIndex ? 'right' : 'left';

  if (isSelf) return <SelfActionArrow label={label} accentBorder={accentBorder} />;
  if (isOrigin) return <OriginArrow direction={direction} label={label} accentBg={accentBg} />;
  if (isDestination) return <DestinationArrow direction={direction} accentBg={accentBg} fillClass={fillClass} />;
  if (isPassThrough) return <PassThroughArrow accentBg={accentBg} />;

  return <InactiveCell />;
}

// ---------------------------------------------------------------------------
// ActorHeader
// ---------------------------------------------------------------------------

/**
 * Column header showing an actor's icon and name.
 *
 * @example
 * <ActorHeader actor={{ name: 'Git', iconId: 'git' }} colors={AMBER} dimmed={false} />
 */
function ActorHeader({
  actor,
  colors,
  dimmed,
  onEnter,
  onLeave,
}: {
  actor: Actor;
  colors: FlowColors;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const Icon = resolveIcon(actor.iconId);
  return (
    <motion.div
      variants={headerVariants}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`flex cursor-default flex-col items-center gap-1 pb-3 transition-opacity duration-200 ${
        dimmed ? 'opacity-30' : 'opacity-100'
      }`}
    >
      <div className={`flex items-center justify-center rounded-lg border bg-zinc-900 p-2 ${colors.border}`}>
        <Icon size={16} className={colors.accent} />
      </div>
      <span className="font-mono text-[10px] font-medium text-zinc-400 text-center leading-tight">
        {actor.name}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StepRow
// ---------------------------------------------------------------------------

/**
 * One row of the sequence diagram grid. Renders a lifeline segment in every
 * column and dispatches arrow rendering to SequenceArrowCell.
 */
function StepRow({
  stepIndex,
  from,
  to,
  label,
  actorCount,
  colors,
  dimmed,
  onEnter,
  onLeave,
}: {
  stepIndex: number;
  from: number;
  to: number;
  label: string;
  actorCount: number;
  colors: FlowColors;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const fillClass = colors.accentFill;

  return (
    <>
      {Array.from({ length: actorCount }, (_, i) => (
        <motion.div
          key={`${stepIndex}-${i}`}
          variants={rowVariants}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className={`relative h-12 cursor-default overflow-visible transition-opacity duration-200 ${
            dimmed ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <Lifeline colorClass={colors.line} />
          <SequenceArrowCell
            cellIndex={i}
            fromIndex={from}
            toIndex={to}
            label={label}
            accentBg={colors.accentBg}
            accentBorder={colors.accentBorder}
            fillClass={fillClass}
          />
        </motion.div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// LifelineDiagram — main export
// ---------------------------------------------------------------------------

export function LifelineDiagram({ variant }: { variant: string }) {
  const config = VARIANTS[variant];
  const [hoveredActor, setHoveredActor] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  if (!config) return null;

  const { actors, steps, colors } = config;
  const anyHover = hoveredActor !== null || hoveredStep !== null;

  const actorDimmed = (idx: number): boolean => {
    if (!anyHover) return false;
    if (hoveredActor !== null) return idx !== hoveredActor;
    if (hoveredStep !== null) {
      const s = steps[hoveredStep];
      return s.from !== idx && s.to !== idx;
    }
    return false;
  };

  const stepDimmed = (idx: number): boolean => {
    if (!anyHover) return false;
    if (hoveredActor !== null) {
      const s = steps[idx];
      return s.from !== hoveredActor && s.to !== hoveredActor;
    }
    if (hoveredStep !== null) return idx !== hoveredStep;
    return false;
  };

  const minWidth = Math.max(420, actors.length * 110);

  return (
    <div className="my-8 w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 pr-8 sm:p-6 sm:pr-10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ staggerChildren: 0.06 }}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${actors.length}, 1fr)`,
          minWidth,
        }}
      >
        {/* Row 0: Actor headers */}
        {actors.map((actor, i) => (
          <ActorHeader
            key={i}
            actor={actor}
            colors={colors}
            dimmed={actorDimmed(i)}
            onEnter={() => setHoveredActor(i)}
            onLeave={() => setHoveredActor(null)}
          />
        ))}

        {/* Rows 1..N: Step rows */}
        {steps.map((step, i) => (
          <StepRow
            key={i}
            stepIndex={i}
            from={step.from}
            to={step.to}
            label={step.label}
            actorCount={actors.length}
            colors={colors}
            dimmed={stepDimmed(i)}
            onEnter={() => setHoveredStep(i)}
            onLeave={() => setHoveredStep(null)}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Radicle logo as a React SVG component.
 *
 * Not available in Simple Icons, so we maintain a custom SVG here.
 * The icon is a stylised seed/sprout representing Radicle's
 * sovereign code collaboration network.
 *
 * @param size      - Width and height in pixels (default 24).
 * @param className - Optional CSS class for colour/layout overrides.
 *
 * @example
 * <RadicleIcon size={20} className="text-white" />
 */

export function RadicleIcon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z" />
    </svg>
  );
}

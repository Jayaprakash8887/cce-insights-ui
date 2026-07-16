import type { ReactNode } from 'react';
import { Card } from './Card';

/**
 * A group of metric tiles rendered inside one white Card (RI-35), matching the e-Buzima Adoption
 * card look: title + info tooltip in the header, a "View / Hide facility breakdown" toggle on the
 * right, and — when open — the drill-down rendered INSIDE the same card (so the metrics and the
 * breakdown read as one card, not two boxes). Clicking anywhere on the metric tiles toggles it.
 */
export function ClickableMetricGroup({
  title,
  description,
  open,
  onToggle,
  cols = 4,
  className,
  children,
  detail,
}: {
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  cols?: 3 | 4;
  className?: string;
  children: ReactNode;
  /** Drill-down content rendered inside the same card when open. */
  detail?: ReactNode;
}) {
  const grid = cols === 3
    ? 'grid grid-cols-1 gap-4 sm:grid-cols-3'
    : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4';
  return (
    <Card
      title={title}
      description={description}
      className={className}
      action={
        <button
          type="button"
          onClick={onToggle}
          className="whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {open ? '▾ Hide details' : '▸ Click to view details'}
        </button>
      }
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="cursor-pointer rounded-lg"
      >
        <div className={grid}>{children}</div>
      </div>
      {open && detail && (
        <div className="mt-4 border-t border-gray-100 pt-4">{detail}</div>
      )}
    </Card>
  );
}

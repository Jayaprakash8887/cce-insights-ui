import { useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

interface KpiCardProps {
  title: string;
  value: string;
  /** Supporting context line, e.g. "12 of 16 patients compliant". */
  context?: string;
  /** Health tone — drives the value colour. 'neutral' for plain counts. */
  tone?: Tone;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon chip background/foreground. */
  iconClass?: string;
  linkTo: string;
  linkLabel: string;
  /** Tooltip help text (ⓘ). */
  description?: string;
  loading?: boolean;
  /** Extra grid/layout classes (e.g. column spans). */
  className?: string;
  /** Render as a non-interactive "Coming soon" placeholder (metric not finalised). */
  placeholder?: boolean;
}

const VALUE_TONE: Record<Tone, string> = {
  good: 'text-green-600',
  warn: 'text-amber-600',
  bad: 'text-red-600',
  neutral: 'text-gray-900',
};

/** Derive a health tone from a 0–100 rate (≥80 good, ≥50 warn, else bad). */
export function rateTone(rate: number | undefined): Tone {
  if (rate == null) return 'neutral';
  if (rate >= 80) return 'good';
  if (rate >= 50) return 'warn';
  return 'bad';
}

export function KpiCard({
  title, value, context, tone = 'neutral', icon: Icon, iconClass = 'bg-blue-50 text-blue-600',
  linkTo, linkLabel, description, loading, className = '', placeholder = false,
}: KpiCardProps) {
  const [tip, setTip] = useState(false);

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${placeholder ? 'bg-gray-100 text-gray-400' : iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        {description && (
          <span className="relative" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 cursor-help text-gray-300 hover:text-gray-400">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
            </svg>
            {tip && (
              <span className="absolute right-0 top-full z-30 mt-1 w-60 rounded-lg border border-gray-200 bg-gray-800 px-3 py-2 text-xs font-normal text-white shadow-lg">
                {description}
              </span>
            )}
          </span>
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-1 text-4xl font-bold tabular-nums ${placeholder || loading ? 'text-gray-300' : VALUE_TONE[tone]}`}>
        {placeholder ? '—' : loading ? '—' : value}
      </p>
      <p className="mt-1 min-h-[16px] text-xs text-gray-500">{placeholder ? 'Coming soon' : loading ? '' : context}</p>

      {placeholder ? (
        <span className="mt-auto w-fit rounded-full bg-gray-100 px-2 py-0.5 pt-0.5 text-[11px] font-medium text-gray-400">
          Metric under review
        </span>
      ) : (
        <span className="mt-auto pt-3 text-xs font-semibold text-blue-600 opacity-70 transition-opacity group-hover:opacity-100">
          {linkLabel} <span aria-hidden="true">&rarr;</span>
        </span>
      )}
    </>
  );

  const base = `flex min-h-[168px] flex-col rounded-2xl border border-gray-200 p-5 shadow-sm ${className}`;

  if (placeholder) {
    return <div className={`${base} bg-gray-50/60`} aria-disabled="true">{inner}</div>;
  }

  return (
    <Link
      to={linkTo}
      className={`group ${base} bg-white transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      {inner}
    </Link>
  );
}

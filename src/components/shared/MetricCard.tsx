import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  denomination?: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  linkTo?: string;
  onClick?: () => void;
  bgColor?: string;
}

export function MetricCard({ title, value, subtitle, description, denomination, icon, trend, trendUp, linkTo, onClick, bgColor }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();

  const clickable = Boolean(linkTo || onClick);
  const handleClick = onClick ?? (linkTo ? () => navigate(linkTo) : undefined);

  return (
    <div
      className={`rounded-xl border border-gray-200 p-5 shadow-sm ${bgColor || 'bg-white'} ${clickable ? 'cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50/30' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div
            className="relative inline-flex items-center gap-1"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            {description && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 flex-shrink-0 text-gray-400">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
            )}
            {description && showTooltip && (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-lg border border-gray-200 bg-gray-800 px-3 py-2 text-xs text-white shadow-lg">
                {description}
                <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-gray-800" />
              </div>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
            {denomination !== undefined && <span className="text-sm font-normal text-gray-400">/{denomination}</span>}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '▲' : '▼'} {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 rounded-lg bg-blue-50 p-2.5 text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

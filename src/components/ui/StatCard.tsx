import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeType?: 'default' | 'success' | 'accent' | 'warning';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'default',
}: StatCardProps) {
  const badgeStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accent: 'bg-sky-50 text-sky-700 border-sky-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs transition-all hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
            {badge && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeStyles[badgeType]}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-md text-slate-700">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

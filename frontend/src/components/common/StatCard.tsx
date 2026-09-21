import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  trend?: {
    value: number;
    label?: string;
    isGood?: boolean; // If true, positive trend is green, negative is red. For expenses, positive trend is bad.
  };
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-brand-50',
  iconTextColor = 'text-brand-600',
  trend,
  badge,
}) => {
  return (
    <Card hoverEffect className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-bold text-surface-900 mt-2 tracking-tight">
            {value}
          </h4>
        </div>
        <div className={`p-3 rounded-2xl ${iconBgColor} ${iconTextColor} shrink-0`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2 border-t border-surface-100">
        {trend ? (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                (trend.value >= 0 && trend.isGood !== false) || (trend.value < 0 && trend.isGood === false)
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.value >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-surface-500">{trend.label || 'vs last month'}</span>
          </div>
        ) : subtitle ? (
          <p className="text-xs text-surface-500">{subtitle}</p>
        ) : (
          <div />
        )}

        {badge && <div>{badge}</div>}
      </div>
    </Card>
  );
};

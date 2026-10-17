import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-700',
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-red-50 text-red-700',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, hint, tone = 'default' }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-500">{title}</span>
      <span className={`rounded-lg p-2 ${TONE_CLASSES[tone]}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
    </div>
    <div className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{value}</div>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

export default StatCard;

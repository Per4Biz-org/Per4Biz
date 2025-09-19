import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  ctaLabel: string;
  accent?: 'blue' | 'green' | 'purple' | 'amber';
}

const accentMap: Record<NonNullable<QuickActionCardProps['accent']>, string> = {
  blue: 'group-hover:bg-blue-600 text-blue-600 group-hover:text-white',
  green: 'group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white',
  purple: 'group-hover:bg-purple-600 text-purple-600 group-hover:text-white',
  amber: 'group-hover:bg-amber-500 text-amber-500 group-hover:text-white'
};

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon: Icon, title, description, to, ctaLabel, accent = 'blue' }) => {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 transition ${accentMap[accent]}`}>
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <span className="text-sm font-medium text-slate-900/60 transition group-hover:text-slate-900">
        {ctaLabel}
      </span>
    </Link>
  );
};

export default QuickActionCard;

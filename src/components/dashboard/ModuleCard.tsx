import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  ctaLabel: string;
  accent?: 'blue' | 'green' | 'purple' | 'amber';
}

const accentBg: Record<NonNullable<ModuleCardProps['accent']>, string> = {
  blue: 'from-blue-50 via-white to-white',
  green: 'from-emerald-50 via-white to-white',
  purple: 'from-purple-50 via-white to-white',
  amber: 'from-amber-50 via-white to-white'
};

const ModuleCard: React.FC<ModuleCardProps> = ({ icon: Icon, title, description, to, ctaLabel, accent = 'blue' }) => {
  return (
    <Link
      to={to}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br ${accentBg[accent]} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-white/60 blur-2xl" />
      <div className="relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-slate-700 shadow-sm">
          <Icon size={22} />
        </div>
        <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      <span className="relative z-10 mt-6 inline-flex items-center text-sm font-semibold text-slate-900/70 transition group-hover:text-slate-900">
        {ctaLabel}
      </span>
    </Link>
  );
};

export default ModuleCard;

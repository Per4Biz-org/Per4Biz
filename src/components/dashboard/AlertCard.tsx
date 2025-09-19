import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface AlertCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: 'warning' | 'info' | 'danger';
  actionLabel?: string;
  actionTo?: string;
}

const toneStyles: Record<NonNullable<AlertCardProps['tone']>, { container: string; pill: string }> = {
  warning: {
    container: 'bg-amber-50 border-amber-200',
    pill: 'bg-amber-100 text-amber-700'
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    pill: 'bg-blue-100 text-blue-700'
  },
  danger: {
    container: 'bg-rose-50 border-rose-200',
    pill: 'bg-rose-100 text-rose-700'
  }
};

const AlertCard: React.FC<AlertCardProps> = ({ icon: Icon, title, description, tone = 'warning', actionLabel, actionTo }) => {
  const styles = toneStyles[tone];

  return (
    <div className={`flex gap-4 rounded-2xl border p-5 ${styles.container}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.pill}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        {actionLabel && actionTo && (
          <Link to={actionTo} className="mt-3 inline-flex items-center text-sm font-semibold text-slate-900 underline-offset-4 hover:underline">
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default AlertCard;

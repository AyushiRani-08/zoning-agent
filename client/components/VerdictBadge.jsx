import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, MapPinOff } from 'lucide-react';

export default function VerdictBadge({ verdict, className = '' }) {
  const configs = {
    feasible: {
      label: 'Permitted & Feasible',
      icon: CheckCircle2,
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    },
    conditionally_feasible: {
      label: 'Conditionally Feasible',
      icon: AlertTriangle,
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
    not_feasible: {
      label: 'Not Feasible / Prohibited',
      icon: XCircle,
      badgeClass: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
    },
    cannot_assess: {
      label: 'Outside Coverage',
      icon: MapPinOff,
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
  };

  const current = configs[verdict] || configs.cannot_assess;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${current.badgeClass} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
}


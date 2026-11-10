import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export default function VerdictBadge({ verdict, className = '' }) {
  const configs = {
    feasible: {
      label: 'Permitted & Feasible',
      icon: CheckCircle2,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    },
    conditionally_feasible: {
      label: 'Conditionally Feasible',
      icon: AlertTriangle,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
    },
    not_feasible: {
      label: 'Not Feasible / Prohibited',
      icon: XCircle,
      badgeClass: 'bg-red-50 text-red-700 border-red-300',
    },
    cannot_assess: {
      label: 'Outside Coverage',
      icon: HelpCircle,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
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


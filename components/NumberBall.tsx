'use client';

import React from 'react';
import { NumberStat } from '@/lib/types';

interface NumberBallProps {
  number: number;
  status?: 'hot' | 'warm' | 'cold' | 'gan_cuc_dai' | 'bonus' | 'matched' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  drought?: number;
  onClick?: () => void;
  showDroughtBadge?: boolean;
  isFavorite?: boolean;
}

export const NumberBall: React.FC<NumberBallProps> = ({
  number,
  status = 'default',
  size = 'md',
  drought,
  onClick,
  showDroughtBadge = false,
  isFavorite = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-14 h-14 text-lg font-extrabold',
  }[size];

  const statusClasses = {
    default: 'bg-slate-800/90 text-slate-200 border border-slate-700/80 hover:border-slate-600',
    hot: 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10',
    warm: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40',
    cold: 'bg-slate-800/60 text-slate-400 border border-slate-700/60',
    gan_cuc_dai: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
    bonus: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/10',
    matched: 'bg-emerald-500/25 text-emerald-200 border-2 border-emerald-400 font-extrabold shadow-sm shadow-emerald-500/20',
  }[status];

  return (
    <div className="relative inline-flex flex-col items-center group">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`rounded-full flex items-center justify-center transition-all duration-200 select-none ${sizeClasses} ${statusClasses} ${
          onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
        } ${isFavorite ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-950' : ''}`}
        title={`Số ${number}${drought !== undefined ? ` (Gan ${drought} kỳ)` : ''}`}
      >
        <span>{number < 10 ? `0${number}` : number}</span>
      </button>

      {showDroughtBadge && drought !== undefined && drought > 0 && (
        <span
          className={`absolute -bottom-2 px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${
            drought >= 8
              ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700'
          }`}
        >
          {drought}k
        </span>
      )}
    </div>
  );
};

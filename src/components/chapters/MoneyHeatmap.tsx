import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Star } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getMonthlyHeatmap } from '../../lib/accounting';
import { formatCurrency } from '../../lib/utils';

interface MoneyHeatmapProps {
  yearMonthStr: string;
}

export const MoneyHeatmap: React.FC<MoneyHeatmapProps> = ({ yearMonthStr }) => {
  const {
    transactions,
    privacyMode,
    currencySymbol,
    setDiaryDate,
    setActiveView,
  } = useFinance();

  const heatmapDays = getMonthlyHeatmap(transactions, yearMonthStr);

  const getIntensityStyle = (intensity: number, isNoSpend: boolean, isFuture: boolean, isToday: boolean) => {
    if (isFuture) {
      return 'bg-black/[0.01] dark:bg-white/[0.01] opacity-30 border-dashed border-black/5 dark:border-white/5';
    }
    if (isNoSpend) {
      return 'bg-apple-green/15 border-apple-green/30 text-apple-green';
    }
    switch (intensity) {
      case 1:
        return 'bg-apple-blue/15 border-apple-blue/30 text-apple-blue';
      case 2:
        return 'bg-apple-indigo/25 border-apple-indigo/40 text-apple-indigo';
      case 3:
        return 'bg-apple-purple/35 border-apple-purple/50 text-apple-purple';
      case 4:
        return 'bg-apple-orange/45 border-apple-orange/60 text-apple-orange';
      default:
        return 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.05] dark:border-white/[0.07] text-ink-700 dark:text-ink-300';
    }
  };

  const dayOfWeekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const [y, m] = yearMonthStr.split('-').map(Number);
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div>
          <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
            Monthly Daily Spending Activity
          </h3>
          <p className="text-xs font-mono text-ink-400">
            Activity heat index • Tap any cell to view day folio
          </p>
        </div>

        {/* Apple HIG Legend */}
        <div className="flex items-center space-x-3 text-[11px] font-mono text-ink-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-apple-green/20 border border-apple-green/50 inline-block" />
            <span>Zero</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-apple-blue/20 border border-apple-blue/50 inline-block" />
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-apple-indigo/30 border border-apple-indigo/50 inline-block" />
            <span>Mid</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-apple-orange/40 border border-apple-orange/60 inline-block" />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {dayOfWeekHeaders.map(day => (
          <div key={day} className="text-[11px] font-mono uppercase text-ink-400 font-semibold py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Blank padding cells before 1st of month */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[64px] rounded-2xl bg-transparent" />
        ))}

        {heatmapDays.map(item => (
          <motion.button
            key={item.dateStr}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            onClick={() => {
              setDiaryDate(item.dateStr);
              setActiveView('diary');
            }}
            className={`min-h-[64px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-shadow ${
              item.isToday ? 'ring-2 ring-apple-blue shadow-apple-card' : ''
            } ${getIntensityStyle(item.intensity, item.isNoSpend, item.isFuture, item.isToday)}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-xs font-bold text-ink-900 dark:text-ink-100">
                {item.dayNumber}
              </span>
              {item.isNoSpend && (
                <span className="text-[10px] text-apple-green font-bold flex items-center" title="No Spend Day">
                  ★
                </span>
              )}
            </div>

            {/* Spend Amount */}
            <div className="mt-1">
              {!item.isFuture && (
                <span className="font-mono text-[10px] block truncate font-semibold">
                  {item.isNoSpend ? 'Zero' : formatCurrency(item.spendAmount, currencySymbol, privacyMode)}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

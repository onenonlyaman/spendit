import React from 'react';
import { Star } from 'lucide-react';
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

  const getIntensityClass = (intensity: number, isNoSpend: boolean, isFuture: boolean) => {
    if (isFuture) return 'bg-paper-100/40 dark:bg-paper-dark opacity-40 border-dashed';
    if (isNoSpend) return 'bg-archival-ochre/15 border-archival-ochre/40 dark:bg-archival-ochre/10';
    switch (intensity) {
      case 1:
        return 'bg-archival-red/10 border-archival-red/20';
      case 2:
        return 'bg-archival-red/25 border-archival-red/35';
      case 3:
        return 'bg-archival-red/45 border-archival-red/50 text-paper-50';
      case 4:
        return 'bg-archival-red/75 border-archival-red text-paper-50';
      default:
        return 'bg-paper-50 dark:bg-paper-dark-card border-paper-300 dark:border-paper-dark-border';
    }
  };

  const dayOfWeekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate day of week offset for the 1st day of the month
  const [y, m] = yearMonthStr.split('-').map(Number);
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay();

  return (
    <div className="p-5 rounded-xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-paper-300/80 dark:border-paper-dark-border">
        <div>
          <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
            31-Day Money Velocity Heatmap
          </h3>
          <p className="text-xs font-mono text-ink-500">
            Ink-density spending washes • Click any day to inspect ledger page
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[10px] font-mono text-ink-600 dark:text-ink-400">
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-archival-ochre/20 border border-archival-ochre/50 inline-block"></span>
            <span>No Spend</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-archival-red/15 border border-archival-red/30 inline-block"></span>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-archival-red/45 border border-archival-red/60 inline-block"></span>
            <span>Mid</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-archival-red/75 border border-archival-red inline-block"></span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
        {dayOfWeekHeaders.map(day => (
          <div key={day} className="text-[11px] font-mono uppercase text-ink-400 font-semibold py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Heatmap Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Blank padding cells before 1st of month */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[58px] rounded-lg bg-transparent" />
        ))}

        {heatmapDays.map(item => (
          <button
            key={item.dateStr}
            onClick={() => {
              setDiaryDate(item.dateStr);
              setActiveView('diary');
            }}
            className={`min-h-[62px] p-1.5 rounded-lg border transition-all hover:scale-[1.03] text-left flex flex-col justify-between ${
              item.isToday ? 'ring-2 ring-archival-brass shadow-sm' : ''
            } ${getIntensityClass(item.intensity, item.isNoSpend, item.isFuture)}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`font-mono text-[11px] font-bold ${
                item.intensity >= 3 ? 'text-paper-50' : 'text-ink-800 dark:text-ink-200'
              }`}>
                {item.dayNumber}
              </span>
              {item.isNoSpend && (
                <span className="text-[10px] text-archival-ochre font-bold flex items-center" title="No Spend Day">
                  ★
                </span>
              )}
            </div>

            {/* Spend Amount */}
            <div className="mt-1">
              {!item.isFuture && (
                <span className={`font-mono text-[10px] block truncate ${
                  item.isNoSpend
                    ? 'text-archival-ochre font-semibold'
                    : item.intensity >= 3
                    ? 'text-paper-100 font-bold'
                    : 'text-ink-600 dark:text-ink-300 font-medium'
                }`}>
                  {item.isNoSpend ? 'Zero' : formatCurrency(item.spendAmount, currencySymbol, privacyMode)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

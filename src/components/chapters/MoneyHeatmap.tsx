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

  /**
   * A sequential quantity needs a sequential ramp. The previous version stepped
   * green → blue → indigo → purple → orange, five hues with no perceptual
   * order, so a reader could not tell which cell meant "more" without decoding
   * a legend that omitted one of them. One hue, rising density, reads instantly.
   */
  const INTENSITY_STEPS = [
    'bg-apple-blue/[0.06] border-apple-blue/15 text-ink-700 dark:text-ink-300',
    'bg-apple-blue/[0.16] border-apple-blue/25 text-ink-800 dark:text-ink-200',
    'bg-apple-blue/[0.32] border-apple-blue/40 text-ink-900 dark:text-ink-100',
    'bg-apple-blue/[0.52] border-apple-blue/60 text-ink-900 dark:text-white',
    'bg-apple-blue/[0.78] border-apple-blue text-white',
  ];

  const getIntensityStyle = (intensity: number, isNoSpend: boolean, isFuture: boolean, isToday: boolean) => {
    if (isFuture) {
      return 'bg-black/[0.01] dark:bg-white/[0.01] opacity-30 border-dashed border-black/5 dark:border-white/5';
    }
    // A no-spend day is a different kind of day, not a lower amount, so it is
    // marked by a distinct outline rather than another step on the ramp.
    if (isNoSpend) {
      return 'bg-transparent border-apple-green border-dashed text-apple-green';
    }
    return INTENSITY_STEPS[Math.min(Math.max(intensity, 0), INTENSITY_STEPS.length - 1)];
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
          <p className="text-xs text-secondary">
            Darker means more spent. Select a day to open it.
          </p>
        </div>

        {/* Legend is generated from the same ramp that paints the cells, so the
            two can never drift apart the way they had. */}
        <div className="flex items-center gap-2 text-xs text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[5px] border border-dashed border-apple-green inline-block" />
            <span>No spend</span>
          </span>
          <span className="flex items-center gap-1 ml-1">
            <span>Less</span>
            {INTENSITY_STEPS.map((step, i) => (
              <span
                key={i}
                className={`w-3 h-3 rounded-[5px] border inline-block ${step}`}
              />
            ))}
            <span>More</span>
          </span>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {dayOfWeekHeaders.map(day => (
          <div key={day} className="text-xs font-mono uppercase text-secondary font-semibold py-0.5">
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
                <span className="text-xs text-apple-green font-bold flex items-center" title="No Spend Day">
                  ★
                </span>
              )}
            </div>

            {/* Spend Amount */}
            <div className="mt-1">
              {!item.isFuture && (
                <span className="font-mono text-xs block truncate font-semibold">
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

import React from 'react';
import { motion } from 'motion/react';
import {
  CheckCheck,
  CheckCircle,
  Clock,
  Flame,
  Lock,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getDailyTotals, getTrailing7DayAverage } from '../../lib/accounting';
import { formatCurrency } from '../../lib/utils';
import { sounds } from '../../lib/audioHaptics';

interface EndOfDaySummaryProps {
  date: string;
}

export const EndOfDaySummary: React.FC<EndOfDaySummaryProps> = ({ date }) => {
  const {
    transactions,
    privacyMode,
    currencySymbol,
    getNoteForDate,
    toggleSealDay,
  } = useFinance();

  const totals = getDailyTotals(transactions, date);
  const trailing7DayAvg = getTrailing7DayAverage(transactions, date);
  const note = getNoteForDate(date);

  const diffFromAvg = trailing7DayAvg - totals.expense;
  const isBelowAverage = diffFromAvg >= 0;

  const handleSealDay = () => {
    if (!note.sealed) {
      sounds.playWaxSealStamp();
    }
    toggleSealDay(date);
  };

  return (
    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Summary Figures */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-ink-900 dark:text-ink-100">
              End-of-Day Ledger Closure
            </span>
            {totals.expense === 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-apple-green/12 text-apple-green text-sm font-semibold">
                No-spend day
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {/* Daily Expense */}
            <div>
              <span className="text-secondary font-mono text-xs block">Daily Outflow</span>
              <span className="font-mono font-bold text-sm text-apple-red">
                {formatCurrency(totals.expense, currencySymbol, privacyMode)}
              </span>
            </div>

            {/* Daily Income */}
            {totals.income > 0 && (
              <div>
                <span className="text-secondary font-mono text-xs block">Daily Inflow</span>
                <span className="font-mono font-bold text-sm text-apple-green">
                  +{formatCurrency(totals.income, currencySymbol, privacyMode)}
                </span>
              </div>
            )}

            {/* 7-Day Baseline Comparison */}
            <div className="border-l border-black/[0.06] dark:border-white/[0.08] pl-4">
              <span className="text-secondary font-mono text-xs block">
                7-Day Rolling Average: {formatCurrency(trailing7DayAvg, currencySymbol, privacyMode)}/day
              </span>
              <div className="flex items-center space-x-1 font-mono text-xs font-semibold">
                {isBelowAverage ? (
                  <span className="text-apple-green flex items-center space-x-0.5">
                    <TrendingDown className="w-3 h-3" />
                    <span>
                      {formatCurrency(Math.abs(diffFromAvg), currencySymbol, privacyMode)} below average
                    </span>
                  </span>
                ) : (
                  <span className="text-apple-red flex items-center space-x-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {formatCurrency(Math.abs(diffFromAvg), currencySymbol, privacyMode)} above average
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Seal Daily Page Button & Status Stamp */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {note.sealed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-apple-green/12 text-apple-green flex items-center justify-center">
                <Lock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-apple-green">Day sealed</span>
                <button
                  onClick={handleSealDay}
                  className="text-sm text-secondary hover:text-ink-900 dark:hover:text-ink-100 underline underline-offset-2 focus-ring rounded"
                >
                  Break the seal to edit
                </button>
              </div>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSealDay}
              className="px-4 py-2.5 rounded-xl bg-apple-green hover:bg-apple-green/90 text-white font-sans text-sm font-semibold shadow-sm flex items-center gap-1.5 focus-ring transition-all"
            >
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              <span>Seal this day</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

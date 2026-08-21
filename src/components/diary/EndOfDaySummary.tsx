import React from 'react';
import confetti from 'canvas-confetti';
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
      // Fire celebratory mineral ink confetti
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.85 },
        colors: ['#B83A3A', '#C07D2B', '#8C6D37', '#2A6F4E'],
      });
    }
    toggleSealDay(date);
  };

  return (
    <div className="mt-6 p-4 rounded-xl bg-paper-200/60 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Summary Figures */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-ink-800 dark:text-ink-200">
              End-of-Day Ledger Closure
            </span>
            {totals.expense === 0 && totals.count > 0 && (
              <span className="rubber-stamp stamp-nospend text-[10px]">
                ★ No-Spend Day
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {/* Daily Expense */}
            <div>
              <span className="text-ink-500 dark:text-ink-400 font-mono text-[11px] block">Daily Outflow</span>
              <span className="font-mono font-bold text-sm text-archival-red">
                {formatCurrency(totals.expense, currencySymbol, privacyMode)}
              </span>
            </div>

            {/* Daily Income */}
            {totals.income > 0 && (
              <div>
                <span className="text-ink-500 dark:text-ink-400 font-mono text-[11px] block">Daily Inflow</span>
                <span className="font-mono font-bold text-sm text-archival-green">
                  +{formatCurrency(totals.income, currencySymbol, privacyMode)}
                </span>
              </div>
            )}

            {/* 7-Day Baseline Comparison */}
            <div className="border-l border-paper-300 dark:border-paper-dark-border pl-4">
              <span className="text-ink-500 dark:text-ink-400 font-mono text-[11px] block">
                7-Day Rolling Average: {formatCurrency(trailing7DayAvg, currencySymbol, privacyMode)}/day
              </span>
              <div className="flex items-center space-x-1 font-mono text-xs font-semibold">
                {isBelowAverage ? (
                  <span className="text-archival-green flex items-center space-x-0.5">
                    <TrendingDown className="w-3 h-3" />
                    <span>
                      {formatCurrency(Math.abs(diffFromAvg), currencySymbol, privacyMode)} below average
                    </span>
                  </span>
                ) : (
                  <span className="text-archival-red flex items-center space-x-0.5">
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
            <div className="flex items-center space-x-3">
              <div className="wax-seal-medallion" title="Archival Seal Verified">
                §
              </div>
              <div className="flex flex-col items-start space-y-1">
                <div className="rubber-stamp stamp-sealed text-xs">
                  ✓ SEALED & AUDITED
                </div>
                <button
                  onClick={handleSealDay}
                  className="text-[10px] font-mono text-ink-400 hover:text-ink-700 underline"
                  title="Unseal Page"
                >
                  Unseal Page
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSealDay}
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-archival-green hover:bg-archival-green/90 text-paper-50 font-sans text-xs font-semibold shadow-sm flex items-center justify-center space-x-1.5 transition-all active:scale-95 min-h-[38px]"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Seal Today's Page</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

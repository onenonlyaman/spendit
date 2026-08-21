import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  BellRing,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { api, FrequentSuggestion, RecurringSuggestion } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

interface RecurringSuggesterProps {
  onSelectPrompt: (prompt: string) => void;
  compact?: boolean;
}

export const RecurringSuggester: React.FC<RecurringSuggesterProps> = ({
  onSelectPrompt,
  compact = false,
}) => {
  const {
    currencySymbol,
    privacyMode,
    currentDiaryDate,
    refreshAllData,
  } = useFinance();

  const [dueSuggestions, setDueSuggestions] = useState<RecurringSuggestion[]>([]);
  const [frequentSuggestions, setFrequentSuggestions] = useState<FrequentSuggestion[]>([]);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [justLoggedMessage, setJustLoggedMessage] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      const data = await api.getSuggestions();
      setDueSuggestions(data.dueSuggestions || []);
      setFrequentSuggestions(data.frequentSuggestions || []);
    } catch {
      // Fallback silently if offline or initial load
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [currentDiaryDate]);

  const handleOneTapLog = async (item: RecurringSuggestion) => {
    setLoggingId(item.id);
    try {
      await api.logRecurringItem(item.id, item.accountId, currentDiaryDate);
      await refreshAllData();
      await fetchSuggestions();

      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#007AFF', '#34C759', '#5856D6', '#FF9500'],
      });

      setJustLoggedMessage(`✓ Recorded ${item.name} (${currencySymbol}${item.amount})`);
      setTimeout(() => setJustLoggedMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to 1-tap log recurring item:', err);
    } finally {
      setLoggingId(null);
    }
  };

  if (dueSuggestions.length === 0 && frequentSuggestions.length === 0 && !justLoggedMessage) {
    return null;
  }

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* Just Logged Success Toast Banner */}
      {justLoggedMessage && (
        <div className="p-3 rounded-2xl bg-apple-green/15 border border-apple-green/30 text-apple-green text-xs font-mono font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{justLoggedMessage}</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-apple-green/80 font-sans font-semibold">
            Recorded
          </span>
        </div>
      )}

      {/* Due Today / Upcoming Recurring Spends Prompt */}
      {dueSuggestions.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] shadow-apple-card space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-sans font-bold text-apple-orange uppercase tracking-wider">
              <BellRing className="w-3.5 h-3.5" />
              <span>Upcoming Due Commitments</span>
            </div>
            <span className="text-[11px] font-mono text-ink-400">
              {dueSuggestions.length} pending
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {dueSuggestions.map(item => {
              const isDueToday = item.urgency === 'due_today';
              const isOverdue = item.urgency === 'overdue';

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs w-full sm:w-auto flex-1 transition-all ${
                    isDueToday
                      ? 'bg-white dark:bg-[#1C1C1E] border-apple-orange/40 shadow-sm'
                      : isOverdue
                      ? 'bg-apple-red/10 border-apple-red/30'
                      : 'bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-ink-900 dark:text-ink-100 truncate">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                          isDueToday
                            ? 'bg-apple-orange/15 text-apple-orange'
                            : isOverdue
                            ? 'bg-apple-red/15 text-apple-red'
                            : 'bg-black/5 dark:bg-white/10 text-ink-500'
                        }`}
                      >
                        {isDueToday
                          ? 'Due Today'
                          : isOverdue
                          ? 'Overdue'
                          : `In ${item.daysUntilDue}d`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-ink-800 dark:text-ink-200 mt-0.5 block">
                      {formatCurrency(item.amount, currencySymbol, privacyMode)}
                    </span>
                  </div>

                  {/* 1-Tap Log Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    disabled={loggingId === item.id}
                    onClick={() => handleOneTapLog(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-apple-green hover:bg-apple-green/90 text-white text-xs font-sans font-semibold shadow-sm transition-all flex items-center space-x-1 disabled:opacity-50 flex-shrink-0"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{loggingId === item.id ? 'Logging...' : '1-Tap Log'}</span>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Repetitive Spend Habits Quick Chips */}
      {frequentSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-sans font-semibold text-ink-400 flex items-center space-x-1 mr-1">
            <Sparkles className="w-3 h-3 text-apple-orange" />
            <span>Frequent:</span>
          </span>
          {frequentSuggestions.map((freq, idx) => (
            <motion.button
              key={`${freq.description}-${idx}`}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectPrompt(freq.prompt)}
              className="text-xs font-sans px-3 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-black/5 dark:hover:bg-white/10 text-ink-800 dark:text-ink-200 border border-black/10 dark:border-white/10 shadow-sm transition-all flex items-center space-x-1.5"
            >
              <span>+ {freq.description}</span>
              <span className="font-mono font-bold text-apple-blue text-[11px]">
                {formatCurrency(freq.amount, currencySymbol, privacyMode)}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

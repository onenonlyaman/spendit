import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  Repeat,
  Sparkles,
  TrendingDown,
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

      // Confetti celebration
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#2A6F4E', '#C07D2B', '#235789'],
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
        <div className="p-2.5 rounded-lg bg-archival-green/15 border border-archival-green/30 text-archival-green text-xs font-mono font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{justLoggedMessage}</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-archival-green/80">
            Ledger Reconciled
          </span>
        </div>
      )}

      {/* Due Today / Upcoming Recurring Spends Prompt */}
      {dueSuggestions.length > 0 && (
        <div className="p-3 rounded-xl bg-archival-ochre-light dark:bg-paper-dark border-2 border-archival-ochre/40 dark:border-paper-dark-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-archival-ochre dark:text-archival-brass uppercase tracking-wider">
              <BellRing className="w-3.5 h-3.5" />
              <span>Smart Recurring Spend Radar</span>
            </div>
            <span className="text-[10px] font-mono text-ink-400">
              {dueSuggestions.length} commitment{dueSuggestions.length === 1 ? '' : 's'} pending
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {dueSuggestions.map(item => {
              const isDueToday = item.urgency === 'due_today';
              const isOverdue = item.urgency === 'overdue';

              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-3 text-xs w-full sm:w-auto flex-1 ${
                    isDueToday
                      ? 'bg-paper-50 dark:bg-paper-dark-card border-archival-ochre/50 shadow-sm'
                      : isOverdue
                      ? 'bg-archival-red-light dark:bg-paper-dark-card border-archival-red/40'
                      : 'bg-paper-50 dark:bg-paper-dark-card border-paper-300 dark:border-paper-dark-border'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-ink-900 dark:text-ink-100 truncate">
                        {item.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          isDueToday
                            ? 'bg-archival-ochre text-paper-50'
                            : isOverdue
                            ? 'bg-archival-red text-paper-50'
                            : 'bg-paper-200 text-ink-600'
                        }`}
                      >
                        {isDueToday
                          ? 'Due Today'
                          : isOverdue
                          ? 'Overdue'
                          : `In ${item.daysUntilDue}d`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-archival-red mt-0.5 block">
                      {formatCurrency(item.amount, currencySymbol, privacyMode)}
                    </span>
                  </div>

                  {/* 1-Tap Log Button */}
                  <button
                    type="button"
                    disabled={loggingId === item.id}
                    onClick={() => handleOneTapLog(item)}
                    className="px-3 py-1.5 rounded bg-archival-green hover:bg-archival-green/90 text-paper-50 text-xs font-mono font-semibold shadow-sm transition-all active:scale-95 flex items-center space-x-1 disabled:opacity-50 flex-shrink-0"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{loggingId === item.id ? 'Logging...' : '1-Tap Log'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Repetitive Spend Habits Quick Chips */}
      {frequentSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 flex items-center space-x-1 mr-1">
            <Sparkles className="w-3 h-3 text-archival-ochre" />
            <span>Frequent:</span>
          </span>
          {frequentSuggestions.map((freq, idx) => (
            <button
              key={`${freq.description}-${idx}`}
              type="button"
              onClick={() => onSelectPrompt(freq.prompt)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-paper-200/90 dark:bg-paper-dark hover:bg-paper-300 dark:hover:bg-paper-dark-border text-ink-800 dark:text-ink-200 border border-paper-300 dark:border-paper-dark-border transition-all flex items-center space-x-1"
            >
              <span>+ {freq.description}</span>
              <span className="font-bold text-archival-red">
                {formatCurrency(freq.amount, currencySymbol, privacyMode)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

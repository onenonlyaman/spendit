import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  FileText,
  PenTool,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateJournalHeader, formatCurrency, getTodayString } from '../../lib/utils';
import { getDailyTotals } from '../../lib/accounting';
import { PrintableJournalModal } from '../common/PrintableJournalModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { RecurringSuggester } from '../common/RecurringSuggester';
import { DailyNotes } from './DailyNotes';
import { EndOfDaySummary } from './EndOfDaySummary';
import { TransactionRow } from './TransactionRow';
import { sounds } from '../../lib/audioHaptics';

export const DiaryView: React.FC = () => {
  const {
    currentDiaryDate,
    setDiaryDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    transactions,
    privacyMode,
    currencySymbol,
    setIsQuickAddOpen,
  } = useFinance();

  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; description: string } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [showClosure, setShowClosure] = useState(false);

  const handlePrevDay = () => {
    sounds.playPageTurn();
    goToPreviousDay();
  };

  const handleNextDay = () => {
    sounds.playPageTurn();
    goToNextDay();
  };

  const handleGoToToday = () => {
    sounds.playPageTurn();
    goToToday();
  };

  // Filter transactions for current diary date
  const dayTransactions = transactions
    .filter(t => t.date === currentDiaryDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const totals = getDailyTotals(transactions, currentDiaryDate);
  const isToday = currentDiaryDate === getTodayString();
  const headerInfo = formatDateJournalHeader(currentDiaryDate);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-5">
      {/* Apple-Grade Header Card & Hero Stat */}
      <div className="apple-glass-card rounded-3xl p-4 sm:p-7 space-y-3 sm:space-y-4">
        {/* Date Paginator & Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-0.5 sm:space-x-1 bg-black/5 dark:bg-white/10 p-1 rounded-2xl">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-700 dark:text-ink-300 transition-colors min-w-[28px] min-h-[28px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={currentDiaryDate}
              onChange={e => e.target.value && setDiaryDate(e.target.value)}
              className="px-1.5 sm:px-2 py-1 text-xs font-mono font-semibold rounded-lg bg-transparent text-ink-900 dark:text-ink-100 border-0 focus:ring-1 focus:ring-apple-blue cursor-pointer max-w-[124px] sm:max-w-none"
              aria-label="Select Date"
            />

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-700 dark:text-ink-300 transition-colors min-w-[28px] min-h-[28px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action Pills */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {!isToday && (
              <button
                onClick={handleGoToToday}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-apple-red text-xs font-semibold flex items-center space-x-1 transition-all min-h-[32px]"
                aria-label="Jump to Today"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Today</span>
              </button>
            )}

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-ink-700 dark:text-ink-300 text-xs transition-colors min-w-[30px] min-h-[30px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
              aria-label="Export or Print Folio"
              title="Print Folio"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Glanceable Hero Title & Daily Spend Figure */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-ink-400 dark:text-ink-500 font-semibold block">
              {headerInfo.dayName}
            </span>
            <h1 className="font-sans font-bold text-xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight mt-0.5">
              {headerInfo.monthName} {headerInfo.dayNumber}, {headerInfo.year}
            </h1>
          </div>

          <div className="sm:text-right bg-black/[0.02] dark:bg-white/[0.04] p-3 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">
              Total Outflow Today
            </span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-ink-900 dark:text-ink-100 tracking-tight">
              {formatCurrency(totals.expense, currencySymbol, privacyMode)}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Recurring Suggestions Radar */}
      {isToday && (
        <RecurringSuggester
          onSelectPrompt={() => setIsQuickAddOpen(true)}
        />
      )}

      {/* Apple Inset Grouped Transaction Ledger */}
      <div className="apple-inset-group shadow-apple-card">
        <div className="px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
          <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">
            Transactions ({dayTransactions.length})
          </span>
          <span className="text-[11px] font-mono text-ink-400">
            Tap row for details
          </span>
        </div>

        {dayTransactions.length === 0 ? (
          /* Clean Minimal Empty State */
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 text-ink-400 dark:text-ink-500 flex items-center justify-center mx-auto text-xl">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-semibold text-base text-ink-800 dark:text-ink-200">
              No transactions recorded for this day
            </h3>
            <p className="font-sans text-xs text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
              Type naturally in the Quick Add bar (Press 'N') to log chai, grocery, UPI payments, or transfers.
            </p>
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue/90 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log First Entry</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {dayTransactions.map(transaction => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onOpenReceipt={(url, desc) => setSelectedReceipt({ url, description: desc })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Progressive Disclosure Section 1: Daily Reflection Note Accordion */}
      <div className="apple-inset-group">
        <button
          onClick={() => setShowReflections(!showReflections)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <PenTool className="w-4 h-4 text-apple-orange" />
            <span className="text-xs font-semibold text-ink-900 dark:text-ink-100">
              Daily Reflection, Mood & Weather
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-ink-400 transition-transform duration-200 ${
              showReflections ? 'rotate-180 text-apple-orange' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {showReflections && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                <DailyNotes date={currentDiaryDate} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progressive Disclosure Section 2: End-of-Day Closure & Wax Seal Accordion */}
      <div className="apple-inset-group">
        <button
          onClick={() => setShowClosure(!showClosure)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-apple-green" />
            <span className="text-xs font-semibold text-ink-900 dark:text-ink-100">
              End-of-Day Closure & Audited Seal
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-ink-400 transition-transform duration-200 ${
              showClosure ? 'rotate-180 text-apple-green' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {showClosure && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                <EndOfDaySummary date={currentDiaryDate} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Receipt Viewer Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <ReceiptModal
            receiptUrl={selectedReceipt.url}
            description={selectedReceipt.description}
            onClose={() => setSelectedReceipt(null)}
          />
        )}
      </AnimatePresence>

      {/* Printable Folio Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <PrintableJournalModal
            defaultScope="day"
            onClose={() => setIsPrintModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

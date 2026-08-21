import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateJournalHeader, formatDateLong, getTodayString } from '../../lib/utils';
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
    setIsQuickAddOpen,
  } = useFinance();

  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; description: string } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isRibbonActive, setIsRibbonActive] = useState(false);

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
    setIsRibbonActive(true);
    setTimeout(() => setIsRibbonActive(false), 900);
    goToToday();
  };

  // Filter transactions for current diary date
  const dayTransactions = transactions
    .filter(t => t.date === currentDiaryDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const isToday = currentDiaryDate === getTodayString();
  const headerInfo = formatDateJournalHeader(currentDiaryDate);

  // Calculate day of the year e.g. Day 226 of 365
  const [y, m, d] = currentDiaryDate.split('-').map(Number);
  const curDateObj = new Date(y, m - 1, d);
  const startOfYear = new Date(curDateObj.getFullYear(), 0, 0);
  const diffTime = curDateObj.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Date Navigation & Diary Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Day Paginator */}
        <div className="flex items-center space-x-1.5 bg-paper-50 dark:bg-paper-dark-card p-1 rounded-lg border border-paper-300 dark:border-paper-dark-border shadow-sm min-h-[40px]">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-md hover:bg-paper-200 dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Previous Day"
            title="Previous Day (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={currentDiaryDate}
            onChange={e => e.target.value && setDiaryDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-transparent text-ink-900 dark:text-ink-100 border-0 focus:ring-1 focus:ring-archival-ochre cursor-pointer"
            aria-label="Select Diary Date"
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-md hover:bg-paper-200 dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Next Day"
            title="Next Day (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {!isToday && (
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 rounded-md bg-paper-200/80 hover:bg-paper-300 dark:bg-paper-dark-card dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 text-xs font-mono flex items-center space-x-1 border border-paper-300 dark:border-paper-dark-border shadow-sm transition-all min-h-[36px]"
              aria-label="Jump to Today's Folio"
            >
              <RotateCcw className="w-3.5 h-3.5 text-archival-red" />
              <span>Jump to Today</span>
            </button>
          )}

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-1.5 rounded-md bg-paper-200 hover:bg-paper-300 dark:bg-paper-dark-card dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 text-xs font-mono flex items-center space-x-1 border border-paper-300 dark:border-paper-dark-border shadow-sm transition-all min-h-[36px]"
            aria-label="Export or Print Today's Ledger Folio"
            title="Export / Print Today's Ledger Folio"
          >
            <Printer className="w-3.5 h-3.5 text-archival-ochre" />
            <span className="hidden sm:inline">Print Folio</span>
          </button>

          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-paper-200 text-paper-50 dark:text-ink-900 text-xs font-sans font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Transaction</span>
          </button>
        </div>
      </div>

      {/* Dynamic Recurring Spends & Due Commitments Radar */}
      {isToday && (
        <RecurringSuggester
          onSelectPrompt={() => setIsQuickAddOpen(true)}
        />
      )}

      {/* Main Physical Notebook Sheet */}
      <div className="relative rounded-2xl shadow-ledger-lg bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border overflow-hidden">
        {/* Bookmark Ribbon on Today */}
        {isToday && (
          <div
            className={`bookmark-ribbon ${isRibbonActive ? 'ribbon-active' : ''}`}
            title="Current Today Bookmark Ribbon"
          />
        )}

        {/* Page Top Header with Ledger Ruling */}
        <div className="p-6 sm:p-8 border-b-2 border-paper-300 dark:border-paper-dark-border bg-paper-100/60 dark:bg-paper-dark">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[11px] uppercase font-mono tracking-widest text-archival-ochre font-bold">
                  Financial Journal • Folio #{dayOfYear}
                </span>
                <span className="text-paper-400 dark:text-ink-600">•</span>
                <span className="text-[11px] font-mono text-ink-500">
                  Year {headerInfo.year}
                </span>
              </div>

              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink-900 dark:text-ink-100 tracking-tight">
                {headerInfo.dayName}
              </h1>
              <p className="font-serif italic text-base text-ink-600 dark:text-ink-400 mt-0.5">
                {headerInfo.monthName} {headerInfo.dayNumber}, {headerInfo.year}
              </p>
            </div>

            {/* Daily Metric Pill */}
            <div className="text-right">
              <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">
                Logged Entries
              </span>
              <span className="font-mono font-bold text-lg text-ink-900 dark:text-ink-100">
                {dayTransactions.length} {dayTransactions.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          </div>
        </div>

        {/* Ruled Transaction Ledger Body */}
        <div className="p-4 sm:p-8 min-h-[320px]">
          <div className="mb-3 flex items-center justify-between pb-2 border-b border-paper-300 dark:border-paper-dark-border">
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-ink-700 dark:text-ink-300">
              Journaled Transactions
            </span>
            <span className="text-[11px] font-mono text-ink-400">
              Verified Journal Ledger • Audited
            </span>
          </div>

          {dayTransactions.length === 0 ? (
            /* Tactile Empty State */
            <div className="py-14 px-4 text-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-paper-200/70 dark:bg-paper-dark text-archival-ochre flex items-center justify-center mx-auto border border-paper-300 dark:border-paper-dark-border shadow-inner">
                <Coffee className="w-7 h-7" />
              </div>
              <h3 className="font-serif italic text-xl text-ink-800 dark:text-ink-200">
                An unwritten ledger page awaits.
              </h3>
              <p className="font-sans text-xs text-ink-500 dark:text-ink-400 max-w-md mx-auto leading-relaxed">
                Log your morning chai, kirana groceries, auto fare, or salary inflow using natural language.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="px-4 py-2 rounded-lg bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-paper-200 text-paper-50 dark:text-ink-900 text-xs font-sans font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log First Entry (Press 'N')</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-paper-200 dark:divide-paper-dark-border">
              {dayTransactions.map(transaction => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onOpenReceipt={(url, desc) => setSelectedReceipt({ url, description: desc })}
                />
              ))}
            </div>
          )}

          {/* Daily Margin Notes Section */}
          <div className="mt-8">
            <DailyNotes date={currentDiaryDate} />
          </div>

          {/* End of Day Summary & Sealing */}
          <EndOfDaySummary date={currentDiaryDate} />
        </div>
      </div>

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receiptUrl={selectedReceipt.url}
          description={selectedReceipt.description}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Printable Folio Modal */}
      {isPrintModalOpen && (
        <PrintableJournalModal
          defaultScope="day"
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};

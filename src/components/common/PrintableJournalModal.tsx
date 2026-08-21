import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  calculateAccountBalances,
  getMonthSummary,
} from '../../lib/accounting';
import { printLedgerDocument } from '../../lib/pdfPrinter';
import {
  formatCurrency,
  formatDateJournalHeader,
  formatDateLong,
} from '../../lib/utils';
import { Transaction } from '../../types';

interface PrintableJournalModalProps {
  onClose: () => void;
  defaultScope?: 'day' | 'month' | 'all';
}

export const PrintableJournalModal: React.FC<PrintableJournalModalProps> = ({
  onClose,
  defaultScope = 'day',
}) => {
  const {
    transactions,
    accounts,
    categories,
    goals,
    dailyNotes,
    recurring,
    currentDiaryDate,
    currencySymbol,
  } = useFinance();

  const [scope, setScope] = useState<'day' | 'month' | 'all'>(defaultScope);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentDiaryDate.slice(0, 7));

  // Compute transactions for current scope
  const filteredTransactions = React.useMemo(() => {
    if (scope === 'day') {
      return transactions
        .filter(t => t.date === currentDiaryDate)
        .sort((a, b) => a.time.localeCompare(b.time));
    }
    if (scope === 'month') {
      return transactions
        .filter(t => t.date.startsWith(selectedMonth))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    }
    return [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [transactions, scope, currentDiaryDate, selectedMonth]);

  const currentDayNote = dailyNotes[currentDiaryDate];
  const dayHeader = formatDateJournalHeader(currentDiaryDate);

  const monthSummary = getMonthSummary(transactions, selectedMonth);
  const [y, m] = selectedMonth.split('-').map(Number);
  const monthDateObj = new Date(y, m - 1, 1);
  const monthName = monthDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const handlePrint = () => {
    printLedgerDocument({
      scope,
      dateStr: currentDiaryDate,
      selectedMonth,
      transactions: filteredTransactions,
      accounts,
      categories,
      dailyNote: currentDayNote,
      goals,
      recurring,
      currencySymbol,
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-150"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        className="max-w-4xl w-full bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple-float border border-black/10 dark:border-white/10 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Modal Toolbar */}
        <div className="bg-black/[0.02] dark:bg-white/[0.03] px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-ink-900 dark:text-ink-100">
                Vector Archival Print & Export
              </h3>
              <p className="text-[11px] font-mono text-ink-400">
                High-DPI printable PDF document
              </p>
            </div>
          </div>

          {/* Scope Selector Controls */}
          <div className="flex items-center space-x-2">
            <div className="apple-segmented-picker !p-0.5">
              <button
                onClick={() => setScope('day')}
                className={`apple-segmented-item ${scope === 'day' ? 'apple-segmented-item-active font-semibold' : 'text-ink-500'}`}
              >
                Today's Folio
              </button>
              <button
                onClick={() => setScope('month')}
                className={`apple-segmented-item ${scope === 'month' ? 'apple-segmented-item-active font-semibold' : 'text-ink-500'}`}
              >
                Monthly Chapter
              </button>
              <button
                onClick={() => setScope('all')}
                className={`apple-segmented-item ${scope === 'all' ? 'apple-segmented-item-active font-semibold' : 'text-ink-500'}`}
              >
                Complete Ledger
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-apple-blue hover:bg-apple-blue/90 text-white font-sans text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Sheet Container (Preview) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-black/[0.03] dark:bg-black/30">
          <div className="max-w-3xl mx-auto bg-white text-zinc-900 p-6 sm:p-10 rounded-2xl shadow-apple-card border border-black/10 font-sans">
            {/* Top Seal & Title */}
            <div className="border-b border-zinc-900 pb-4 mb-5">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-zinc-900">SpendIt</span>
                  <span>•</span>
                  <span>Financial Folio & Register</span>
                </div>
                <span>Currency: {currencySymbol}</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                    {scope === 'day' && `Daily Ledger Folio: ${dayHeader.dayName}`}
                    {scope === 'month' && `Monthly Financial Chapter: ${monthName}`}
                    {scope === 'all' && `Complete Archival Financial Ledger`}
                  </h1>
                  <p className="text-xs text-zinc-600 mt-1">
                    {scope === 'day' && `${dayHeader.monthName} ${dayHeader.dayNumber}, ${dayHeader.year}`}
                    {scope === 'month' && `Financial summary and verified ledger transactions for ${monthName}`}
                    {scope === 'all' && `Comprehensive transaction ledger across all accounts`}
                  </p>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="block text-zinc-400 text-[10px] uppercase">Verified Register</span>
                  <span className="font-semibold text-zinc-900">{new Date().toLocaleDateString('en-US')}</span>
                </div>
              </div>
            </div>

            {/* Financial Vitals Summary Strip */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 mb-5 font-mono text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Total Inflow</span>
                <span className="font-bold text-sm text-apple-green">
                  +{formatCurrency(totalIncome, currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Total Outflow</span>
                <span className="font-bold text-sm text-apple-red">
                  -{formatCurrency(totalExpense, currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Net Balance</span>
                <span className="font-bold text-sm text-zinc-900">
                  {formatCurrency(totalIncome - totalExpense, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Ruled Transaction Table */}
            <div className="mb-5">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-300 pb-1 mb-2">
                Transactions ({filteredTransactions.length} records)
              </h2>

              {filteredTransactions.length === 0 ? (
                <p className="py-8 text-center text-xs italic text-zinc-400">
                  No ledger entries recorded for this period.
                </p>
              ) : (
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[10px] uppercase text-zinc-400">
                      <th className="py-1.5 pr-2">Date/Time</th>
                      <th className="py-1.5 px-2">Description & Notes</th>
                      <th className="py-1.5 px-2">Category</th>
                      <th className="py-1.5 px-2">Account</th>
                      <th className="py-1.5 pl-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredTransactions.map(t => {
                      const acc = accounts.find(a => a.id === t.accountId);
                      const cat = categories.find(c => c.id === t.categoryId);
                      return (
                        <tr key={t.id} className="align-top">
                          <td className="py-2 pr-2 text-zinc-600 whitespace-nowrap">
                            <span className="block">{t.date}</span>
                            <span className="text-[10px] text-zinc-400">{t.time}</span>
                          </td>
                          <td className="py-2 px-2">
                            <span className="font-semibold text-zinc-900 block font-sans">{t.description}</span>
                            {t.notes && (
                              <span className="text-xs italic text-zinc-600 block">
                                "{t.notes}"
                              </span>
                            )}
                            {t.tags && t.tags.length > 0 && (
                              <span className="text-[10px] text-zinc-400 block mt-0.5">
                                {t.tags.join(' ')}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-zinc-700 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px]">
                              {cat?.name || 'General'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-zinc-700 whitespace-nowrap">
                            {acc?.name || 'Cash'}
                          </td>
                          <td
                            className={`py-2 pl-2 text-right font-bold whitespace-nowrap ${
                              t.type === 'income'
                                ? 'text-apple-green'
                                : t.type === 'transfer'
                                ? 'text-apple-blue'
                                : 'text-apple-red'
                            }`}
                          >
                            {t.type === 'income' ? '+' : t.type === 'transfer' ? '⇄ ' : '-'}
                            {formatCurrency(t.amount, currencySymbol)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Scope = Day: Daily Notes & Reflection Section */}
            {scope === 'day' && currentDayNote && (
              <div className="mt-5 pt-3 border-t border-zinc-200">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Daily Reflection & State of Mind
                </h3>
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center space-x-3 mb-1.5 text-xs font-mono text-zinc-600">
                    <span>Mood: <strong className="capitalize text-zinc-900">{currentDayNote.mood}</strong></span>
                    <span>•</span>
                    <span>Weather: <strong className="capitalize text-zinc-900">{currentDayNote.weather}</strong></span>
                    {currentDayNote.location && <span>• Location: <strong className="text-zinc-900">{currentDayNote.location}</strong></span>}
                  </div>
                  {currentDayNote.reflection ? (
                    <p className="text-xs text-zinc-700 italic">
                      "{currentDayNote.reflection}"
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No reflection recorded.</p>
                  )}
                </div>
              </div>
            )}

            {/* Scope = All or Month: Account Balances Register */}
            {scope !== 'day' && accounts.length > 0 && (
              <div className="mt-5 pt-3 border-t border-zinc-200">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Verified Account Balances
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {accounts.map(acc => (
                    <div key={acc.id} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono">
                      <span className="text-zinc-500 block truncate text-[10px]">{acc.name}</span>
                      <span className="font-bold text-zinc-900 block mt-0.5">
                        {formatCurrency(acc.balance, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stamp Footer */}
            <div className="mt-6 pt-3 border-t border-zinc-300 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-apple-green" />
                <span>AUDITED FOLIO • SPENDIT FINANCIAL ARCHIVES</span>
              </div>
              <span>REGISTER VERIFIED</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

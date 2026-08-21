import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-4xl w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border-2 border-paper-400 dark:border-paper-dark-border overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Toolbar */}
        <div className="bg-paper-200/90 dark:bg-paper-dark px-6 py-4 border-b border-paper-300 dark:border-paper-dark-border flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-archival-ochre/20 text-archival-ochre flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
                Printable Archival Ledger PDF
              </h3>
              <p className="text-[11px] font-mono text-ink-500">
                Formatted for physical ledger print • Audited Folio Record
              </p>
            </div>
          </div>

          {/* Scope Selector Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg bg-paper-100 dark:bg-paper-dark-card p-1 border border-paper-300 dark:border-paper-dark-border text-xs font-mono">
              <button
                onClick={() => setScope('day')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  scope === 'day'
                    ? 'bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 shadow-sm'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                Today's Folio
              </button>
              <button
                onClick={() => setScope('month')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  scope === 'month'
                    ? 'bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 shadow-sm'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                Monthly Chapter
              </button>
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  scope === 'all'
                    ? 'bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 shadow-sm'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                Complete Audit Book
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-paper-200 text-paper-50 dark:text-ink-900 font-sans text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-ink-400 hover:text-ink-800 dark:hover:text-ink-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Sheet Container (Preview) */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-paper-200/50 dark:bg-paper-dark">
          <div className="max-w-3xl mx-auto bg-white text-ink-900 p-8 sm:p-12 rounded-xl shadow-lg border border-paper-300 font-serif">
            {/* Archival Ledger Top Seal & Title */}
            <div className="border-b-2 border-ink-900 pb-5 mb-6">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-ink-600 mb-2">
                <span>§ SpendIt • Archival Personal Finance Register</span>
                <span>Currency: ₹ (INR)</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 font-serif">
                    {scope === 'day' && `Daily Ledger Folio: ${dayHeader.dayName}`}
                    {scope === 'month' && `Monthly Financial Chapter: ${monthName}`}
                    {scope === 'all' && `Complete Archival Financial Ledger`}
                  </h1>
                  <p className="text-xs sm:text-sm italic text-ink-700 mt-1 font-serif">
                    {scope === 'day' && `${dayHeader.monthName} ${dayHeader.dayNumber}, ${dayHeader.year}`}
                    {scope === 'month' && `Financial summary and verified ledger transactions for ${monthName}`}
                    {scope === 'all' && `Comprehensive transaction ledger across all accounts`}
                  </p>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="block text-ink-500 text-[10px]">VERIFIED REGISTER</span>
                  <span className="font-semibold text-ink-900">{new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Financial Vitals Summary Strip */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded bg-paper-100/80 border border-paper-300 mb-6 font-mono text-xs">
              <div>
                <span className="text-[10px] text-ink-500 uppercase block">Total Verified Inflow</span>
                <span className="font-bold text-sm text-archival-green">
                  +{formatCurrency(totalIncome, currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-ink-500 uppercase block">Total Verified Outflow</span>
                <span className="font-bold text-sm text-archival-red">
                  -{formatCurrency(totalExpense, currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-ink-500 uppercase block">Net Retained Balance</span>
                <span className="font-bold text-sm text-ink-900">
                  {formatCurrency(totalIncome - totalExpense, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Ruled Transaction Table */}
            <div className="mb-6">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-700 border-b border-ink-400 pb-1 mb-2">
                Journaled Transactions ({filteredTransactions.length} records)
              </h2>

              {filteredTransactions.length === 0 ? (
                <p className="py-8 text-center text-xs italic text-ink-500">
                  No ledger entries recorded for this period.
                </p>
              ) : (
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-ink-300 text-[10px] uppercase text-ink-500">
                      <th className="py-1.5 pr-2">Date/Time</th>
                      <th className="py-1.5 px-2">Description & Notes</th>
                      <th className="py-1.5 px-2">Category</th>
                      <th className="py-1.5 px-2">Account</th>
                      <th className="py-1.5 pl-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200">
                    {filteredTransactions.map(t => {
                      const acc = accounts.find(a => a.id === t.accountId);
                      const cat = categories.find(c => c.id === t.categoryId);
                      return (
                        <tr key={t.id} className="align-top">
                          <td className="py-2 pr-2 text-ink-600 whitespace-nowrap">
                            <span className="block">{t.date}</span>
                            <span className="text-[10px] text-ink-400">{t.time}</span>
                          </td>
                          <td className="py-2 px-2">
                            <span className="font-semibold text-ink-900 block font-sans">{t.description}</span>
                            {t.notes && (
                              <span className="font-handwriting text-sm italic text-ink-700 block">
                                ✎ "{t.notes}"
                              </span>
                            )}
                            {t.tags && t.tags.length > 0 && (
                              <span className="text-[10px] text-ink-400 block mt-0.5">
                                {t.tags.join(' ')}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-ink-700 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-paper-100 border border-paper-300 text-[10px]">
                              {cat?.name || 'General'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-ink-700 whitespace-nowrap">
                            {acc?.name || 'Cash'}
                          </td>
                          <td
                            className={`py-2 pl-2 text-right font-bold whitespace-nowrap ${
                              t.type === 'income'
                                ? 'text-archival-green'
                                : t.type === 'transfer'
                                ? 'text-archival-blue'
                                : 'text-archival-red'
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
              <div className="mt-6 pt-4 border-t-2 border-paper-300">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-700 mb-2">
                  Daily Margin Reflection & State of Mind
                </h3>
                <div className="p-4 rounded bg-paper-100/60 border border-paper-300">
                  <div className="flex items-center space-x-4 mb-2 text-xs font-mono text-ink-600">
                    <span>Mood: <strong className="capitalize text-ink-900">{currentDayNote.mood}</strong></span>
                    <span>•</span>
                    <span>Weather: <strong className="capitalize text-ink-900">{currentDayNote.weather}</strong></span>
                    {currentDayNote.location && <span>• Location: <strong className="text-ink-900">{currentDayNote.location}</strong></span>}
                  </div>
                  {currentDayNote.reflection ? (
                    <p className="font-handwriting text-lg text-ink-800 leading-relaxed italic">
                      "{currentDayNote.reflection}"
                    </p>
                  ) : (
                    <p className="text-xs text-ink-400 italic">No handwritten reflection recorded.</p>
                  )}
                </div>
              </div>
            )}

            {/* Scope = All or Month: Account Balances Register */}
            {scope !== 'day' && accounts.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-paper-300">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-700 mb-2">
                  Verified Account Balances
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {accounts.map(acc => (
                    <div key={acc.id} className="p-2.5 rounded bg-paper-100/60 border border-paper-300 text-xs font-mono">
                      <span className="text-ink-500 block truncate text-[11px]">{acc.name}</span>
                      <span className="font-bold text-ink-900 block mt-0.5">
                        {formatCurrency(acc.balance, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Physical Archival Stamp */}
            <div className="mt-8 pt-4 border-t border-ink-300 flex items-center justify-between text-[10px] font-mono text-ink-500">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border border-ink-400 flex items-center justify-center font-bold text-[8px]">
                  ✓
                </div>
                <span>SEALED & AUDITED • FINANCIAL LEDGER REGISTER</span>
              </div>
              <span>PAGE FOLIO VERIFIED • SPENDIT ARCHIVES</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  Edit2,
  Layers,
  PieChart,
  PiggyBank,
  Plus,
  Printer,
  Receipt,
  Repeat,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  calculateSafeToSpend,
  getCategoryBreakdown,
  getMonthSummary,
} from '../../lib/accounting';
import { formatCurrency, getTodayString } from '../../lib/utils';
import { PrintableJournalModal } from '../common/PrintableJournalModal';
import { MoneyHeatmap } from './MoneyHeatmap';
import { RecurringItem } from '../../types';

export const ChaptersView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    recurring,
    privacyMode,
    currencySymbol,
    currentDiaryDate,
    addRecurring,
    updateRecurring,
    deleteRecurring,
  } = useFinance();

  // Selected Month state e.g. "2026-08"
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(
    currentDiaryDate.slice(0, 7)
  );

  // Active Folio Leaf Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'envelopes'>('overview');

  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // New Recurring Form State
  const [recName, setRecName] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDay, setRecDay] = useState('1');
  const [recAccountId, setRecAccountId] = useState(accounts[0]?.id || '');
  const [recCategoryId, setRecCategoryId] = useState(categories[0]?.id || '');

  // Edit Recurring Form State
  const [editRecName, setEditRecName] = useState('');
  const [editRecAmount, setEditRecAmount] = useState('');
  const [editRecDay, setEditRecDay] = useState('1');
  const [editRecAccountId, setEditRecAccountId] = useState('');
  const [editRecCategoryId, setEditRecCategoryId] = useState('');

  const summary = getMonthSummary(transactions, selectedYearMonth);
  const categoryBreakdowns = getCategoryBreakdown(transactions, selectedYearMonth, categories);

  // Safe to spend calculations
  const fixedBills = recurring.reduce((sum, r) => sum + r.amount, 0);
  const savingsTarget = summary.totalIncome * 0.2; // 20% savings target
  const daysRemainingInMonth = summary.totalDaysInMonth - summary.daysElapsed;

  const safeToSpend = calculateSafeToSpend(
    summary.totalIncome || 0,
    fixedBills,
    savingsTarget,
    summary.totalExpense,
    Math.max(1, daysRemainingInMonth)
  );

  const handlePrevMonth = () => {
    const [y, m] = selectedYearMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    setSelectedYearMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedYearMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newY = nextDate.getFullYear();
    const newM = (nextDate.getMonth() + 1).toString().padStart(2, '0');
    setSelectedYearMonth(`${newY}-${newM}`);
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(recAmount);
    if (!recName.trim() || isNaN(num) || num <= 0) return;

    await addRecurring({
      name: recName.trim(),
      amount: num,
      accountId: recAccountId || accounts[0]?.id || 'acc_upi',
      categoryId: recCategoryId || categories[0]?.id || 'cat_utilities',
      frequency: 'monthly',
      dayOfMonth: parseInt(recDay, 10) || 1,
    });

    setRecName('');
    setRecAmount('');
    setIsAddRecurringOpen(false);
  };

  const handleOpenEditRecurring = (rec: RecurringItem) => {
    setEditingRecurring(rec);
    setEditRecName(rec.name);
    setEditRecAmount(rec.amount.toString());
    setEditRecDay((rec.dayOfMonth || 1).toString());
    setEditRecAccountId(rec.accountId || accounts[0]?.id || '');
    setEditRecCategoryId(rec.categoryId || categories[0]?.id || '');
  };

  const handleSaveEditRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecurring) return;
    const num = parseFloat(editRecAmount);
    if (!editRecName.trim() || isNaN(num) || num <= 0) return;

    await updateRecurring(editingRecurring.id, {
      name: editRecName.trim(),
      amount: num,
      dayOfMonth: parseInt(editRecDay, 10) || 1,
      accountId: editRecAccountId,
      categoryId: editRecCategoryId,
    });

    setEditingRecurring(null);
  };

  const [yearNum, monthNum] = selectedYearMonth.split('-').map(Number);
  const monthDate = new Date(yearNum, monthNum - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Chapter Month Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper-50 dark:bg-paper-dark-card p-6 rounded-2xl border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono tracking-widest text-archival-ochre font-bold">
              Monthly Financial Chapter
            </span>
            <span className="text-paper-400">•</span>
            <span className="text-xs font-mono text-ink-500">
              Volume {selectedYearMonth.replace('-', '.')}
            </span>
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink-900 dark:text-ink-100 mt-1">
            {monthName}
          </h1>
        </div>

        {/* Month Selector Controls & Print Button */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-paper-200 hover:bg-paper-300 dark:bg-paper-dark dark:hover:bg-paper-dark-card text-ink-700 dark:text-ink-300 text-xs font-mono flex items-center space-x-1.5 border border-paper-300 dark:border-paper-dark-border shadow-sm transition-all"
            aria-label="Print Monthly Chapter PDF"
          >
            <Printer className="w-3.5 h-3.5 text-archival-blue" />
            <span>Print Chapter</span>
          </button>

          <div className="flex items-center space-x-2 bg-paper-100 dark:bg-paper-dark p-1.5 rounded-lg border border-paper-300 dark:border-paper-dark-border">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded hover:bg-paper-200 dark:hover:bg-paper-dark-card text-ink-700 dark:text-ink-300"
              aria-label="Previous Month Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-3 text-ink-900 dark:text-ink-100">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded hover:bg-paper-200 dark:hover:bg-paper-dark-card text-ink-700 dark:text-ink-300"
              aria-label="Next Month Chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tactile Folio Leaf Tabs */}
      <div className="flex items-center space-x-1.5 p-1.5 bg-paper-100 dark:bg-paper-dark rounded-xl border border-paper-300 dark:border-paper-dark-border w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-paper-50 dark:bg-paper-dark-card text-ink-900 dark:text-ink-100 shadow-sm border border-paper-300 dark:border-paper-dark-border'
              : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 hover:bg-paper-200/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-archival-ochre" />
          <span>Chapter Vitals & Compass</span>
        </button>

        <button
          onClick={() => setActiveTab('heatmap')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'heatmap'
              ? 'bg-paper-50 dark:bg-paper-dark-card text-ink-900 dark:text-ink-100 shadow-sm border border-paper-300 dark:border-paper-dark-border'
              : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 hover:bg-paper-200/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-archival-blue" />
          <span>31-Day Cashflow Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('envelopes')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'envelopes'
              ? 'bg-paper-50 dark:bg-paper-dark-card text-ink-900 dark:text-ink-100 shadow-sm border border-paper-300 dark:border-paper-dark-border'
              : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 hover:bg-paper-200/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-archival-green" />
          <span>Envelopes & Recurring Radar</span>
        </button>
      </div>

      {/* TAB 1: Chapter Vitals & Compass */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Chapter Macro Vitals Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Inflow */}
            <div className="p-4 rounded-xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-ink-500">Total Income</span>
                <TrendingUp className="w-4 h-4 text-archival-green" />
              </div>
              <span className="font-mono font-bold text-xl text-archival-green block">
                +{formatCurrency(summary.totalIncome, currencySymbol, privacyMode)}
              </span>
              <span className="text-[10px] font-mono text-ink-400 mt-1 block">
                Verified Inflow
              </span>
            </div>

            {/* Total Outflow */}
            <div className="p-4 rounded-xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-ink-500">Total Outflow</span>
                <TrendingDown className="w-4 h-4 text-archival-red" />
              </div>
              <span className="font-mono font-bold text-xl text-archival-red block">
                -{formatCurrency(summary.totalExpense, currencySymbol, privacyMode)}
              </span>
              <span className="text-[10px] font-mono text-ink-400 mt-1 block">
                {summary.avgDailySpend > 0
                  ? `Avg ${formatCurrency(summary.avgDailySpend, currencySymbol, privacyMode)}/day`
                  : 'No spend recorded'}
              </span>
            </div>

            {/* Net Savings & Rate */}
            <div className="p-4 rounded-xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-ink-500">Net Retained</span>
                <PiggyBank className="w-4 h-4 text-archival-ochre" />
              </div>
              <span className="font-mono font-bold text-xl text-ink-900 dark:text-ink-100 block">
                {formatCurrency(summary.netSavings, currencySymbol, privacyMode)}
              </span>
              <span className="text-[10px] font-mono text-archival-ochre font-semibold mt-1 block">
                {summary.savingsRate}% Savings Rate
              </span>
            </div>

            {/* No-Spend Days */}
            <div className="p-4 rounded-xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-ink-500">No-Spend Days</span>
                <span className="text-archival-ochre font-bold">★</span>
              </div>
              <span className="font-mono font-bold text-xl text-ink-900 dark:text-ink-100 block">
                {summary.noSpendDaysCount} Days
              </span>
              <span className="text-[10px] font-mono text-ink-400 mt-1 block">
                {summary.biggestExpense
                  ? `Max: ${formatCurrency(summary.biggestExpense.amount, currencySymbol, privacyMode)}`
                  : 'Zero spend'}
              </span>
            </div>
          </div>

          {/* Safe-to-Spend Compass Card */}
          <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-paper-300 dark:border-paper-dark-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-archival-ochre/15 text-archival-ochre flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
                    Safe-to-Spend Compass
                  </h3>
                  <p className="text-xs font-mono text-ink-500">
                    Dynamic daily allowance after fixed commitments & 20% savings cushion
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-ink-400 block">Safe Daily Allowance</span>
                <span className="font-mono font-bold text-2xl text-archival-green">
                  {formatCurrency(safeToSpend.safeDailySpend, currencySymbol, privacyMode)}
                  <span className="text-xs font-normal text-ink-500">/day</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <span className="text-[10px] text-ink-400 block">Discretionary Runway Remaining</span>
                <span className="font-bold text-base text-ink-800 dark:text-ink-200 mt-0.5 block">
                  {formatCurrency(safeToSpend.remainingAllowance, currencySymbol, privacyMode)}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <span className="text-[10px] text-ink-400 block">Fixed Commitments (Monthly)</span>
                <span className="font-bold text-base text-ink-800 dark:text-ink-200 mt-0.5 block">
                  {formatCurrency(fixedBills, currencySymbol, privacyMode)}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <span className="text-[10px] text-ink-400 block">Days Left in Chapter</span>
                <span className="font-bold text-base text-ink-800 dark:text-ink-200 mt-0.5 block">
                  {daysRemainingInMonth > 0 ? `${daysRemainingInMonth} days remaining` : 'Chapter complete'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 31-Day Velocity Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <MoneyHeatmap yearMonthStr={selectedYearMonth} />
        </div>
      )}

      {/* TAB 3: Category Envelopes & Recurring Radar */}
      {activeTab === 'envelopes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Category Budget Envelopes */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-paper-300 dark:border-paper-dark-border">
              <div>
                <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
                  Category Ledger Envelopes
                </h3>
                <p className="text-xs font-mono text-ink-500">
                  Total spent vs. monthly discretionary budget limits
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-ink-600 dark:text-ink-400">
                {categoryBreakdowns.length} Envelopes
              </span>
            </div>

            <div className="space-y-4">
              {categoryBreakdowns.map(item => {
                const pct = item.budget > 0 ? Math.min(100, (item.totalSpent / item.budget) * 100) : item.percentage;
                return (
                  <div key={item.category.id} className="space-y-1.5 p-3 rounded-xl bg-paper-100/60 dark:bg-paper-dark border border-paper-300/60 dark:border-paper-dark-border">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.category.color }}
                        />
                        <span className="font-semibold text-ink-900 dark:text-ink-100">
                          {item.category.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-ink-900 dark:text-ink-100">
                          {formatCurrency(item.totalSpent, currencySymbol, privacyMode)}
                        </span>
                        {item.budget > 0 && (
                          <span className="text-ink-400 text-[11px]">
                            / {formatCurrency(item.budget, currencySymbol, privacyMode)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ink Progress Bar */}
                    <div className="h-2.5 w-full rounded-full bg-paper-200 dark:bg-paper-dark-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: item.isOverBudget ? '#B83A3A' : item.category.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurring Commitments Radar */}
          <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-paper-300 dark:border-paper-dark-border">
                <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100 flex items-center space-x-1.5">
                  <Repeat className="w-4 h-4 text-archival-brass" />
                  <span>Scheduled Bills</span>
                </h3>
                <button
                  onClick={() => setIsAddRecurringOpen(true)}
                  className="px-2.5 py-1 rounded bg-paper-200 hover:bg-paper-300 dark:bg-paper-dark text-ink-800 dark:text-ink-200 text-xs font-mono flex items-center space-x-1 border border-paper-300 dark:border-paper-dark-border"
                  aria-label="Add Recurring Item"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bill</span>
                </button>
              </div>

              {recurring.length === 0 ? (
                <div className="py-8 text-center text-ink-500 space-y-2">
                  <Repeat className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs font-serif italic">No recurring commitments logged yet.</p>
                  <button
                    onClick={() => setIsAddRecurringOpen(true)}
                    className="text-[11px] font-mono text-archival-ochre underline font-semibold"
                  >
                    + Add rent, WiFi, or SIP
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recurring.map(rec => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border flex items-center justify-between text-xs group hover:border-paper-400 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-ink-900 dark:text-ink-100 block">
                          {rec.name}
                        </span>
                        <span className="text-[10px] font-mono text-ink-400">
                          Due Day {rec.dayOfMonth} of month
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-archival-red">
                          {formatCurrency(rec.amount, currencySymbol, privacyMode)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEditRecurring(rec)}
                            className="p-1 text-ink-400 hover:text-ink-800 dark:hover:text-ink-200"
                            aria-label="Edit Recurring Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRecurring(rec.id)}
                            className="p-1 text-ink-400 hover:text-archival-red"
                            aria-label="Delete Recurring Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-paper-300 dark:border-paper-dark-border mt-6 text-xs font-mono text-ink-600 dark:text-ink-400 text-center font-bold">
              Total Fixed: {formatCurrency(fixedBills, currencySymbol, privacyMode)} / month
            </div>
          </div>
        </div>
      )}

      {/* Add Recurring Modal */}
      {isAddRecurringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border-2 border-paper-300 dark:border-paper-dark-border p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-300 dark:border-paper-dark-border">
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
                Add Scheduled Recurring Bill
              </h3>
              <button
                onClick={() => setIsAddRecurringOpen(false)}
                className="p-1 text-ink-400 hover:text-ink-900 dark:hover:text-ink-100"
                aria-label="Close add bill modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-ink-600 dark:text-ink-400 mb-1">
                  Commitment Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rent, Fiber Broadband, Netflix, SIP"
                  value={recName}
                  onChange={e => setRecName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  required
                />
              </div>

              <div>
                <label className="block text-ink-600 dark:text-ink-400 mb-1">
                  Monthly Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  inputMode="decimal"
                  value={recAmount}
                  onChange={e => setRecAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-600 dark:text-ink-400 mb-1">
                    Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={recDay}
                    onChange={e => setRecDay(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  />
                </div>

                <div>
                  <label className="block text-ink-600 dark:text-ink-400 mb-1">
                    Account
                  </label>
                  <select
                    value={recAccountId}
                    onChange={e => setRecAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300 dark:border-paper-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddRecurringOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-ink-600 hover:bg-paper-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ink-900 text-paper-50 dark:bg-paper-100 dark:text-ink-900 text-xs font-semibold rounded shadow-sm"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recurring Modal */}
      {editingRecurring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border-2 border-paper-300 dark:border-paper-dark-border p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-300 dark:border-paper-dark-border">
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
                Edit Scheduled Recurring Bill
              </h3>
              <button
                onClick={() => setEditingRecurring(null)}
                className="p-1 text-ink-400 hover:text-ink-900 dark:hover:text-ink-100"
                aria-label="Close edit bill modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRecurring} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-ink-600 dark:text-ink-400 mb-1">
                  Commitment Name
                </label>
                <input
                  type="text"
                  value={editRecName}
                  onChange={e => setEditRecName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  required
                />
              </div>

              <div>
                <label className="block text-ink-600 dark:text-ink-400 mb-1">
                  Monthly Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editRecAmount}
                  onChange={e => setEditRecAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-600 dark:text-ink-400 mb-1">
                    Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editRecDay}
                    onChange={e => setEditRecDay(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  />
                </div>

                <div>
                  <label className="block text-ink-600 dark:text-ink-400 mb-1">
                    Account
                  </label>
                  <select
                    value={editRecAccountId}
                    onChange={e => setEditRecAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300 dark:border-paper-dark-border">
                <button
                  type="button"
                  onClick={() => setEditingRecurring(null)}
                  className="px-3.5 py-1.5 text-xs text-ink-600 hover:bg-paper-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ink-900 text-paper-50 dark:bg-paper-100 dark:text-ink-900 text-xs font-semibold rounded shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Modal */}
      {isPrintModalOpen && (
        <PrintableJournalModal
          defaultScope="month"
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};

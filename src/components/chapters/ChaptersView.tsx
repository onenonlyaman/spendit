import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
import { formatCurrency, getTodayString, cn } from '../../lib/utils';
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

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'envelopes' | 'heatmap' | 'subscriptions'>('overview');

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
  const savingsTarget = summary.totalIncome * 0.2;
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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Apple-Grade Month Hero Card */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wide text-secondary font-semibold block">
              Monthly Financial Chapter
            </span>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight mt-0.5">
              {monthName}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-black/5 dark:bg-white/10 p-1 rounded-2xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-700 dark:text-ink-300 transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-semibold px-2 text-ink-900 dark:text-ink-100">
                {selectedYearMonth}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-700 dark:text-ink-300 transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="p-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-ink-700 dark:text-ink-300 transition-colors"
              title="Print Monthly Chapter"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Glanceable Metrics (Income / Expense / Net Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-xs text-secondary block">Total Monthly Inflow</span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-apple-green block mt-0.5">
              +{formatCurrency(summary.totalIncome, currencySymbol, privacyMode)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-xs text-secondary block">Total Outflow</span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-apple-red block mt-0.5">
              -{formatCurrency(summary.totalExpense, currencySymbol, privacyMode)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-xs text-secondary block">Net Monthly Balance</span>
            <span className={`font-mono font-bold text-xl sm:text-2xl block mt-0.5 ${summary.netSavings >= 0 ? 'text-accent' : 'text-apple-red'}`}>
              {summary.netSavings >= 0 ? '+' : ''}{formatCurrency(summary.netSavings, currencySymbol, privacyMode)}
            </span>
          </div>
        </div>

        {/* Sub-View Tabs with Fluid Liquid Spring Pill and Instinctive Gradient Edge Fades */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar scroll-fade-x mask-fade-x sm:mask-none px-1 pb-1">
          <div className="apple-segmented-picker relative flex min-w-max">
            {(
              [
                { id: 'overview', label: 'Vitals', fullLabel: 'Monthly Vitals' },
                { id: 'envelopes', label: 'Envelopes', fullLabel: 'Category Envelopes' },
                { id: 'heatmap', label: 'Heatmap', fullLabel: 'Calendar Heatmap' },
                { id: 'subscriptions', label: `Recurring (${recurring.length})`, fullLabel: `Subscriptions (${recurring.length})` },
              ] as const
            ).map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
 "relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors z-10 whitespace-nowrap",
                    isActive
                      ? "text-ink-900 dark:text-white font-semibold"
                      : "text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-chapter-tab-indicator"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm -z-10"
                    />
                  )}
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Tab 1: Overview & Safe-to-Spend Compass */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
          {/* Safe-to-Spend Compass Card */}
          <div className="apple-inset-group shadow-apple-card p-6 space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                Safe-to-Spend Compass
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-secondary block">Daily Discretionary Allowance:</span>
                <span className="font-mono font-bold text-3xl text-accent block mt-1">
                  {formatCurrency(safeToSpend.safeDailySpend, currencySymbol, privacyMode)}
                  <span className="text-xs font-normal text-secondary"> /day</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-secondary">Remaining Allowance:</span>
                  <span className="font-bold text-ink-900 dark:text-ink-100">
                    {formatCurrency(safeToSpend.remainingAllowance, currencySymbol, privacyMode)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Committed Bills & Rent:</span>
                  <span className="text-apple-red">-{formatCurrency(fixedBills, currencySymbol, privacyMode)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">20% Goal Target:</span>
                  <span className="text-apple-orange">-{formatCurrency(savingsTarget, currencySymbol, privacyMode)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Days Remaining:</span>
                  <span className="font-bold">{daysRemainingInMonth} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Month Burn Pace & Activity Summary */}
          <div className="apple-inset-group shadow-apple-card p-6 space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <Clock className="w-5 h-5 text-apple-orange" />
              <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                Pace & Velocity
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-secondary block">Average Daily Burn Rate:</span>
                <span className="font-mono font-bold text-2xl text-ink-900 dark:text-ink-100 block mt-1">
                  {formatCurrency(summary.avgDailySpend, currencySymbol, privacyMode)}
                  <span className="text-xs font-normal text-secondary"> /day</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <span className="text-xs font-semibold text-ink-800 dark:text-ink-200 block">
                  Top Spending Categories:
                </span>
                <div className="space-y-1.5">
                  {categoryBreakdowns.slice(0, 3).map(c => (
                    <div key={c.category.id} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-secondary">{c.category.name}</span>
                      <span className="font-bold text-ink-900 dark:text-ink-100">
                        {formatCurrency(c.totalSpent, currencySymbol, privacyMode)} ({c.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Category Envelopes */}
      {activeTab === 'envelopes' && (
        <motion.div
          key="envelopes"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="apple-inset-group shadow-apple-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
              Category Envelope Breakdown
            </h3>
            <span className="text-xs text-secondary">
              {categoryBreakdowns.length} active spending envelopes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryBreakdowns.map(cat => (
              <div
                key={cat.category.id}
                className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.category.color }}
                    />
                    <span className="font-semibold text-xs text-ink-900 dark:text-ink-100">
                      {cat.category.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-ink-900 dark:text-ink-100">
                    {formatCurrency(cat.totalSpent, currencySymbol, privacyMode)}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.category.color,
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-secondary">
                  <span>{cat.transactionCount} transactions</span>
                  <span>{cat.percentage.toFixed(1)}% of budget</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Heatmap */}
      {activeTab === 'heatmap' && (
        <motion.div
          key="heatmap"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="apple-inset-group shadow-apple-card p-6 space-y-4"
        >
          <div className="pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
              Monthly Daily Spending Rhythm
            </h3>
          </div>
          <MoneyHeatmap yearMonthStr={selectedYearMonth} />
        </motion.div>
      )}

      {/* Tab 4: Subscriptions & Recurring Radar */}
      {activeTab === 'subscriptions' && (
        <motion.div
          key="subscriptions"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="apple-inset-group shadow-apple-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                Recurring Commitments & Subscriptions
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Total monthly commitment: {formatCurrency(fixedBills, currencySymbol, privacyMode)}
              </p>
            </div>

            <button
              onClick={() => setIsAddRecurringOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recurring</span>
            </button>
          </div>

          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {recurring.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-ink-900 dark:text-ink-100 block">
                    {item.name}
                  </span>
                  <span className="text-xs text-secondary">
                    Due every month on day {item.dayOfMonth}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-sm text-apple-red">
                    -{formatCurrency(item.amount, currencySymbol, privacyMode)}
                  </span>
                  <button
                    onClick={() => handleOpenEditRecurring(item)}
                    className="p-1 text-secondary hover:text-ink-900 dark:hover:text-ink-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRecurring(item.id)}
                    className="p-1 text-secondary hover:text-apple-red"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Add Recurring Modal */}
      <AnimatePresence>
        {isAddRecurringOpen && typeof document !== 'undefined' && createPortal(
          <div
            onClick={() => setIsAddRecurringOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-apple-float space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                  New Recurring Subscription
                </h3>
                <button
                  onClick={() => setIsAddRecurringOpen(false)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRecurring} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Name / Service
                  </label>
                  <input
                    type="text"
                    required
                    placeholder='e.g. "Rent", "Netflix", "Broadband", "Gym"'
                    value={recName}
                    onChange={e => setRecName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-ink-900 dark:text-ink-100 focus-ring"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Monthly Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0"
                      value={recAmount}
                      onChange={e => setRecAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Day of Month (1-31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={recDay}
                      onChange={e => setRecDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddRecurringOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-accent text-white rounded-xl shadow-sm"
                  >
                    Save Subscription
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Edit Recurring Modal */}
      <AnimatePresence>
        {editingRecurring && typeof document !== 'undefined' && createPortal(
          <div
            onClick={() => setEditingRecurring(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-apple-float space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                  Edit Subscription
                </h3>
                <button
                  onClick={() => setEditingRecurring(null)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditRecurring} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Name / Service
                  </label>
                  <input
                    type="text"
                    required
                    value={editRecName}
                    onChange={e => setEditRecName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-ink-900 dark:text-ink-100 focus-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Monthly Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editRecAmount}
                      onChange={e => setEditRecAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Day of Month (1-31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={editRecDay}
                      onChange={e => setEditRecDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecurring(null)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-accent text-white rounded-xl shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Printable Chapter Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <PrintableJournalModal
            defaultScope="month"
            onClose={() => setIsPrintModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

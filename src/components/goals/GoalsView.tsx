import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  Coins,
  DollarSign,
  Edit2,
  HeartHandshake,
  Minus,
  Paperclip,
  PiggyBank,
  Plane,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Vault,
  Watch,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/utils';
import { MoneyGoal } from '../../types';
import { sounds } from '../../lib/audioHaptics';

export const GoalsView: React.FC = () => {
  const {
    goals,
    accounts,
    privacyMode,
    currencySymbol,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
  } = useFinance();

  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<MoneyGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<MoneyGoal | null>(null);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<MoneyGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAccount, setContributionAccount] = useState(accounts[0]?.id || '');

  // New Goal State
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalCategory, setGoalCategory] = useState('Savings');
  const [goalNotes, setGoalNotes] = useState('');

  // Edit Goal State
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalCurrent, setEditGoalCurrent] = useState('');
  const [editGoalDate, setEditGoalDate] = useState('');
  const [editGoalCategory, setEditGoalCategory] = useState('Savings');
  const [editGoalNotes, setEditGoalNotes] = useState('');

  const totalSavedInGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTargetInGoals = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(goalTarget);
    if (!goalName.trim() || isNaN(targetNum) || targetNum <= 0) return;

    await addGoal({
      name: goalName.trim(),
      targetAmount: targetNum,
      targetDate: goalDate || '2026-12-31',
      category: goalCategory,
      color: '#5856D6',
      icon: 'Target',
      notes: goalNotes.trim() || undefined,
    });

    setGoalName('');
    setGoalTarget('');
    setGoalDate('');
    setGoalNotes('');
    setIsCreatingGoal(false);
  };

  const handleOpenEdit = (g: MoneyGoal) => {
    setEditingGoal(g);
    setEditGoalName(g.name);
    setEditGoalTarget(g.targetAmount.toString());
    setEditGoalCurrent(g.currentAmount.toString());
    setEditGoalDate(g.targetDate);
    setEditGoalCategory(g.category);
    setEditGoalNotes(g.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editGoalName.trim()) return;

    const targetNum = parseFloat(editGoalTarget);
    const curNum = parseFloat(editGoalCurrent);
    if (isNaN(targetNum) || targetNum <= 0) return;

    await updateGoal(editingGoal.id, {
      name: editGoalName.trim(),
      targetAmount: targetNum,
      currentAmount: isNaN(curNum) ? editingGoal.currentAmount : curNum,
      targetDate: editGoalDate || editingGoal.targetDate,
      category: editGoalCategory || editingGoal.category,
      notes: editGoalNotes.trim() || undefined,
    });

    setEditingGoal(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;
    await deleteGoal(deletingGoal.id);
    setDeletingGoal(null);
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForContribution) return;
    const amountNum = parseFloat(contributionAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !contributionAccount) return;

    sounds.playCoinChime();

    await contributeToGoal(selectedGoalForContribution.id, amountNum, contributionAccount);

    const newTotal = selectedGoalForContribution.currentAmount + amountNum;
    const isCompleted = newTotal >= selectedGoalForContribution.targetAmount;

    // Reserved for the moment the jar is actually filled. Firing on every
    // contribution spends the celebration on routine, and then reaching the
    // goal feels like nothing at all.
    if (isCompleted) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.8 },
        colors: ['#007AFF', '#34C759', '#FF9500', '#AF52DE'],
      });
    }

    setContributionAmount('');
    setSelectedGoalForContribution(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Apple-Grade Goals Hero Card */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wide text-secondary font-semibold block">
              Savings jars
            </span>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight mt-0.5">
              Total Stashed: {formatCurrency(totalSavedInGoals, currencySymbol, privacyMode)}
            </h1>
          </div>

          <button
            onClick={() => setIsCreatingGoal(true)}
            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Money Jar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-xs text-secondary block">Total Funded</span>
            <span className="font-mono font-bold text-base sm:text-lg text-accent block mt-0.5">
              {formatCurrency(totalSavedInGoals, currencySymbol, privacyMode)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-xs text-secondary block">Target Aggregation</span>
            <span className="font-mono font-bold text-base sm:text-lg text-ink-900 dark:text-ink-100 block mt-0.5">
              {formatCurrency(totalTargetInGoals, currencySymbol, privacyMode)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] col-span-2 sm:col-span-1">
            <span className="text-xs text-secondary block">Active Goals</span>
            <span className="font-mono font-bold text-base sm:text-lg text-ink-900 dark:text-ink-100 block mt-0.5">
              {goals.length} Jars
            </span>
          </div>
        </div>
      </div>

      {/* Jars Grid / Empty State */}
      {goals.length === 0 ? (
        <div className="apple-inset-group p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-apple-blue/10 text-accent flex items-center justify-center mx-auto text-2xl">
            🍯
          </div>
          <h3 className="font-sans font-semibold text-lg text-ink-900 dark:text-ink-100">
            No savings jars yet
          </h3>
          <p className="font-sans text-xs text-secondary max-w-sm mx-auto">
            Create dedicated visual envelopes to stash money towards future dreams (Diwali, emergency fund, vacation, new tech).
          </p>
          <button
            onClick={() => setIsCreatingGoal(true)}
            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Money Jar</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="apple-inset-group shadow-apple-card hover:shadow-apple-float transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-apple-blue/15 text-accent flex items-center justify-center font-bold text-base">
                        🍯
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-secondary block font-semibold">
                          {goal.category}
                        </span>
                        <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100 leading-tight">
                          {goal.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-lg text-secondary hover:text-ink-900 dark:hover:text-ink-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="p-1.5 rounded-lg text-secondary hover:text-apple-red hover:bg-apple-red/10 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Gauge */}
                  <div className="my-4 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-2.5">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xs font-mono uppercase text-secondary block">Stashed</span>
                        <span className="font-mono font-bold text-xl text-ink-900 dark:text-ink-100">
                          {formatCurrency(goal.currentAmount, currencySymbol, privacyMode)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono uppercase text-secondary block">Target</span>
                        <span className="font-mono font-bold text-xs text-secondary">
                          {formatCurrency(goal.targetAmount, currencySymbol, privacyMode)}
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-apple-blue to-apple-indigo transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-secondary">
                      <span>{pct}% Funded</span>
                      <span>{formatCurrency(remaining, currencySymbol, privacyMode)} to go</span>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="font-sans text-xs text-secondary italic mb-4">
 "{goal.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-secondary">
                    Target: {goal.targetDate}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedGoalForContribution(goal);
                      setContributionAmount('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold flex items-center space-x-1 shadow-sm transition-all active:scale-95"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Feed Jar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feed Jar Drawer / Contribution Modal */}
      <AnimatePresence>
        {selectedGoalForContribution && typeof document !== 'undefined' && createPortal(
          <div
            onClick={() => setSelectedGoalForContribution(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-apple-float space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                    Feed "{selectedGoalForContribution.name}"
                  </h3>
                  <span className="text-xs text-secondary">Deposit savings into jar</span>
                </div>
                <button
                  onClick={() => setSelectedGoalForContribution(null)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick-tap Presets with Spring */}
              <div className="flex items-center justify-between gap-1.5">
                {[500, 1000, 2000, 5000].map(amt => (
                  <motion.button
                    key={amt}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setContributionAmount(amt.toString())}
                    className="px-2.5 py-1 text-xs font-mono font-semibold rounded-xl bg-black/5 dark:bg-white/10 hover:bg-apple-blue/15 hover:text-accent transition-colors flex-1"
                  >
                    +{amt}
                  </motion.button>
                ))}
              </div>

              <form onSubmit={handleContribute} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Deposit Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={contributionAmount}
                    onChange={e => setContributionAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Source Account
                  </label>
                  <select
                    value={contributionAccount}
                    onChange={e => setContributionAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs text-ink-900 dark:text-ink-100 focus-ring cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, currencySymbol, privacyMode)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGoalForContribution(null)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-accent text-white rounded-xl shadow-sm"
                  >
                    Deposit Funds
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Create Goal Modal */}
      <AnimatePresence>
        {isCreatingGoal && typeof document !== 'undefined' && createPortal(
          <div
            onClick={() => setIsCreatingGoal(false)}
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
                  New Money Jar
                </h3>
                <button
                  onClick={() => setIsCreatingGoal(false)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Goal / Dream Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder='e.g. "Diwali Fund", "Emergency Buffer", "Goa Trip"'
                    value={goalName}
                    onChange={e => setGoalName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-ink-900 dark:text-ink-100 focus-ring"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Target Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="50000"
                      value={goalTarget}
                      onChange={e => setGoalTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goalDate}
                      onChange={e => setGoalDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Intention / Motivation Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder='e.g. "For peaceful sleep without financial anxiety"'
                    value={goalNotes}
                    onChange={e => setGoalNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-ink-900 dark:text-ink-100 focus-ring"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingGoal(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-accent text-white rounded-xl shadow-sm"
                  >
                    Create Jar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Edit Goal Modal */}
      <AnimatePresence>
        {editingGoal && typeof document !== 'undefined' && createPortal(
          <div
            onClick={() => setEditingGoal(null)}
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
                  Edit Money Jar
                </h3>
                <button
                  onClick={() => setEditingGoal(null)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editGoalName}
                    onChange={e => setEditGoalName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-ink-900 dark:text-ink-100 focus-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Target Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editGoalTarget}
                      onChange={e => setEditGoalTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Current Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editGoalCurrent}
                      onChange={e => setEditGoalCurrent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 focus-ring"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
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

      {/* Delete Goal Modal */}
      <AnimatePresence>
        {deletingGoal && typeof document !== 'undefined' && createPortal(
          <div
            onClick={() => setDeletingGoal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-red/30 shadow-apple-float space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-apple-red/15 text-apple-red flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                  Delete "{deletingGoal.name}"?
                </h3>
                <p className="text-xs text-secondary mt-1">
                  This will remove the goal envelope. Sinking reserve transactions will be retained in your ledger history.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setDeletingGoal(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-xs font-semibold bg-apple-red hover:bg-apple-red/90 text-white rounded-xl shadow-sm"
                >
                  Delete Jar
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
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
      color: '#C07D2B',
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

    // Play tactile coin chime
    sounds.playCoinChime();

    await contributeToGoal(selectedGoalForContribution.id, amountNum, contributionAccount);

    // Confetti celebration
    const newTotal = selectedGoalForContribution.currentAmount + amountNum;
    const isCompleted = newTotal >= selectedGoalForContribution.targetAmount;

    confetti({
      particleCount: isCompleted ? 80 : 45,
      spread: isCompleted ? 90 : 65,
      origin: { y: 0.8 },
      colors: ['#C07D2B', '#2A6F4E', '#235789', '#D4AF37'],
    });

    setContributionAmount('');
    setSelectedGoalForContribution(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Header & Goal Progress Vitals */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-paper-50 dark:bg-paper-dark-card p-6 rounded-2xl border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-archival-ochre font-bold">
            Sinking Funds & Envelopes
          </span>
          <h1 className="font-serif font-bold text-3xl text-ink-900 dark:text-ink-100 mt-1">
            Money Jars & Dreams
          </h1>
          <p className="text-xs font-sans text-ink-600 dark:text-ink-400 mt-0.5">
            Dedicated physical envelopes and sinking jars for future milestones.
          </p>
        </div>

        <div className="flex items-center space-x-6 bg-paper-100 dark:bg-paper-dark p-4 rounded-xl border border-paper-300 dark:border-paper-dark-border">
          <div>
            <span className="text-[11px] font-mono text-ink-500 block">Total Stashed in Jars</span>
            <span className="font-mono font-bold text-xl text-archival-ochre">
              {formatCurrency(totalSavedInGoals, currencySymbol, privacyMode)}
            </span>
          </div>
          <div className="border-l border-paper-300 dark:border-paper-dark-border pl-4 space-y-0.5 text-xs font-mono">
            <span className="text-ink-500 block">Target Aggregation:</span>
            <span className="font-semibold text-ink-800 dark:text-ink-200">
              {formatCurrency(totalTargetInGoals, currencySymbol, privacyMode)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreatingGoal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-paper-200 text-paper-50 dark:text-ink-900 text-xs font-sans font-semibold flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Money Jar</span>
        </button>
      </div>

      {/* Money Jars Grid / Empty State */}
      {goals.length === 0 ? (
        <div className="p-12 text-center bg-paper-50 dark:bg-paper-dark-card rounded-2xl border-2 border-dashed border-paper-300 dark:border-paper-dark-border space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-archival-ochre/15 text-archival-ochre flex items-center justify-center mx-auto text-3xl">
            🍯
          </div>
          <h3 className="font-serif italic text-2xl text-ink-900 dark:text-ink-100">
            No Money Jars or Sinking Envelopes yet.
          </h3>
          <p className="font-sans text-xs text-ink-500 max-w-md mx-auto leading-relaxed">
            Create dedicated visual envelopes to stash money towards milestone dreams (e.g. Diwali celebrations, emergency reserve, Goa trip, new gadget).
          </p>
          <button
            onClick={() => setIsCreatingGoal(true)}
            className="px-4 py-2 rounded-lg bg-archival-ochre hover:bg-archival-ochre/90 text-paper-50 text-xs font-mono font-semibold inline-flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Money Jar</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="relative p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger hover:shadow-ledger-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Jar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-xl bg-archival-ochre/15 text-archival-ochre flex items-center justify-center font-bold">
                        🍯
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400 block">
                          {goal.category}
                        </span>
                        <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100 leading-tight">
                          {goal.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label={`Edit ${goal.name} Goal`}
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="p-1.5 rounded text-ink-400 hover:text-archival-red transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label={`Remove ${goal.name} Goal`}
                        title="Remove Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Apothecary Liquid / Glass Visual */}
                  <div className="my-5 p-4 rounded-xl bg-paper-100/80 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border relative overflow-hidden">
                    <div className="flex items-end justify-between relative z-10">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-ink-400 block">Filled Amount</span>
                        <span className="font-mono font-bold text-xl text-ink-900 dark:text-ink-100">
                          {formatCurrency(goal.currentAmount, currencySymbol, privacyMode)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-ink-400 block">Target</span>
                        <span className="font-mono font-bold text-sm text-ink-600 dark:text-ink-400">
                          {formatCurrency(goal.targetAmount, currencySymbol, privacyMode)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Gauge */}
                    <div className="mt-3 h-3 w-full rounded-full bg-paper-300/60 dark:bg-paper-dark-border overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-archival-ochre to-archival-brass transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-ink-500">
                      <span>{pct}% Funded</span>
                      <span>{formatCurrency(remaining, currencySymbol, privacyMode)} to go</span>
                    </div>

                    {/* Milestone Delight Badge */}
                    <div className="mt-2 pt-2 border-t border-paper-200/60 dark:border-paper-dark-border flex items-center justify-between text-xs">
                      {pct >= 100 ? (
                        <span className="rubber-stamp stamp-reconciled text-[10px]">
                          ✓ Goal Fully Filled! 🍯
                        </span>
                      ) : pct >= 75 ? (
                        <span className="font-handwriting text-xs text-archival-ochre">
                          ✎ "Almost at the finish line!"
                        </span>
                      ) : pct >= 50 ? (
                        <span className="font-handwriting text-xs text-archival-green">
                          ✎ "Halfway there — steady reserve!"
                        </span>
                      ) : pct >= 25 ? (
                        <span className="font-handwriting text-xs text-ink-500 dark:text-ink-400">
                          ✎ "Solid start, grain by grain"
                        </span>
                      ) : (
                        <span className="font-handwriting text-xs text-ink-400">
                          ✎ "Every coin counts"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Handwritten Note / Intention */}
                  {goal.notes && (
                    <p className="font-handwriting text-sm text-ink-600 dark:text-ink-300 italic mb-4">
                      "{goal.notes}"
                    </p>
                  )}
                </div>

                {/* Jar Bottom Actions */}
                <div className="pt-3 border-t border-paper-200 dark:border-paper-dark-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-400">
                    Target: {goal.targetDate}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedGoalForContribution(goal);
                      setContributionAmount('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-archival-ochre hover:bg-archival-ochre/90 text-paper-50 text-xs font-mono font-semibold flex items-center space-x-1 shadow-sm transition-all active:scale-95"
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

      {/* Feed Jar Contribution Modal */}
      {selectedGoalForContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border p-5 space-y-4">
            <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
              Feed Jar: {selectedGoalForContribution.name}
            </h3>
            <p className="text-xs font-sans text-ink-600">
              Allocate funds directly from one of your accounts into this goal envelope.
            </p>

            <form onSubmit={handleContribute} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Source Account</label>
                <select
                  value={contributionAccount}
                  onChange={e => setContributionAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs border border-paper-300"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({currencySymbol}{a.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">
                  Contribution Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  inputMode="decimal"
                  placeholder="0.00"
                  value={contributionAmount}
                  onChange={e => setContributionAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-sm font-mono border border-paper-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300">
                <button
                  type="button"
                  onClick={() => setSelectedGoalForContribution(null)}
                  className="px-3 py-1.5 text-xs text-ink-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
                  className="px-4 py-1.5 bg-archival-ochre text-paper-50 text-xs font-semibold rounded"
                >
                  Deposit into Jar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
                Edit Money Jar
              </h3>
              <button onClick={() => setEditingGoal(null)} className="p-1 text-ink-400 hover:text-ink-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-ink-600 mb-1">Jar Name</label>
                <input
                  type="text"
                  required
                  value={editGoalName}
                  onChange={e => setEditGoalName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 border border-paper-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-ink-600 mb-1">
                    Target ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editGoalTarget}
                    onChange={e => setEditGoalTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 font-mono border border-paper-300"
                  />
                </div>
                <div>
                  <label className="block font-mono text-ink-600 mb-1">
                    Current Filled ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editGoalCurrent}
                    onChange={e => setEditGoalCurrent(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 font-mono border border-paper-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-ink-600 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={editGoalDate}
                    onChange={e => setEditGoalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 border border-paper-300"
                  />
                </div>
                <div>
                  <label className="block font-mono text-ink-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={editGoalCategory}
                    onChange={e => setEditGoalCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-paper-100 border border-paper-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-ink-600 mb-1">Notes / Intention</label>
                <textarea
                  rows={2}
                  value={editGoalNotes}
                  onChange={e => setEditGoalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 font-handwriting text-sm border border-paper-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-3 py-1.5 text-ink-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ink-900 text-paper-50 font-semibold rounded"
                >
                  Save Jar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal Confirmation Modal */}
      {deletingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border border-archival-red/40 p-5 space-y-4">
            <div className="flex items-center space-x-2 text-archival-red">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg">
                Delete Jar: {deletingGoal.name}?
              </h3>
            </div>
            <p className="text-xs font-sans text-ink-600">
              Are you sure you want to delete this money jar? Past ledger contributions will remain in your transaction records.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-paper-300">
              <button
                type="button"
                onClick={() => setDeletingGoal(null)}
                className="px-3 py-1.5 text-xs text-ink-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-archival-red text-paper-50 text-xs font-semibold rounded"
              >
                Yes, Delete Jar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      {isCreatingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border p-5 space-y-4">
            <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
              Create New Sinking Fund / Money Jar
            </h3>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Jar Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Fund, Emergency Buffer, Goa Trip, New MacBook"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs border border-paper-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">
                  Target Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  inputMode="decimal"
                  placeholder="25000.00"
                  value={goalTarget}
                  onChange={e => setGoalTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs font-mono border border-paper-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={e => setGoalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs border border-paper-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Festival, Travel, Safety, Tech"
                  value={goalCategory}
                  onChange={e => setGoalCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs border border-paper-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Notes & Inspiration</label>
                <textarea
                  rows={2}
                  placeholder="Why is this goal meaningful to you?"
                  value={goalNotes}
                  onChange={e => setGoalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs font-handwriting text-sm border border-paper-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300">
                <button
                  type="button"
                  onClick={() => setIsCreatingGoal(false)}
                  className="px-3 py-1.5 text-xs text-ink-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ink-900 text-paper-50 text-xs font-semibold rounded"
                >
                  Create Jar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

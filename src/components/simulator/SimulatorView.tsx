import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Coins,
  FastForward,
  HelpCircle,
  PiggyBank,
  Repeat,
  Sliders,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/utils';

export const SimulatorView: React.FC = () => {
  const {
    goals,
    transactions,
    accounts,
    recurring,
    privacyMode,
    currencySymbol,
  } = useFinance();

  // Simulation Sliders
  const [expenseReduction, setExpenseReduction] = useState(150);
  const [additionalIncome, setAdditionalIncome] = useState(0);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');

  // Calculate baseline monthly savings from last 30 days
  const recentMonthExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentMonthIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 3500;

  const baselineSavings = Math.max(0, recentMonthIncome - recentMonthExpenses);
  const simulatedMonthlySavings = baselineSavings + expenseReduction + additionalIncome;

  const selectedGoal = goals.find(g => g.id === selectedGoalId) || goals[0];
  const goalRemaining = selectedGoal ? Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount) : 0;

  const baselineMonthsToGoal = baselineSavings > 0 ? (goalRemaining / baselineSavings) : 999;
  const simulatedMonthsToGoal = simulatedMonthlySavings > 0 ? (goalRemaining / simulatedMonthlySavings) : 999;

  const monthsSaved = Math.max(0, baselineMonthsToGoal - simulatedMonthsToGoal);

  // 1-Year & 3-Year Projections
  const oneYearAdditionalWealth = (expenseReduction + additionalIncome) * 12;
  const threeYearAdditionalWealth = (expenseReduction + additionalIncome) * 36;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="bg-paper-50 dark:bg-paper-dark-card p-6 rounded-2xl border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-mono tracking-widest text-archival-ochre font-bold">
            Predictive Decision Modeling
          </span>
          <span className="text-paper-400">•</span>
          <span className="text-xs font-mono text-ink-500">
            Pencil & Math Sandbox
          </span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-ink-900 dark:text-ink-100 mt-1">
          "What-If" Scenario Simulator
        </h1>
        <p className="text-xs font-sans text-ink-600 dark:text-ink-400 mt-0.5">
          Model how micro-adjustments in daily tea, dining out, or freelance income compound your long-term freedom.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Simulation Sliders */}
        <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-paper-300 dark:border-paper-dark-border">
            <Sliders className="w-4 h-4 text-archival-ochre" />
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
              Scenario Levers
            </h3>
          </div>

          {/* Lever 1: Discretionary Expense Trim */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-ink-700 dark:text-ink-300">Monthly Expense Reduction:</span>
              <span className="font-bold text-archival-green text-sm">
                +{currencySymbol}{expenseReduction}/mo
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="25"
              value={expenseReduction}
              onChange={e => setExpenseReduction(parseInt(e.target.value, 10))}
              className="w-full accent-archival-green cursor-pointer"
            />
            <p className="text-[11px] font-mono text-ink-400">
              e.g. Making tea/coffee at home, cancelling 2 unused subscriptions, packing lunch twice a week.
            </p>
          </div>

          {/* Lever 2: Side Inflow / Income Boost */}
          <div className="space-y-2 pt-2 border-t border-paper-200 dark:border-paper-dark-border">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-ink-700 dark:text-ink-300">Additional Side Income:</span>
              <span className="font-bold text-archival-blue text-sm">
                +{currencySymbol}{additionalIncome}/mo
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={additionalIncome}
              onChange={e => setAdditionalIncome(parseInt(e.target.value, 10))}
              className="w-full accent-archival-blue cursor-pointer"
            />
            <p className="text-[11px] font-mono text-ink-400">
              e.g. Weekend consulting, craft sales, dividends.
            </p>
          </div>

          {/* Lever 3: Target Money Jar */}
          {goals.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-paper-200 dark:border-paper-dark-border">
              <label className="block text-xs font-mono text-ink-700 dark:text-ink-300">
                Target Sinking Jar:
              </label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
              >
                {goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({currencySymbol}{g.targetAmount.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Live Math Results & Projections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestone Acceleration Banner */}
          {selectedGoal && (
            <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
              <div className="flex items-center space-x-2 mb-3">
                <FastForward className="w-5 h-5 text-archival-ochre" />
                <span className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
                  Milestone Acceleration Projection
                </span>
              </div>

              <div className="p-4 rounded-xl bg-archival-ochre/10 border border-archival-ochre/30 text-ink-900 dark:text-ink-100">
                <p className="font-serif text-lg leading-snug">
                  By putting an extra{' '}
                  <strong className="font-mono text-archival-ochre">
                    {currencySymbol}{expenseReduction + additionalIncome}/month
                  </strong>{' '}
                  towards your{' '}
                  <strong>"{selectedGoal.name}"</strong>:
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-paper-50 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                    <span className="text-[10px] text-ink-400 block">Original Estimated Time</span>
                    <span className="font-bold text-sm text-ink-700 dark:text-ink-300">
                      {baselineMonthsToGoal < 99 ? `${baselineMonthsToGoal.toFixed(1)} months` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-paper-50 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                    <span className="text-[10px] text-ink-400 block">Simulated Fast-Track</span>
                    <span className="font-bold text-sm text-archival-green">
                      {simulatedMonthsToGoal < 99 ? `${simulatedMonthsToGoal.toFixed(1)} months` : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-archival-green/20 border border-archival-green/40 text-archival-green font-bold text-xs flex items-center space-x-1">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {monthsSaved > 0
                        ? `Accelerated by ${monthsSaved.toFixed(1)} full months!`
                        : 'Boost your monthly levers above'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compound Wealth Horizon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
              <span className="text-[11px] font-mono uppercase text-ink-500 block">
                1-Year Compounded Delta
              </span>
              <span className="font-mono font-bold text-2xl text-archival-green mt-1 block">
                +{formatCurrency(oneYearAdditionalWealth, currencySymbol, privacyMode)}
              </span>
              <p className="text-[11px] font-mono text-ink-400 mt-1">
                Pure additional savings retained in your vaults over the next 12 months.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
              <span className="text-[11px] font-mono uppercase text-ink-500 block">
                3-Year Long-Term Horizon
              </span>
              <span className="font-mono font-bold text-2xl text-archival-ochre mt-1 block">
                +{formatCurrency(threeYearAdditionalWealth, currencySymbol, privacyMode)}
              </span>
              <p className="text-[11px] font-mono text-ink-400 mt-1">
                Enough to fully fund major life goals or emergency safety cushions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

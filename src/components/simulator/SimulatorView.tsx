import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Target,
  TrendingUp,
  Zap,
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
  const [expenseReduction, setExpenseReduction] = useState(250);
  const [additionalIncome, setAdditionalIncome] = useState(0);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');

  // Calculate baseline monthly savings from last 30 days
  const recentMonthExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentMonthIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 4000;

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
  const monthlyTotalBoost = expenseReduction + additionalIncome;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Apple-Grade Simulator Hero Card */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-ink-400 dark:text-ink-500 font-semibold block">
            Predictive Decision Modeling
          </span>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight mt-0.5">
            "What-If" Scenario Sandbox
          </h1>
          <p className="text-xs text-ink-500 max-w-xl mt-1">
            Simulate how daily habit tweaks, dining adjustments, or side income compound into significant long-term wealth.
          </p>
        </div>

        {/* Hero Projection Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">Monthly Capital Boost</span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-apple-green block mt-0.5">
              +{formatCurrency(monthlyTotalBoost, currencySymbol, privacyMode)}/mo
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">1-Year Accumulated Alpha</span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-apple-blue block mt-0.5">
              +{formatCurrency(oneYearAdditionalWealth, currencySymbol, privacyMode)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">3-Year Compounding Horizon</span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-apple-indigo block mt-0.5">
              +{formatCurrency(threeYearAdditionalWealth, currencySymbol, privacyMode)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Interactive Levers */}
        <div className="apple-inset-group shadow-apple-card p-6 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <Sliders className="w-4 h-4 text-apple-blue" />
            <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
              Scenario Levers
            </h3>
          </div>

          {/* Lever 1: Discretionary Expense Trim */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-700 dark:text-ink-300">Expense Reduction:</span>
              <span className="font-mono font-bold text-apple-green text-sm">
                +{currencySymbol}{expenseReduction}/mo
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={expenseReduction}
              onChange={e => setExpenseReduction(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-black/10 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-apple-green"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[100, 250, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setExpenseReduction(amt)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                    expenseReduction === amt
                      ? 'bg-apple-green text-white border-apple-green font-bold'
                      : 'bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/5 text-ink-600 dark:text-ink-400 hover:bg-black/10'
                  }`}
                >
                  +{currencySymbol}{amt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 leading-relaxed">
              e.g. Canceling 2 subscriptions, dining out 1 less time/week, homemade coffee.
            </p>
          </div>

          {/* Lever 2: Side Income / Bonus Inflow */}
          <div className="space-y-2.5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-700 dark:text-ink-300">Side Hustle / Inflow:</span>
              <span className="font-mono font-bold text-apple-blue text-sm">
                +{currencySymbol}{additionalIncome}/mo
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={additionalIncome}
              onChange={e => setAdditionalIncome(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-black/10 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-apple-blue"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[500, 1500, 3000, 5000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAdditionalIncome(amt)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                    additionalIncome === amt
                      ? 'bg-apple-blue text-white border-apple-blue font-bold'
                      : 'bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/5 text-ink-600 dark:text-ink-400 hover:bg-black/10'
                  }`}
                >
                  +{currencySymbol}{amt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 leading-relaxed">
              e.g. Weekend consulting, marketplace sales, dividend reinvestments.
            </p>
          </div>

          {/* Lever 3: Target Goal */}
          {goals.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300">
                Target Sinking Jar:
              </label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs outline-none"
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

        {/* Right 2 Columns: Fast-Track & Timeline Visualizations */}
        <div className="lg:col-span-2 space-y-5">
          {/* Milestone Acceleration Card */}
          {selectedGoal ? (
            <div className="apple-inset-group shadow-apple-card p-6 space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                <FastForward className="w-5 h-5 text-apple-orange" />
                <div>
                  <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                    Goal Acceleration: {selectedGoal.name}
                  </h3>
                  <span className="text-xs font-mono text-ink-400">
                    Target: {formatCurrency(selectedGoal.targetAmount, currencySymbol)} • {formatCurrency(goalRemaining, currencySymbol)} remaining
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <p className="font-sans text-sm text-ink-800 dark:text-ink-200">
                  With your combined boost of{' '}
                  <strong className="font-mono text-apple-blue font-bold">
                    +{formatCurrency(monthlyTotalBoost, currencySymbol)}/month
                  </strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/10">
                    <span className="text-[10px] font-mono text-ink-400 block uppercase">Standard Pace</span>
                    <span className="font-mono font-bold text-base text-ink-700 dark:text-ink-300 block mt-0.5">
                      {baselineMonthsToGoal < 99 ? `${baselineMonthsToGoal.toFixed(1)} mo` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-apple-green/10 border border-apple-green/20">
                    <span className="text-[10px] font-mono text-apple-green block uppercase font-semibold">Fast-Track Pace</span>
                    <span className="font-mono font-bold text-base text-apple-green block mt-0.5">
                      {simulatedMonthsToGoal < 99 ? `${simulatedMonthsToGoal.toFixed(1)} mo` : '—'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-apple-blue/10 border border-apple-blue/20">
                    <span className="text-[10px] font-mono text-apple-blue block uppercase font-semibold">Time Saved</span>
                    <span className="font-mono font-bold text-base text-apple-blue block mt-0.5">
                      {monthsSaved > 0 ? `${monthsSaved.toFixed(1)} months` : '0 mo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="apple-inset-group p-6 text-center text-xs text-ink-400">
              Create a goal jar to calculate time-to-milestone acceleration.
            </div>
          )}

          {/* 3-Year Compounding Visual Comparison */}
          <div className="apple-inset-group shadow-apple-card p-6 space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <Sparkles className="w-5 h-5 text-apple-blue" />
              <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                Compound Trajectory Horizons
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-ink-500">Year 1 (+{formatCurrency(oneYearAdditionalWealth, currencySymbol)}):</span>
                  <span className="font-bold text-apple-green">{formatCurrency(oneYearAdditionalWealth, currencySymbol)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-apple-green" style={{ width: '33.3%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-ink-500">Year 2 (+{formatCurrency(oneYearAdditionalWealth * 2, currencySymbol)}):</span>
                  <span className="font-bold text-apple-blue">{formatCurrency(oneYearAdditionalWealth * 2, currencySymbol)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-apple-blue" style={{ width: '66.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-ink-500">Year 3 Compounded Total (+{formatCurrency(threeYearAdditionalWealth, currencySymbol)}):</span>
                  <span className="font-bold text-apple-indigo">{formatCurrency(threeYearAdditionalWealth, currencySymbol)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-apple-blue via-apple-indigo to-apple-purple" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Edit3,
  Feather,
  Plus,
  RotateCcw,
  Sparkles,
  Vault,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/utils';
import { parseNaturalLanguageInput } from '../../lib/nlpParser';

interface OnboardingGuideModalProps {
  onClose: () => void;
}

export const OnboardingGuideModal: React.FC<OnboardingGuideModalProps> = ({ onClose }) => {
  const {
    accounts,
    categories,
    currencySymbol,
    addTransaction,
    setIsQuickAddOpen,
  } = useFinance();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [sandboxInput, setSandboxInput] = useState('chai 15 cash morning');
  const [hasTestedLog, setHasTestedLog] = useState(false);

  const parsedSandbox = parseNaturalLanguageInput(sandboxInput, accounts, categories);

  const handleTestLogging = async () => {
    if (parsedSandbox.amount > 0 && parsedSandbox.description) {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        description: parsedSandbox.description,
        amount: parsedSandbox.amount,
        type: parsedSandbox.type,
        accountId: parsedSandbox.accountId || accounts[0]?.id || 'acc-1',
        categoryId: parsedSandbox.categoryId || categories[0]?.id || 'cat-1',
        notes: parsedSandbox.notes,
        tags: parsedSandbox.tags,
        reconciled: true,
      });
      setHasTestedLog(true);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('spendit_onboarding_completed', 'true');
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-150"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        className="max-w-xl w-full bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple-float border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Header & Step Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="SpendIt Logo"
                className="w-8 h-8 rounded-xl object-contain shadow-sm"
              />
              <div>
                <span className="text-xs uppercase tracking-wide text-secondary">
                  SpendIt Welcome
                </span>
                <h2 className="font-sans font-bold text-xl text-ink-900 dark:text-ink-100">
                  Welcome to SpendIt Folio
                </h2>
              </div>
            </div>

            <button aria-label="Skip the guide"
              onClick={handleFinish}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all ${
                  step === currentStep
                    ? 'w-8 bg-accent'
                    : step < currentStep
                    ? 'w-4 bg-apple-blue/40'
                    : 'w-4 bg-black/10 dark:bg-white/15'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Physical Ledger Metaphor */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-apple-blue/15 text-accent flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-sans font-bold text-sm text-ink-900 dark:text-ink-100">
                    Your Personal Financial Ledger
                  </h3>
                </div>
                <p className="text-sm text-secondary leading-relaxed">
                  SpendIt gives you complete data sovereignty with an offline-first SQLite database. No cloud accounts, no subscriptions, no tracking.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="font-bold text-ink-900 dark:text-ink-100 block">Daily Folio</span>
                  <span className="text-secondary text-xs mt-0.5 block">Log transactions and reflections day by day.</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="font-bold text-ink-900 dark:text-ink-100 block">Safe-to-Spend</span>
                  <span className="text-secondary text-xs mt-0.5 block">Live compass calculating remaining daily budget.</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Interactive Shorthand Logging Sandbox */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-apple-blue/10 border border-apple-blue/20 text-xs">
                <span className="font-bold text-accent block">Interactive Shorthand Sandbox</span>
                <span className="text-ink-700 dark:text-ink-300 mt-1 block">
                  Type naturally using merchant, amount, account, and time of day.
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={sandboxInput}
                  onChange={e => setSandboxInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs font-mono focus-ring"
                  placeholder='e.g. "chai 15 cash morning"'
                />

                {/* Live parsed preview */}
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-xs font-mono flex items-center justify-between">
                  <div>
                    <span className="text-xs text-secondary block">Parsed Description:</span>
                    <span className="font-bold text-ink-900 dark:text-ink-100">{parsedSandbox.description || '—'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-secondary block">Parsed Amount:</span>
                    <span className="font-bold text-apple-green">{formatCurrency(parsedSandbox.amount, currencySymbol)}</span>
                  </div>
                </div>
              </div>

              <button aria-label="Add"
                type="button"
                onClick={handleTestLogging}
                disabled={hasTestedLog}
                className="w-full py-2.5 rounded-xl bg-accent text-white font-sans text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                {hasTestedLog ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Logged to Today's Folio!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Try Recording Entry</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Sovereign Storage & Offline Export */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="flex items-center space-x-2">
                  <Vault className="w-4 h-4 text-apple-green" />
                  <span className="font-bold text-xs text-ink-900 dark:text-ink-100">
                    Your data stays on this device
                  </span>
                </div>
                <p className="text-sm text-secondary leading-relaxed">
                  Your finances stay strictly on this device. You can export complete JSON backups anytime or generate vector PDF print folios for your physical binder.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-xs space-y-1.5">
                <span className="font-bold text-ink-900 dark:text-ink-100 block">Keyboard Shortcuts Quick-Card:</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-secondary">
                  <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">N</kbd> Log Entry</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">P</kbd> Privacy Mask</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">T</kbd> Jump to Today</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">← / →</kbd> Prev/Next Day</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="px-5 py-2.5 rounded-xl bg-accent text-white font-sans text-xs font-semibold flex items-center space-x-1 shadow-sm transition-all"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-accent text-white font-sans text-xs font-semibold shadow-sm transition-all"
              >
                Start Journaling
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

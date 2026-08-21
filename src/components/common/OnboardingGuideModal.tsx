import React, { useState } from 'react';
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
  const [sandboxInput, setSandboxInput] = useState('chai 15 cash');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border-2 border-paper-400 dark:border-paper-dark-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Leather Spine Header */}
        <div className="h-2 bg-gradient-to-r from-archival-brass via-archival-ochre to-archival-brass w-full"></div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Header & Step Counter */}
          <div className="flex items-start justify-between border-b border-paper-300 dark:border-paper-dark-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono tracking-widest text-archival-ochre font-bold">
                  Journal Initiation
                </span>
                <span className="text-paper-400">•</span>
                <span className="text-xs font-mono text-ink-500">
                  Step {currentStep} of 3
                </span>
              </div>
              <h2 className="font-serif font-bold text-2xl text-ink-900 dark:text-ink-100">
                {currentStep === 1 && 'Welcome to Your Financial Folio'}
                {currentStep === 2 && 'Lightning Shorthand Journaling'}
                {currentStep === 3 && 'The Daily Closing Ceremony'}
              </h2>
            </div>

            <button
              onClick={handleFinish}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 dark:hover:text-ink-200"
              aria-label="Close Onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 1: Core Concept & Starting Balances */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <p className="text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-relaxed font-serif">
                SpendIt is designed like a personal, leather-bound financial notebook. No SaaS dashboards, no cloud tracking. Every rupee you spend is journaled with double-entry integrity.
              </p>

              <div className="p-4 rounded-xl bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-ink-800 dark:text-ink-200 block">
                  Your Pre-Seeded Ledger Accounts:
                </span>
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  {accounts.slice(0, 4).map(acc => (
                    <div key={acc.id} className="p-2.5 rounded bg-paper-50 dark:bg-paper-dark-card border border-paper-200 dark:border-paper-dark-border">
                      <span className="text-ink-500 text-[11px] block">{acc.name}</span>
                      <span className="font-bold text-ink-900 dark:text-ink-100 block mt-0.5">
                        {formatCurrency(acc.balance, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-ink-500 italic">
                  You can edit names, initial balances, and add new banks anytime in Accounts.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Interactive Shorthand Sandbox */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <p className="text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
                Log entries in 3 seconds by typing naturally with Indian terms. Try editing the phrase below:
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={sandboxInput}
                  onChange={e => setSandboxInput(e.target.value)}
                  placeholder='e.g. "kirana 450 upi", "chai 15 cash", "rent 20k hdfc"'
                  className="w-full px-3.5 py-2.5 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 font-sans text-sm border-2 border-archival-ochre/60 focus:outline-none shadow-inner"
                  autoFocus
                />

                {/* Example Quick Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-mono text-ink-500 mr-1">Try:</span>
                  {['chai 15 cash morning', 'lunch 250 upi noon', 'coffee 180 12:23 pm', 'dinner 1200 hdfc night'].map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setSandboxInput(prompt)}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-200/80 dark:bg-paper-dark text-ink-700 dark:text-ink-300 hover:bg-paper-300 border border-paper-300 dark:border-paper-dark-border"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Live Shorthand Preview */}
                <div className="p-3.5 rounded-xl bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-archival-brass font-bold">
                    <span>⚡ Live Shorthand Parser</span>
                    <span>{parsedSandbox.amount > 0 ? '✓ Ready' : '• Type amount...'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-ink-400 block">Description</span>
                      <span className="font-semibold text-ink-900 dark:text-ink-100">{parsedSandbox.description || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 block">Amount</span>
                      <span className="font-bold text-archival-red">{formatCurrency(parsedSandbox.amount, currencySymbol)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 block">Account</span>
                      <span className="font-semibold text-ink-900 dark:text-ink-100">
                        {accounts.find(a => a.id === parsedSandbox.accountId)?.name || 'Cash'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 block">Time & Slot</span>
                      <span className="font-semibold text-ink-900 dark:text-ink-100">
                        {parsedSandbox.time || 'Now'}
                        {parsedSandbox.timeSlot && ` (${parsedSandbox.timeSlot.replace('_', ' ')})`}
                      </span>
                    </div>
                  </div>
                </div>

                {!hasTestedLog ? (
                  <button
                    onClick={handleTestLogging}
                    className="w-full py-2 bg-archival-ochre text-paper-50 font-mono text-xs font-bold rounded-lg hover:bg-archival-ochre/90 transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Sample Entry to Today's Ledger</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-lg bg-archival-green-light dark:bg-archival-green/20 border border-archival-green/40 text-archival-green text-xs font-mono text-center font-bold flex items-center justify-center space-x-1.5">
                    <Check className="w-4 h-4" />
                    <span>Sample entry recorded on Today's Folio!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: The Mindful Daily Closing Ceremony */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <p className="text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-relaxed font-serif">
                SpendIt turns budgeting into a mindful evening closing ceremony.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-ink-900 dark:text-ink-100">
                    <Edit3 className="w-4 h-4 text-archival-brass" />
                    <span>Margin Notes & Mood</span>
                  </div>
                  <p className="text-[11px] text-ink-500">
                    Record your mood, weather, and handwritten thoughts in Caveat cursive script on each day's folio page.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-paper-100 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-ink-900 dark:text-ink-100">
                    <span className="text-archival-red font-serif font-bold">✓</span>
                    <span>Wax Seal Verification</span>
                  </div>
                  <p className="text-[11px] text-ink-500">
                    Click <strong className="text-ink-800 dark:text-ink-200">[Seal Today's Page]</strong> at night to reconcile your records with a red wax stamp.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-paper-200/70 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border flex items-center justify-between text-xs font-mono">
                <span>Keyboard Shortcuts:</span>
                <div className="flex space-x-1.5 text-[10px]">
                  <kbd className="px-1.5 py-0.5 bg-paper-50 dark:bg-paper-dark-card border rounded font-bold">N: Log</kbd>
                  <kbd className="px-1.5 py-0.5 bg-paper-50 dark:bg-paper-dark-card border rounded font-bold">P: Mask</kbd>
                  <kbd className="px-1.5 py-0.5 bg-paper-50 dark:bg-paper-dark-card border rounded font-bold">T: Today</kbd>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-paper-300 dark:border-paper-dark-border">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-ink-600 hover:bg-paper-200 dark:hover:bg-paper-dark transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-4 py-2 rounded-lg text-xs font-mono text-ink-500 hover:text-ink-800 transition-colors"
              >
                Skip Guide
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="px-5 py-2 rounded-lg bg-ink-900 dark:bg-paper-100 text-paper-50 dark:text-ink-900 text-xs font-semibold flex items-center space-x-1.5 shadow-sm hover:opacity-90 transition-opacity"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-6 py-2 rounded-lg bg-archival-green text-paper-50 text-xs font-bold font-mono flex items-center space-x-1.5 shadow-sm hover:bg-archival-green/90 transition-colors"
              >
                <span>Open My Journal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

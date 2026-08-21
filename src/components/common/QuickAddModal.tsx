import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Clock, Plus, Sparkles, WalletMinimal } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useToast } from '../../context/ToastContext';
import { parseNaturalLanguageInput } from '../../lib/nlpParser';
import { getTodayString, formatCurrency } from '../../lib/utils';
import { TransactionType } from '../../types';
import { Modal } from '../ui/Modal';
import { sounds } from '../../lib/audioHaptics';

const EXAMPLE_PROMPTS = ['chai 15 cash morning', 'kirana 450 upi noon', 'dinner 1200 hdfc 8:30pm'];

const TIME_SLOTS = [
  { label: 'Morning', hint: '6–8 AM', tag: 'morning' },
  { label: 'Noon', hint: '8 AM–2 PM', tag: 'noon' },
  { label: 'Evening', hint: '2–7 PM', tag: 'evening' },
  { label: 'Night', hint: '7–12 AM', tag: 'night' },
  { label: 'Late night', hint: '12–6 AM', tag: 'late night' },
];

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    accounts,
    categories,
    addTransaction,
    currentDiaryDate,
    currencySymbol,
    setActiveView,
  } = useFinance();

  const { success, error } = useToast();

  const [inputQuery, setInputQuery] = useState('');
  const [customDate, setCustomDate] = useState(currentDiaryDate);
  const [customTime, setCustomTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [showManualFields, setShowManualFields] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDraft, setSavedDraft] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // A ledger with no accounts cannot accept an entry at all. Say so up front
  // rather than letting the save fail against a NOT NULL foreign key.
  const hasLedgerSetup = accounts.length > 0 && categories.length > 0;

  useEffect(() => {
    if (isQuickAddOpen) {
      const draft = sessionStorage.getItem('spendit_draft_entry');
      if (draft && !inputQuery) {
        setSavedDraft(draft);
      }
      setFormError(null);
      setCustomDate(currentDiaryDate);
      setCustomTime(
        new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      );
    }
  }, [isQuickAddOpen, currentDiaryDate]);

  useEffect(() => {
    if (inputQuery) {
      sessionStorage.setItem('spendit_draft_entry', inputQuery);
    } else {
      sessionStorage.removeItem('spendit_draft_entry');
    }
  }, [inputQuery]);

  // Live NLP Parsing
  const parsed = useMemo(() => {
    return parseNaturalLanguageInput(inputQuery, accounts, categories);
  }, [inputQuery, accounts, categories]);

  // Editable overrides
  const [overrideType, setOverrideType] = useState<TransactionType | null>(null);
  const [overrideAccountId, setOverrideAccountId] = useState<string | null>(null);
  const [overrideDestAccountId, setOverrideDestAccountId] = useState<string | null>(null);
  const [overrideCategoryId, setOverrideCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!inputQuery) {
      setOverrideType(null);
      setOverrideAccountId(null);
      setOverrideDestAccountId(null);
      setOverrideCategoryId(null);
      setReceiptUrl(undefined);
    }
  }, [inputQuery]);

  const effectiveType = overrideType || parsed.type;
  const effectiveAccountId = overrideAccountId || parsed.accountId || accounts[0]?.id;
  const effectiveDestAccountId =
    overrideDestAccountId || parsed.destinationAccountId || accounts[1]?.id;
  const effectiveCategoryId = overrideCategoryId || parsed.categoryId || categories[0]?.id;
  const effectiveTime = parsed.time || customTime;

  const closeSheet = () => {
    setIsQuickAddOpen(false);
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!parsed.description) {
      setFormError('Add what this was for — try "chai 15 cash".');
      return;
    }
    if (!parsed.amount || parsed.amount <= 0) {
      setFormError('Add an amount above zero, like "chai 15".');
      return;
    }
    if (!effectiveAccountId || !effectiveCategoryId) {
      setFormError('Create an account before logging an entry.');
      return;
    }

    setIsSubmitting(true);

    let saved = false;
    try {
      await addTransaction({
        date: customDate || getTodayString(),
        time: effectiveTime,
        description: parsed.description,
        amount: parsed.amount,
        type: effectiveType,
        accountId: effectiveAccountId,
        destinationAccountId: effectiveType === 'transfer' ? effectiveDestAccountId : undefined,
        categoryId: effectiveCategoryId,
        tags: parsed.tags,
        notes: parsed.notes,
        receiptUrl: receiptUrl,
        reconciled: false,
      });
      saved = true;
    } catch (err) {
      // Never fail silently: the entry the user just typed is still in the box.
      const reason = err instanceof Error ? err.message : String(err);
      setFormError(`Could not save this entry. ${reason}`);
      error('Entry not saved', 'Your text is still here — try again.');
    } finally {
      setIsSubmitting(false);
    }

    if (!saved) return;

    sounds.playInkTap();
    success(
      `Logged ${formatCurrency(parsed.amount, currencySymbol)}`,
      parsed.description
    );

    setInputQuery('');
    setSavedDraft(null);
    sessionStorage.removeItem('spendit_draft_entry');
    setReceiptUrl(undefined);
    closeSheet();
  };

  const readyToSave = Boolean(parsed.amount && parsed.amount > 0 && parsed.description);

  return (
    <Modal
      open={isQuickAddOpen}
      onClose={closeSheet}
      title="Log new entry"
      subtitle="Type it the way you'd say it"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-apple-blue/12 text-accent flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" aria-hidden="true" />
        </div>
      }
      footer={
        hasLedgerSetup ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-secondary hidden sm:block">
              {readyToSave ? 'Press Enter to record' : 'Amount and description required'}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={closeSheet}
                className="px-4 py-2.5 text-sm font-semibold text-ink-700 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl focus-ring transition-colors"
              >
                Cancel
              </button>
              <button aria-label="Add"
                type="submit"
                form="quick-add-form"
                disabled={!readyToSave || isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold bg-accent text-white rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus-ring transition-all active:scale-[0.98] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{isSubmitting ? 'Recording…' : 'Record to ledger'}</span>
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      {!hasLedgerSetup ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-apple-blue/12 text-accent flex items-center justify-center mx-auto">
            <WalletMinimal className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
              Add an account first
            </h3>
            <p className="text-base text-secondary max-w-sm mx-auto">
              Every entry is recorded against an account, so there's a balance to update. Create
              one and this takes two seconds from then on.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              closeSheet();
              setActiveView('accounts');
            }}
            className="px-5 py-2.5 text-sm font-semibold bg-accent text-white rounded-xl focus-ring transition-colors"
          >
            Go to accounts
          </button>
        </div>
      ) : (
        <form id="quick-add-form" onSubmit={handleSave} className="space-y-5">
          {/* Main Prompt Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="quick-add-input" className="text-sm font-medium text-ink-700 dark:text-ink-300">
                What did you spend?
              </label>
              {savedDraft && !inputQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setInputQuery(savedDraft);
                    setSavedDraft(null);
                  }}
                  className="text-sm font-medium text-accent hover:underline focus-ring rounded"
                >
                  ↺ Restore unsaved draft
                </button>
              )}
            </div>

            <input
              id="quick-add-input"
              ref={inputRef}
              data-autofocus
              type="text"
              value={inputQuery}
              onChange={e => {
                setInputQuery(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder='chai 15 cash morning'
              aria-invalid={formError ? true : undefined}
              aria-describedby={formError ? 'quick-add-error' : undefined}
              className="w-full px-4 py-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-lg text-ink-900 dark:text-ink-100 placeholder:text-secondary focus-ring font-sans"
              autoCapitalize="sentences"
              autoCorrect="off"
            />

            {formError && (
              <p
                id="quick-add-error"
                role="alert"
                className="text-sm font-medium text-apple-red"
              >
                {formError}
              </p>
            )}

            {/* Examples only while the box is empty — they are scaffolding, not chrome. */}
            {!inputQuery && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-sm text-secondary mr-0.5">Try</span>
                {EXAMPLE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setInputQuery(prompt);
                      inputRef.current?.focus();
                    }}
                    className="text-sm font-mono px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-apple-blue/12 hover:text-accent text-ink-700 dark:text-ink-300 focus-ring transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview — the amount is the number the user is checking. */}
          <div className="apple-inset-group p-4">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <span className="text-sm font-medium text-secondary">
                {parsed.description || 'Waiting for an entry'}
              </span>
              <span
                className={`text-sm font-medium shrink-0 ${
                  readyToSave ? 'text-apple-green' : 'text-secondary'
                }`}
              >
                {readyToSave ? 'Ready' : 'Incomplete'}
              </span>
            </div>

            <div className="flex items-end justify-between gap-4 flex-wrap">
              <span
                className={`text-4xl font-semibold tabular-nums tracking-tight ${
                  parsed.amount > 0 ? 'text-ink-900 dark:text-ink-100' : 'text-secondary'
                }`}
              >
                {parsed.amount > 0 ? formatCurrency(parsed.amount, currencySymbol) : '—'}
              </span>

              <dl className="flex items-center gap-5 text-sm">
                <div>
                  <dt className="text-secondary">Account</dt>
                  <dd className="font-medium text-ink-900 dark:text-ink-100">
                    {accounts.find(a => a.id === effectiveAccountId)?.name || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-secondary">Time</dt>
                  <dd className="font-medium tabular-nums text-ink-900 dark:text-ink-100">
                    {effectiveTime}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Progressive Disclosure: Manual Overrides */}
          <div>
            <button
              type="button"
              onClick={() => setShowManualFields(!showManualFields)}
              aria-expanded={showManualFields}
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline focus-ring rounded"
            >
              <span>{showManualFields ? 'Hide details' : 'Date, category, and time slot'}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showManualFields ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence initial={false}>
              {showManualFields && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="quick-add-date"
                          className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5"
                        >
                          Date
                        </label>
                        <input
                          id="quick-add-date"
                          type="date"
                          value={customDate}
                          onChange={e => setCustomDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-base text-ink-900 dark:text-ink-100 focus-ring"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="quick-add-category"
                          className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5"
                        >
                          Category
                        </label>
                        <select
                          id="quick-add-category"
                          value={effectiveCategoryId}
                          onChange={e => setOverrideCategoryId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-base text-ink-900 dark:text-ink-100 focus-ring"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <fieldset>
                      <legend className="flex items-center gap-1.5 text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                        <Clock className="w-4 h-4 text-secondary" aria-hidden="true" />
                        <span>Time slot</span>
                      </legend>
                      <div className="flex flex-wrap gap-1.5">
                        {TIME_SLOTS.map(slot => {
                          const active = parsed.timeSlot === slot.tag.replace(' ', '_');
                          return (
                            <button
                              key={slot.tag}
                              type="button"
                              aria-pressed={active}
                              onClick={() => {
                                const cleaned = inputQuery
                                  .replace(
                                    /\b(morning|noon|afternoon|evening|night|late\s*night|midnight)\b/gi,
                                    ''
                                  )
                                  .replace(/\s+/g, ' ')
                                  .trim();
                                setInputQuery(cleaned ? `${cleaned} ${slot.tag}` : slot.tag);
                                inputRef.current?.focus();
                              }}
                              className={`text-sm px-3 py-1.5 rounded-full border focus-ring transition-colors ${
                                active
                                  ? 'bg-accent text-white border-apple-blue font-semibold'
                                  : 'bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.08] text-ink-700 dark:text-ink-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
                              }`}
                            >
                              {slot.label}
                              <span className={active ? 'text-white/70' : 'text-secondary'}>
                                {' '}
                                {slot.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      )}
    </Modal>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRightLeft,
  Calendar,
  ChevronDown,
  Clock,
  Coins,
  Paperclip,
  Plus,
  PlusCircle,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { parseNaturalLanguageInput } from '../../lib/nlpParser';
import { getTodayString, formatCurrency } from '../../lib/utils';
import { TransactionType } from '../../types';
import { RecurringSuggester } from './RecurringSuggester';
import { sounds } from '../../lib/audioHaptics';

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    accounts,
    categories,
    addTransaction,
    currentDiaryDate,
    currencySymbol,
  } = useFinance();

  const [inputQuery, setInputQuery] = useState('');
  const [customDate, setCustomDate] = useState(currentDiaryDate);
  const [customTime, setCustomTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [showManualFields, setShowManualFields] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDraft, setSavedDraft] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      const draft = sessionStorage.getItem('spendit_draft_entry');
      if (draft && !inputQuery) {
        setSavedDraft(draft);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setCustomDate(currentDiaryDate);
      setCustomTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
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
  const effectiveDestAccountId = overrideDestAccountId || parsed.destinationAccountId || accounts[1]?.id;
  const effectiveCategoryId = overrideCategoryId || parsed.categoryId || categories[0]?.id;
  const effectiveTime = parsed.time || customTime;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.amount || parsed.amount <= 0 || !parsed.description) {
      return;
    }

    setIsSubmitting(true);
    try {
      sounds.playInkTap();

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

      setInputQuery('');
      setSavedDraft(null);
      sessionStorage.removeItem('spendit_draft_entry');
      setReceiptUrl(undefined);
      setIsQuickAddOpen(false);
    } catch (err) {
      console.error('Error logging entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const examplePrompts = [
    'chai 15 cash morning',
    'kirana 450 upi noon',
    'coffee 180 12:23 pm',
    'dinner 1200 hdfc 8:30pm',
    'cab 350 late night',
  ];

  return (
    <AnimatePresence>
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            className="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-apple-float overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Dynamic Sheet Header */}
            <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                    Log New Entry
                  </h2>
                  <span className="text-[11px] font-mono text-ink-400">Natural language shorthand</span>
                </div>
              </div>

              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Sheet Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Main Prompt Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-ink-700 dark:text-ink-300">
                  Type naturally:
                </label>
                {savedDraft && !inputQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputQuery(savedDraft);
                      setSavedDraft(null);
                    }}
                    className="text-apple-blue hover:underline font-mono text-[11px]"
                  >
                    ↺ Restore unsaved draft
                  </button>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder='e.g. "chai 15 cash morning", "lunch 250 upi noon", "coffee 180 12:23 pm"'
                className="w-full px-4 py-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-sm text-ink-900 dark:text-ink-100 outline-none focus:ring-2 focus:ring-apple-blue font-sans shadow-inner"
                autoCapitalize="sentences"
                autoCorrect="off"
              />
            </div>

            {/* Quick Suggestions Pills */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-ink-400 mr-1 self-center">Try:</span>
              {examplePrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInputQuery(prompt)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-apple-blue/15 hover:text-apple-blue transition-colors text-ink-700 dark:text-ink-300"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Time Slot Helper Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-ink-400 mr-1 flex items-center space-x-1 self-center">
                <Clock className="w-3 h-3 text-apple-blue" />
                <span>Slot:</span>
              </span>
              {[
                { label: 'Morning (6–8 AM)', tag: 'morning' },
                { label: 'Noon (8 AM–2 PM)', tag: 'noon' },
                { label: 'Evening (2–7 PM)', tag: 'evening' },
                { label: 'Night (7–12 AM)', tag: 'night' },
                { label: 'Late Night (12–6 AM)', tag: 'late night' },
              ].map(slot => (
                <button
                  key={slot.tag}
                  type="button"
                  onClick={() => {
                    const cleaned = inputQuery
                      .replace(/\b(morning|noon|afternoon|evening|night|late\s*night|midnight)\b/gi, '')
                      .replace(/\s+/g, ' ')
                      .trim();
                    setInputQuery(cleaned ? `${cleaned} ${slot.tag}` : slot.tag);
                    inputRef.current?.focus();
                  }}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                    parsed.timeSlot === slot.tag.replace(' ', '_')
                      ? 'bg-apple-blue text-white border-apple-blue font-bold'
                      : 'bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/5 text-ink-600 dark:text-ink-400 hover:bg-black/10'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            {/* Live Preview Card */}
            <div className="apple-inset-group p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-800 dark:text-ink-200">
                  Live Preview
                </span>
                <span className="text-xs font-mono text-apple-blue font-semibold">
                  {parsed.amount > 0 ? '✓ Ready' : '• Type amount...'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04]">
                  <span className="text-[10px] text-ink-400 block">Description</span>
                  <span className="font-semibold text-ink-900 dark:text-ink-100 truncate block">
                    {parsed.description || '—'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04]">
                  <span className="text-[10px] text-ink-400 block">Amount</span>
                  <span className="font-bold text-apple-red block">
                    {parsed.amount > 0 ? formatCurrency(parsed.amount, currencySymbol) : '—'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04]">
                  <span className="text-[10px] text-ink-400 block">Account</span>
                  <span className="font-semibold text-ink-900 dark:text-ink-100 truncate block">
                    {accounts.find(a => a.id === effectiveAccountId)?.name || 'Cash'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04]">
                  <span className="text-[10px] text-ink-400 block">Time</span>
                  <span className="font-semibold text-ink-900 dark:text-ink-100 block">
                    {effectiveTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Progressive Disclosure: Manual Overrides */}
            <div>
              <button
                type="button"
                onClick={() => setShowManualFields(!showManualFields)}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-apple-blue hover:underline"
              >
                <span>{showManualFields ? 'Hide Manual Details' : 'Manual Overrides (Date, Category, Split)'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showManualFields ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showManualFields && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-3 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-ink-500 mb-1">Date</label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={e => setCustomDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-ink-500 mb-1">Category</label>
                        <select
                          value={effectiveCategoryId}
                          onChange={e => setOverrideCategoryId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs outline-none"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!parsed.amount || parsed.amount <= 0 || isSubmitting}
                className="px-5 py-2.5 text-xs font-semibold bg-apple-blue hover:bg-apple-blue/90 text-white rounded-xl shadow-sm disabled:opacity-50 transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Record to Ledger'}</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  );
};

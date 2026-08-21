import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Calendar,
  Clock,
  Coins,
  Paperclip,
  PlusCircle,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { parseNaturalLanguageInput } from '../../lib/nlpParser';
import { getTodayString } from '../../lib/utils';
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

  // Focus input on open
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
    // Reset overrides when query is wiped
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

      // Reset & Close
      setInputQuery('');
      setSavedDraft(null);
      sessionStorage.removeItem('spendit_draft_entry');
      setReceiptUrl(undefined);
      setIsQuickAddOpen(false);
    } catch (err) {
      console.error('Error logging transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const examplePrompts = [
    'chai 15 cash morning',
    'lunch 250 upi noon',
    'coffee 180 card 12:23 pm',
    'dinner 1200 hdfc 8:30pm',
    'cab 350 cash late night',
  ];

  if (!isQuickAddOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-paper-50 dark:bg-paper-dark-card rounded-xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Paper Header Strip */}
        <div className="bg-paper-200/80 dark:bg-paper-dark px-5 py-3 border-b border-paper-300 dark:border-paper-dark-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-archival-ochre/20 text-archival-ochre flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
              Quick Ledger Entry
            </h3>
          </div>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="p-1 rounded-md text-ink-500 hover:text-ink-900 dark:hover:text-ink-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Dynamic Recurring & Frequent Spends Suggester */}
          <RecurringSuggester
            onSelectPrompt={(prompt) => {
              setInputQuery(prompt);
              inputRef.current?.focus();
            }}
          />

          <form onSubmit={handleSave} className="space-y-4">
            {/* Main Natural Language Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono font-medium text-ink-600 dark:text-ink-400">
                  Shorthand Journal Entry <span className="text-[10px] text-ink-400 dark:text-ink-500">(e.g. "chai 15 cash morning", "lunch 250 upi 12:23 pm")</span>
                </label>
                {savedDraft && !inputQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputQuery(savedDraft);
                      setSavedDraft(null);
                    }}
                    className="text-[10px] font-mono text-archival-ochre hover:underline flex items-center space-x-1"
                  >
                    <span>↺ Restore unsaved draft</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={e => setInputQuery(e.target.value)}
                  placeholder='e.g., "chai 15 cash morning", "lunch 250 upi noon", "coffee 180 card 12:23 pm", "dinner 1200 hdfc 8:30pm", "cab 350 late night"'
                  className="w-full px-3.5 py-2.5 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 font-sans text-sm border border-paper-400 dark:border-paper-dark-border focus:outline-none focus:ring-2 focus:ring-archival-ochre/50 focus:border-archival-ochre shadow-inner min-h-[44px]"
                  autoCapitalize="sentences"
                  autoCorrect="off"
                  aria-label="Shorthand journal entry"
                />
              </div>
            </div>

            {/* Quick Example Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-ink-500 dark:text-ink-400 mr-1">Try:</span>
              {examplePrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInputQuery(prompt)}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-200/80 dark:bg-paper-dark text-ink-700 dark:text-ink-300 hover:bg-paper-300/80 border border-paper-300 dark:border-paper-dark-border transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Time Slot Helper Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-ink-500 dark:text-ink-400 mr-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-archival-ochre" />
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
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    parsed.timeSlot === slot.tag.replace(' ', '_')
                      ? 'bg-archival-ochre/20 border-archival-ochre text-archival-ochre font-bold'
                      : 'bg-paper-200/60 dark:bg-paper-dark border-paper-300 dark:border-paper-dark-border text-ink-600 dark:text-ink-400 hover:bg-paper-300/80'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            {/* Live Parsing Preview Card */}
            <div className="p-3.5 rounded-lg bg-paper-100/90 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-500 dark:text-ink-400 font-semibold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-archival-ochre" />
                  <span>Ledger Entry Preview</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-200/90 dark:bg-paper-dark-card border border-paper-300 dark:border-paper-dark-border text-ink-800 dark:text-ink-200 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-archival-ochre" />
                    <span>{effectiveTime}</span>
                    {parsed.timeSlot && (
                      <span className="text-[10px] text-archival-ochre font-semibold capitalize">
                        • {parsed.timeSlot.replace('_', ' ')}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-mono text-archival-brass">
                    {parsed.amount > 0 ? '✓ Ready to Record' : '• Waiting for amount...'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Type */}
                <div className="p-2 rounded bg-paper-50 dark:bg-paper-dark-card border border-paper-200 dark:border-paper-dark-border">
                  <span className="text-[10px] text-ink-400 block font-mono">Type</span>
                  <span className="font-semibold flex items-center space-x-1 capitalize text-ink-800 dark:text-ink-200">
                    {effectiveType === 'expense' && <TrendingDown className="w-3 h-3 text-archival-red" />}
                    {effectiveType === 'income' && <TrendingUp className="w-3 h-3 text-archival-green" />}
                    {effectiveType === 'transfer' && <ArrowRightLeft className="w-3 h-3 text-archival-blue" />}
                    <span>{effectiveType}</span>
                  </span>
                </div>

                {/* Amount */}
                <div className="p-2 rounded bg-paper-50 dark:bg-paper-dark-card border border-paper-200 dark:border-paper-dark-border">
                  <span className="text-[10px] text-ink-400 block font-mono">Amount</span>
                  <span className="font-mono font-bold text-sm text-ink-900 dark:text-ink-100">
                    {currencySymbol}{parsed.amount.toFixed(2)}
                  </span>
                </div>

                {/* Account */}
                <div className="p-2 rounded bg-paper-50 dark:bg-paper-dark-card border border-paper-200 dark:border-paper-dark-border truncate">
                  <span className="text-[10px] text-ink-400 block font-mono">
                    {effectiveType === 'transfer' ? 'From' : 'Payment Mode'}
                  </span>
                  <span className="font-medium text-ink-800 dark:text-ink-200 truncate block">
                    {accounts.find(a => a.id === effectiveAccountId)?.name || 'Default Cash'}
                  </span>
                </div>

                {/* Category / Dest Account */}
                <div className="p-2 rounded bg-paper-50 dark:bg-paper-dark-card border border-paper-200 dark:border-paper-dark-border truncate">
                  <span className="text-[10px] text-ink-400 block font-mono">
                    {effectiveType === 'transfer' ? 'To Account' : 'Category'}
                  </span>
                  <span className="font-medium text-ink-800 dark:text-ink-200 truncate block">
                    {effectiveType === 'transfer'
                      ? accounts.find(a => a.id === effectiveDestAccountId)?.name || 'Select Dest'
                      : categories.find(c => c.id === effectiveCategoryId)?.name || 'General'}
                  </span>
                </div>
              </div>

              {/* Description & Tags */}
              <div className="pt-1 text-xs flex flex-wrap items-center justify-between gap-1">
                <div>
                  <span className="text-ink-500 dark:text-ink-400 font-mono text-[11px]">Description: </span>
                  <span className="font-medium text-ink-900 dark:text-ink-100">
                    {parsed.description || '—'}
                  </span>
                </div>
                {parsed.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {parsed.tags.map(t => (
                      <span key={t} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-archival-ochre/15 text-archival-ochre">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {parsed.notes && (
                <div className="text-[11px] font-handwriting text-ink-600 dark:text-ink-300 italic">
                  Note: "{parsed.notes}"
                </div>
              )}
            </div>

            {/* Toggle Manual Adjustments */}
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowManualFields(!showManualFields)}
                className="text-archival-ochre hover:underline font-mono text-[11px] flex items-center space-x-1"
              >
                <span>{showManualFields ? '− Hide Manual Controls' : '+ Adjust Date, Category, or Account Manually'}</span>
              </button>

              {/* Receipt Upload Button */}
              <label className="cursor-pointer text-[11px] font-mono text-ink-600 dark:text-ink-400 hover:text-ink-900 flex items-center space-x-1 px-2 py-1 rounded bg-paper-200 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <Paperclip className="w-3 h-3" />
                <span>{receiptUrl ? '✓ Receipt Attached' : 'Attach Receipt'}</span>
                <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
              </label>
            </div>

            {/* Manual Overrides Drawer */}
            {showManualFields && (
              <div className="p-3 rounded-lg bg-paper-200/50 dark:bg-paper-dark-card border border-paper-300 dark:border-paper-dark-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-ink-500 font-mono text-[10px] mb-1">Journal Date</label>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-ink-400" />
                    <input
                      type="date"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="px-2 py-1 rounded bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ink-500 font-mono text-[10px] mb-1">Log Time</label>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-ink-400" />
                    <input
                      type="time"
                      value={customTime}
                      onChange={e => setCustomTime(e.target.value)}
                      className="px-2 py-1 rounded bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ink-500 font-mono text-[10px] mb-1">Account Override</label>
                  <select
                    value={effectiveAccountId}
                    onChange={e => setOverrideAccountId(e.target.value)}
                    className="px-2 py-1 rounded bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs w-full"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-ink-500 font-mono text-[10px] mb-1">Category Override</label>
                  <select
                    value={effectiveCategoryId}
                    onChange={e => setOverrideCategoryId(e.target.value)}
                    className="px-2 py-1 rounded bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs w-full"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-paper-300 dark:border-paper-dark-border">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-3.5 py-1.5 rounded-md font-sans text-xs text-ink-600 dark:text-ink-400 hover:bg-paper-200 dark:hover:bg-paper-dark transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!parsed.amount || parsed.amount <= 0 || isSubmitting}
                className="px-4 py-1.5 rounded-md bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-paper-200 text-paper-50 dark:text-ink-900 font-sans text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording...' : 'Record in Ledger'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

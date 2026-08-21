import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Coins,
  Repeat,
  Sparkles,
  Trash2,
  Vault,
  X,
} from 'lucide-react';
import { CustomReminder, ReminderAction, ReminderFrequency } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { AppleSwitch } from '../ui/apple-switch';
import { sounds } from '../../lib/audioHaptics';

interface CustomReminderModalProps {
  initialReminder?: CustomReminder | null;
  onClose: () => void;
}

const ACTION_OPTIONS: { id: ReminderAction; label: string; icon: React.ReactNode; defaultTitle: string; defaultBody: string }[] = [
  {
    id: 'log_day',
    label: 'Daily Folio Check',
    icon: <BookOpen className="w-4 h-4 text-accent" />,
    defaultTitle: '📖 Evening Financial Folio Check',
    defaultBody: 'Take a moment to record today\'s expenses, review balances, and seal your daily reflection.',
  },
  {
    id: 'review_jars',
    label: 'Money Jars Review',
    icon: <Vault className="w-4 h-4 text-apple-orange" />,
    defaultTitle: '🏺 Money Jars Inspection',
    defaultBody: 'Check your apothecary savings jars and deposit spare funds toward goals.',
  },
  {
    id: 'check_budget',
    label: 'Category Budgets',
    icon: <Coins className="w-4 h-4 text-apple-green" />,
    defaultTitle: '📊 Category Budget Pace',
    defaultBody: 'Review category spending limits and ensure you are staying on track.',
  },
  {
    id: 'reconcile',
    label: 'Account Reconciliation',
    icon: <Check className="w-4 h-4 text-apple-indigo" />,
    defaultTitle: '⚖️ Bank Account Reconciliation',
    defaultBody: 'Cross-check bank ledger balances against your physical receipts.',
  },
  {
    id: 'custom',
    label: 'Custom Alert',
    icon: <Sparkles className="w-4 h-4 text-apple-red" />,
    defaultTitle: '🔔 Personal Financial Reminder',
    defaultBody: 'Custom financial checkpoint reminder.',
  },
];

const FREQUENCY_OPTIONS: { id: ReminderFrequency; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { id: 'weekends', label: 'Weekends (Sat-Sun)' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export const CustomReminderModal: React.FC<CustomReminderModalProps> = ({
  initialReminder,
  onClose,
}) => {
  const { addReminder, updateReminder, deleteReminder } = useFinance();

  const [title, setTitle] = useState(initialReminder?.title || ACTION_OPTIONS[0].defaultTitle);
  const [body, setBody] = useState(initialReminder?.body || ACTION_OPTIONS[0].defaultBody);
  const [action, setAction] = useState<ReminderAction>(initialReminder?.action || 'log_day');
  const [time, setTime] = useState(initialReminder?.time || '20:00');
  const [frequency, setFrequency] = useState<ReminderFrequency>(initialReminder?.frequency || 'daily');
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialReminder?.dayOfWeek ?? 0);
  const [dayOfMonth, setDayOfMonth] = useState<number>(initialReminder?.dayOfMonth ?? 1);
  const [enabled, setEnabled] = useState<boolean>(initialReminder?.enabled ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionSelect = (selectedAction: ReminderAction) => {
    setAction(selectedAction);
    const meta = ACTION_OPTIONS.find(a => a.id === selectedAction);
    if (meta && (!initialReminder || title === ACTION_OPTIONS.find(a => a.id === initialReminder.action)?.defaultTitle)) {
      setTitle(meta.defaultTitle);
      setBody(meta.defaultBody);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (initialReminder) {
        await updateReminder(initialReminder.id, {
          title: title.trim(),
          body: body.trim(),
          action,
          time,
          frequency,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
          enabled,
        });
      } else {
        await addReminder({
          title: title.trim(),
          body: body.trim(),
          action,
          time,
          frequency,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
          enabled,
        });
      }
      sounds.playCoinChime();
      onClose();
    } catch (err) {
      console.error('Failed to save reminder:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialReminder) return;
    try {
      await deleteReminder(initialReminder.id);
      sounds.playPageTurn();
      onClose();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/15 text-accent flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-ink-900 dark:text-ink-100">
                {initialReminder ? 'Edit Custom Reminder' : 'New Custom Reminder'}
              </h3>
              <p className="text-xs text-secondary">
                Configure scheduled financial alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* 1. Action Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold block">
              Reminder Purpose & Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleActionSelect(opt.id)}
                  className={`p-2.5 rounded-2xl border flex items-center space-x-2 text-left transition-all ${
                    action === opt.id
                      ? 'bg-apple-blue/15 border-apple-blue text-accent font-semibold'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-ink-700 dark:text-ink-300'
                  }`}
                >
                  {opt.icon}
                  <span className="text-xs truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Title & Message */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold mb-1 block">
                Notification Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 📖 Evening Financial Folio Check"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-ink-900 dark:text-ink-100 placeholder:text-secondary focus-ring focus:border-apple-blue"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold mb-1 block">
                Prompt Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                placeholder="Message displayed in toast notification..."
                className="w-full px-3.5 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-ink-900 dark:text-ink-100 placeholder:text-secondary focus-ring focus:border-apple-blue resize-none"
              />
            </div>
          </div>

          {/* 3. Time of Day & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Alert Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs font-mono font-semibold text-ink-900 dark:text-ink-100 focus-ring focus:border-apple-blue cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold mb-1 flex items-center space-x-1">
                <Repeat className="w-3 h-3" />
                <span>Frequency</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ReminderFrequency)}
                className="w-full px-3 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs font-semibold text-ink-900 dark:text-ink-100 focus-ring focus:border-apple-blue cursor-pointer"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Weekly Day or Monthly Date Picker */}
          {frequency === 'weekly' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold block">
                Repeat Every Week On
              </label>
              <div className="flex items-center justify-between gap-1">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDayOfWeek(d.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all ${
                      dayOfWeek === d.id
                        ? 'bg-accent text-white border-apple-blue'
                        : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-secondary'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold block">
                Day of Month (1 - 31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                className="w-full px-3.5 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs font-mono font-semibold text-ink-900 dark:text-ink-100 focus-ring focus:border-apple-blue"
              />
            </div>
          )}

          {/* 5. Enabled Switch */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Active Reminder
              </span>
              <span className="text-xs text-secondary">
                Trigger toast notification on schedule
              </span>
            </div>
            <AppleSwitch
              checked={enabled}
              onChange={setEnabled}
              color="green"
              aria-label="Toggle Reminder Active"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-2">
            {initialReminder ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-2xl bg-apple-red/10 hover:bg-apple-red/20 text-apple-red font-sans text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-secondary font-sans text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl bg-accent text-white font-sans text-xs font-semibold shadow-sm transition-transform active:scale-95 disabled:opacity-50"
              >
                {initialReminder ? 'Update Reminder' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

export default CustomReminderModal;

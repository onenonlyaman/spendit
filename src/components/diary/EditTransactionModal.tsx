import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Clock,
  Paperclip,
  Save,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  const {
    accounts,
    categories,
    currencySymbol,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  const [date, setDate] = useState(transaction.date);
  const [time, setTime] = useState(transaction.time);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [destinationAccountId, setDestinationAccountId] = useState(
    transaction.destinationAccountId || accounts.find(a => a.id !== transaction.accountId)?.id || ''
  );
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [tagsText, setTagsText] = useState(transaction.tags.join(', '));
  const [notes, setNotes] = useState(transaction.notes || '');
  const [receiptUrl, setReceiptUrl] = useState(transaction.receiptUrl || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!description.trim() || isNaN(num) || num <= 0) return;

    const parsedTags = tagsText
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    await updateTransaction(transaction.id, {
      date,
      time,
      description: description.trim(),
      amount: num,
      type,
      accountId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      categoryId: type === 'transfer' ? '' : categoryId,
      tags: parsedTags,
      notes: notes.trim() || undefined,
      receiptUrl: receiptUrl || undefined,
    });

    onClose();
  };

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    onClose();
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
        className="max-w-lg w-full bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple-float border border-black/10 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
              Edit Transaction
            </h3>
            <span className="text-xs text-secondary">ID: {transaction.id.slice(0, 8)}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Type Selector Tabs */}
          <div className="flex rounded-xl bg-black/[0.03] dark:bg-white/[0.05] p-1 border border-black/5 dark:border-white/5">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 rounded-lg font-sans text-xs font-semibold capitalize transition-all flex items-center justify-center space-x-1.5 ${
                  type === t
                    ? 'bg-white dark:bg-[#2C2C2E] text-ink-900 dark:text-ink-100 shadow-sm'
                    : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                {t === 'expense' && <TrendingDown className="w-3.5 h-3.5 text-apple-red" />}
                {t === 'income' && <TrendingUp className="w-3.5 h-3.5 text-apple-green" />}
                {t === 'transfer' && <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />}
                <span>{t}</span>
              </button>
            ))}
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Description / Merchant</label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
              />
            </div>
            <div>
              <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Amount ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] font-mono font-bold text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
              />
            </div>
          </div>

          {/* Accounts & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">
                {type === 'transfer' ? 'Source Account' : 'Payment Mode'}
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Destination Account</label>
                <select
                  value={destinationAccountId}
                  onChange={e => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === accountId}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Journal Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
              />
            </div>
            <div>
              <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
              />
            </div>
          </div>

          {/* Tags & Notes */}
          <div>
            <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Tags (Comma separated)</label>
            <input
              type="text"
              placeholder="#chai, #swiggy, #office"
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 focus-ring"
            />
          </div>

          <div>
            <label className="block text-ink-700 dark:text-ink-300 font-semibold mb-1">Reflection Note</label>
            <textarea
              rows={2}
              placeholder="Context or notes about this spend..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 text-xs border border-black/10 dark:border-white/10 focus-ring"
            />
          </div>

          {/* Receipt Upload & Preview */}
          <div className="flex items-center justify-between pt-1">
            <label className="cursor-pointer text-xs font-semibold text-accent hover:underline flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-apple-blue/10 border border-apple-blue/20">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{receiptUrl ? 'Replace Receipt Image' : 'Attach Receipt Image'}</span>
              <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
            </label>
            {receiptUrl && (
              <button
                type="button"
                onClick={() => setReceiptUrl('')}
                className="text-apple-red hover:underline font-mono text-xs"
              >
                Remove Receipt
              </button>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            {showDeleteConfirm ? (
              <div className="flex items-center space-x-2">
                <span className="text-apple-red font-mono font-bold text-xs">Confirm delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-apple-red text-white font-semibold rounded-xl text-xs"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-apple-red hover:underline text-xs font-semibold flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-4 py-2 bg-accent text-white font-semibold rounded-xl text-xs shadow-sm flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

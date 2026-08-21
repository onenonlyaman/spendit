import React, { useState } from 'react';
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
      amount: Math.round(num * 100) / 100,
      type,
      accountId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      categoryId,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-lg w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-paper-200/80 dark:bg-paper-dark px-5 py-3.5 border-b border-paper-300 dark:border-paper-dark-border flex items-center justify-between flex-shrink-0">
          <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
            Edit Ledger Transaction
          </h3>
          <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Type Selector Tabs */}
          <div className="flex rounded-lg bg-paper-200 dark:bg-paper-dark p-1 border border-paper-300">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 rounded-md font-mono text-xs font-semibold capitalize transition-all flex items-center justify-center space-x-1 ${
                  type === t
                    ? 'bg-paper-50 dark:bg-paper-dark-card text-ink-900 dark:text-ink-100 shadow-sm border border-paper-300'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {t === 'expense' && <TrendingDown className="w-3 h-3 text-archival-red" />}
                {t === 'income' && <TrendingUp className="w-3 h-3 text-archival-green" />}
                {t === 'transfer' && <ArrowRightLeft className="w-3 h-3 text-archival-blue" />}
                <span>{t}</span>
              </button>
            ))}
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-ink-600 font-mono mb-1">Description / Merchant</label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded bg-paper-100 text-ink-900 border border-paper-300"
              />
            </div>
            <div>
              <label className="block text-ink-600 font-mono mb-1">Amount ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded bg-paper-100 font-mono font-bold border border-paper-300"
              />
            </div>
          </div>

          {/* Accounts & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-600 font-mono mb-1">
                {type === 'transfer' ? 'Source Account' : 'Payment Mode'}
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-paper-100 text-ink-900 border border-paper-300"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-ink-600 font-mono mb-1">Destination Account</label>
                <select
                  value={destinationAccountId}
                  onChange={e => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-ink-900 border border-paper-300"
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
                <label className="block text-ink-600 font-mono mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-ink-900 border border-paper-300"
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
              <label className="block text-ink-600 font-mono mb-1">Journal Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded bg-paper-100 border border-paper-300"
              />
            </div>
            <div>
              <label className="block text-ink-600 font-mono mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded bg-paper-100 border border-paper-300"
              />
            </div>
          </div>

          {/* Tags & Notes */}
          <div>
            <label className="block text-ink-600 font-mono mb-1">Tags (Comma separated)</label>
            <input
              type="text"
              placeholder="#chai, #swiggy, #office"
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
              className="w-full px-3 py-2 rounded bg-paper-100 border border-paper-300"
            />
          </div>

          <div>
            <label className="block text-ink-600 font-mono mb-1">Handwritten Margin Reflection</label>
            <textarea
              rows={2}
              placeholder="Context or notes about this spend..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded bg-paper-100 font-handwriting text-sm border border-paper-300"
            />
          </div>

          {/* Receipt Upload & Preview */}
          <div className="flex items-center justify-between pt-1">
            <label className="cursor-pointer text-xs font-mono text-ink-700 hover:text-ink-900 flex items-center space-x-1.5 px-3 py-1.5 rounded bg-paper-200 border border-paper-300">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{receiptUrl ? 'Replace Receipt Image' : 'Attach Receipt Image'}</span>
              <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
            </label>
            {receiptUrl && (
              <button
                type="button"
                onClick={() => setReceiptUrl('')}
                className="text-archival-red hover:underline font-mono text-[11px]"
              >
                Remove Receipt
              </button>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-paper-300">
            {showDeleteConfirm ? (
              <div className="flex items-center space-x-2">
                <span className="text-archival-red font-mono font-bold text-xs">Confirm delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-archival-red text-paper-50 font-semibold rounded text-xs"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-ink-600 hover:bg-paper-200 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-archival-red hover:underline font-mono text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Transaction</span>
              </button>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-ink-600 hover:bg-paper-200 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-ink-900 text-paper-50 font-semibold rounded text-xs shadow-sm flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

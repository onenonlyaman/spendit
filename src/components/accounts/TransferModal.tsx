import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRightLeft, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface TransferModalProps {
  onClose: () => void;
  initialFromId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({ onClose, initialFromId }) => {
  const { accounts, transferFunds, currencySymbol } = useFinance();

  const [fromId, setFromId] = useState(initialFromId || accounts[0]?.id || '');
  const [toId, setToId] = useState(
    accounts.find(a => a.id !== (initialFromId || accounts[0]?.id))?.id || accounts[1]?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !fromId || !toId || fromId === toId) return;

    transferFunds(fromId, toId, num, description.trim() || undefined);
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
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple-float border border-black/10 dark:border-white/10 overflow-hidden space-y-4 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                Transfer Funds
              </h3>
              <span className="text-xs font-mono text-ink-400">Inter-account reallocation</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Source Account (Outflow)
            </label>
            <select
              value={fromId}
              onChange={e => setFromId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 text-xs outline-none"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === toId}>
                  {a.name} ({currencySymbol}{a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Destination Account (Inflow)
            </label>
            <select
              value={toId}
              onChange={e => setToId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 text-xs outline-none"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === fromId}>
                  {a.name} ({currencySymbol}{a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Transfer Amount ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 font-mono text-sm border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Transfer Memo / Note
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Monthly savings allocation"
              className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 text-xs border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || fromId === toId}
              className="px-4 py-2 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

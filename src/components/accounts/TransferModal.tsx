import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border overflow-hidden">
        {/* Header */}
        <div className="bg-paper-200/80 dark:bg-paper-dark px-5 py-3.5 border-b border-paper-300 dark:border-paper-dark-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-4 h-4 text-archival-blue" />
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
              Inter-Account Fund Transfer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-500 hover:text-ink-900 dark:hover:text-ink-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-ink-600 dark:text-ink-400 mb-1">
              Source Account (Outflow)
            </label>
            <select
              value={fromId}
              onChange={e => setFromId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === toId}>
                  {a.name} ({currencySymbol}{a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-600 dark:text-ink-400 mb-1">
              Destination Account (Inflow)
            </label>
            <select
              value={toId}
              onChange={e => setToId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === fromId}>
                  {a.name} ({currencySymbol}{a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-600 dark:text-ink-400 mb-1">
              Transfer Amount ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 font-mono text-sm border border-paper-300 dark:border-paper-dark-border"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-600 dark:text-ink-400 mb-1">
              Transfer Memo / Note
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Monthly savings allocation"
              className="w-full px-3 py-2 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 text-xs border border-paper-300 dark:border-paper-dark-border"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300 dark:border-paper-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs text-ink-600 hover:bg-paper-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || fromId === toId}
              className="px-4 py-1.5 rounded-md bg-archival-blue hover:bg-archival-blue/90 text-paper-50 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

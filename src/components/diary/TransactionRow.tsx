import React, { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Circle,
  Edit2,
  Paperclip,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/utils';
import { Transaction } from '../../types';
import { EditTransactionModal } from './EditTransactionModal';

interface TransactionRowProps {
  transaction: Transaction;
  onOpenReceipt: (url: string, description: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onOpenReceipt,
}) => {
  const {
    accounts,
    categories,
    privacyMode,
    currencySymbol,
    toggleReconcile,
    deleteTransaction,
  } = useFinance();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const account = accounts.find(a => a.id === transaction.accountId);
  const destAccount = transaction.destinationAccountId
    ? accounts.find(a => a.id === transaction.destinationAccountId)
    : null;
  const category = categories.find(c => c.id === transaction.categoryId);

  const getAmountColor = () => {
    if (transaction.type === 'income') return 'text-archival-green';
    if (transaction.type === 'transfer') return 'text-archival-blue';
    return 'text-archival-red';
  };

  const getAmountPrefix = () => {
    if (transaction.type === 'income') return '+';
    if (transaction.type === 'transfer') return '⇄ ';
    return '-';
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
  };

  const accountDisplayName =
    transaction.type === 'transfer' && destAccount
      ? `${account?.name || 'Cash'} → ${destAccount.name}`
      : account?.name || 'UPI / Cash';

  return (
    <>
      <div className="group relative flex items-center justify-between py-3 px-3 hover:bg-paper-200/50 dark:hover:bg-paper-dark-card/60 transition-colors border-b border-paper-300/70 dark:border-paper-dark-border/80">
        {/* Left: Reconciled Checkbox + Time + Details */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
          {/* Reconcile Verification Button */}
          <button
            onClick={() => toggleReconcile(transaction.id)}
            className="text-ink-400 hover:text-archival-green transition-colors flex-shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center -m-1 p-1"
            aria-label={transaction.reconciled ? 'Reconciled in Ledger' : 'Mark Reconciled'}
            title={transaction.reconciled ? 'Reconciled in Ledger' : 'Mark Reconciled'}
          >
            {transaction.reconciled ? (
              <CheckCircle2 className="w-4 h-4 text-archival-green" />
            ) : (
              <Circle className="w-4 h-4 opacity-40 hover:opacity-100" />
            )}
          </button>

          {/* Time Stamp */}
          <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400 flex-shrink-0 w-10">
            {transaction.time}
          </span>

          {/* Description + Notes + Tags */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-medium text-xs text-ink-900 dark:text-ink-100 truncate">
                {transaction.description}
              </span>

              {/* Category Pill */}
              {category && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded border truncate"
                  style={{
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}40`,
                    color: category.color,
                  }}
                >
                  {category.name}
                </span>
              )}

              {/* Mobile Account Indicator */}
              <span className="text-[10px] font-mono text-ink-400 sm:hidden">
                • {accountDisplayName}
              </span>

              {/* Receipt Indicator Button */}
              {transaction.receiptUrl && (
                <button
                  onClick={() => onOpenReceipt(transaction.receiptUrl!, transaction.description)}
                  className="text-[10px] font-mono text-archival-brass hover:underline flex items-center space-x-0.5 bg-archival-ochre/10 px-1.5 py-0.2 rounded border border-archival-brass/30"
                  aria-label="View Attached Receipt"
                  title="View Attached Receipt"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>Receipt</span>
                </button>
              )}
            </div>

            {/* Handwritten Margin Note / Tags */}
            {(transaction.notes || (transaction.tags && transaction.tags.length > 0)) && (
              <div className="flex items-center space-x-2 mt-0.5 text-ink-600 dark:text-ink-400 flex-wrap gap-y-0.5">
                {transaction.notes && (
                  <span className="font-handwriting text-xs italic tracking-wide text-ink-700 dark:text-ink-300">
                    ✎ {transaction.notes}
                  </span>
                )}
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {transaction.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono text-ink-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Account Name & Financial Amount */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Account Badge (Desktop) */}
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block truncate max-w-[140px]">
              {accountDisplayName}
            </span>
          </div>

          {/* Tabular Ledger Amount */}
          <div className="text-right min-w-[80px]">
            <span className={`font-mono font-bold text-xs tracking-tight ${getAmountColor()}`}>
              {getAmountPrefix()}
              {formatCurrency(transaction.amount, currencySymbol, privacyMode)}
            </span>
          </div>

          {/* Hover Action Buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            {showDeleteConfirm ? (
              <div className="flex items-center space-x-1 bg-paper-100 dark:bg-paper-dark p-0.5 rounded border border-archival-red/40">
                <button
                  onClick={handleDelete}
                  className="px-1.5 py-0.5 text-[10px] font-mono bg-archival-red text-paper-50 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-ink-600 rounded hover:bg-paper-200"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1 rounded text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
                  aria-label="Edit Transaction"
                  title="Edit Transaction"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 rounded text-ink-400 hover:text-archival-red transition-colors"
                  aria-label="Delete Record"
                  title="Delete Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditTransactionModal
          transaction={transaction}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

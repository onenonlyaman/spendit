import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Edit2,
  Paperclip,
  Trash2,
  Wallet,
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const account = accounts.find(a => a.id === transaction.accountId);
  const destAccount = transaction.destinationAccountId
    ? accounts.find(a => a.id === transaction.destinationAccountId)
    : null;
  const category = categories.find(c => c.id === transaction.categoryId);

  const getAmountColor = () => {
    if (transaction.type === 'income') return 'text-apple-green';
    if (transaction.type === 'transfer') return 'text-apple-blue';
    return 'text-ink-900 dark:text-ink-100';
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
      ? `${account?.name || 'Account'} → ${destAccount.name}`
      : account?.name || 'Cash & UPI';

  return (
    <>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="group cursor-pointer border-b border-black/[0.04] dark:border-white/[0.06] last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors px-3 sm:px-4 py-3"
      >
        {/* Primary Glanceable Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Reconcile Verification Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleReconcile(transaction.id);
              }}
              className="text-ink-400 hover:text-apple-green transition-colors flex-shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center p-1"
              aria-label={transaction.reconciled ? 'Reconciled' : 'Mark Reconciled'}
            >
              {transaction.reconciled ? (
                <CheckCircle2 className="w-4 h-4 text-apple-green" />
              ) : (
                <Circle className="w-4 h-4 opacity-30 hover:opacity-100" />
              )}
            </button>

            {/* Merchant Title & Category Badge */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xs sm:text-sm text-ink-900 dark:text-ink-100 truncate">
                  {transaction.description}
                </span>

                {category && (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border truncate"
                    style={{
                      backgroundColor: `${category.color}12`,
                      borderColor: `${category.color}35`,
                      color: category.color,
                    }}
                  >
                    {category.name}
                  </span>
                )}
              </div>

              {/* Secondary Subtitle Preview */}
              <div className="flex items-center space-x-2 text-[11px] font-mono text-ink-400 dark:text-ink-500 mt-0.5">
                <span>{transaction.time}</span>
                <span>•</span>
                <span className="truncate">{accountDisplayName}</span>
                {transaction.receiptUrl && (
                  <>
                    <span>•</span>
                    <span className="text-apple-blue font-medium flex items-center space-x-0.5">
                      <Paperclip className="w-3 h-3" />
                      <span>Receipt</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Amount & Expand Indicator */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className={`font-mono font-bold text-xs sm:text-sm tracking-tight ${getAmountColor()}`}>
              {getAmountPrefix()}
              {formatCurrency(transaction.amount, currencySymbol, privacyMode)}
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-ink-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-apple-blue' : ''
              }`}
            />
          </div>
        </div>

        {/* Tucked-Away Progressive Disclosure Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-2.5">
                {/* Notes & Marginalia */}
                {transaction.notes && (
                  <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-ink-400 block mb-0.5">
                      Reflection Note
                    </span>
                    <p className="font-sans italic text-xs text-ink-800 dark:text-ink-200">
                      "{transaction.notes}"
                    </p>
                  </div>
                )}

                {/* Tags */}
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="text-[10px] font-mono text-ink-400">Tags:</span>
                    {transaction.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-700 dark:text-ink-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Receipt View Button */}
                {transaction.receiptUrl && (
                  <button
                    onClick={() => onOpenReceipt(transaction.receiptUrl!, transaction.description)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-apple-blue/10 text-apple-blue text-xs font-semibold hover:bg-apple-blue/15 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>View Attached Receipt</span>
                  </button>
                )}

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-ink-800 dark:text-ink-200 text-xs font-medium flex items-center space-x-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {showDeleteConfirm ? (
                      <div className="flex items-center space-x-1.5 bg-apple-red/10 p-1 rounded-lg border border-apple-red/30">
                        <span className="text-[10px] font-mono text-apple-red px-1">Delete record?</span>
                        <button
                          onClick={handleDelete}
                          className="px-2 py-0.5 text-xs font-semibold bg-apple-red text-white rounded-md"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-2 py-0.5 text-xs font-medium text-ink-600 dark:text-ink-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-1.5 rounded-lg hover:bg-apple-red/10 text-apple-red text-xs font-medium flex items-center space-x-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-ink-400">
                    ID: {transaction.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditTransactionModal
            transaction={transaction}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

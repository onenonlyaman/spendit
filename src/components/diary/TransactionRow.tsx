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
  Lock,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useToast } from '../../context/ToastContext';
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
    getNoteForDate,
    recentlyAddedId,
  } = useFinance();

  const isJustAdded = recentlyAddedId === transaction.id;

  const { success, error } = useToast();

  // A sealed day is a closed day. Editing or deleting inside it would make the
  // seal decorative, so the controls are withdrawn until the user breaks it.
  const isDaySealed = getNoteForDate(transaction.date).sealed;

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
    if (transaction.type === 'transfer') return 'text-accent';
    return 'text-ink-900 dark:text-ink-100';
  };

  const getAmountPrefix = () => {
    if (transaction.type === 'income') return '+';
    if (transaction.type === 'transfer') return '⇄ ';
    return '-';
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const label = transaction.description;
    try {
      await deleteTransaction(transaction.id);
      setShowDeleteConfirm(false);
      success('Entry deleted', label);
    } catch (err) {
      setShowDeleteConfirm(false);
      error(
        'Could not delete that entry',
        err instanceof Error ? err.message : 'The entry is unchanged.'
      );
    }
  };

  const accountDisplayName =
    transaction.type === 'transfer' && destAccount
      ? `${account?.name || 'Account'} → ${destAccount.name}`
      : account?.name || 'Cash & UPI';

  return (
    <>
      {/*
        A freshly written entry arrives with a brief accent wash that recedes
        into the row. It answers "where did it go?" without a banner, and it is
        the only place in the app that animates for emphasis rather than state.
        `prefers-reduced-motion` collapses it to a static appearance via
        MotionConfig at the app root.
      */}
      <motion.div
        layout="position"
        initial={isJustAdded ? { opacity: 0, y: -8 } : false}
        animate={
          isJustAdded
            ? {
                opacity: 1,
                y: 0,
                backgroundColor: [
                  'rgba(0, 122, 255, 0.14)',
                  'rgba(0, 122, 255, 0.14)',
                  'rgba(0, 122, 255, 0)',
                ],
              }
            : { opacity: 1, y: 0 }
        }
        transition={
          isJustAdded
            ? {
                y: { type: 'spring', stiffness: 480, damping: 34 },
                opacity: { duration: 0.18 },
                backgroundColor: { duration: 1.9, times: [0, 0.28, 1], ease: [0.16, 1, 0.3, 1] },
              }
            : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
        }
        onClick={() => setIsExpanded(!isExpanded)}
        className="group cursor-pointer border-b border-black/[0.04] dark:border-white/[0.06] last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] px-3 sm:px-4 py-3"
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
              className="text-secondary hover:text-apple-green transition-colors flex-shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center p-1"
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
                    className="text-xs font-mono px-2 py-0.5 rounded-full border truncate"
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
              <div className="flex items-center space-x-2 text-xs text-secondary mt-0.5">
                <span>{transaction.time}</span>
                <span>•</span>
                <span className="truncate">{accountDisplayName}</span>
                {transaction.receiptUrl && (
                  <>
                    <span>•</span>
                    <span className="text-accent font-medium flex items-center space-x-0.5">
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
              className={`w-3.5 h-3.5 text-secondary transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-accent' : ''
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
                    <span className="text-xs uppercase tracking-wide text-secondary block mb-0.5">
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
                    <span className="text-xs text-secondary">Tags:</span>
                    {transaction.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-700 dark:text-ink-300"
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
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-apple-blue/10 text-accent text-xs font-semibold hover:bg-apple-blue/15 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>View Attached Receipt</span>
                  </button>
                )}

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  {isDaySealed ? (
                    <p className="flex items-center gap-1.5 text-sm text-secondary">
                      <Lock className="w-4 h-4 text-secondary" aria-hidden="true" />
                      <span>This day is sealed. Break the seal to edit this entry.</span>
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-ink-800 dark:text-ink-200 text-sm font-medium flex items-center gap-1.5 focus-ring transition-colors"
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                        <span>Edit</span>
                      </button>

                      {showDeleteConfirm ? (
                        <div className="flex items-center gap-2 bg-apple-red/[0.06] py-1 pl-3 pr-1 rounded-lg border border-apple-red/30">
                          <span className="text-sm font-medium text-apple-red">
                            Delete this entry?
                          </span>
                          <button
                            onClick={handleDelete}
                            className="px-2.5 py-1 text-sm font-semibold bg-apple-red text-white rounded-md focus-ring"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2.5 py-1 text-sm font-semibold text-ink-700 dark:text-ink-200 rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus-ring"
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-3 py-1.5 rounded-lg hover:bg-apple-red/10 text-apple-red text-sm font-medium flex items-center gap-1.5 focus-ring transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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

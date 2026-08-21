import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  ChevronDown,
  Filter,
  Image,
  Paperclip,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateShort } from '../../lib/utils';
import { Transaction } from '../../types';
import { ReceiptModal } from '../common/ReceiptModal';
import { TransactionRow } from '../diary/TransactionRow';
import { GooeyInput } from '../ui/gooey-input';
import { AppleSwitch } from '../ui/apple-switch';

export const SearchView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    privacyMode,
    currencySymbol,
    setDiaryDate,
    setActiveView,
    searchQuery,
    setSearchQuery,
  } = useFinance();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyWithReceipts, setOnlyWithReceipts] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; description: string } | null>(null);

  // Extract all distinct tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => t.tags.forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const qLower = searchQuery.toLowerCase().trim();

    return transactions.filter(t => {
      // Query search
      if (qLower) {
        const matchDesc = t.description.toLowerCase().includes(qLower);
        const matchNotes = (t.notes || '').toLowerCase().includes(qLower);
        const matchTags = t.tags.some(tag => tag.toLowerCase().includes(qLower));
        const matchAmount = t.amount.toString().includes(qLower);
        if (!matchDesc && !matchNotes && !matchTags && !matchAmount) {
          return false;
        }
      }

      // Account filter
      if (selectedAccountId !== 'all' && t.accountId !== selectedAccountId && t.destinationAccountId !== selectedAccountId) {
        return false;
      }

      // Category filter
      if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) {
        return false;
      }

      // Receipts filter
      if (onlyWithReceipts && !t.receiptUrl) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedAccountId, selectedCategoryId, selectedType, onlyWithReceipts]);

  // Total matching sum
  const totalMatchingExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Apple Spotlight Search Hero Card */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-7 space-y-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-ink-400 dark:text-ink-500 font-semibold block">
            Universal Search & Archive
          </span>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight mt-0.5">
            Spotlight Search
          </h1>
        </div>

        {/* Large Apple Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by merchant, note, #tag, or amount..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-sm text-ink-900 dark:text-ink-100 outline-none focus:ring-2 focus:ring-apple-blue font-sans shadow-inner"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 rounded-full text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle & Quick Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[10px] font-mono text-ink-400 mr-1">Quick:</span>
            {allTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-apple-blue/15 hover:text-apple-blue transition-colors text-ink-700 dark:text-ink-300"
              >
                #{tag}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-apple-blue hover:underline"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showFilters ? 'Hide Filters' : 'Filter Options'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Progressive Disclosure Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-2 border-t border-black/[0.04] dark:border-white/[0.06]"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div>
                  <label className="block text-[10px] font-mono text-ink-500 mb-1">Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs outline-none"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-ink-500 mb-1">Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-ink-500 mb-1">Type</label>
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 h-[38px]">
                  <span className="text-xs font-semibold text-ink-800 dark:text-ink-200">
                    📎 Receipts Only
                  </span>
                  <AppleSwitch
                    checked={onlyWithReceipts}
                    onChange={setOnlyWithReceipts}
                    color="blue"
                    size="sm"
                    aria-label="Filter Receipts Only"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Inset Group */}
      <div className="apple-inset-group shadow-apple-card">
        <div className="px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
          <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">
            Matching Records ({filteredTransactions.length})
          </span>
          {totalMatchingExpense > 0 && (
            <span className="text-xs font-mono font-bold text-ink-900 dark:text-ink-100">
              Total: {formatCurrency(totalMatchingExpense, currencySymbol, privacyMode)}
            </span>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <Search className="w-8 h-8 text-ink-300 mx-auto" />
            <h3 className="font-sans font-semibold text-sm text-ink-800 dark:text-ink-200">
              No matching records found
            </h3>
            <p className="text-xs text-ink-400">
              Try adjusting query keywords or resetting filter parameters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {filteredTransactions.map(transaction => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onOpenReceipt={(url, desc) => setSelectedReceipt({ url, description: desc })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receiptUrl={selectedReceipt.url}
          description={selectedReceipt.description}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

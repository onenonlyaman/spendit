import React, { useMemo, useState } from 'react';
import {
  Calendar,
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

export const SearchView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    privacyMode,
    currencySymbol,
    setDiaryDate,
    setActiveView,
  } = useFinance();

  const [query, setQuery] = useState('');
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
    const qLower = query.toLowerCase().trim();

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
  }, [transactions, query, selectedAccountId, selectedCategoryId, selectedType, onlyWithReceipts]);

  // Total matching sum
  const totalMatchingExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="bg-paper-50 dark:bg-paper-dark-card p-6 rounded-2xl border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-mono tracking-widest text-archival-ochre font-bold">
            Ledger Index & Archives
          </span>
          <span className="text-paper-400">•</span>
          <span className="text-xs font-mono text-ink-500">
            Full-Text Journal Query
          </span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-ink-900 dark:text-ink-100 mt-1">
          Archive Search & Discovery
        </h1>
        <p className="text-xs font-sans text-ink-600 dark:text-ink-400 mt-0.5">
          Locate any historical transaction, handwritten note, or receipt attachment in milliseconds.
        </p>

        {/* Main Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search descriptions, notes (e.g. 'chai', 'coffee', 'Gion'), #tags, or exact amounts..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 font-sans text-sm border border-paper-300 dark:border-paper-dark-border focus:outline-none focus:ring-2 focus:ring-archival-ochre shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3 text-ink-400 hover:text-ink-700 min-w-[28px] min-h-[28px] flex items-center justify-center -m-1"
              aria-label="Clear search query"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
          {/* Account Filter */}
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="px-2.5 py-1 rounded bg-paper-100 dark:bg-paper-dark text-ink-800 dark:text-ink-200 border border-paper-300 dark:border-paper-dark-border"
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryId}
            onChange={e => setSelectedCategoryId(e.target.value)}
            className="px-2.5 py-1 rounded bg-paper-100 dark:bg-paper-dark text-ink-800 dark:text-ink-200 border border-paper-300 dark:border-paper-dark-border"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2.5 py-1 rounded bg-paper-100 dark:bg-paper-dark text-ink-800 dark:text-ink-200 border border-paper-300 dark:border-paper-dark-border"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Incomes Only</option>
            <option value="transfer">Transfers Only</option>
          </select>

          {/* Only Receipts Toggle */}
          <button
            onClick={() => setOnlyWithReceipts(!onlyWithReceipts)}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center space-x-1 ${
              onlyWithReceipts
                ? 'bg-archival-ochre text-paper-50 border-archival-ochre font-semibold'
                : 'bg-paper-100 dark:bg-paper-dark text-ink-700 dark:text-ink-300 border-paper-300 dark:border-paper-dark-border'
            }`}
          >
            <Paperclip className="w-3 h-3" />
            <span>Has Receipt</span>
          </button>
        </div>

        {/* Common Tag Chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-paper-200 dark:border-paper-dark-border mt-3">
            <span className="text-[11px] font-mono text-ink-400">Popular Tags:</span>
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-200 dark:bg-paper-dark text-ink-700 dark:text-ink-300 hover:bg-paper-300 border border-paper-300 dark:border-paper-dark-border transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results Ledger Sheet */}
      <div className="rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger overflow-hidden p-6">
        <div className="flex items-center justify-between pb-3 border-b border-paper-300 dark:border-paper-dark-border mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-sm uppercase text-ink-800 dark:text-ink-200">
              Query Results ({filteredTransactions.length} items)
            </span>
          </div>

          <div className="font-mono text-xs text-ink-600 dark:text-ink-400">
            Matching Outflow:{' '}
            <strong className="text-archival-red">
              {formatCurrency(totalMatchingExpense, currencySymbol, privacyMode)}
            </strong>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-ink-500 space-y-2">
            <Search className="w-8 h-8 mx-auto opacity-40" />
            <p className="font-serif italic text-base">No matching ledger entries found.</p>
            <p className="text-xs font-sans">Try broadening your search query or removing active filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-paper-200 dark:divide-paper-dark-border">
            {filteredTransactions.map(txn => (
              <div key={txn.id} className="relative">
                {/* Date jump banner on row */}
                <div className="flex items-center justify-between py-1 bg-paper-100/50 dark:bg-paper-dark/50 px-3 text-[10px] font-mono text-ink-400">
                  <button
                    onClick={() => {
                      setDiaryDate(txn.date);
                      setActiveView('diary');
                    }}
                    className="hover:underline text-archival-ochre flex items-center space-x-1"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Jump to Diary: {txn.date}</span>
                  </button>
                  <span>Folio Record #{txn.id.slice(-6)}</span>
                </div>
                <TransactionRow
                  transaction={txn}
                  onOpenReceipt={(url, desc) => setSelectedReceipt({ url, description: desc })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Viewer */}
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

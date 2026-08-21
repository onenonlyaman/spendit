import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Edit2,
  Plus,
  PlusCircle,
  ShieldCheck,
  Smartphone,
  Trash2,
  TrendingUp,
  Vault,
  Wallet,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/utils';
import { Account, AccountType } from '../../types';
import { TransferModal } from './TransferModal';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    transactions,
    privacyMode,
    currencySymbol,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useFinance();

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string | undefined>(undefined);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  // New Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('cash');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccInstitution, setNewAccInstitution] = useState('');
  const [newAccMasked, setNewAccMasked] = useState('');

  // Edit Account Form State
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>('cash');
  const [editBalance, setEditBalance] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editMasked, setEditMasked] = useState('');

  // Calculate Net Worth & Balances
  const totalAssets = accounts
    .filter(a => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalLiabilities;

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditType(acc.type);
    setEditBalance(acc.initialBalance.toString());
    setEditInstitution(acc.institution || '');
    setEditMasked(acc.accountNumberMasked || '');
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const initialBal = parseFloat(newAccBalance) || 0;

    let icon = 'Banknote';
    let color = '#8C6D37';
    if (newAccType === 'bank') {
      icon = 'Building2';
      color = '#2A6F4E';
    } else if (newAccType === 'credit') {
      icon = 'CreditCard';
      color = '#B83A3A';
    } else if (newAccType === 'savings') {
      icon = 'Vault';
      color = '#C07D2B';
    } else if (newAccName.toLowerCase().includes('upi') || newAccName.toLowerCase().includes('gpay')) {
      icon = 'Smartphone';
      color = '#235789';
    }

    await addAccount({
      name: newAccName.trim(),
      type: newAccType,
      initialBalance: initialBal,
      institution: newAccInstitution.trim() || undefined,
      accountNumberMasked: newAccMasked.trim() || undefined,
      color,
      icon,
    });

    setNewAccName('');
    setNewAccBalance('');
    setNewAccInstitution('');
    setNewAccMasked('');
    setIsCreatingAccount(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editName.trim()) return;

    const initialBal = parseFloat(editBalance);

    await updateAccount(editingAccount.id, {
      name: editName.trim(),
      type: editType,
      initialBalance: isNaN(initialBal) ? editingAccount.initialBalance : initialBal,
      institution: editInstitution.trim() || undefined,
      accountNumberMasked: editMasked.trim() || undefined,
    });

    setEditingAccount(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    await deleteAccount(deletingAccount.id);
    setDeletingAccount(null);
  };

  const getAccountIcon = (type: AccountType, name: string) => {
    if (name.toLowerCase().includes('upi') || name.toLowerCase().includes('gpay') || name.toLowerCase().includes('paytm')) {
      return <Smartphone className="w-5 h-5" />;
    }
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      case 'credit':
        return <CreditCard className="w-5 h-5" />;
      case 'savings':
        return <Vault className="w-5 h-5" />;
      case 'cash':
      default:
        return <Banknote className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Apple-Style Net Worth Summary Card */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-ink-400 dark:text-ink-500 font-semibold block">
              Portfolio & Liquidity
            </span>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight mt-0.5">
              Net Worth: {formatCurrency(netWorth, currencySymbol, privacyMode)}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setTransferSourceId(undefined);
                setIsTransferOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-apple-blue/10 hover:bg-apple-blue/15 text-apple-blue text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>

            <button
              onClick={() => setIsCreatingAccount(true)}
              className="px-3.5 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue/90 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Account</span>
            </button>
          </div>
        </div>

        {/* Asset vs Liability Metric Breakdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">Total Liquid Assets</span>
            <span className="font-mono font-bold text-base sm:text-lg text-apple-green block mt-0.5">
              {formatCurrency(totalAssets, currencySymbol, privacyMode)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">Credit & Liabilities</span>
            <span className="font-mono font-bold text-base sm:text-lg text-apple-red block mt-0.5">
              {formatCurrency(totalLiabilities, currencySymbol, privacyMode)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] col-span-2 sm:col-span-1">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 block">Active Accounts</span>
            <span className="font-mono font-bold text-base sm:text-lg text-ink-900 dark:text-ink-100 block mt-0.5">
              {accounts.length} Sources
            </span>
          </div>
        </div>
      </div>

      {/* Apple Wallet Style Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          const isExpanded = expandedAccountId === acc.id;
          const accTxns = transactions.filter(
            t => t.accountId === acc.id || t.destinationAccountId === acc.id
          );
          const isNegative = acc.balance < 0;

          return (
            <motion.div
              key={acc.id}
              layout
              onClick={() => setExpandedAccountId(isExpanded ? null : acc.id)}
              className="apple-inset-group shadow-apple-card hover:shadow-apple-float transition-all p-5 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm"
                    style={{
                      backgroundColor: `${acc.color}15`,
                      borderColor: `${acc.color}35`,
                      color: acc.color,
                    }}
                  >
                    {getAccountIcon(acc.type, acc.name)}
                  </div>

                  <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-600 dark:text-ink-400 font-semibold mr-1">
                      {acc.type}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingAccount(acc)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-apple-red hover:bg-apple-red/10 transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                  {acc.name}
                </h3>
                <p className="text-xs font-mono text-ink-500 mb-4">
                  {acc.institution || (acc.type === 'cash' ? 'Physical Cash' : 'Personal Wallet')}
                  {acc.accountNumberMasked ? ` • ${acc.accountNumberMasked}` : ''}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono text-ink-400 block uppercase">
                    Available Balance
                  </span>
                  <span
                    className={`font-mono font-bold text-2xl block mt-0.5 ${
                      isNegative ? 'text-apple-red' : 'text-ink-900 dark:text-ink-100'
                    }`}
                  >
                    {formatCurrency(acc.balance, currencySymbol, privacyMode)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 text-[11px] font-mono text-ink-500 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <span>{accTxns.length} records</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransferSourceId(acc.id);
                      setIsTransferOpen(true);
                    }}
                    className="text-apple-blue font-semibold hover:underline"
                  >
                    Transfer Funds →
                  </button>
                </div>
              </div>

              {/* Progressive Disclosure: Mini-Statement */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]"
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="text-[10px] uppercase font-mono text-ink-400 font-semibold block mb-2">
                      Recent Activity
                    </span>
                    {accTxns.length === 0 ? (
                      <p className="text-xs text-ink-400 italic">No entries yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {accTxns.slice(0, 5).map(t => (
                          <div key={t.id} className="flex items-center justify-between text-xs py-1 border-b border-black/[0.02] dark:border-white/[0.02] last:border-b-0 font-mono">
                            <span className="truncate max-w-[130px]">{t.description}</span>
                            <span className={t.type === 'income' ? 'text-apple-green font-bold' : 'text-ink-800 dark:text-ink-200'}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currencySymbol, privacyMode)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Transfer Drawer Modal */}
      <AnimatePresence>
        {isTransferOpen && (
          <TransferModal
            initialFromId={transferSourceId}
            onClose={() => {
              setIsTransferOpen(false);
              setTransferSourceId(undefined);
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Account Modal */}
      <AnimatePresence>
        {isCreatingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-apple-float space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                  Create New Account
                </h3>
                <button
                  onClick={() => setIsCreatingAccount(false)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder='e.g. "HDFC Salary", "Cash Pouch", "Paytm Wallet"'
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-ink-900 dark:text-ink-100 outline-none focus:ring-2 focus:ring-apple-blue"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Account Type
                    </label>
                    <select
                      value={newAccType}
                      onChange={e => setNewAccType(e.target.value as AccountType)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-ink-900 dark:text-ink-100 outline-none"
                    >
                      <option value="cash">Physical Cash</option>
                      <option value="bank">Bank Account</option>
                      <option value="credit">Credit Card</option>
                      <option value="savings">Sinking Savings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Starting Balance ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={newAccBalance}
                      onChange={e => setNewAccBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 outline-none focus:ring-2 focus:ring-apple-blue"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingAccount(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-apple-blue hover:bg-apple-blue/90 text-white rounded-xl shadow-sm"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Account Modal */}
      <AnimatePresence>
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-apple-float space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                  Edit Account
                </h3>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-ink-900 dark:text-ink-100 outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Account Type
                    </label>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value as AccountType)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-ink-900 dark:text-ink-100 outline-none"
                    >
                      <option value="cash">Physical Cash</option>
                      <option value="bank">Bank Account</option>
                      <option value="credit">Credit Card</option>
                      <option value="savings">Sinking Savings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                      Base Balance ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editBalance}
                      onChange={e => setEditBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-mono text-ink-900 dark:text-ink-100 outline-none focus:ring-2 focus:ring-apple-blue"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-apple-blue hover:bg-apple-blue/90 text-white rounded-xl shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-red/30 shadow-apple-float space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-apple-red/15 text-apple-red flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-100">
                  Delete "{deletingAccount.name}"?
                </h3>
                <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                  This account and associated ledger balance will be removed. Existing transactions will remain intact.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setDeletingAccount(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-xs font-semibold bg-apple-red hover:bg-apple-red/90 text-white rounded-xl shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

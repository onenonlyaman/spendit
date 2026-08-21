import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  Building2,
  Check,
  CreditCard,
  Edit2,
  Plus,
  PlusCircle,
  ShieldCheck,
  Smartphone,
  Trash2,
  TrendingUp,
  Vault,
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

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editName.trim()) return;

    await updateAccount(editingAccount.id, {
      name: editName.trim(),
      type: editType,
      initialBalance: parseFloat(editBalance) || 0,
      institution: editInstitution.trim() || undefined,
      accountNumberMasked: editMasked.trim() || undefined,
    });

    setEditingAccount(null);
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deletingAccount) return;
    await deleteAccount(deletingAccount.id);
    setDeletingAccount(null);
  };

  const getAccountIcon = (type: AccountType, name: string) => {
    if (name.toLowerCase().includes('upi') || name.toLowerCase().includes('gpay') || name.toLowerCase().includes('paytm')) {
      return <Smartphone className="w-5 h-5" />;
    }
    switch (type) {
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      case 'credit':
        return <CreditCard className="w-5 h-5" />;
      case 'savings':
      case 'investment':
        return <Vault className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Header & Net Worth Vitals */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-paper-50 dark:bg-paper-dark-card p-6 rounded-2xl border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-archival-ochre font-bold">
            Ledger Asset & Liability Register
          </span>
          <h1 className="font-serif font-bold text-3xl text-ink-900 dark:text-ink-100 mt-1">
            Accounts & Vaults
          </h1>
          <p className="text-xs font-sans text-ink-600 dark:text-ink-400 mt-0.5">
            Real-time balances calculated directly from your ledger entries.
          </p>
        </div>

        {/* Net Worth Callout */}
        <div className="flex items-center space-x-6 bg-paper-100 dark:bg-paper-dark p-4 rounded-xl border border-paper-300 dark:border-paper-dark-border">
          <div>
            <span className="text-[11px] font-mono text-ink-500 block">Total Net Position</span>
            <span className="font-mono font-bold text-xl text-ink-900 dark:text-ink-100">
              {formatCurrency(netWorth, currencySymbol, privacyMode)}
            </span>
          </div>
          <div className="border-l border-paper-300 dark:border-paper-dark-border pl-4 space-y-0.5 text-xs font-mono">
            <div className="flex justify-between space-x-4">
              <span className="text-ink-500">Assets:</span>
              <span className="font-semibold text-archival-green">
                {formatCurrency(totalAssets, currencySymbol, privacyMode)}
              </span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-ink-500">Liabilities:</span>
              <span className="font-semibold text-archival-red">
                {formatCurrency(totalLiabilities, currencySymbol, privacyMode)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setTransferSourceId(undefined);
              setIsTransferOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-paper-200 hover:bg-paper-300 dark:bg-paper-dark-card text-xs font-mono text-ink-800 dark:text-ink-200 border border-paper-300 dark:border-paper-dark-border flex items-center space-x-1.5 shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-archival-blue" />
            <span>Transfer Between Accounts</span>
          </button>
        </div>

        <button
          onClick={() => setIsCreatingAccount(true)}
          className="px-3.5 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-paper-200 text-paper-50 dark:text-ink-900 text-xs font-sans font-semibold flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map(acc => {
          const accTxns = transactions.filter(
            t => t.accountId === acc.id || t.destinationAccountId === acc.id
          );
          const isNegative = acc.balance < 0;

          return (
            <div
              key={acc.id}
              className="relative p-5 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger hover:shadow-ledger-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm"
                    style={{
                      backgroundColor: `${acc.color}15`,
                      borderColor: `${acc.color}35`,
                      color: acc.color,
                    }}
                  >
                    {getAccountIcon(acc.type, acc.name)}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-paper-200 dark:bg-paper-dark text-ink-600 border border-paper-300 mr-1">
                      {acc.type}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1 rounded text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingAccount(acc)}
                      className="p-1 rounded text-ink-400 hover:text-archival-red transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100 leading-snug">
                  {acc.name}
                </h3>
                <p className="text-xs font-mono text-ink-500 mb-4">
                  {acc.institution || (acc.type === 'cash' ? 'Physical Cash' : 'Personal Account')}
                  {acc.accountNumberMasked ? ` • ${acc.accountNumberMasked}` : ''}
                </p>
              </div>

              <div className="pt-3 border-t border-paper-200 dark:border-paper-dark-border">
                <span className="text-[10px] font-mono text-ink-400 block uppercase">
                  Reconciled Ledger Balance
                </span>
                <span
                  className={`font-mono font-bold text-2xl block mt-0.5 ${
                    isNegative ? 'text-archival-red' : 'text-ink-900 dark:text-ink-100'
                  }`}
                >
                  {formatCurrency(acc.balance, currencySymbol, privacyMode)}
                </span>

                <div className="flex items-center justify-between mt-3 pt-2 text-[11px] font-mono text-ink-500 border-t border-paper-200/50">
                  <span>{accTxns.length} records</span>
                  <button
                    onClick={() => {
                      setTransferSourceId(acc.id);
                      setIsTransferOpen(true);
                    }}
                    className="text-archival-blue font-semibold hover:underline"
                  >
                    Transfer Funds →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
                Edit Ledger Account
              </h3>
              <button onClick={() => setEditingAccount(null)} className="p-1 text-ink-400 hover:text-ink-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Account Type</label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                >
                  <option value="cash">Cash / UPI / Wallet</option>
                  <option value="bank">Bank Checking / Savings (Debit)</option>
                  <option value="credit">Credit Card (Liability)</option>
                  <option value="savings">Savings Vault / Gold Reserve</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">
                  Starting / Opening Balance ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={editBalance}
                  onChange={e => setEditBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs font-mono border border-paper-300 dark:border-paper-dark-border"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">
                  Institution / Provider Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, Paytm, Leather Wallet"
                  value={editInstitution}
                  onChange={e => setEditInstitution(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">
                  Masked Number / Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. •••• 4821"
                  value={editMasked}
                  onChange={e => setEditMasked(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 dark:bg-paper-dark text-xs border border-paper-300 dark:border-paper-dark-border"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3 py-1.5 text-xs text-ink-600 hover:bg-paper-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ink-900 text-paper-50 text-xs font-semibold rounded shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border border-archival-red/40 p-5 space-y-4">
            <div className="flex items-center space-x-2 text-archival-red">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg">
                Delete Account: {deletingAccount.name}?
              </h3>
            </div>

            <p className="text-xs font-sans text-ink-600 dark:text-ink-400 leading-relaxed">
              Are you sure you want to remove this account? Any recorded entries linked to this account will remain safely in your past journal.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-paper-300">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="px-3.5 py-1.5 text-xs text-ink-600 hover:bg-paper-200 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccountConfirm}
                className="px-4 py-1.5 bg-archival-red text-paper-50 text-xs font-semibold rounded shadow-sm"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {isCreatingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-paper-50 dark:bg-paper-dark-card rounded-2xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-100">
                Create New Ledger Account
              </h3>
              <button onClick={() => setIsCreatingAccount(false)} className="p-1 text-ink-400 hover:text-ink-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBI Savings, GPay UPI, Cash Envelope, Axis Card"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs border border-paper-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">Account Type</label>
                <select
                  value={newAccType}
                  onChange={e => setNewAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs border border-paper-300"
                >
                  <option value="cash">Cash / UPI / Digital Wallet</option>
                  <option value="bank">Bank Checking / Savings (Debit)</option>
                  <option value="credit">Credit Card (Liability)</option>
                  <option value="savings">Savings Vault / Gold Reserve</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">
                  Starting Opening Balance ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={newAccBalance}
                  onChange={e => setNewAccBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs font-mono border border-paper-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-600 mb-1">
                  Institution / Provider (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC, SBI, ICICI, Paytm"
                  value={newAccInstitution}
                  onChange={e => setNewAccInstitution(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-paper-100 text-xs border border-paper-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-paper-300">
                <button
                  type="button"
                  onClick={() => setIsCreatingAccount(false)}
                  className="px-3 py-1.5 text-xs text-ink-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ink-900 text-paper-50 text-xs font-semibold rounded"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferOpen && (
        <TransferModal
          initialFromId={transferSourceId}
          onClose={() => setIsTransferOpen(false)}
        />
      )}
    </div>
  );
};

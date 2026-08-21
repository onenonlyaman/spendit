import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Coins,
  Download,
  Eye,
  FileSpreadsheet,
  HardDrive,
  Printer,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { exportTransactionsToCSV } from '../../lib/utils';
import { PrintableJournalModal } from '../common/PrintableJournalModal';
import { OnboardingGuideModal } from '../common/OnboardingGuideModal';
import { UpdateModal } from '../common/UpdateModal';
import { sounds } from '../../lib/audioHaptics';
import {
  AppUpdateState,
  checkForAppUpdates,
  CURRENT_APP_VERSION,
  openGitHubReleases,
} from '../../lib/updater';
import {
  ensureNotificationPermission,
  sendNativeNotification,
} from '../../lib/notifications';
import { Bell, Check, Globe, RefreshCcw } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    currencySymbol,
    setCurrencySymbol,
    privacyMode,
    togglePrivacyMode,
    exportBackup,
    importBackup,
    resetAllData,
  } = useFinance();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [printableModalScope, setPrintableModalScope] = useState<'day' | 'month' | 'all' | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => sounds.isEnabled());

  // Updates & Notifications State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateState, setUpdateState] = useState<AppUpdateState | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateCheckStatus, setUpdateCheckStatus] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spendit_notifications_enabled') !== 'false';
  });
  const [billAlertsEnabled, setBillAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spendit_bill_alerts_enabled') !== 'false';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckStatus('Checking GitHub Releases for updates...');

    try {
      const res = await checkForAppUpdates();
      setUpdateState(res);
      if (res.available) {
        setUpdateCheckStatus(`Found ${res.kind === 'upgrade' ? 'upgrade' : 'update'} v${res.newVersion}!`);
        setShowUpdateModal(true);
      } else if (res.error) {
        setUpdateCheckStatus(`Status: ${res.error}`);
      } else {
        setUpdateCheckStatus(`✓ SpendIt is up to date (v${CURRENT_APP_VERSION})`);
        setTimeout(() => setUpdateCheckStatus(null), 5000);
      }

    } catch (err: any) {
      setUpdateCheckStatus('Could not check updates: ' + (err?.message || 'Offline'));
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleTestNotification = async () => {
    const granted = await ensureNotificationPermission();
    if (granted) {
      await sendNativeNotification(
        '🔔 SpendIt Native Desktop Alert',
        'Windows toast notifications are successfully connected and working perfectly!'
      );
    } else {
      alert('Notification permissions are not enabled in Windows Settings.');
    }
  };


  const currencies = [
    { symbol: '₹', name: 'Indian Rupee (₹) — Default' },
    { symbol: '$', name: 'US Dollar ($)' },
    { symbol: '€', name: 'Euro (€)' },
    { symbol: '£', name: 'British Pound (£)' },
    { symbol: '¥', name: 'Japanese Yen (¥)' },
    { symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  ];

  const handleExportJSON = async () => {
    const backupData = await exportBackup();
    const jsonStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendit-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvStr = exportTransactionsToCSV(transactions, accounts, categories);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendit-ledger-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      const ok = await importBackup(content);
      if (ok) {
        setImportStatus('✓ Ledger successfully restored!');
      } else {
        setImportStatus('✕ Invalid backup archive file.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="bg-paper-50 dark:bg-paper-dark-card p-6 rounded-2xl border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="SpendIt Logo" className="w-14 h-14 rounded-2xl object-contain shadow-md border border-paper-200 dark:border-paper-dark-border" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono tracking-widest text-archival-ochre font-bold">
                Ledger Preferences & Archival Tools
              </span>
            </div>
            <h1 className="font-serif font-bold text-3xl text-ink-900 dark:text-ink-100 mt-1">
              Settings & Sovereignty
            </h1>
            <p className="text-xs font-sans text-ink-600 dark:text-ink-400 mt-0.5">
              Your financial journal stays strictly private on your personal device. Zero tracking. Zero cloud lock-in.
            </p>
          </div>
        </div>


        <button
          onClick={() => setIsOnboardingModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-paper-200 hover:bg-paper-300 dark:bg-paper-dark dark:hover:bg-paper-dark-border text-ink-800 dark:text-ink-200 text-xs font-mono font-semibold flex items-center space-x-1.5 border border-paper-300 dark:border-paper-dark-border self-start sm:self-auto min-h-[36px]"
        >
          <span>📖 Journal Guide</span>
        </button>
      </div>

      {/* Printable Archival PDF Section */}
      <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger space-y-4">
        <div className="flex items-center space-x-2 border-b border-paper-300 dark:border-paper-dark-border pb-2">
          <Printer className="w-4 h-4 text-archival-ochre" />
          <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
            Printable Archival Ledger PDF
          </h3>
        </div>

        <p className="text-xs font-sans text-ink-600 dark:text-ink-400 leading-relaxed">
          Generate an authentic physical journal folio sheet or monthly book. Ready for printing, binder archival, or personal records.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => setPrintableModalScope('day')}
            className="p-3.5 rounded-xl bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 dark:hover:bg-paper-dark-border/40 border border-paper-300 dark:border-paper-dark-border flex flex-col items-center justify-center space-y-1.5 transition-all text-center group"
          >
            <Printer className="w-5 h-5 text-archival-ochre group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-semibold text-ink-900 dark:text-ink-100">
              Today's Folio Sheet
            </span>
            <span className="text-[10px] text-ink-400">Daily ruled page with margin notes</span>
          </button>

          <button
            onClick={() => setPrintableModalScope('month')}
            className="p-3.5 rounded-xl bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 dark:hover:bg-paper-dark-border/40 border border-paper-300 dark:border-paper-dark-border flex flex-col items-center justify-center space-y-1.5 transition-all text-center group"
          >
            <Printer className="w-5 h-5 text-archival-blue group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-semibold text-ink-900 dark:text-ink-100">
              Monthly Chapter Volume
            </span>
            <span className="text-[10px] text-ink-400">Month vitals, envelopes & records</span>
          </button>

          <button
            onClick={() => setPrintableModalScope('all')}
            className="p-3.5 rounded-xl bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 dark:hover:bg-paper-dark-border/40 border border-paper-300 dark:border-paper-dark-border flex flex-col items-center justify-center space-y-1.5 transition-all text-center group"
          >
            <Printer className="w-5 h-5 text-archival-green group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-semibold text-ink-900 dark:text-ink-100">
              Complete Audit Book
            </span>
            <span className="text-[10px] text-ink-400">Full historical ledger register</span>
          </button>
        </div>
      </div>

      {/* Currency & Presentation Preferences */}
      <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger space-y-4">
        <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100 border-b border-paper-300 dark:border-paper-dark-border pb-2">
          Journal Currency & Masking
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-ink-600 dark:text-ink-400 mb-1">
              Primary Currency Symbol
            </label>
            <select
              value={currencySymbol}
              onChange={e => setCurrencySymbol(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs min-h-[38px]"
            >
              {currencies.map(c => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-600 dark:text-ink-400 mb-1">
              Public Privacy Mask Mode
            </label>
            <button
              onClick={togglePrivacyMode}
              className="w-full px-3 py-2 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs flex items-center justify-between min-h-[38px]"
            >
              <span>{privacyMode ? 'Masked (••••••)' : 'Unmasked (Public)'}</span>
              <span className="font-mono text-[10px] text-archival-ochre">Key: 'P'</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-600 dark:text-ink-400 mb-1">
              Tactile Sound & Acoustic Effects
            </label>
            <button
              onClick={() => {
                const next = !hapticsEnabled;
                setHapticsEnabled(next);
                sounds.setEnabled(next);
                if (next) sounds.playCoinChime();
              }}
              className="w-full px-3 py-2 rounded-lg bg-paper-100 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 dark:border-paper-dark-border text-xs flex items-center justify-between min-h-[38px]"
            >
              <span>{hapticsEnabled ? '🔊 Sound Enabled' : '🔇 Muted'}</span>
              <span className="font-mono text-[10px] text-archival-ochre">
                {hapticsEnabled ? 'Stamps & Coins' : 'Silent'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Sovereignty & Portability */}
      <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger space-y-4">
        <div className="flex items-center space-x-2 border-b border-paper-300 dark:border-paper-dark-border pb-2">
          <HardDrive className="w-4 h-4 text-archival-brass" />
          <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
            Journal Portability & Offline Backups
          </h3>
        </div>

        <p className="text-xs font-sans text-ink-600 dark:text-ink-400 leading-relaxed">
          SpendIt maintains your records with complete financial integrity. You can export complete journal archives, download spreadsheet registers, or restore previous books at any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export Journal Archive */}
          <button
            onClick={handleExportJSON}
            className="p-3 rounded-xl bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 border border-paper-300 dark:border-paper-dark-border flex flex-col items-center justify-center space-y-1.5 transition-colors text-center"
          >
            <Download className="w-5 h-5 text-archival-green" />
            <span className="text-xs font-mono font-semibold text-ink-800 dark:text-ink-200">
              Export Journal Archive
            </span>
            <span className="text-[10px] text-ink-400">All accounts, goals & ledger entries</span>
          </button>

          {/* Export Spreadsheet Register */}
          <button
            onClick={handleExportCSV}
            className="p-3 rounded-xl bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 border border-paper-300 dark:border-paper-dark-border flex flex-col items-center justify-center space-y-1.5 transition-colors text-center"
          >
            <FileSpreadsheet className="w-5 h-5 text-archival-blue" />
            <span className="text-xs font-mono font-semibold text-ink-800 dark:text-ink-200">
              Export Spreadsheet Register
            </span>
            <span className="text-[10px] text-ink-400">Excel / Sheets compatible</span>
          </button>

          {/* Restore Journal Archive */}
          <label className="cursor-pointer p-3 rounded-xl bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 border border-paper-300 dark:border-paper-dark-border flex flex-col items-center justify-center space-y-1.5 transition-colors text-center">
            <Upload className="w-5 h-5 text-archival-ochre" />
            <span className="text-xs font-mono font-semibold text-ink-800 dark:text-ink-200">
              Restore Journal File
            </span>
            <span className="text-[10px] text-ink-400">Upload backup archive file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="p-2.5 rounded-lg bg-archival-ochre/15 text-archival-ochre text-xs font-mono text-center font-bold">
            {importStatus}
          </div>
        )}
      </div>

      {/* Software Updates & OTA Channel */}
      <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger space-y-4">
        <div className="flex items-center justify-between border-b border-paper-200 dark:border-paper-dark-border pb-3">
          <div className="flex items-center space-x-2">
            <RefreshCcw className="w-4 h-4 text-archival-ochre" />
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
              Software Releases & In-App Updates
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-archival-ochre/15 text-archival-ochre">
            v{CURRENT_APP_VERSION}
          </span>
        </div>

        <p className="text-xs font-sans text-ink-600 dark:text-ink-400 leading-relaxed">
          SpendIt is open-source and distributed securely via GitHub Releases. Minor and patch updates can be applied over-the-air seamlessly without touching your local database.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCheckForUpdates}
            disabled={isCheckingUpdate}
            className="px-4 py-2 bg-archival-ochre hover:bg-archival-ochre-dark disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            <span>{isCheckingUpdate ? 'Checking Releases...' : 'Check for Updates'}</span>
          </button>

          <button
            onClick={openGitHubReleases}
            className="px-4 py-2 bg-paper-200 hover:bg-paper-300 dark:bg-paper-dark dark:hover:bg-paper-dark-border text-ink-800 dark:text-ink-200 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-colors border border-paper-300 dark:border-paper-dark-border"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GitHub Releases Page</span>
          </button>
        </div>

        {updateCheckStatus && (
          <div className="p-3 bg-paper-100 dark:bg-paper-dark rounded-xl border border-paper-200 dark:border-paper-dark-border text-xs font-mono text-ink-700 dark:text-ink-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-archival-ochre flex-shrink-0" />
            <span>{updateCheckStatus}</span>
          </div>
        )}
      </div>

      {/* Native Desktop Notifications */}
      <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-paper-300 dark:border-paper-dark-border shadow-ledger space-y-4">
        <div className="flex items-center justify-between border-b border-paper-200 dark:border-paper-dark-border pb-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-forest-700 dark:text-forest-400" />
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">
              Native Windows Notifications
            </h3>
          </div>
        </div>

        <p className="text-xs font-sans text-ink-600 dark:text-ink-400 leading-relaxed">
          Receive native Windows 10/11 desktop toast reminders for daily journaling and recurring bill deadlines.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-paper-100 dark:bg-paper-dark border border-paper-200 dark:border-paper-dark-border">
            <div>
              <p className="text-xs font-mono font-bold text-ink-800 dark:text-ink-200">
                Daily Evening Journal Prompt (9:00 PM)
              </p>
              <p className="text-[11px] text-ink-500">
                Gentle reminder to review daily ledger and seal the day's reflection
              </p>
            </div>
            <button
              onClick={() => {
                const next = !notificationsEnabled;
                setNotificationsEnabled(next);
                localStorage.setItem('spendit_notifications_enabled', String(next));
                if (next) ensureNotificationPermission();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${notificationsEnabled ? 'bg-forest-700' : 'bg-paper-300 dark:bg-paper-dark-border'}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-paper-100 dark:bg-paper-dark border border-paper-200 dark:border-paper-dark-border">
            <div>
              <p className="text-xs font-mono font-bold text-ink-800 dark:text-ink-200">
                Recurring Bill Due Alerts
              </p>
              <p className="text-[11px] text-ink-500">
                Toast notification when rent, electricity, or subscriptions are due today
              </p>
            </div>
            <button
              onClick={() => {
                const next = !billAlertsEnabled;
                setBillAlertsEnabled(next);
                localStorage.setItem('spendit_bill_alerts_enabled', String(next));
                if (next) ensureNotificationPermission();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${billAlertsEnabled ? 'bg-forest-700' : 'bg-paper-300 dark:bg-paper-dark-border'}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${billAlertsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleTestNotification}
          className="px-3.5 py-1.5 bg-paper-200 hover:bg-paper-300 dark:bg-paper-dark dark:hover:bg-paper-dark-border text-ink-800 dark:text-ink-200 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border border-paper-300 dark:border-paper-dark-border transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Send Test Windows Notification</span>
        </button>
      </div>

      {/* Danger Zone: Ledger Reset */}
      <div className="p-6 rounded-2xl bg-paper-50 dark:bg-paper-dark-card border-2 border-archival-red/30 shadow-ledger space-y-4">
        <div className="flex items-center space-x-2 border-b border-archival-red/20 pb-2">
          <AlertTriangle className="w-4 h-4 text-archival-red" />
          <h3 className="font-serif font-bold text-base text-archival-red">
            Danger Zone • Ledger Reset
          </h3>
        </div>


        <p className="text-xs font-sans text-ink-600 dark:text-ink-400 leading-relaxed">
          Reset the journal and clear all transaction records, accounts, notes, and money jars back to clean blank pages.
        </p>

        {showResetConfirm ? (
          <div className="p-4 rounded-xl bg-archival-red-light dark:bg-archival-red/20 border border-archival-red space-y-3">
            <p className="text-xs font-mono text-archival-red font-bold">
              ⚠ This action cannot be undone. All recorded journal entries and custom accounts will be permanently cleared.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={async () => {
                  await resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-archival-red text-paper-50 font-mono text-xs font-bold hover:bg-archival-red/90 transition-colors shadow-sm"
              >
                Permanently Clear Journal
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-ink-700 dark:text-ink-300 font-mono text-xs hover:bg-paper-200 dark:hover:bg-paper-dark"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-lg bg-archival-red-light dark:bg-archival-red/15 text-archival-red border border-archival-red/40 hover:bg-archival-red/20 font-mono text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Ledger to Fresh Clean State</span>
          </button>
        )}
      </div>

      {/* Printable Modal */}
      {printableModalScope && (
        <PrintableJournalModal
          defaultScope={printableModalScope}
          onClose={() => setPrintableModalScope(null)}
        />
      )}

      {/* Onboarding Guide Modal */}
      {isOnboardingModalOpen && (
        <OnboardingGuideModal
          onClose={() => setIsOnboardingModalOpen(false)}
        />
      )}

      {/* Software Update / Upgrade Modal */}
      {showUpdateModal && updateState && (
        <UpdateModal
          updateState={updateState}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
};


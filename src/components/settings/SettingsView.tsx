import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Coins,
  Download,
  Eye,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Moon,
  Printer,
  RefreshCcw,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { exportTransactionsToCSV } from '../../lib/utils';
import { PrintableJournalModal } from '../common/PrintableJournalModal';
import { OnboardingGuideModal } from '../common/OnboardingGuideModal';
import { UpdateModal } from '../common/UpdateModal';
import { AppleSwitch } from '../ui/apple-switch';
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

export const SettingsView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    currencySymbol,
    setCurrencySymbol,
    privacyMode,
    togglePrivacyMode,
    theme,
    toggleTheme,
    performanceMode,
    togglePerformanceMode,
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
    setUpdateCheckStatus('Checking for latest releases...');

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
        '🔔 SpendIt System Notification',
        'Native notifications are working smoothly.'
      );
    }
  };

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const granted = await ensureNotificationPermission();
      if (!granted) return;
    }
    setNotificationsEnabled(val);
    localStorage.setItem('spendit_notifications_enabled', val ? 'true' : 'false');
  };

  const handleToggleBillAlerts = (val: boolean) => {
    setBillAlertsEnabled(val);
    localStorage.setItem('spendit_bill_alerts_enabled', val ? 'true' : 'false');
  };

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

  const currencies = [
    { symbol: '₹', name: 'Indian Rupee (₹)' },
    { symbol: '$', name: 'US Dollar ($)' },
    { symbol: '€', name: 'Euro (€)' },
    { symbol: '£', name: 'British Pound (£)' },
    { symbol: '¥', name: 'Japanese Yen (¥)' },
    { symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="apple-glass-card rounded-3xl p-6 space-y-1">
        <span className="text-xs uppercase font-mono tracking-wider text-ink-400 dark:text-ink-500 font-semibold block">
          Configuration & Sovereignty
        </span>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight">
          Settings
        </h1>
      </div>

      {/* Section 1: App Preferences */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-400 font-semibold px-3 block">
          Preferences & Acoustics
        </span>

        <div className="apple-inset-group shadow-apple-card divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {/* Currency Row */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Primary Currency
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Default symbol for amounts
              </span>
            </div>

            <select
              value={currencySymbol}
              onChange={e => setCurrencySymbol(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-xs font-semibold text-ink-900 dark:text-ink-100 outline-none cursor-pointer"
            >
              {currencies.map(c => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Mask Toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Privacy Mode
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Mask amounts in public view (Key: P)
              </span>
            </div>

            <AppleSwitch
              checked={privacyMode}
              onChange={togglePrivacyMode}
              color="blue"
              aria-label="Toggle Privacy Mode"
            />
          </div>

          {/* Acoustic Haptics Toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Acoustic Haptics & Sounds
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Page turns, wax stamps, and coin chimes
              </span>
            </div>

            <AppleSwitch
              checked={hapticsEnabled}
              onChange={(next) => {
                setHapticsEnabled(next);
                sounds.setEnabled(next);
                if (next) sounds.playCoinChime();
              }}
              color="green"
              aria-label="Toggle Acoustic Haptics"
            />
          </div>

          {/* Visual Profile / Performance Mode Toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Performance Profile
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                {performanceMode
                  ? 'High Speed: Blurs & springs disabled for ultra-low GPU load'
                  : 'Rich Appearance: Translucent blurs & fluid spring physics'}
              </span>
            </div>

            <AppleSwitch
              checked={performanceMode}
              onChange={togglePerformanceMode}
              color="orange"
              aria-label="Toggle Performance Profile"
            />
          </div>

          {/* First-Run Guide Trigger */}
          <button
            onClick={() => setIsOnboardingModalOpen(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Journal Guide & Tutorial
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Re-open interactive shorthand walkthrough
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-400" />
          </button>
        </div>
      </div>

      {/* Section 2: Notifications & Updates */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-400 font-semibold px-3 block">
          System & Notifications
        </span>

        <div className="apple-inset-group shadow-apple-card divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {/* Bill Reminders Toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Recurring Bill Due Reminders
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Toast notifications when commitments are due
              </span>
            </div>

            <AppleSwitch
              checked={billAlertsEnabled}
              onChange={(next) => handleToggleBillAlerts(next)}
              color="green"
              aria-label="Toggle Recurring Bill Reminders"
            />
          </div>

          {/* Check Updates Row */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                SpendIt Desktop v{CURRENT_APP_VERSION}
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                {updateCheckStatus || 'Offline-first release'}
              </span>
            </div>

            <button
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdate}
              className="px-3 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blue/90 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isCheckingUpdate ? 'Checking...' : 'Check Updates'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Data Export & Archiving */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-400 font-semibold px-3 block">
          Export & Portability
        </span>

        <div className="apple-inset-group shadow-apple-card divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {/* Export PDF Book */}
          <button
            onClick={() => setPrintableModalScope('all')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Print Complete Historical Folio
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Export vector printable PDF document
              </span>
            </div>
            <Printer className="w-4 h-4 text-apple-blue" />
          </button>

          {/* Export JSON Backup */}
          <button
            onClick={handleExportJSON}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Export Journal JSON Backup
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Download complete backup file
              </span>
            </div>
            <Download className="w-4 h-4 text-apple-green" />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Export Spreadsheet CSV
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                Excel / Numbers compatible register
              </span>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-apple-orange" />
          </button>

          {/* Restore JSON */}
          <label className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Restore Journal Archive
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                {importStatus || 'Upload .json backup'}
              </span>
            </div>
            <Upload className="w-4 h-4 text-apple-indigo" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Section 4: Destructive Zone */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-apple-red font-semibold px-3 block">
          Reset Zone
        </span>

        <div className="apple-inset-group shadow-apple-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-apple-red block">
              Erase & Reset All Data
            </span>
            <span className="text-[11px] font-mono text-ink-400">
              Clear all transactions, accounts, and goal envelopes
            </span>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 rounded-xl bg-apple-red/10 hover:bg-apple-red/20 text-apple-red text-xs font-semibold transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
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
                  Reset All Ledger Data?
                </h3>
                <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                  This action is irreversible. All transactions, accounts, and goals will be wiped.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetAllData();
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-apple-red hover:bg-apple-red/90 text-white rounded-xl shadow-sm"
                >
                  Erase Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Modal */}
      <AnimatePresence>
        {printableModalScope && (
          <PrintableJournalModal
            defaultScope={printableModalScope}
            onClose={() => setPrintableModalScope(null)}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Guide Modal */}
      <AnimatePresence>
        {isOnboardingModalOpen && (
          <OnboardingGuideModal onClose={() => setIsOnboardingModalOpen(false)} />
        )}
      </AnimatePresence>

      {/* Update Modal */}
      <AnimatePresence>
        {showUpdateModal && updateState && (
          <UpdateModal
            updateState={updateState}
            onClose={() => setShowUpdateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Download,
  Eye,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Moon,
  Plus,
  Printer,
  RefreshCcw,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Vault,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CustomReminder } from '../../types';
import { exportTransactionsToCSV } from '../../lib/utils';
import { PrintableJournalModal } from '../common/PrintableJournalModal';
import { OnboardingGuideModal } from '../common/OnboardingGuideModal';
import { UpdateModal } from '../common/UpdateModal';
import { CustomReminderModal } from '../common/CustomReminderModal';
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
  sendTestNotification,
} from '../../lib/notifications';

export const SettingsView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    reminders,
    toggleReminder,
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

  const { success, error } = useToast();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [hasExportedBeforeReset, setHasExportedBeforeReset] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [printableModalScope, setPrintableModalScope] = useState<'day' | 'month' | 'all' | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [selectedReminderForEdit, setSelectedReminderForEdit] = useState<CustomReminder | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
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
    try {
      const backupData = await exportBackup();
      const jsonStr =
        typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spendit-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setHasExportedBeforeReset(true);
      success('Backup downloaded', `${transactions.length} entries saved to your device.`);
    } catch (err) {
      error(
        'Backup failed',
        err instanceof Error ? err.message : 'Could not write the backup file.'
      );
    }
  };

  const handleExportCSV = () => {
    try {
      const csvStr = exportTransactionsToCSV(transactions, accounts, categories);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spendit-ledger-entries-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      success('Spreadsheet downloaded', `${transactions.length} entries exported as CSV.`);
    } catch (err) {
      error('Export failed', err instanceof Error ? err.message : 'Could not write the CSV file.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => {
      setImportStatus('Could not read that file');
      error('Restore failed', 'That file could not be read from disk.');
    };
    reader.onload = async event => {
      const content = event.target?.result as string;
      setImportStatus('Restoring…');
      const ok = await importBackup(content);
      if (ok) {
        setImportStatus('Restored');
        success('Ledger restored', 'Your entries, accounts, and jars are back.');
      } else {
        setImportStatus('That file is not a SpendIt backup');
        error(
          'Restore failed',
          'That file is not a SpendIt backup, or it is damaged. Your current ledger is untouched.'
        );
      }
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
        <span className="text-xs uppercase tracking-wide text-secondary font-semibold block">
          General
        </span>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 tracking-tight">
          Settings
        </h1>
      </div>

      {/* Section 1: App Preferences */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold px-3 block">
          Preferences & Acoustics
        </span>

        <div className="apple-inset-group shadow-apple-card divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {/* Currency Row */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Primary Currency
              </span>
              <span className="text-xs text-secondary">
                Default symbol for amounts
              </span>
            </div>

            <select
              value={currencySymbol}
              onChange={e => setCurrencySymbol(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-xs font-semibold text-ink-900 dark:text-ink-100 focus-ring cursor-pointer"
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
              <span className="text-xs text-secondary">
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
              <span className="text-xs text-secondary">
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
              <span className="text-xs text-secondary">
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
              <span className="text-xs text-secondary">
                Re-open interactive shorthand walkthrough
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </div>

      {/* Section 2: Custom Reminders & Notifications */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold">
            Custom Reminders & Folio Alerts
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedReminderForEdit(null);
              setIsReminderModalOpen(true);
            }}
            className="text-xs font-semibold text-accent hover:text-accent/80 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Reminder</span>
          </button>
        </div>

        <div className="apple-inset-group shadow-apple-card divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {/* Master Notifications Toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Enable Scheduled Reminders
              </span>
              <span className="text-xs text-secondary">
                Receive native desktop toasts on your scheduled time
              </span>
            </div>

            <AppleSwitch
              checked={notificationsEnabled}
              onChange={(next) => handleToggleNotifications(next)}
              color="blue"
              aria-label="Toggle Scheduled Reminders"
            />
          </div>

          {/* List of Custom Reminders */}
          {reminders.map((reminder) => {
            let frequencyLabel = 'Daily';
            if (reminder.frequency === 'weekdays') frequencyLabel = 'Weekdays (Mon-Fri)';
            else if (reminder.frequency === 'weekends') frequencyLabel = 'Weekends';
            else if (reminder.frequency === 'weekly') {
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              frequencyLabel = `Weekly on ${dayNames[reminder.dayOfWeek ?? 0]}`;
            } else if (reminder.frequency === 'monthly') {
              frequencyLabel = `Monthly on day ${reminder.dayOfMonth ?? 1}`;
            }

            return (
              <div
                key={reminder.id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReminderForEdit(reminder);
                    setIsReminderModalOpen(true);
                  }}
                  className="flex-1 flex items-center space-x-3 text-left overflow-hidden group"
                >
                  <div className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {reminder.action === 'log_day' ? (
                      <BookOpen className="w-4 h-4" />
                    ) : reminder.action === 'review_jars' ? (
                      <Vault className="w-4 h-4 text-apple-orange" />
                    ) : reminder.action === 'check_budget' ? (
                      <Coins className="w-4 h-4 text-apple-green" />
                    ) : reminder.action === 'reconcile' ? (
                      <Check className="w-4 h-4 text-apple-indigo" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 truncate">
                        {reminder.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-xs font-mono text-ink-600 dark:text-ink-300 flex-shrink-0">
                        {reminder.time}
                      </span>
                    </div>
                    <p className="text-xs text-secondary truncate">
                      {frequencyLabel} • {reminder.body}
                    </p>
                  </div>
                </button>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <AppleSwitch
                    checked={reminder.enabled && notificationsEnabled}
                    disabled={!notificationsEnabled}
                    onChange={() => toggleReminder(reminder.id)}
                    color="green"
                    aria-label={`Toggle reminder ${reminder.title}`}
                  />
                </div>
              </div>
            );
          })}

          {/* Bill Reminders Toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Recurring Bill Due Reminders
              </span>
              <span className="text-xs text-secondary">
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

          {/* Test Notification Row */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                Test System Notifications
              </span>
              <span className="text-xs text-secondary">
                Send an immediate test alert to verify permissions
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                await sendTestNotification();
                sounds.playCoinChime();
              }}
              className="px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-ink-800 dark:text-ink-200 text-xs font-semibold transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Send Test</span>
            </button>
          </div>

          {/* Check Updates Row */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-ink-100 block">
                SpendIt Desktop v{CURRENT_APP_VERSION}
              </span>
              <span className="text-xs text-secondary">
                {updateCheckStatus || 'Offline-first release'}
              </span>
            </div>

            <button
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdate}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isCheckingUpdate ? 'Checking...' : 'Check Updates'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Data Export & Archiving */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-secondary font-semibold px-3 block">
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
              <span className="text-xs text-secondary">
                Export vector printable PDF document
              </span>
            </div>
            <Printer className="w-4 h-4 text-accent" />
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
              <span className="text-xs text-secondary">
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
              <span className="text-xs text-secondary">
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
              <span className="text-xs text-secondary">
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
        <span className="text-xs font-semibold uppercase tracking-wide text-apple-red font-semibold px-3 block">
          Reset Zone
        </span>

        <div className="apple-inset-group shadow-apple-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-apple-red block">
              Erase & Reset All Data
            </span>
            <span className="text-xs text-secondary">
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

      {/* Reset Confirmation — irreversible, so it is gated on a typed phrase */}
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={async () => {
          try {
            await resetAllData();
            setShowResetConfirm(false);
            setHasExportedBeforeReset(false);
            success('Ledger erased', 'SpendIt is back to a blank folio.');
          } catch (err) {
            error(
              'Erase failed',
              err instanceof Error ? err.message : 'The ledger was not changed.'
            );
          }
        }}
        title="Erase everything?"
        body={
          <>
            SpendIt keeps your ledger only on this device. There is no cloud copy and no way to
            undo this — once erased, these records are gone for good.
          </>
        }
        consequences={[
          { label: 'Entries', value: transactions.length },
          { label: 'Accounts', value: accounts.length },
          { label: 'Categories', value: categories.length },
          { label: 'Reminders', value: reminders.length },
        ]}
        safeAction={{
          label: hasExportedBeforeReset ? 'Download another backup' : 'Download a backup first',
          onClick: handleExportJSON,
          hint: hasExportedBeforeReset
            ? 'Backup saved. You can restore it later from Export & Portability.'
            : 'Saves a .json file you can restore from later.',
        }}
        requirePhrase="ERASE"
        confirmLabel="Erase everything"
        cancelLabel="Keep my ledger"
      />

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

      {/* Custom Reminder Modal */}
      <AnimatePresence>
        {isReminderModalOpen && (
          <CustomReminderModal
            initialReminder={selectedReminderForEdit}
            onClose={() => {
              setIsReminderModalOpen(false);
              setSelectedReminderForEdit(null);
            }}
          />
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

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { AccountsView } from './components/accounts/AccountsView';
import { ChaptersView } from './components/chapters/ChaptersView';
import { Navigation } from './components/common/Navigation';
import { OnboardingGuideModal } from './components/common/OnboardingGuideModal';
import { QuickAddModal } from './components/common/QuickAddModal';
import { DiaryView } from './components/diary/DiaryView';
import { GoalsView } from './components/goals/GoalsView';
import { SearchView } from './components/search/SearchView';
import { SettingsView } from './components/settings/SettingsView';
import { SimulatorView } from './components/simulator/SimulatorView';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { UpdateModal } from './components/common/UpdateModal';
import { CustomContextMenu } from './components/common/CustomContextMenu';
import { ContextMenuProvider } from './context/ContextMenuContext';
import { ToastProvider } from './context/ToastContext';
import { AppUpdateState, checkForAppUpdates } from './lib/updater';
import { checkDueBillsAndNotify, checkCustomRemindersAndNotify } from './lib/notifications';

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 28 : direction < 0 ? -28 : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -28 : direction < 0 ? 28 : 0,
    opacity: 0,
  }),
};

const MainContent: React.FC = () => {
  const { activeView, navDirection, recurring, reminders, markReminderFired, performanceMode } = useFinance();
  const [startupUpdate, setStartupUpdate] = useState<AppUpdateState | null>(null);

  // Background startup checks & recurring bills
  useEffect(() => {
    // 1. Check for recurring bill alerts on startup
    const billAlertsEnabled = localStorage.getItem('spendit_bill_alerts_enabled') !== 'false';
    if (billAlertsEnabled && recurring.length > 0) {
      checkDueBillsAndNotify(recurring);
    }
  }, [recurring]);

  // Periodic check for Custom Reminders (every 30s)
  useEffect(() => {
    const checkReminders = async () => {
      const notificationsEnabled = localStorage.getItem('spendit_notifications_enabled') !== 'false';
      if (!notificationsEnabled || reminders.length === 0) return;

      const firedIds = await checkCustomRemindersAndNotify(reminders);
      for (const id of firedIds) {
        await markReminderFired(id);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders, markReminderFired]);

  useEffect(() => {
    // 2. Check for OTA updates on startup
    const timer = setTimeout(async () => {
      try {
        const update = await checkForAppUpdates();
        if (update.available) {
          setStartupUpdate(update);
        }
      } catch (err) {
        // Silently ignore in dev/offline
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <MotionConfig reducedMotion={performanceMode ? "always" : "user"}>
      <main className="flex-1 pb-24 sm:pb-16 pt-14 sm:pt-2 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={navDirection}>
          <motion.div
            key={activeView}
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: performanceMode ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeView === 'diary' && <DiaryView />}
            {activeView === 'accounts' && <AccountsView />}
            {activeView === 'chapters' && <ChaptersView />}
            {activeView === 'goals' && <GoalsView />}
            {activeView === 'simulator' && <SimulatorView />}
            {activeView === 'search' && <SearchView />}
            {activeView === 'settings' && <SettingsView />}
          </motion.div>
        </AnimatePresence>

        {/* Startup Update Prompt */}
        {startupUpdate && (
          <UpdateModal
            updateState={startupUpdate}
            onClose={() => setStartupUpdate(null)}
          />
        )}
      </main>
    </MotionConfig>
  );
};

export const App: React.FC = () => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    const isDone = localStorage.getItem('spendit_onboarding_completed');
    if (isDone !== 'true') {
      setIsOnboardingOpen(true);
    }
  }, []);

  return (
    <FinanceProvider>
      <ToastProvider>
        <ContextMenuProvider>
        <div className="min-h-screen flex flex-col bg-[#F8F8FA] dark:bg-black font-sans selection:bg-apple-blue/20 relative">
          <Navigation />
          <MainContent />

          {/* Global Quick Add Modal */}
          <QuickAddModal />

          {/* First-Run Onboarding Guide Modal */}
          {isOnboardingOpen && (
            <OnboardingGuideModal onClose={() => setIsOnboardingOpen(false)} />
          )}

          {/* Artisanal Desktop Custom Context Menu */}
          <CustomContextMenu />

          {/* Apple Style Minimalist Footer */}
          <footer className="mt-auto py-5 border-t border-black/[0.04] dark:border-white/[0.06] text-secondary text-xs mb-16 sm:mb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="font-sans font-bold text-ink-800 dark:text-ink-200">
                  SpendIt
                </span>
                <span>•</span>
                <span className="font-mono text-xs">
                  Your financial folio, simplified.
                </span>
              </div>

              {/* Keyboard Shortcut Cheatsheet */}
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="hidden md:inline text-secondary">
                  Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-ink-600 dark:text-ink-300">N</kbd> Log Entry •{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-ink-600 dark:text-ink-300">P</kbd> Privacy •{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-ink-600 dark:text-ink-300">T</kbd> Jump Today
                </span>
              </div>
            </div>
          </footer>
        </div>
        </ContextMenuProvider>
      </ToastProvider>
    </FinanceProvider>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
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
import { AppUpdateState, checkForAppUpdates } from './lib/updater';
import { checkDueBillsAndNotify } from './lib/notifications';

const MainContent: React.FC = () => {
  const { activeView, recurring } = useFinance();
  const [startupUpdate, setStartupUpdate] = useState<AppUpdateState | null>(null);

  // Background startup checks
  useEffect(() => {
    // 1. Check for recurring bill alerts on startup
    const billAlertsEnabled = localStorage.getItem('spendit_bill_alerts_enabled') !== 'false';
    if (billAlertsEnabled && recurring.length > 0) {
      checkDueBillsAndNotify(recurring);
    }
  }, [recurring]);

  useEffect(() => {
    // 2. Check for OTA updates / major upgrades on startup
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
    <main className="flex-1 pb-24 sm:pb-16">
      {activeView === 'diary' && <DiaryView />}
      {activeView === 'accounts' && <AccountsView />}
      {activeView === 'chapters' && <ChaptersView />}
      {activeView === 'goals' && <GoalsView />}
      {activeView === 'simulator' && <SimulatorView />}
      {activeView === 'search' && <SearchView />}
      {activeView === 'settings' && <SettingsView />}

      {/* Startup Update Prompt */}
      {startupUpdate && (
        <UpdateModal
          updateState={startupUpdate}
          onClose={() => setStartupUpdate(null)}
        />
      )}
    </main>
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
      <div className="min-h-screen flex flex-col bg-paper-100 dark:bg-paper-dark font-sans selection:bg-archival-ochre/20">
        <Navigation />
        <MainContent />

        {/* Global Quick Add Modal */}
        <QuickAddModal />

        {/* First-Run Onboarding Guide Modal */}
        {isOnboardingOpen && (
          <OnboardingGuideModal onClose={() => setIsOnboardingOpen(false)} />
        )}

        {/* Artisanal Ledger Footer */}
        <footer className="mt-auto py-6 border-t border-paper-300 dark:border-paper-dark-border bg-paper-50 dark:bg-paper-dark-card text-ink-500 text-xs mb-16 sm:mb-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-ink-800 dark:text-ink-200">
                SpendIt
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">
                Handwritten Financial Ledger & Diary
              </span>
            </div>
        
            {/* Keyboard Shortcut Cheatsheet */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-paper-200 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <kbd className="font-bold">N</kbd> Log Entry
              </span>
              <span className="px-1.5 py-0.5 rounded bg-paper-200 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <kbd className="font-bold">P</kbd> Privacy Mask
              </span>
              <span className="px-1.5 py-0.5 rounded bg-paper-200 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <kbd className="font-bold">T</kbd> Jump to Today
              </span>
              <span className="px-1.5 py-0.5 rounded bg-paper-200 dark:bg-paper-dark border border-paper-300 dark:border-paper-dark-border">
                <kbd className="font-bold">← / →</kbd> Flip Pages
              </span>
            </div>
          </div>
        </footer>
      </div>
    </FinanceProvider>
  );
};

export default App;

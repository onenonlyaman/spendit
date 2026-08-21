import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  Flame,
  Moon,
  Plus,
  Printer,
  Search,
  Settings,
  Sparkles,
  Sun,
  Vault,
} from 'lucide-react';
import { ActiveView, useFinance } from '../../context/FinanceContext';
import { cn } from '../../lib/utils';
import { PrintableJournalModal } from './PrintableJournalModal';

export const Navigation: React.FC = () => {
  const {
    activeView,
    setActiveView,
    privacyMode,
    togglePrivacyMode,
    theme,
    toggleTheme,
    setIsQuickAddOpen,
    goToToday,
    currentDiaryDate,
  } = useFinance();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'diary', label: "Today's Diary", icon: <BookOpen className="w-4 h-4" /> },
    { id: 'accounts', label: 'Accounts & Vaults', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'chapters', label: 'Monthly Chapters', icon: <Calendar className="w-4 h-4" /> },
    { id: 'goals', label: 'Money Jars', icon: <Vault className="w-4 h-4" /> },
    { id: 'simulator', label: 'What-If Simulator', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'search', label: 'Archive & Search', icon: <Search className="w-4 h-4" /> },
    { id: 'settings', label: 'Ledger Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper-50/95 dark:bg-paper-dark/95 backdrop-blur border-b border-paper-300 dark:border-paper-dark-border shadow-sm">
        {/* Top Banner with Leather Spine Accent */}
        <div className="h-1.5 bg-gradient-to-r from-archival-brass via-archival-ochre to-archival-brass w-full"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setActiveView('diary');
                  goToToday();
                }}
                className="flex items-center space-x-2.5 text-left group"
                aria-label="SpendIt Home - Today's Ledger"
              >
                <img
                  src="/logo.png"
                  alt="SpendIt Logo"
                  className="w-9 h-9 rounded-lg object-contain shadow-sm group-hover:scale-105 transition-transform"
                />

                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-serif font-bold text-xl tracking-tight text-ink-900 dark:text-ink-100">
                      SpendIt
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-archival-ochre-light dark:bg-paper-dark-border text-archival-ochre dark:text-archival-brass border border-archival-ochre/30">
                      Ledger
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
                    Financial Journal & Physical Ledger
                  </p>
                </div>
              </button>
            </div>

            {/* Center/Right Action Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Quick Add Button (Desktop) */}
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-paper-200 text-paper-50 dark:text-ink-900 font-sans text-xs font-semibold shadow-sm transition-all active:scale-95 min-h-[36px]"
                aria-label="Quick Add Entry (Press N)"
                title="Quick Add Entry (Press 'N' or ⌘K)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Entry</span>
                <kbd className="ml-1 px-1 py-0.5 text-[10px] font-mono rounded bg-ink-700 dark:bg-paper-300 text-paper-100 dark:text-ink-800">
                  N
                </kbd>
              </button>

              {/* Print PDF Button */}
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="p-2 rounded-md bg-paper-200/60 dark:bg-paper-dark-card border border-paper-300 dark:border-paper-dark-border text-ink-700 dark:text-ink-300 hover:bg-paper-300/60 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Print / Export Archival PDF"
                title="Print / Export Archival PDF"
              >
                <Printer className="w-4 h-4 text-archival-ochre" />
              </button>

              {/* Privacy Mode Toggle */}
              <button
                onClick={togglePrivacyMode}
                className={cn(
                  "p-2 rounded-md transition-colors border text-xs flex items-center space-x-1.5 min-w-[36px] min-h-[36px] justify-center",
                  privacyMode
                    ? "bg-archival-red-light border-archival-red/40 text-archival-red dark:bg-archival-red/20"
                    : "bg-paper-200/60 dark:bg-paper-dark-card border-paper-300 dark:border-paper-dark-border text-ink-700 dark:text-ink-300 hover:bg-paper-300/60"
                )}
                aria-label="Toggle Privacy Mask (Press P)"
                title="Toggle Privacy Mask (Press 'P')"
              >
                {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden md:inline font-mono text-[11px]">
                  {privacyMode ? 'Masked' : 'Public'}
                </span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md bg-paper-200/60 dark:bg-paper-dark-card border border-paper-300 dark:border-paper-dark-border text-ink-700 dark:text-ink-300 hover:bg-paper-300/60 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Toggle Dark Theme"
                title="Toggle Parchment / Candlelit Dark Theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Desktop Notebook Index Tabs Bar */}
          <nav className="hidden sm:flex space-x-1.5 overflow-x-auto py-1.5 scrollbar-none border-t border-paper-200 dark:border-paper-dark-border">
            {navItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 text-xs font-sans rounded-lg transition-all min-h-[36px]",
                    isActive
                      ? "bg-paper-200/90 dark:bg-paper-dark-card text-ink-900 dark:text-ink-100 font-semibold shadow-sm border border-paper-300 dark:border-paper-dark-border"
                      : "text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200 hover:bg-paper-200/50 dark:hover:bg-paper-dark"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'diary' && (
                    <span className="font-mono text-[10px] opacity-70 px-1 py-0.2 rounded bg-paper-300/50 dark:bg-paper-dark-border">
                      {currentDiaryDate.slice(5)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Dock (Thumbs-First) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-50/98 dark:bg-paper-dark/98 backdrop-blur border-t-2 border-paper-300 dark:border-paper-dark-border shadow-ledger-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveView('diary')}
          className={cn(
            "flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[48px] min-h-[44px] transition-colors",
            activeView === 'diary'
              ? "text-ink-900 dark:text-ink-100 font-bold"
              : "text-ink-400 hover:text-ink-700 dark:hover:text-ink-300"
          )}
          aria-label="Today's Diary"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] font-sans mt-0.5">Diary</span>
        </button>

        <button
          onClick={() => setActiveView('accounts')}
          className={cn(
            "flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[48px] min-h-[44px] transition-colors",
            activeView === 'accounts'
              ? "text-ink-900 dark:text-ink-100 font-bold"
              : "text-ink-400 hover:text-ink-700 dark:hover:text-ink-300"
          )}
          aria-label="Accounts and Vaults"
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px] font-sans mt-0.5">Accounts</span>
        </button>

        {/* Center Floating Quick Add Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-ink-900 dark:bg-paper-100 text-paper-50 dark:text-ink-900 shadow-ledger border-2 border-paper-50 dark:border-paper-dark active:scale-90 transition-transform"
          aria-label="Quick Add Journal Entry"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveView('chapters')}
          className={cn(
            "flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[48px] min-h-[44px] transition-colors",
            activeView === 'chapters'
              ? "text-ink-900 dark:text-ink-100 font-bold"
              : "text-ink-400 hover:text-ink-700 dark:hover:text-ink-300"
          )}
          aria-label="Monthly Chapters"
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px] font-sans mt-0.5">Chapters</span>
        </button>

        <button
          onClick={() => setActiveView('goals')}
          className={cn(
            "flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[48px] min-h-[44px] transition-colors",
            activeView === 'goals'
              ? "text-ink-900 dark:text-ink-100 font-bold"
              : "text-ink-400 hover:text-ink-700 dark:hover:text-ink-300"
          )}
          aria-label="Money Jars"
        >
          <Vault className="w-4 h-4" />
          <span className="text-[10px] font-sans mt-0.5">Jars</span>
        </button>
      </nav>

      {/* Global Printable PDF Modal */}
      {isPrintModalOpen && (
        <PrintableJournalModal
          defaultScope="day"
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </>
  );
};

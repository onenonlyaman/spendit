import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  Moon,
  Plus,
  Printer,
  Search,
  Settings,
  Sparkles,
  Sun,
  Vault,
  X,
  Zap,
} from 'lucide-react';
import { ActiveView, useFinance } from '../../context/FinanceContext';
import { cn } from '../../lib/utils';
import { PrintableJournalModal } from './PrintableJournalModal';
import { GooeyInput } from '../ui/gooey-input';
import { GlassSurface } from '../ui/GlassSurface';
import { AppleSwitch } from '../ui/apple-switch';

export const Navigation: React.FC = () => {
  const {
    activeView,
    setActiveView,
    privacyMode,
    togglePrivacyMode,
    theme,
    toggleTheme,
    performanceMode,
    togglePerformanceMode,
    setIsQuickAddOpen,
    goToToday,
    currentDiaryDate,
    searchQuery,
    setSearchQuery,
  } = useFinance();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'diary', label: 'Today', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'accounts', label: 'Accounts', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'chapters', label: 'Insights', icon: <Calendar className="w-4 h-4" /> },
    { id: 'goals', label: 'Jars', icon: <Vault className="w-4 h-4" /> },
    { id: 'simulator', label: 'Simulator', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveView('search');
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP TOP HEADER (HIDDEN ON MOBILE)                                 */}
      {/* ========================================================================= */}
      <header className="hidden sm:block sticky top-0 z-30 w-full px-6 py-2.5">
        <GlassSurface
          borderRadius={22}
          blur={24}
          backgroundOpacity={0.88}
          saturation={1.8}
          className="max-w-7xl mx-auto shadow-apple-float"
        >
          <div className="flex flex-col w-full">
            {/* Top Functional Layer */}
            <div className="flex items-center justify-between h-12 px-4">
              {/* Brand & Home */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setActiveView('diary');
                    goToToday();
                  }}
                  className="flex items-center space-x-2 text-left group"
                  aria-label="SpendIt Home"
                >
                  <img
                    src="/logo.png"
                    alt="SpendIt Logo"
                    className="w-8 h-8 rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div className="flex items-center space-x-1.5">
                    <span className="font-sans font-bold text-sm tracking-tight text-ink-900 dark:text-ink-100">
                      SpendIt
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-600 dark:text-ink-300 font-semibold">
                      Folio
                    </span>
                  </div>
                </button>
              </div>

              {/* Desktop Dynamic Controls */}
              <div className="flex items-center space-x-2.5">
                <GooeyInput
                  placeholder="Search ledger..."
                  collapsedWidth={110}
                  expandedWidth={220}
                  value={searchQuery}
                  onValueChange={(val) => {
                    setSearchQuery(val);
                    if (val && activeView !== 'search') {
                      setActiveView('search');
                    }
                  }}
                  onKeyDown={handleSearchSubmit}
                />

                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-apple-blue hover:bg-apple-blue/90 text-white font-sans text-xs font-semibold shadow-sm transition-all active:scale-95 min-h-[34px]"
                  aria-label="Quick Add Entry"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Entry</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink-600 dark:text-ink-400 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Print / Export Folio"
                  title="Print / Export Folio"
                >
                  <Printer className="w-4 h-4 text-ink-700 dark:text-ink-300" />
                </button>

                <button
                  onClick={togglePrivacyMode}
                  className={cn(
                    "p-1.5 rounded-full transition-colors text-xs flex items-center justify-center min-w-[32px] min-h-[32px]",
                    privacyMode
                      ? "bg-apple-red/15 text-apple-red"
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-ink-600 dark:text-ink-400"
                  )}
                  aria-label="Toggle Privacy Mask"
                  title="Toggle Privacy Mask (Key: P)"
                >
                  {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  onClick={togglePerformanceMode}
                  className={cn(
                    "p-1.5 rounded-full transition-colors text-xs flex items-center justify-center min-w-[32px] min-h-[32px]",
                    performanceMode
                      ? "bg-apple-orange/15 text-apple-orange"
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-ink-600 dark:text-ink-400"
                  )}
                  aria-label="Toggle Performance Profile"
                  title={performanceMode ? "Performance Profile (Blurs & motion disabled)" : "Rich Appearance Profile (Blurs & motion active)"}
                >
                  <Zap className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink-600 dark:text-ink-400 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Toggle Dark Theme"
                >
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Desktop Segmented Navigation Tabs */}
            <div className="flex items-center justify-center px-4 pb-2 pt-1 border-t border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar scroll-fade-x">
              <nav className="apple-segmented-picker relative flex min-w-max">
                {navItems.map(item => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={cn(
                        "relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 z-10",
                        isActive
                          ? "text-ink-900 dark:text-white font-semibold"
                          : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-indicator"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm -z-10"
                        />
                      )}
                      {item.icon}
                      <span>{item.label}</span>
                      {item.id === 'diary' && (
                        <span className="text-[10px] opacity-60 ml-0.5 font-mono">
                          {currentDiaryDate.slice(5)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </GlassSurface>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP FLOATING SEARCH ICON & EXPANDABLE GLASS BAR                */}
      {/* ========================================================================= */}
      <div className="sm:hidden fixed top-3.5 right-3.5 z-30">
        <AnimatePresence mode="wait">
          {!isMobileSearchOpen ? (
            <motion.button
              key="search-trigger"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/60 dark:border-white/15 shadow-apple-float flex items-center justify-center text-ink-700 dark:text-ink-200"
              aria-label="Open Search"
            >
              <Search className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.div
              key="search-bar"
              initial={{ width: 40, opacity: 0 }}
              animate={{ width: 'calc(100vw - 28px)', opacity: 1 }}
              exit={{ width: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              className="fixed top-3.5 left-3.5 right-3.5 z-40 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-3xl border border-white/60 dark:border-white/15 shadow-apple-float rounded-2xl px-3.5 py-2 flex items-center space-x-2"
            >
              <Search className="w-4 h-4 text-apple-blue flex-shrink-0" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search transactions, tags, accounts..."
                className="flex-1 bg-transparent border-0 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:outline-none font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-xs font-semibold text-apple-blue pl-1"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 3. FRAMER / APPLE LIQUID GLASS FULL-WIDTH HORIZONTAL FLOATING DOCK       */}
      {/* ========================================================================= */}
      <nav className="sm:hidden fixed bottom-3 left-3 right-3 z-40 flex items-center gap-2">
        {/* Left Navigation Island Pill (Spans across available width) */}
        <div className="flex-1 flex items-center justify-around px-1.5 py-1.5 rounded-full bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl border border-white/60 dark:border-0 shadow-lg dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] h-[52px]">
          {/* 1. Today */}
          <button
            onClick={() => {
              setActiveView('diary');
              setIsMobileMoreOpen(false);
            }}
            className="flex-1 relative flex items-center justify-center h-10 rounded-full text-ink-600 dark:text-ink-300 transition-colors"
            aria-label="Today's Diary"
          >
            {activeView === 'diary' && (
              <motion.div
                layoutId="mobile-glass-dock-pill"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-white dark:bg-white/15 backdrop-blur-md rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-black/5 dark:border-0 -z-10"
              />
            )}
            <BookOpen className={cn("w-4 h-4 transition-transform", activeView === 'diary' ? "scale-110 text-apple-blue dark:text-white" : "opacity-60")} />
          </button>

          {/* 2. Accounts */}
          <button
            onClick={() => {
              setActiveView('accounts');
              setIsMobileMoreOpen(false);
            }}
            className="flex-1 relative flex items-center justify-center h-10 rounded-full text-ink-600 dark:text-ink-300 transition-colors"
            aria-label="Accounts"
          >
            {activeView === 'accounts' && (
              <motion.div
                layoutId="mobile-glass-dock-pill"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-white dark:bg-white/15 backdrop-blur-md rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-black/5 dark:border-0 -z-10"
              />
            )}
            <CreditCard className={cn("w-4 h-4 transition-transform", activeView === 'accounts' ? "scale-110 text-apple-blue dark:text-white" : "opacity-60")} />
          </button>

          {/* 3. Insights */}
          <button
            onClick={() => {
              setActiveView('chapters');
              setIsMobileMoreOpen(false);
            }}
            className="flex-1 relative flex items-center justify-center h-10 rounded-full text-ink-600 dark:text-ink-300 transition-colors"
            aria-label="Insights"
          >
            {activeView === 'chapters' && (
              <motion.div
                layoutId="mobile-glass-dock-pill"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-white dark:bg-white/15 backdrop-blur-md rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-black/5 dark:border-0 -z-10"
              />
            )}
            <Calendar className={cn("w-4 h-4 transition-transform", activeView === 'chapters' ? "scale-110 text-apple-blue dark:text-white" : "opacity-60")} />
          </button>

          {/* 4. Jars */}
          <button
            onClick={() => {
              setActiveView('goals');
              setIsMobileMoreOpen(false);
            }}
            className="flex-1 relative flex items-center justify-center h-10 rounded-full text-ink-600 dark:text-ink-300 transition-colors"
            aria-label="Money Jars"
          >
            {activeView === 'goals' && (
              <motion.div
                layoutId="mobile-glass-dock-pill"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-white dark:bg-white/15 backdrop-blur-md rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-black/5 dark:border-0 -z-10"
              />
            )}
            <Vault className={cn("w-4 h-4 transition-transform", activeView === 'goals' ? "scale-110 text-apple-blue dark:text-white" : "opacity-60")} />
          </button>
        </div>

        {/* Right Action Button (+) which smoothly rotates to (✕) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
          className="w-[52px] h-[52px] rounded-full bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl border border-white/60 dark:border-0 shadow-lg dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex items-center justify-center text-ink-800 dark:text-ink-100 flex-shrink-0"
          aria-label="Toggle Actions"
        >
          <motion.div
            animate={{ rotate: isMobileMoreOpen ? 135 : 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
          >
            <Plus className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </nav>

      {/* ========================================================================= */}
      {/* 4. FLOATING CONTEXTUAL GLASS ACTION POPUP (DIRECTLY ABOVE ACTION BUTTON)   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <>
            {/* Backdrop to dismiss when clicking outside */}
            <div
              onClick={() => setIsMobileMoreOpen(false)}
              className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Floating Glass Action Menu (matches Instagram/Framer style) */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              style={{ transformOrigin: 'bottom right' }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="sm:hidden fixed bottom-[72px] right-3 z-50 w-60 rounded-3xl bg-white/75 dark:bg-[#1C1C1E]/75 backdrop-blur-3xl border border-white/60 dark:border-0 shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-2 space-y-0.5"
            >
              {/* 1. Quick Add Entry */}
              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsQuickAddOpen(true);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-900 dark:text-ink-100 transition-colors text-left font-sans text-xs font-semibold"
              >
                <div className="w-7 h-7 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span>New Quick Entry</span>
              </button>

              {/* 2. What-If Simulator */}
              <button
                onClick={() => {
                  setActiveView('simulator');
                  setIsMobileMoreOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-900 dark:text-ink-100 transition-colors text-left font-sans text-xs font-semibold"
              >
                <div className="w-7 h-7 rounded-xl bg-apple-orange/15 text-apple-orange flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>What-If Simulator</span>
              </button>

              {/* 3. Search Ledger */}
              <button
                onClick={() => {
                  setActiveView('search');
                  setIsMobileMoreOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-900 dark:text-ink-100 transition-colors text-left font-sans text-xs font-semibold"
              >
                <div className="w-7 h-7 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <span>Search Ledger</span>
              </button>

              {/* 4. Settings */}
              <button
                onClick={() => {
                  setActiveView('settings');
                  setIsMobileMoreOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-900 dark:text-ink-100 transition-colors text-left font-sans text-xs font-semibold"
              >
                <div className="w-7 h-7 rounded-xl bg-ink-400/15 text-ink-600 dark:text-ink-300 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <span>Settings</span>
              </button>

              {/* 5. Export / Print Folio PDF */}
              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsPrintModalOpen(true);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-ink-900 dark:text-ink-100 transition-colors text-left font-sans text-xs font-semibold"
              >
                <div className="w-7 h-7 rounded-xl bg-apple-green/15 text-apple-green flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <span>Print Folio PDF</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-1" />

              {/* Quick Settings Toggles */}
              <div className="px-1.5 py-1 space-y-1">
                {/* Dark Mode */}
                <div
                  onClick={toggleTheme}
                  className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 text-xs font-medium text-ink-800 dark:text-ink-200">
                    {theme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 text-apple-indigo" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-apple-orange" />
                    )}
                    <span>Dark Mode</span>
                  </div>
                  <AppleSwitch
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                    color="indigo"
                    size="sm"
                    aria-label="Dark Mode"
                  />
                </div>

                {/* Privacy Mask */}
                <div
                  onClick={togglePrivacyMode}
                  className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 text-xs font-medium text-ink-800 dark:text-ink-200">
                    {privacyMode ? (
                      <EyeOff className="w-3.5 h-3.5 text-apple-red" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-ink-500" />
                    )}
                    <span>Privacy Mask</span>
                  </div>
                  <AppleSwitch
                    checked={privacyMode}
                    onChange={togglePrivacyMode}
                    color="blue"
                    size="sm"
                    aria-label="Privacy Mask"
                  />
                </div>

                {/* Performance Profile */}
                <div
                  onClick={togglePerformanceMode}
                  className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 text-xs font-medium text-ink-800 dark:text-ink-200">
                    <Zap className={cn("w-3.5 h-3.5", performanceMode ? "text-apple-orange" : "text-ink-400")} />
                    <span>Performance Mode</span>
                  </div>
                  <AppleSwitch
                    checked={performanceMode}
                    onChange={togglePerformanceMode}
                    color="orange"
                    size="sm"
                    aria-label="Performance Mode"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Printable PDF Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <PrintableJournalModal
            defaultScope="day"
            onClose={() => setIsPrintModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;

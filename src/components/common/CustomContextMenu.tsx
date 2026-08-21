import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  Eye,
  EyeOff,
  Moon,
  Plus,
  RotateCcw,
  Scissors,
  Settings,
  Sun,
  Zap,
} from 'lucide-react';
import { useContextMenu } from '../../context/ContextMenuContext';
import { useFinance } from '../../context/FinanceContext';
import { sounds } from '../../lib/audioHaptics';
import { AppleSwitch } from '../ui/apple-switch';

export const CustomContextMenu: React.FC = () => {
  const { isOpen, position, targetMeta, closeContextMenu } = useContextMenu();
  const {
    setIsQuickAddOpen,
    privacyMode,
    togglePrivacyMode,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    theme,
    toggleTheme,
    performanceMode,
    togglePerformanceMode,
    setActiveView,
    exportBackup,
    refreshAllData,
  } = useFinance();

  if (!isOpen) return null;

  const handleAction = (action: () => void | Promise<void>) => {
    sounds.playPageTurn();
    closeContextMenu();
    action();
  };

  // Clipboard Helpers
  const handleCopy = async () => {
    try {
      if (targetMeta.selectedText) {
        await navigator.clipboard.writeText(targetMeta.selectedText);
      } else if (targetMeta.isInput && targetMeta.targetElement) {
        const input = targetMeta.targetElement as HTMLInputElement | HTMLTextAreaElement;
        const val = input.value.substring(input.selectionStart || 0, input.selectionEnd || input.value.length);
        if (val) await navigator.clipboard.writeText(val);
      }
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
    closeContextMenu();
  };

  const handleCut = async () => {
    try {
      if (targetMeta.isInput && targetMeta.targetElement) {
        const input = targetMeta.targetElement as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || input.value.length;
        const cutText = input.value.substring(start, end);
        if (cutText) {
          await navigator.clipboard.writeText(cutText);
          input.value = input.value.substring(0, start) + input.value.substring(end);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    } catch (err) {
      console.warn('Clipboard cut error:', err);
    }
    closeContextMenu();
  };

  const handlePaste = async () => {
    try {
      if (targetMeta.isInput && targetMeta.targetElement) {
        const text = await navigator.clipboard.readText();
        const input = targetMeta.targetElement as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || input.value.length;
        input.value = input.value.substring(0, start) + text + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + text.length;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
    closeContextMenu();
  };

  const handleSelectAll = () => {
    if (targetMeta.isInput && targetMeta.targetElement) {
      const input = targetMeta.targetElement as HTMLInputElement | HTMLTextAreaElement;
      input.select();
    }
    closeContextMenu();
  };

  const handleExportJSON = async () => {
    const backupData = await exportBackup();
    const jsonStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showTextEditing = targetMeta.isInput || (targetMeta.selectedText && targetMeta.selectedText.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        id="custom-desktop-context-menu"
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
        className="fixed z-[9999] min-w-[220px] select-none shadow-apple-float"
        onContextMenu={e => e.preventDefault()}
      >
        <div className="overlay-surface rounded-[20px] overflow-hidden p-1.5">
          <div className="w-full text-xs font-sans text-ink-800 dark:text-ink-200">
            {/* 1. Contextual Text / Clipboard Editing */}
            {showTextEditing && (
              <div className="space-y-0.5 pb-1 mb-1 border-b border-black/[0.06] dark:border-white/[0.08]">
                {targetMeta.isInput && (
                  <button
                    onClick={handleCut}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                      <span>Cut</span>
                    </span>
                    <span className="text-xs text-secondary group-hover:text-white">Ctrl+X</span>
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                    <span>Copy</span>
                  </span>
                  <span className="text-xs text-secondary group-hover:text-white">Ctrl+C</span>
                </button>

                {targetMeta.isInput && (
                  <button
                    onClick={handlePaste}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                      <span>Paste</span>
                    </span>
                    <span className="text-xs text-secondary group-hover:text-white">Ctrl+V</span>
                  </button>
                )}

                <button
                  onClick={handleSelectAll}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group"
                >
                  <span className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                    <span>Select All</span>
                  </span>
                  <span className="text-xs text-secondary group-hover:text-white">Ctrl+A</span>
                </button>
              </div>
            )}

            {/* 2. Navigation Actions */}
            <div className="space-y-0.5 pb-1 mb-1 border-b border-black/[0.06] dark:border-white/[0.08]">
              <button
                onClick={() => handleAction(() => setIsQuickAddOpen(true))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white text-accent font-semibold transition-colors text-left group"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-accent group-hover:text-white" />
                  <span>Log New Entry</span>
                </span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-apple-blue/15 group-hover:bg-white/20 group-hover:text-white">N</span>
              </button>

              <div
                onClick={() => handleAction(togglePrivacyMode)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {privacyMode ? (
                    <EyeOff className="w-3.5 h-3.5 text-apple-red group-hover:text-white" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                  )}
                  <span>Privacy Mask</span>
                </span>
                <AppleSwitch
                  checked={privacyMode}
                  onChange={() => handleAction(togglePrivacyMode)}
                  color="blue"
                  size="sm"
                  aria-label="Privacy Mask"
                />
              </div>

              <button
                onClick={() => handleAction(goToToday)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                  <span>Jump to Today</span>
                </span>
                <span className="text-xs text-secondary group-hover:text-white">T</span>
              </button>

              <div className="grid grid-cols-2 gap-1 pt-0.5">
                <button
                  onClick={() => handleAction(goToPreviousDay)}
                  className="flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-accent hover:text-white text-xs font-mono text-ink-700 dark:text-ink-300 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Prev Day</span>
                </button>
                <button
                  onClick={() => handleAction(goToNextDay)}
                  className="flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-accent hover:text-white text-xs font-mono text-ink-700 dark:text-ink-300 transition-colors"
                >
                  <span>Next Day</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 3. Theme, Tools & Settings */}
            <div className="space-y-0.5">
              <div
                onClick={() => handleAction(toggleTheme)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-apple-indigo group-hover:text-white" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-apple-orange group-hover:text-white" />
                  )}
                  <span>Dark Mode</span>
                </span>
                <AppleSwitch
                  checked={theme === 'dark'}
                  onChange={() => handleAction(toggleTheme)}
                  color="indigo"
                  size="sm"
                  aria-label="Dark Mode"
                />
              </div>

              <div
                onClick={() => handleAction(togglePerformanceMode)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-apple-orange group-hover:text-white" />
                  <span>Performance Mode</span>
                </span>
                <AppleSwitch
                  checked={performanceMode}
                  onChange={() => handleAction(togglePerformanceMode)}
                  color="orange"
                  size="sm"
                  aria-label="Performance Mode"
                />
              </div>

              <button
                onClick={() => handleAction(handleExportJSON)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-apple-green group-hover:text-white" />
                  <span>Backup Data (JSON)</span>
                </span>
              </button>

              <button
                onClick={() => handleAction(() => setActiveView('settings'))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left group"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                  <span>Settings</span>
                </span>
              </button>

              <button
                onClick={() => handleAction(refreshAllData)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-accent hover:text-white transition-colors text-left text-secondary group-hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
                  <span>Reload Ledger</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomContextMenu;

import React from 'react';
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
  PenTool,
  RotateCcw,
  Scissors,
  Settings,
  Sun,
} from 'lucide-react';
import { useContextMenu } from '../../context/ContextMenuContext';
import { useFinance } from '../../context/FinanceContext';
import { sounds } from '../../lib/audioHaptics';

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
    } else {
      window.getSelection()?.selectAllChildren(document.body);
    }
    closeContextMenu();
  };

  const handleExportJSON = async () => {
    try {
      const backupData = await exportBackup();
      const jsonStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spendit-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const showTextEditing = targetMeta.isEditable || targetMeta.hasSelection;

  return (
    <div
      id="custom-desktop-context-menu"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
      className="fixed z-[9999] min-w-[230px] bg-paper-50/95 dark:bg-paper-dark-card/95 backdrop-blur-md border-2 border-archival-ochre/40 dark:border-archival-ochre/30 shadow-2xl rounded-xl p-1.5 text-xs font-sans text-ink-800 dark:text-ink-200 select-none animate-fadeIn ring-1 ring-ink-900/10"
      onContextMenu={e => e.preventDefault()}
    >
      {/* 1. Contextual Text / Clipboard Editing */}
      {showTextEditing && (
        <div className="space-y-0.5 pb-1 mb-1 border-b border-paper-200 dark:border-paper-dark-border">
          {targetMeta.isInput && (
            <button
              onClick={handleCut}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-ink-500" />
                <span>Cut</span>
              </span>
              <span className="font-mono text-[10px] text-ink-400">Ctrl+X</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-ink-500" />
              <span>Copy</span>
            </span>
            <span className="font-mono text-[10px] text-ink-400">Ctrl+C</span>
          </button>

          {targetMeta.isInput && (
            <button
              onClick={handlePaste}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Clipboard className="w-3.5 h-3.5 text-ink-500" />
                <span>Paste</span>
              </span>
              <span className="font-mono text-[10px] text-ink-400">Ctrl+V</span>
            </button>
          )}

          <button
            onClick={handleSelectAll}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
          >
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-ink-500" />
              <span>Select All</span>
            </span>
            <span className="font-mono text-[10px] text-ink-400">Ctrl+A</span>
          </button>
        </div>
      )}

      {/* 2. Global Physical Diary Navigation */}
      <div className="space-y-0.5 pb-1 mb-1 border-b border-paper-200 dark:border-paper-dark-border">
        <button
          onClick={() => handleAction(() => setIsQuickAddOpen(true))}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark text-archival-ochre-dark dark:text-archival-ochre font-semibold transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <PenTool className="w-3.5 h-3.5 text-archival-ochre" />
            <span>Log Entry</span>
          </span>
          <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-archival-ochre/15">N</span>
        </button>

        <button
          onClick={() => handleAction(togglePrivacyMode)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            {privacyMode ? (
              <Eye className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-ink-500" />
            )}
            <span>{privacyMode ? 'Reveal Balances' : 'Privacy Mask'}</span>
          </span>
          <span className="font-mono text-[10px] text-ink-400">P</span>
        </button>

        <button
          onClick={() => handleAction(goToToday)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-ink-500" />
            <span>Jump to Today</span>
          </span>
          <span className="font-mono text-[10px] text-ink-400">T</span>
        </button>

        <div className="grid grid-cols-2 gap-1 pt-0.5">
          <button
            onClick={() => handleAction(goToPreviousDay)}
            className="flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 dark:hover:bg-paper-dark-border text-[11px] font-mono text-ink-700 dark:text-ink-300 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            <span>Prev Day</span>
          </button>
          <button
            onClick={() => handleAction(goToNextDay)}
            className="flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-paper-100 dark:bg-paper-dark hover:bg-paper-200 dark:hover:bg-paper-dark-border text-[11px] font-mono text-ink-700 dark:text-ink-300 transition-colors"
          >
            <span>Next Day</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. Theme, Tools & Settings */}
      <div className="space-y-0.5">
        <button
          onClick={() => handleAction(toggleTheme)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>{theme === 'dark' ? 'Parchment Light Mode' : 'Night Ledger Dark Mode'}</span>
          </span>
        </button>

        <button
          onClick={() => handleAction(handleExportJSON)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-archival-blue" />
            <span>Backup Ledger (JSON)</span>
          </span>
        </button>

        <button
          onClick={() => handleAction(() => setActiveView('settings'))}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-ink-500" />
            <span>Settings & Sovereignty</span>
          </span>
        </button>

        <button
          onClick={() => handleAction(refreshAllData)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/80 dark:hover:bg-paper-dark transition-colors text-left text-ink-500 hover:text-ink-700 dark:hover:text-ink-300"
        >
          <span className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-ink-400" />
            <span>Reload Journal Pages</span>
          </span>
        </button>
      </div>
    </div>
  );
};

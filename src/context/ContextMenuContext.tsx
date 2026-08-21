import React, { createContext, useContext, useEffect, useState } from 'react';

export interface TargetMetadata {
  isInput: boolean;
  isEditable: boolean;
  hasSelection: boolean;
  selectedText: string;
  targetElement: HTMLElement | null;
  transactionId?: string;
  accountId?: string;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuContextType {
  isOpen: boolean;
  position: ContextMenuPosition;
  targetMeta: TargetMetadata;
  closeContextMenu: () => void;
  openCustomMenu: (x: number, y: number, meta?: Partial<TargetMetadata>) => void;
}

const defaultTargetMeta: TargetMetadata = {
  isInput: false,
  isEditable: false,
  hasSelection: false,
  selectedText: '',
  targetElement: null,
};

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [targetMeta, setTargetMeta] = useState<TargetMetadata>(defaultTargetMeta);

  const closeContextMenu = () => {
    setIsOpen(false);
  };

  const openCustomMenu = (x: number, y: number, meta?: Partial<TargetMetadata>) => {
    // Menu width ~240px, height ~360px
    const menuWidth = 240;
    const menuHeight = 360;

    const clampedX = x + menuWidth > window.innerWidth ? Math.max(10, window.innerWidth - menuWidth - 16) : x;
    const clampedY = y + menuHeight > window.innerHeight ? Math.max(10, window.innerHeight - menuHeight - 16) : y;

    setPosition({ x: clampedX, y: clampedY });
    setTargetMeta({
      ...defaultTargetMeta,
      ...meta,
    });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // 1. Completely suppress native browser right-click context menu everywhere
      e.preventDefault();

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      const isEditable = target.isContentEditable || isInput;
      const selection = window.getSelection()?.toString() || '';
      const hasSelection = selection.trim().length > 0;

      const txnEl = target.closest('[data-transaction-id]');
      const txnId = txnEl ? txnEl.getAttribute('data-transaction-id') || undefined : undefined;

      const accEl = target.closest('[data-account-id]');
      const accId = accEl ? accEl.getAttribute('data-account-id') || undefined : undefined;

      openCustomMenu(e.clientX, e.clientY, {
        isInput,
        isEditable,
        hasSelection,
        selectedText: selection,
        targetElement: target,
        transactionId: txnId,
        accountId: accId,
      });
    };

    const handlePointerDown = (e: MouseEvent) => {
      // Dismiss if clicked outside the context menu
      const menuEl = document.getElementById('custom-desktop-context-menu');
      if (menuEl && !menuEl.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    const handleScrollOrResize = () => {
      closeContextMenu();
    };

    // Attach with capture to guarantee interception before any internal elements
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  return (
    <ContextMenuContext.Provider
      value={{
        isOpen,
        position,
        targetMeta,
        closeContextMenu,
        openCustomMenu,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = (): ContextMenuContextType => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};

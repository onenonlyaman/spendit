import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Small line under the title. Announced as the dialog description. */
  subtitle?: React.ReactNode;
  /** Leading glyph block, usually a tinted icon tile. */
  icon?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  /** Pinned action row. Rendered outside the scroll area so it never scrolls away. */
  footer?: React.ReactNode;
  /** Set false for destructive flows that must not close on a stray backdrop click. */
  dismissOnBackdrop?: boolean;
  /** Rises from the bottom edge on narrow windows, like a sheet. */
  sheetOnMobile?: boolean;
}

/**
 * The single dialog primitive for the app.
 *
 * Every modal surface routes through this so dialog semantics, Escape, focus
 * containment, and focus restoration exist once and cannot drift apart:
 * previously each modal reimplemented its own shell and none of them were
 * reachable or escapable by keyboard.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  children,
  footer,
  dismissOnBackdrop = true,
  sheetOnMobile = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const descriptionId = useId();

  // Remember the trigger so focus can return exactly where the user left it.
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
    // Let the exit animation start before yanking focus back.
    requestAnimationFrame(() => restoreFocusRef.current?.focus?.());
  }, [onClose]);

  // Escape to dismiss, Tab cycling contained to the panel.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null || el === document.activeElement
      );
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, handleClose]);

  // Move focus into the dialog, and freeze the page behind it.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>(FOCUSABLE) ??
        panel;
      target.focus();
    }, 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  const modalNode = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4 ${
            sheetOnMobile ? 'items-end sm:items-center' : 'items-center'
          }`}
          onMouseDown={e => {
            if (dismissOnBackdrop && e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={subtitle ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={`w-full ${SIZE_CLASS[size]} bg-white dark:bg-paper-dark-card ${
              sheetOnMobile ? 'rounded-t-3xl sm:rounded-3xl' : 'rounded-3xl'
            } border border-black/10 dark:border-white/10 shadow-apple-float overflow-hidden flex flex-col max-h-[92vh] focus-ring`}
          >
            <div className="px-4 sm:px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {icon}
                <div className="min-w-0">
                  <h2
                    id={headingId}
                    className="font-sans font-semibold text-lg text-ink-900 dark:text-ink-100 truncate"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p id={descriptionId} className="text-sm text-secondary truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="shrink-0 p-2 -mr-1 rounded-full text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 focus-ring transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-5 overflow-y-auto">{children}</div>

            {footer && (
              <div className="px-4 sm:px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalNode, document.body);
};

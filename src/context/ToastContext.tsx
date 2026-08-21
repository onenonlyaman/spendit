import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  tone: ToastTone;
  /** What happened, in the user's terms. */
  message: string;
  /** For failures: what the user can do about it. */
  detail?: string;
  action?: ToastAction;
}

interface ToastContextType {
  toast: (t: Omit<Toast, 'id'>) => string;
  success: (message: string, detail?: string) => string;
  /** Errors persist until dismissed — a failure the user missed is a failure they will repeat. */
  error: (message: string, detail?: string, action?: ToastAction) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const AUTO_DISMISS_MS = 4200;

const TONE_STYLES: Record<ToastTone, { icon: React.ElementType; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: 'text-apple-green', ring: 'ring-apple-green/25' },
  error: { icon: AlertTriangle, accent: 'text-apple-red', ring: 'ring-apple-red/30' },
  info: { icon: Info, accent: 'text-accent', ring: 'ring-apple-blue/25' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts(prev => [...prev.slice(-2), { ...t, id }]);

      if (t.tone !== 'error') {
        timers.current[id] = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, detail?: string) => toast({ tone: 'success', message, detail }),
    [toast]
  );

  const error = useCallback(
    (message: string, detail?: string, action?: ToastAction) =>
      toast({ tone: 'error', message, detail, action }),
    [toast]
  );

  const value = useMemo(
    () => ({ toast, success, error, dismiss }),
    [toast, success, error, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="fixed bottom-24 sm:bottom-6 right-0 sm:right-6 left-0 sm:left-auto z-[60] flex flex-col items-center sm:items-end gap-2 px-4 sm:px-0 pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map(t => {
            const { icon: Icon, accent, ring } = TONE_STYLES[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                role={t.tone === 'error' ? 'alert' : 'status'}
                aria-live={t.tone === 'error' ? 'assertive' : 'polite'}
                className={`pointer-events-auto w-full sm:w-auto sm:min-w-[320px] sm:max-w-md bg-white dark:bg-paper-dark-card border border-black/10 dark:border-white/10 rounded-2xl shadow-apple-float ring-1 ${ring} px-4 py-3 flex items-start gap-3`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${accent}`} aria-hidden="true" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-100 break-words">
                    {t.message}
                  </p>
                  {t.detail && (
                    <p className="text-sm text-secondary mt-0.5 break-words">
                      {t.detail}
                    </p>
                  )}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-2 text-sm font-semibold text-accent hover:underline focus-ring rounded"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 p-1 -mr-1 -mt-0.5 rounded-full text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 focus-ring transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

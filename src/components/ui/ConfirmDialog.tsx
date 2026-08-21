import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export interface ConsequenceLine {
  label: string;
  value: string | number;
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  /** Plain-language statement of what is about to happen. */
  body: React.ReactNode;
  /** Itemized, counted list of exactly what will be destroyed. */
  consequences?: ConsequenceLine[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'destructive' | 'neutral';
  /**
   * When set, the confirm button stays disabled until the user types this
   * word. Reserved for actions with no recovery path at all.
   */
  requirePhrase?: string;
  /** A safer action offered alongside — typically "export a backup first". */
  safeAction?: { label: string; onClick: () => void | Promise<void>; hint?: string };
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  body,
  consequences,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'destructive',
  requirePhrase,
  safeAction,
}) => {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTyped('');
      setBusy(false);
    }
  }, [open]);

  const phraseSatisfied = !requirePhrase || typed.trim().toUpperCase() === requirePhrase.toUpperCase();
  const destructive = tone === 'destructive';

  const handleConfirm = async () => {
    if (!phraseSatisfied || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      sheetOnMobile={false}
      dismissOnBackdrop={!destructive}
      icon={
        destructive ? (
          <div className="w-10 h-10 rounded-2xl bg-apple-red/12 text-apple-red flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
        ) : undefined
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-ink-700 dark:text-ink-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl focus-ring transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!phraseSatisfied || busy}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl text-white focus-ring transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              destructive ? 'bg-apple-red hover:bg-apple-red/90' : 'bg-accent'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-base text-ink-800 dark:text-ink-200 leading-relaxed">{body}</div>

        {consequences && consequences.length > 0 && (
          <div className="rounded-2xl border border-apple-red/25 bg-apple-red/[0.04] overflow-hidden">
            <p className="px-4 pt-3 pb-2 text-sm font-semibold text-apple-red">
              This permanently deletes
            </p>
            <ul className="divide-y divide-apple-red/12">
              {consequences.map(line => (
                <li key={line.label} className="px-4 py-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-ink-700 dark:text-ink-300">{line.label}</span>
                  <span className="text-sm font-mono font-semibold tabular-nums text-ink-900 dark:text-ink-100">
                    {line.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {safeAction && (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
            <button
              type="button"
              onClick={safeAction.onClick}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white focus-ring transition-colors"
            >
              {safeAction.label}
            </button>
            {safeAction.hint && (
              <p className="text-sm text-secondary mt-2 text-center">
                {safeAction.hint}
              </p>
            )}
          </div>
        )}

        {requirePhrase && (
          <div>
            <label
              htmlFor="confirm-phrase"
              className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5"
            >
              Type <span className="font-mono font-bold text-apple-red">{requirePhrase}</span> to
              confirm
            </label>
            <input
              id="confirm-phrase"
              data-autofocus
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={requirePhrase}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-base font-mono text-ink-900 dark:text-ink-100 focus-ring"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

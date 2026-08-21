import React from 'react';
import { Download, Trash2, X } from 'lucide-react';

interface ReceiptModalProps {
  receiptUrl: string;
  description: string;
  onClose: () => void;
  onDelete?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receiptUrl,
  description,
  onClose,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-lg w-full bg-paper-50 dark:bg-paper-dark-card rounded-xl shadow-ledger-lg border border-paper-400 dark:border-paper-dark-border overflow-hidden">
        {/* Header */}
        <div className="bg-paper-200/80 dark:bg-paper-dark px-4 py-3 border-b border-paper-300 dark:border-paper-dark-border flex items-center justify-between">
          <div className="truncate pr-2">
            <h4 className="font-serif font-bold text-sm text-ink-900 dark:text-ink-100 truncate">
              Receipt: {description}
            </h4>
            <span className="text-[10px] font-mono text-ink-500">Physical Ledger Attachment</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-500 hover:text-ink-900 dark:hover:text-ink-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Image Container */}
        <div className="p-4 bg-paper-100 dark:bg-paper-dark flex items-center justify-center max-h-[70vh] overflow-auto">
          <img
            src={receiptUrl}
            alt={`Receipt for ${description}`}
            className="max-h-[60vh] max-w-full rounded-md shadow-md object-contain border border-paper-300 dark:border-paper-dark-border"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-paper-50 dark:bg-paper-dark-card border-t border-paper-300 dark:border-paper-dark-border flex items-center justify-between">
          {onDelete ? (
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="text-xs font-mono text-archival-red hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Attachment</span>
            </button>
          ) : <div />}

          <div className="flex items-center space-x-2">
            <a
              href={receiptUrl}
              download={`receipt-${description.toLowerCase().replace(/\s+/g, '-')}.png`}
              className="px-3 py-1.5 rounded bg-paper-200 hover:bg-paper-300 text-ink-800 text-xs font-mono flex items-center space-x-1 border border-paper-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </a>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-ink-900 text-paper-50 text-xs font-sans font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

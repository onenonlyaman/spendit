import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
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
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-150"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        className="relative max-w-lg w-full bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple-float border border-black/10 dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="truncate pr-2">
            <h4 className="font-sans font-bold text-sm text-ink-900 dark:text-ink-100 truncate">
              Receipt: {description}
            </h4>
            <span className="text-xs text-secondary">Transaction receipt attachment</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Image Container */}
        <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-center max-h-[65vh] overflow-auto">
          <img
            src={receiptUrl}
            alt={`Receipt for ${description}`}
            className="max-h-[55vh] max-w-full rounded-2xl shadow-sm object-contain border border-black/10 dark:border-white/10"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          {onDelete ? (
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="text-xs font-semibold text-apple-red hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          ) : <div />}

          <div className="flex items-center space-x-2">
            <a
              href={receiptUrl}
              download={`receipt-${description.toLowerCase().replace(/\s+/g, '-')}.png`}
              className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-ink-800 dark:text-ink-200 text-xs font-semibold flex items-center space-x-1 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold shadow-sm"
            >
              Done
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

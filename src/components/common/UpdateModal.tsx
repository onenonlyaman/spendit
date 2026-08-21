import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AppUpdateState,
  downloadAndInstallOTAUpdate,
  installAndroidAPK,
  openGitHubReleases,
} from '../../lib/updater';

interface UpdateModalProps {
  updateState: AppUpdateState;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateState, onClose }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isMajorUpgrade = updateState.kind === 'upgrade';
  const isAndroidAPK = updateState.kind === 'android-apk';

  const handleStartOTADownload = async () => {
    if (!updateState.rawUpdate) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      await downloadAndInstallOTAUpdate(updateState.rawUpdate, pct => {
        setProgress(pct);
      });
      setIsDownloaded(true);
    } catch (err: any) {
      console.error('OTA Download failed:', err);
      setDownloadError(err?.message || 'Download failed. Please try again or download manually from GitHub.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstallAndroid = async () => {
    try {
      await installAndroidAPK(updateState.apkDownloadUrl);
      onClose();
    } catch (err: any) {
      console.error('Android APK install trigger failed:', err);
      openGitHubReleases();
    }
  };

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
        className="bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-apple-float rounded-3xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              isMajorUpgrade
                ? 'bg-apple-orange/15 text-apple-orange'
                : isAndroidAPK
                ? 'bg-apple-green/15 text-apple-green'
                : 'bg-apple-blue/15 text-apple-blue'
            }`}>
              {isMajorUpgrade ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isAndroidAPK ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-sans font-bold text-base text-ink-900 dark:text-ink-50">
                {isMajorUpgrade
                  ? 'Major Release Upgrade Available'
                  : isAndroidAPK
                  ? 'New Android Release Available'
                  : 'New App Update Available'}
              </h3>
              <p className="text-xs font-mono text-ink-400">
                Current: <span className="font-bold">v{updateState.currentVersion}</span> → Available: <span className="font-bold text-apple-blue">v{updateState.newVersion}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm text-ink-700 dark:text-ink-300 font-sans">
          {isMajorUpgrade ? (
            <div className="bg-apple-orange/10 border border-apple-orange/20 rounded-2xl p-4 space-y-2">
              <p className="font-semibold text-apple-orange flex items-center gap-2 text-xs">
                <ExternalLink className="w-4 h-4" />
                Architectural Upgrade Required
              </p>
              <p className="text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
                Version <strong>v{updateState.newVersion}</strong> includes major native platform updates. To upgrade safely while preserving your local database, download the new installer directly from our GitHub Releases page.
              </p>
            </div>
          ) : isAndroidAPK ? (
            <div className="bg-apple-green/10 border border-apple-green/20 rounded-2xl p-4 space-y-2">
              <p className="font-semibold text-apple-green flex items-center gap-2 text-xs">
                <Smartphone className="w-4 h-4" />
                Android APK Package Update
              </p>
              <p className="text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
                Version <strong>v{updateState.newVersion}</strong> is ready to download and install. Your local SQLite ledger records will be preserved seamlessly during update.
              </p>
            </div>
          ) : (
            <div className="bg-apple-blue/10 border border-apple-blue/20 rounded-2xl p-4 space-y-2">
              <p className="font-semibold text-apple-blue flex items-center gap-2 text-xs">
                <ArrowUpCircle className="w-4 h-4" />
                Seamless Over-The-Air (OTA) Update
              </p>
              <p className="text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
                This update can be applied instantly within the application. Your SQLite financial records will remain completely safe in your AppData directory.
              </p>
            </div>
          )}

          {/* Release Notes */}
          {updateState.body && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-400">
                Changelog & Highlights
              </span>
              <div className="p-3 bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed text-ink-800 dark:text-ink-200">
                {updateState.body}
              </div>
            </div>
          )}

          {/* Progress Bar (For Desktop OTA Download) */}
          {isDownloading && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs font-mono text-ink-600 dark:text-ink-400">
                <span>Downloading update...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-apple-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success State */}
          {isDownloaded && (
            <div className="p-4 bg-apple-green/10 border border-apple-green/20 rounded-2xl flex items-center space-x-3 text-apple-green text-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>
                Update package downloaded and verified successfully. Please close and reopen SpendIt to complete the update.
              </span>
            </div>
          )}

          {/* Error State */}
          {downloadError && (
            <div className="p-3 bg-apple-red/10 border border-apple-red/20 rounded-2xl text-apple-red text-xs">
              {downloadError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
          >
            {isDownloaded ? 'Close' : 'Later'}
          </button>

          {isAndroidAPK ? (
            <button
              onClick={handleInstallAndroid}
              className="px-4 py-2 bg-apple-green hover:bg-apple-green/90 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download & Install APK</span>
            </button>
          ) : isMajorUpgrade ? (
            <button
              onClick={openGitHubReleases}
              className="px-4 py-2 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Download from GitHub</span>
            </button>
          ) : isDownloaded ? (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-apple-green hover:bg-apple-green/90 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart App</span>
            </button>
          ) : (
            <button
              onClick={handleStartOTADownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-apple-blue hover:bg-apple-blue/90 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Downloading...' : 'Update In-App'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default UpdateModal;

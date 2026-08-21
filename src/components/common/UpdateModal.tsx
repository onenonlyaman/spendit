import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AppUpdateState,
  downloadAndInstallOTAUpdate,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-50 dark:bg-paper-dark-card border-2 border-archival-ochre/40 shadow-2xl rounded-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-paper-200 dark:border-paper-dark-border bg-paper-100/50 dark:bg-paper-dark/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isMajorUpgrade ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-forest-100 text-forest-800 dark:bg-forest-900/40 dark:text-forest-300'}`}>
              {isMajorUpgrade ? <AlertTriangle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-ink-50">
                {isMajorUpgrade ? 'Major Release Upgrade Available' : 'New In-App Update Available'}
              </h3>
              <p className="text-xs font-mono text-ink-500">
                Current: <span className="font-bold">v{updateState.currentVersion}</span> → Available: <span className="font-bold text-archival-ochre">v{updateState.newVersion}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-paper-200 dark:hover:bg-paper-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm text-ink-700 dark:text-ink-300 font-sans">
          {isMajorUpgrade ? (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 space-y-2">
              <p className="font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Architectural Upgrade Required
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                Version <strong>v{updateState.newVersion}</strong> includes major native platform updates. To upgrade safely while preserving your local database, download the new installer directly from our GitHub Releases page.
              </p>
            </div>
          ) : (
            <div className="bg-forest-50 dark:bg-forest-950/30 border border-forest-200 dark:border-forest-900/50 rounded-xl p-4 space-y-2">
              <p className="font-medium text-forest-900 dark:text-forest-200 flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                Seamless Over-The-Air (OTA) Update
              </p>
              <p className="text-xs text-forest-800/80 dark:text-forest-300/80 leading-relaxed">
                This update can be applied instantly within the application. Your SQLite financial records will remain completely safe in your AppData directory.
              </p>
            </div>
          )}

          {/* Release Notes */}
          {updateState.body && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-500">
                Changelog & Highlights
              </span>
              <div className="p-3 bg-paper-100 dark:bg-paper-dark border border-paper-200 dark:border-paper-dark-border rounded-xl text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed text-ink-800 dark:text-ink-200">
                {updateState.body}
              </div>
            </div>
          )}

          {/* Progress Bar (For OTA Download) */}
          {isDownloading && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs font-mono text-ink-600 dark:text-ink-400">
                <span>Downloading update...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-paper-200 dark:bg-paper-dark rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-archival-ochre h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success State */}
          {isDownloaded && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-200 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                Update package downloaded and verified successfully. Please close and reopen SpendIt to complete the update.
              </span>
            </div>
          )}

          {/* Error State */}
          {downloadError && (
            <div className="p-3 bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-900/50 rounded-xl text-wine-800 dark:text-wine-200 text-xs">
              {downloadError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-paper-200 dark:border-paper-dark-border bg-paper-100/50 dark:bg-paper-dark/50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-medium text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
          >
            {isDownloaded ? 'Close' : 'Later'}
          </button>

          {isMajorUpgrade ? (
            <button
              onClick={openGitHubReleases}
              className="px-4 py-2 bg-archival-ochre hover:bg-archival-ochre-dark text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Download from GitHub</span>
            </button>
          ) : isDownloaded ? (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart App</span>
            </button>
          ) : (
            <button
              onClick={handleStartOTADownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-archival-ochre hover:bg-archival-ochre-dark disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-transform active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Downloading...' : 'Update In-App'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

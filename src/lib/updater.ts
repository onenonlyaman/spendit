import { check, Update } from '@tauri-apps/plugin-updater';
import { openUrl } from '@tauri-apps/plugin-opener';
import semver from 'semver';
import { sendNativeNotification } from './notifications';

export type UpdateKind = 'ota' | 'upgrade' | null;

export interface AppUpdateState {
  available: boolean;
  kind: UpdateKind;
  currentVersion: string;
  newVersion: string;
  body?: string;
  rawUpdate?: Update;
  downloadProgress?: number;
  isDownloading: boolean;
  isDownloaded: boolean;
  error?: string;
}

export const CURRENT_APP_VERSION = '1.0.0';
export const GITHUB_RELEASES_URL = 'https://github.com/spendit/spendit/releases';

/**
 * Checks for updates via GitHub Releases using Tauri v2 updater.
 * Classifies releases into:
 * - 'ota': Minor/patch update that can be downloaded and installed in-app.
 * - 'upgrade': Major version leaps (e.g. v1.x -> v2.x) that require downloading the latest release from GitHub.
 */
export async function checkForAppUpdates(): Promise<AppUpdateState> {
  try {
    const update = await check();
    if (!update || !update.available) {
      return {
        available: false,
        kind: null,
        currentVersion: CURRENT_APP_VERSION,
        newVersion: CURRENT_APP_VERSION,
        isDownloading: false,
        isDownloaded: false,
      };
    }

    const currentVer = update.currentVersion || CURRENT_APP_VERSION;
    const newVer = update.version;

    // Compare versions using semver
    let kind: UpdateKind = 'ota';
    const cleanCurrent = semver.clean(currentVer) || currentVer;
    const cleanNew = semver.clean(newVer) || newVer;

    if (semver.valid(cleanCurrent) && semver.valid(cleanNew)) {
      const diff = semver.diff(cleanCurrent, cleanNew);
      if (diff === 'major') {
        kind = 'upgrade';
      } else {
        kind = 'ota';
      }
    }

    return {
      available: true,
      kind,
      currentVersion: currentVer,
      newVersion: newVer,
      body: update.body || undefined,
      rawUpdate: update,
      isDownloading: false,
      isDownloaded: false,
    };
  } catch (err: any) {
    console.warn('Update check note:', err?.message || err);
    return {
      available: false,
      kind: null,
      currentVersion: CURRENT_APP_VERSION,
      newVersion: CURRENT_APP_VERSION,
      isDownloading: false,
      isDownloaded: false,
      error: err?.message || 'Unable to check for updates (running offline or in development mode)',
    };
  }
}

/**
 * Downloads and installs an OTA in-app update.
 */
export async function downloadAndInstallOTAUpdate(
  update: Update,
  onProgress?: (progressPercent: number) => void
): Promise<void> {
  let downloadedBytes = 0;
  let totalBytes = 0;

  await update.downloadAndInstall(event => {
    switch (event.event) {
      case 'Started':
        totalBytes = event.data.contentLength || 0;
        break;
      case 'Progress':
        downloadedBytes += event.data.chunkLength;
        if (totalBytes > 0 && onProgress) {
          const pct = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
          onProgress(pct);
        }
        break;
      case 'Finished':
        if (onProgress) onProgress(100);
        break;
    }
  });

  // Dispatch desktop notification
  await sendNativeNotification(
    '✨ Update Ready to Install',
    `SpendIt v${update.version} has been downloaded. Restart the app to apply the update.`
  );
}

/**
 * Opens GitHub Releases in the system browser for major upgrades.
 */
export async function openGitHubReleases(): Promise<void> {
  try {
    await openUrl(GITHUB_RELEASES_URL);
  } catch {
    window.open(GITHUB_RELEASES_URL, '_blank');
  }
}

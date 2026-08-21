import { check, Update } from '@tauri-apps/plugin-updater';
import { openUrl } from '@tauri-apps/plugin-opener';
import semver from 'semver';
import { sendNativeNotification } from './notifications';

export type UpdateKind = 'ota' | 'upgrade' | 'android-apk' | null;

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
  apkDownloadUrl?: string;
  error?: string;
}

export const CURRENT_APP_VERSION = '1.1.3';
export const GITHUB_RELEASES_URL = 'https://github.com/onenonlyaman/spendit/releases';




export const GITHUB_API_LATEST_URL = 'https://api.github.com/repos/onenonlyaman/spendit/releases/latest';

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Checks for updates across Desktop and Android platforms.
 */
export async function checkForAppUpdates(): Promise<AppUpdateState> {
  // 1. Android APK Update Check (Via GitHub Releases API)
  if (isAndroid()) {
    try {
      const response = await fetch(GITHUB_API_LATEST_URL, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }
      const release = await response.json();
      const latestTag = release.tag_name ? release.tag_name.replace(/^v/, '') : '';

      if (latestTag && semver.valid(latestTag) && semver.gt(latestTag, CURRENT_APP_VERSION)) {
        const apkAsset = release.assets?.find((a: any) =>
          a.name && (a.name.endsWith('.apk') || a.name.includes('universal.apk'))
        ) || release.assets?.find((a: any) => a.name?.endsWith('.apk'));

        return {
          available: true,
          kind: 'android-apk',
          currentVersion: CURRENT_APP_VERSION,
          newVersion: latestTag,
          body: release.body || undefined,
          apkDownloadUrl: apkAsset ? apkAsset.browser_download_url : GITHUB_RELEASES_URL,
          isDownloading: false,
          isDownloaded: false,
        };
      }

      return {
        available: false,
        kind: null,
        currentVersion: CURRENT_APP_VERSION,
        newVersion: CURRENT_APP_VERSION,
        isDownloading: false,
        isDownloaded: false,
      };
    } catch (err: any) {
      console.warn('Android update check note:', err?.message || err);
      return {
        available: false,
        kind: null,
        currentVersion: CURRENT_APP_VERSION,
        newVersion: CURRENT_APP_VERSION,
        isDownloading: false,
        isDownloaded: false,
        error: err?.message || 'Unable to check for Android updates',
      };
    }
  }

  // 2. Desktop Windows Tauri v2 Updater Check
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
 * Downloads and installs an OTA in-app update on Desktop.
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

  await sendNativeNotification(
    '✨ Update Ready to Install',
    `SpendIt v${update.version} has been downloaded. Restart the app to apply the update.`
  );
}

/**
 * Initiates Android APK package update.
 */
export async function installAndroidAPK(apkUrl?: string): Promise<void> {
  const url = apkUrl || GITHUB_RELEASES_URL;
  try {
    await openUrl(url);
  } catch {
    window.open(url, '_blank');
  }
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

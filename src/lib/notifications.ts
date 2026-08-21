import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { RecurringItem } from '../types';

/**
 * Ensures notification permissions are granted on Windows desktop.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    return permissionGranted;
  } catch (err) {
    console.warn('Native notifications unavailable (running outside Tauri):', err);
    return false;
  }
}

/**
 * Dispatches a native Windows desktop toast notification.
 */
export async function sendNativeNotification(title: string, body: string): Promise<void> {
  try {
    const hasPermission = await ensureNotificationPermission();
    if (hasPermission) {
      sendNotification({
        title,
        body,
      });
    }
  } catch (err) {
    console.warn('Failed to send native notification:', err);
  }
}

/**
 * Checks recurring bills and dispatches alerts for bills due today.
 */
export async function checkDueBillsAndNotify(recurring: RecurringItem[]): Promise<void> {
  const currentDay = new Date().getDate();
  const dueItems = recurring.filter(r => r.dayOfMonth === currentDay);

  if (dueItems.length === 1) {
    const item = dueItems[0];
    await sendNativeNotification(
      '💸 Bill Due Today — SpendIt',
      `"${item.name}" (₹${item.amount.toLocaleString('en-IN')}) is scheduled for today.`
    );
  } else if (dueItems.length > 1) {
    const total = dueItems.reduce((sum, item) => sum + item.amount, 0);
    await sendNativeNotification(
      '💸 Multiple Bills Due Today — SpendIt',
      `${dueItems.length} recurring payments totaling ₹${total.toLocaleString('en-IN')} are scheduled today.`
    );
  }
}

/**
 * Dispatches the evening financial reflection diary prompt.
 */
export async function sendDiaryEveningPrompt(): Promise<void> {
  await sendNativeNotification(
    '📖 Evening Financial Diary Reminder',
    'Take a peaceful moment to review today\'s spending and record your evening reflection.'
  );
}

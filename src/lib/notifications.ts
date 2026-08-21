import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { RecurringItem, CustomReminder } from '../types';

export const DEFAULT_REMINDERS: CustomReminder[] = [
  {
    id: 'default_daily_reflection',
    title: '📖 Evening Financial Folio Check',
    body: 'Take a moment to record today\'s expenses, review your balance, and seal your daily note.',
    time: '20:00',
    frequency: 'daily',
    action: 'log_day',
    enabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'default_weekly_review',
    title: '📊 Weekly Financial Review',
    body: 'Review your money jars, category budgets, and overall financial pace.',
    time: '18:00',
    frequency: 'weekly',
    dayOfWeek: 0, // Sunday
    action: 'review_jars',
    enabled: false,
    createdAt: Date.now() + 1,
  },
];

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
 * Checks custom user reminders and triggers notifications when schedule matches.
 * Returns the list of reminder IDs that fired.
 */
export async function checkCustomRemindersAndNotify(
  reminders: CustomReminder[]
): Promise<string[]> {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentHHmm = `${currentHours}:${currentMinutes}`;
  const currentDayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
  const currentDayOfMonth = now.getDate();
  const todayDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const firedReminderIds: string[] = [];

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;

    // Check if already fired today
    if (reminder.lastTriggeredDate === todayDateStr) continue;

    // Match Time ("HH:mm")
    if (reminder.time !== currentHHmm) continue;

    // Match Frequency
    let shouldFire = false;
    switch (reminder.frequency) {
      case 'daily':
        shouldFire = true;
        break;
      case 'weekdays':
        shouldFire = currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
        break;
      case 'weekends':
        shouldFire = currentDayOfWeek === 0 || currentDayOfWeek === 6;
        break;
      case 'weekly':
        shouldFire = reminder.dayOfWeek !== undefined && reminder.dayOfWeek === currentDayOfWeek;
        break;
      case 'monthly':
        shouldFire = reminder.dayOfMonth !== undefined && reminder.dayOfMonth === currentDayOfMonth;
        break;
    }

    if (shouldFire) {
      await sendNativeNotification(reminder.title, reminder.body);
      firedReminderIds.push(reminder.id);
    }
  }

  return firedReminderIds;
}

/**
 * Sends an immediate test notification.
 */
export async function sendTestNotification(): Promise<void> {
  await sendNativeNotification(
    '🔔 SpendIt Notification Test',
    'Custom reminders and alerts are properly active on your system!'
  );
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


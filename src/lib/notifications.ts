/**
 * Expense Tracker — Local Notifications Module
 * Strictly local notifications for daily expense reminders.
 * No push notification / remote FCM dependency.
 */

import { Platform } from 'react-native';

export interface ScheduledReminderInfo {
  id: string;
  hour?: number;
  minute?: number;
}

/**
 * Request notification permissions from the user.
 * Returns true if permissions are granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const Notifications = await import('expo-notifications');
    if (!Notifications.getPermissionsAsync || !Notifications.requestPermissionsAsync) {
      return false;
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return requested.status === 'granted';
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Cancel all scheduled reminders and notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const Notifications = await import('expo-notifications');
    if (Notifications.cancelAllScheduledNotificationsAsync) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  } catch (error) {
    console.warn('Failed to cancel scheduled notifications:', error);
  }
}

/**
 * Get all currently scheduled local notifications.
 */
export async function getScheduledReminders(): Promise<ScheduledReminderInfo[]> {
  if (Platform.OS === 'web') return [];

  try {
    const Notifications = await import('expo-notifications');
    if (!Notifications.getAllScheduledNotificationsAsync) return [];

    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.map((item) => {
      const trigger = item.trigger as { hour?: number; minute?: number } | null;
      return {
        id: item.identifier,
        hour: trigger?.hour,
        minute: trigger?.minute,
      };
    });
  } catch (error) {
    console.warn('Failed to get scheduled notifications:', error);
    return [];
  }
}

/**
 * Schedule a daily reminder at specified hour and minute.
 * Cancels all previous scheduled notifications first, then registers
 * a new recurring daily trigger.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  options?: { title?: string; body?: string }
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const Notifications = await import('expo-notifications');
    if (!Notifications.scheduleNotificationAsync || !Notifications.SchedulableTriggerInputTypes) {
      return false;
    }

    // Configure foreground presentation behavior if not already set
    if (Notifications.setNotificationHandler) {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      } catch {
        // Safe to ignore if already configured
      }
    }

    // Cancel all existing scheduled notifications first
    await cancelAllReminders();

    // Android channel setup
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('expense-daily-reminders', {
        name: 'Daily Reminder',
        description: 'Daily reminder to log your daily expenses',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    const title = options?.title ?? 'Daily Expense Reminder 💰';
    const body =
      options?.body ??
      'Did you record your expenses today? Keep your budget accurate by logging them now!';

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'daily_reminder', url: '/add' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? 'expense-daily-reminders' : undefined,
      },
    });

    return true;
  } catch (error) {
    console.warn('Failed to schedule daily reminder:', error);
    return false;
  }
}

import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns true if the app is currently running inside the Expo Go app on Android or iOS.
 * Uses expo-constants AppOwnership / ExecutionEnvironment compatible across all Expo SDKs.
 */
export function isRunningInExpoGo(): boolean {
  return (
    Constants.appOwnership === AppOwnership.Expo ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

export const REMINDER_CHANNEL_ID = 'reminders';
export const BUDGET_CHANNEL_ID = 'budget-alerts';
export const TRANSACTIONS_CHANNEL_ID = 'transactions';

/**
 * Configure Android notification channels with appropriate semantic importance
 */
export async function setupNotificationChannelsAsync(): Promise<void> {
  if (Platform.OS !== 'android' || isRunningInExpoGo()) return;
  try {
    const { setNotificationChannelAsync, AndroidImportance } = await import(
      'expo-notifications'
    );
    if (!setNotificationChannelAsync) return;

    // 1. Reminders channel (HIGH importance for scheduled prompts)
    await setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Daily Reminders',
      description: 'Reminds you to record your daily expenses',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      sound: 'default',
    });

    // 2. Budget Alerts channel (HIGH importance for financial warnings)
    await setNotificationChannelAsync(BUDGET_CHANNEL_ID, {
      name: 'Budget Alerts',
      description: 'Notifies when spending approaches or exceeds your monthly budget',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: 'default',
    });

    // 3. Transactions channel (DEFAULT importance for transaction confirmations)
    await setNotificationChannelAsync(TRANSACTIONS_CHANNEL_ID, {
      name: 'Transaction Updates',
      description: 'Activity summaries and transaction records',
      importance: AndroidImportance.DEFAULT,
      lightColor: '#10B981',
      sound: 'default',
    });
  } catch (err) {
    console.warn('Failed to setup notification channels:', err);
  }
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === 'web' || isRunningInExpoGo()) return false;

  try {
    const { getPermissionsAsync, requestPermissionsAsync } = await import(
      'expo-notifications'
    );
    if (!getPermissionsAsync || !requestPermissionsAsync) return false;

    const currentSettings = await getPermissionsAsync();
    let status = currentSettings.status;

    if (status !== 'granted') {
      const requested = await requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      status = requested.status;
    }

    return status === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permissions:', err);
    return false;
  }
}

/**
 * Cancel any existing daily reminder scheduled notifications
 */
export async function cancelDailyReminderAsync(): Promise<void> {
  if (Platform.OS === 'web' || isRunningInExpoGo()) return;
  try {
    const { getAllScheduledNotificationsAsync, cancelScheduledNotificationAsync } =
      await import('expo-notifications');
    if (!getAllScheduledNotificationsAsync || !cancelScheduledNotificationAsync) return;

    const scheduled = await getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'daily_reminder') {
        await cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (err) {
    console.warn('Failed to cancel daily reminder:', err);
  }
}

/**
 * Schedule daily recurring reminder
 */
export async function scheduleDailyReminderAsync(
  hour: number,
  minute: number,
  language: 'en' | 'bn' = 'en',
): Promise<boolean> {
  if (Platform.OS === 'web' || isRunningInExpoGo()) return false;

  try {
    const {
      scheduleNotificationAsync,
      setNotificationHandler,
      SchedulableTriggerInputTypes,
    } = await import('expo-notifications');

    if (!scheduleNotificationAsync) return false;

    const hasPermission = await requestNotificationPermissionsAsync();
    if (!hasPermission) return false;

    if (setNotificationHandler) {
      try {
        setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      } catch {
        // Ignore handler error if already set
      }
    }

    await setupNotificationChannelsAsync();
    await cancelDailyReminderAsync();

    const title =
      language === 'bn'
        ? 'দৈনিক খরচের হিসাব রাখুন 💰'
        : 'Time to log your expenses 💰';

    const body =
      language === 'bn'
        ? 'আজ কি কোনো খরচ করেছেন? বাজেট নিয়ন্ত্রণে রাখতে এখনই লিখে রাখুন!'
        : 'Did you make any purchases today? Log them now to keep your budget on track!';

    await scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'daily_reminder', url: '/add' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });

    return true;
  } catch (err) {
    console.warn('Failed to schedule daily reminder:', err);
    return false;
  }
}

// Memory cache to deduplicate budget alert notifications during active sessions
const notifiedBudgetMonths: Record<string, '80' | '100'> = {};

/**
 * Checks budget threshold against actual month totals and fires genuine OS notification if breached.
 * Automatically deduplicated so the user is only notified once per threshold per month.
 */
export async function checkBudgetThresholdAlertAsync(params: {
  month: string;
  totalSpent: number;
  totalBudget: number;
  language: 'en' | 'bn';
}): Promise<void> {
  const { month, totalSpent, totalBudget, language } = params;
  if (!totalBudget || totalBudget <= 0 || totalSpent <= 0) return;
  if (Platform.OS === 'web' || isRunningInExpoGo()) return;

  const ratio = totalSpent / totalBudget;
  let thresholdHit: '80' | '100' | null = null;

  if (ratio >= 1.0) {
    thresholdHit = '100';
  } else if (ratio >= 0.8) {
    thresholdHit = '80';
  }

  if (!thresholdHit) return;

  const currentLevel = notifiedBudgetMonths[month];
  // Deduplicate: Don't repeat identical alert level for the current month
  if (currentLevel === thresholdHit || (currentLevel === '100' && thresholdHit === '80')) {
    return;
  }

  try {
    const { scheduleNotificationAsync } = await import('expo-notifications');
    if (!scheduleNotificationAsync) return;

    await setupNotificationChannelsAsync();

    const isExceeded = thresholdHit === '100';
    const title = isExceeded
      ? language === 'bn'
        ? 'বাজেট ছাড়িয়ে গেছে! ⚠️'
        : 'Monthly Budget Exceeded ⚠️'
      : language === 'bn'
        ? 'বাজেট সতর্কতা: ৮০% খরচ হয়েছে 📊'
        : 'Budget Warning: 80% Spent 📊';

    const body = isExceeded
      ? language === 'bn'
        ? 'আপনার চলতি মাসের খরচের পরিমাণ নির্ধারিত বাজেট সীমা অতিক্রম করেছে।'
        : 'Your spending this month has exceeded your total monthly budget limit.'
      : language === 'bn'
        ? 'আপনার চলতি মাসের খরচের পরিমাণ বাজেটের ৮০% এ পৌঁছে গেছে।'
        : 'You have reached 80% of your allocated monthly budget.';

    await scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'budget_alert', month, url: '/budget' },
      },
      trigger: {
        channelId: BUDGET_CHANNEL_ID,
      },
    });

    notifiedBudgetMonths[month] = thresholdHit;
  } catch (err) {
    console.warn('Failed to send budget notification:', err);
  }
}


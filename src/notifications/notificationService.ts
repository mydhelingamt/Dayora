import { DeviceEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import { databaseClient, DatabaseClient } from '../database';
import { Logger } from '../services/loggerService';
import { DateService } from '../services/dateService';
import { BirthdayEntity, TaskEntity, UserProfileEntity } from '../repositories/types';
import { NativeBridge } from './nativeBridge';
import {
  CelebrationPayload,
  NotificationChannelConfig,
  NotificationClickEvent,
  NotificationType,
  ReconciliationStats,
  ScheduledNotificationEntity,
} from './types';

export const NOTIFICATION_CHANNELS: Record<string, NotificationChannelConfig> = {
  BIRTHDAYS: {
    id: 'dayora_birthdays',
    name: 'Birthday Reminders',
    description: 'Notifications for upcoming birthdays and milestone celebrations',
    importance: 'high',
    vibration: true,
  },
  TASKS: {
    id: 'dayora_tasks',
    name: 'Task Deadlines',
    description: 'Alerts for scheduled tasks and upcoming due dates',
    importance: 'high',
    vibration: true,
  },
};

/**
 * Generates a stable, collision-resistant 32-bit positive integer hash
 * for Android AlarmManager and NotificationManagerCompat.
 */
/* eslint-disable no-bitwise */
export function hashStringToCode(str: string, baseOffset = 100000): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (Math.abs(hash) % 1000000000) + baseOffset;
}
/* eslint-enable no-bitwise */

export class NotificationService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient = databaseClient) {
    this.db = db;
  }

  public getBirthdayNotificationId(birthdayId: string): string {
    return `bday_${birthdayId}`;
  }

  public getTaskNotificationId(taskId: string): string {
    return `task_${taskId}`;
  }

  public getUserBirthdayNotificationId(): string {
    return 'user_birthday';
  }

  /**
   * Checks whether POST_NOTIFICATIONS permission is already granted.
   */
  public async checkPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      if (Platform.Version >= 33) {
        return await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Requests POST_NOTIFICATIONS runtime permission on Android 13+ (API 33+).
   */
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        if (isGranted) {
          await NativeBridge.createNotificationChannels();
        }
        return isGranted;
      }
      await NativeBridge.createNotificationChannels();
      return true;
    } catch (error) {
      Logger.error('Failed to request notification permission', error);
      return false;
    }
  }

  /**
   * Schedules an exact local notification for an upcoming birthday at midnight.
   */
  public async scheduleBirthdayNotification(
    birthday: BirthdayEntity,
    referenceDate: Date = new Date()
  ): Promise<boolean> {
    try {
      if (!this.db.isInitialized()) {
        return false;
      }

      if (birthday.is_archived) {
        await this.cancelForReference('birthday', birthday.id);
        return false;
      }

      const nowMs = referenceDate.getTime();
      const nextBday = DateService.getNextBirthday(
        birthday.birth_day,
        birthday.birth_month,
        referenceDate
      ).nextDate;

      const daysBefore = birthday.reminder_days_before || 0;
      const targetDate = new Date(
        nextBday.getFullYear(),
        nextBday.getMonth(),
        nextBday.getDate() - daysBefore,
        0, 0, 0, 0 // Midnight local time
      );

      // If midnight for this year's reminder has already passed, schedule for the next year
      if (targetDate.getTime() <= nowMs) {
        const futureRef = new Date(nowMs + 86400000);
        const nextNextBday = DateService.getNextBirthday(
          birthday.birth_day,
          birthday.birth_month,
          futureRef
        ).nextDate;
        targetDate.setFullYear(nextNextBday.getFullYear());
        targetDate.setMonth(nextNextBday.getMonth());
        targetDate.setDate(nextNextBday.getDate() - daysBefore);
      }

      const triggerTimeMs = targetDate.getTime();
      const turningAge = DateService.getTurningAge(
        birthday.birth_year,
        birthday.birth_month,
        birthday.birth_day,
        nextBday
      );

      const id = this.getBirthdayNotificationId(birthday.id);
      const code = hashStringToCode(id, 100000);
      const channelId = NOTIFICATION_CHANNELS.BIRTHDAYS?.id || 'dayora_birthdays';

      const relationshipTag = birthday.relationship ? ` (${birthday.relationship})` : '';
      const title =
        daysBefore === 0
          ? `🎉 It's ${birthday.name}'s Birthday Today!`
          : `🎂 Upcoming Birthday: ${birthday.name}${relationshipTag}`;

      let body = '';
      if (turningAge !== null) {
        body =
          daysBefore === 0
            ? `${birthday.name} is turning ${turningAge} today! Tap to celebrate.`
            : `${birthday.name} is turning ${turningAge} in ${daysBefore} ${daysBefore === 1 ? 'day' : 'days'}!`;
      } else {
        body =
          daysBefore === 0
            ? `Wish ${birthday.name} a wonderful birthday! Tap to celebrate.`
            : `${birthday.name}'s birthday is in ${daysBefore} ${daysBefore === 1 ? 'day' : 'days'}!`;
      }

      if (birthday.relationship && !body.includes(birthday.relationship)) {
        body += ` • ${birthday.relationship}`;
      }
      if (birthday.notes && birthday.notes.trim()) {
        body += `\n📝 Notes: ${birthday.notes.trim()}`;
      }

      const payload: CelebrationPayload = {
        type: 'birthday',
        referenceId: birthday.id,
        name: birthday.name,
        turningAge,
        relationship: birthday.relationship || undefined,
        photoUri: birthday.photo_uri || undefined,
        message: body,
      };

      const payloadJson = JSON.stringify(payload);
      const nowIso = new Date().toISOString();

      // Persist metadata in SQLite
      await this.db.execute(
        `INSERT OR REPLACE INTO scheduled_notifications (
          id, notification_code, type, reference_id, title, body, channel_id,
          trigger_time_ms, trigger_date_str, payload_json, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?);`,
        [
          id,
          code,
          'birthday',
          birthday.id,
          title,
          body,
          channelId,
          triggerTimeMs,
          targetDate.toISOString(),
          payloadJson,
          nowIso,
          nowIso,
        ]
      );

      // Schedule native AlarmManager alarm
      await NativeBridge.scheduleNotification(
        id,
        code,
        channelId,
        title,
        body,
        triggerTimeMs,
        'birthday',
        birthday.id,
        payloadJson
      );

      Logger.debug(`Scheduled birthday notification for ${birthday.name} at ${targetDate.toISOString()}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to schedule birthday notification for ${birthday.id}`, error);
      return false;
    }
  }

  /**
   * Schedules an exact local notification for a task with configured reminder offset.
   */
  public async scheduleTaskNotification(
    task: TaskEntity,
    referenceDate: Date = new Date()
  ): Promise<boolean> {
    try {
      if (!this.db.isInitialized()) {
        return false;
      }

      // If task has no due date, or is completed/cancelled, cancel existing notification
      if (
        !task.due_date ||
        task.status === 'completed' ||
        task.status === 'cancelled' ||
        Number(task.is_completed) === 1 ||
        task.reminder_minutes === null
      ) {
        await this.cancelForReference('task', task.id);
        return false;
      }

      const [yearRaw, monthRaw, dayRaw] = (task.due_date || '').split('-').map(Number);
      const [hoursRaw, minutesRaw] = (task.due_time && task.due_time.trim() ? task.due_time.trim() : '09:00')
        .split(':')
        .map(Number);
      const parsedYear = yearRaw || new Date().getFullYear();
      const parsedMonth = (monthRaw || 1) - 1;
      const parsedDay = dayRaw || 1;
      const parsedHours = typeof hoursRaw === 'number' && !Number.isNaN(hoursRaw) ? hoursRaw : 9;
      const parsedMinutes = typeof minutesRaw === 'number' && !Number.isNaN(minutesRaw) ? minutesRaw : 0;
      const dueDateTime = new Date(parsedYear, parsedMonth, parsedDay, parsedHours, parsedMinutes, 0, 0);

      const reminderMinutes = task.reminder_minutes ?? 0;
      let triggerTimeMs = dueDateTime.getTime() - reminderMinutes * 60 * 1000;

      // If trigger time has already passed, but due time is still in future, fallback to due time
      if (triggerTimeMs <= referenceDate.getTime() && dueDateTime.getTime() > referenceDate.getTime()) {
        triggerTimeMs = dueDateTime.getTime();
      } else if (triggerTimeMs <= referenceDate.getTime()) {
        await this.cancelForReference('task', task.id);
        return false;
      }

      const id = this.getTaskNotificationId(task.id);
      const code = hashStringToCode(id, 500000);
      const channelId = NOTIFICATION_CHANNELS.TASKS?.id || 'dayora_tasks';

      let priorityPrefix = '📌';
      if (task.priority === 'urgent') {
        priorityPrefix = '🚨 [Urgent]';
      } else if (task.priority === 'high') {
        priorityPrefix = '⚡ [High]';
      }
      const title = `${priorityPrefix} Task Reminder: ${task.title}`;

      let reminderPrefix = '';
      if (reminderMinutes === 0) {
        reminderPrefix = 'Due now';
      } else if (reminderMinutes === 15) {
        reminderPrefix = 'Due in 15 minutes';
      } else if (reminderMinutes === 30) {
        reminderPrefix = 'Due in 30 minutes';
      } else if (reminderMinutes === 60) {
        reminderPrefix = 'Due in 1 hour';
      } else if (reminderMinutes === 1440) {
        reminderPrefix = 'Due tomorrow';
      } else {
        reminderPrefix = `Due in ${reminderMinutes} minutes`;
      }

      const categoryLabel = task.category
        ? task.category.charAt(0).toUpperCase() + task.category.slice(1)
        : 'Task';

      let body = `${reminderPrefix} (${task.due_time || '09:00'}) • [${categoryLabel}]`;
      if (task.location) {
        body += ` • 📍 ${task.location}`;
      }
      if (task.description && task.description.trim()) {
        body += `\n📝 ${task.description.trim()}`;
      }
      const payload = {
        type: 'task',
        referenceId: task.id,
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.due_date,
        dueTime: task.due_time,
      };

      const payloadJson = JSON.stringify(payload);
      const nowIso = new Date().toISOString();

      await this.db.execute(
        `INSERT OR REPLACE INTO scheduled_notifications (
          id, notification_code, type, reference_id, title, body, channel_id,
          trigger_time_ms, trigger_date_str, payload_json, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?);`,
        [
          id,
          code,
          'task',
          task.id,
          title,
          body,
          channelId,
          triggerTimeMs,
          new Date(triggerTimeMs).toISOString(),
          payloadJson,
          nowIso,
          nowIso,
        ]
      );

      await NativeBridge.scheduleNotification(
        id,
        code,
        channelId,
        title,
        body,
        triggerTimeMs,
        'task',
        task.id,
        payloadJson
      );

      Logger.debug(`Scheduled task notification for "${task.title}" at ${new Date(triggerTimeMs).toISOString()}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to schedule task notification for ${task.id}`, error);
      return false;
    }
  }

  /**
   * Schedules a celebration notification for the main user's own birthday.
   */
  public async scheduleUserBirthdayNotification(
    profile: UserProfileEntity,
    referenceDate: Date = new Date()
  ): Promise<boolean> {
    try {
      if (!this.db.isInitialized()) {
        return false;
      }

      if (!profile.date_of_birth) {
        await this.cancelForReference('user_birthday', 'user');
        return false;
      }

      const parts = profile.date_of_birth.split('-');
      let month: number;
      let day: number;
      let year: number | null = null;

      if (parts.length === 3) {
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else if (parts.length === 2) {
        month = Number(parts[0]);
        day = Number(parts[1]);
      } else {
        return false;
      }

      const nowMs = referenceDate.getTime();
      const nextBday = DateService.getNextBirthday(day, month, referenceDate).nextDate;
      const targetDate = new Date(nextBday.getFullYear(), nextBday.getMonth(), nextBday.getDate(), 0, 0, 0, 0);

      if (targetDate.getTime() <= nowMs) {
        const futureRef = new Date(nowMs + 86400000);
        const nextNextBday = DateService.getNextBirthday(day, month, futureRef).nextDate;
        targetDate.setFullYear(nextNextBday.getFullYear());
        targetDate.setMonth(nextNextBday.getMonth());
        targetDate.setDate(nextNextBday.getDate());
      }

      const triggerTimeMs = targetDate.getTime();
      const turningAge = year ? DateService.getTurningAge(year, month, day, nextBday) : null;

      const id = this.getUserBirthdayNotificationId();
      const code = 999999;
      const channelId = NOTIFICATION_CHANNELS.BIRTHDAYS?.id || 'dayora_birthdays';
      const title = `🌟 Happy Birthday, ${profile.name || 'Friend'}!`;
      const body = `Today is your special day! Open Dayora to reveal your birthday celebration! 🎂`;

      const payload: CelebrationPayload = {
        type: 'user_birthday',
        referenceId: 'user',
        name: profile.name || 'You',
        turningAge,
        photoUri: profile.photo_uri || undefined,
        message: body,
      };

      const payloadJson = JSON.stringify(payload);
      const nowIso = new Date().toISOString();

      await this.db.execute(
        `INSERT OR REPLACE INTO scheduled_notifications (
          id, notification_code, type, reference_id, title, body, channel_id,
          trigger_time_ms, trigger_date_str, payload_json, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?);`,
        [
          id,
          code,
          'user_birthday',
          'user',
          title,
          body,
          channelId,
          triggerTimeMs,
          targetDate.toISOString(),
          payloadJson,
          nowIso,
          nowIso,
        ]
      );

      await NativeBridge.scheduleNotification(
        id,
        code,
        channelId,
        title,
        body,
        triggerTimeMs,
        'user_birthday',
        'user',
        payloadJson
      );

      Logger.debug(`Scheduled user birthday celebration notification at ${targetDate.toISOString()}`);
      return true;
    } catch (error) {
      Logger.error('Failed to schedule user birthday notification', error);
      return false;
    }
  }

  /**
   * Cancels any scheduled notification associated with a specific entity reference.
   */
  public async cancelForReference(type: NotificationType, referenceId: string): Promise<void> {
    try {
      if (!this.db.isInitialized()) {
        return;
      }

      const result = await this.db.execute<ScheduledNotificationEntity>(
        `SELECT notification_code FROM scheduled_notifications
         WHERE type = ? AND reference_id = ? AND status = 'scheduled';`,
        [type, referenceId]
      );

      for (const row of result.rows) {
        await NativeBridge.cancelNotification(row.notification_code);
      }

      const nowIso = new Date().toISOString();
      await this.db.execute(
        `UPDATE scheduled_notifications
         SET status = 'cancelled', updated_at = ?
         WHERE type = ? AND reference_id = ? AND status = 'scheduled';`,
        [nowIso, type, referenceId]
      );
    } catch (error) {
      Logger.error(`Failed to cancel notification for ${type}:${referenceId}`, error);
    }
  }

  /**
   * Reconciles all pending notifications against active birthdays and tasks in SQLite.
   * Designed to run asynchronously during app startup without blocking UI rendering.
   */
  public async reconcileNotifications(referenceDate: Date = new Date()): Promise<ReconciliationStats> {
    const stats: ReconciliationStats = {
      scheduledBirthdays: 0,
      scheduledTasks: 0,
      scheduledUserBirthday: false,
      cancelledOrphaned: 0,
      cleanedExpired: 0,
    };

    try {
      if (!this.db.isInitialized()) {
        return stats;
      }

      const nowMs = referenceDate.getTime();
      const nowIso = referenceDate.toISOString();

      // 1. Reconcile active birthdays
      const birthdaysResult = await this.db.execute<BirthdayEntity>(
        'SELECT * FROM birthdays WHERE is_archived = 0;'
      );
      for (const bday of birthdaysResult.rows) {
        const scheduled = await this.scheduleBirthdayNotification(bday, referenceDate);
        if (scheduled) stats.scheduledBirthdays++;
      }

      // 2. Reconcile active tasks
      const tasksResult = await this.db.execute<TaskEntity>(
        `SELECT * FROM tasks
         WHERE status = 'pending' AND due_date IS NOT NULL AND (is_completed = 0 OR is_completed IS NULL);`
      );
      for (const task of tasksResult.rows) {
        const scheduled = await this.scheduleTaskNotification(task, referenceDate);
        if (scheduled) stats.scheduledTasks++;
      }

      // 3. Reconcile main user's birthday
      const userResult = await this.db.execute<UserProfileEntity>(
        'SELECT * FROM user_profile LIMIT 1;'
      );
      if (userResult.rows[0]?.date_of_birth) {
        stats.scheduledUserBirthday = await this.scheduleUserBirthdayNotification(
          userResult.rows[0],
          referenceDate
        );
      }

      // 4. Cancel orphaned birthday notifications
      const orphanedBirthdays = await this.db.execute<{ notification_code: number }>(
        `SELECT notification_code FROM scheduled_notifications
         WHERE status = 'scheduled' AND type = 'birthday'
           AND reference_id NOT IN (SELECT id FROM birthdays WHERE is_archived = 0);`
      );
      for (const orphan of orphanedBirthdays.rows) {
        await NativeBridge.cancelNotification(orphan.notification_code);
        stats.cancelledOrphaned++;
      }
      await this.db.execute(
        `UPDATE scheduled_notifications SET status = 'cancelled', updated_at = ?
         WHERE status = 'scheduled' AND type = 'birthday'
           AND reference_id NOT IN (SELECT id FROM birthdays WHERE is_archived = 0);`,
        [nowIso]
      );

      // 5. Cancel orphaned task notifications
      const orphanedTasks = await this.db.execute<{ notification_code: number }>(
        `SELECT notification_code FROM scheduled_notifications
         WHERE status = 'scheduled' AND type = 'task'
           AND reference_id NOT IN (SELECT id FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL);`
      );
      for (const orphan of orphanedTasks.rows) {
        await NativeBridge.cancelNotification(orphan.notification_code);
        stats.cancelledOrphaned++;
      }
      await this.db.execute(
        `UPDATE scheduled_notifications SET status = 'cancelled', updated_at = ?
         WHERE status = 'scheduled' AND type = 'task'
           AND reference_id NOT IN (SELECT id FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL);`,
        [nowIso]
      );

      // 6. Mark expired notifications as delivered
      const expiredResult = await this.db.execute(
        `UPDATE scheduled_notifications
         SET status = 'delivered', updated_at = ?
         WHERE status = 'scheduled' AND trigger_time_ms < ?;`,
        [nowIso, nowMs]
      );
      stats.cleanedExpired = expiredResult.rowsAffected || 0;

      Logger.debug('Notification reconciliation complete:', stats);
    } catch (error) {
      Logger.error('Notification reconciliation failed', error);
    }

    return stats;
  }

  /**
   * Retrieves any notification payload that launched the app from a closed state.
   */
  public async getInitialNotification(): Promise<NotificationClickEvent | null> {
    return await NativeBridge.getInitialNotification();
  }

  /**
   * Plays the synthesized lightweight Happy Birthday chime tune.
   */
  public async playBirthdayTune(): Promise<boolean> {
    return await NativeBridge.playBirthdayTune();
  }

  /**
   * Stops the synthesized birthday music.
   */
  public async stopBirthdayTune(): Promise<boolean> {
    return await NativeBridge.stopBirthdayTune();
  }

  /**
   * Listens for foreground and background notification tap events.
   */
  public addNotificationClickListener(
    callback: (event: NotificationClickEvent) => void
  ): () => void {
    const subscription = DeviceEventEmitter.addListener(
      'onDayoraNotificationClick',
      (event: NotificationClickEvent) => {
        try {
          callback(event);
        } catch (error) {
          Logger.error('Error handling notification click event', error);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }
}

export const notificationService = new NotificationService();

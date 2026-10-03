import { NativeModules } from 'react-native';
import { databaseClient } from '../database';
import { BirthdayEntity, TaskEntity, UserProfileEntity } from '../repositories/types';
import { notificationService } from '../notifications/notificationService';
import { Logger } from './loggerService';

export interface DayoraBackupPayload {
  dayora_backup_version: number;
  app_version: string;
  exported_at: string;
  summary: {
    birthday_count: number;
    task_count: number;
    has_user_profile: boolean;
  };
  data: {
    user_profile: UserProfileEntity | null;
    birthdays: BirthdayEntity[];
    tasks: TaskEntity[];
  };
}

export interface ExportBackupResult {
  success: boolean;
  filePath: string;
  fileName: string;
  savedToDownloads: boolean;
  birthdayCount: number;
  taskCount: number;
}

export interface RestoreBackupResult {
  success: boolean;
  mode: 'merge' | 'replace';
  birthdaysRestored: number;
  tasksRestored: number;
  profileRestored: boolean;
}

const { DayoraStorageModule } = NativeModules;

export class BackupService {
  /**
   * Generates a complete JSON backup payload from the local SQLite database.
   */
  public static async generateBackupPayload(): Promise<DayoraBackupPayload> {
    try {
      const [profileRes, birthdaysRes, tasksRes] = await Promise.all([
        databaseClient.execute<UserProfileEntity>('SELECT * FROM user_profile LIMIT 1;'),
        databaseClient.execute<BirthdayEntity>(
          'SELECT * FROM birthdays WHERE is_archived = 0 ORDER BY name ASC;'
        ),
        databaseClient.execute<TaskEntity>(
          'SELECT * FROM tasks ORDER BY created_at ASC;'
        ),
      ]);

      const userProfile = profileRes.rows && profileRes.rows.length > 0 ? profileRes.rows[0] : null;
      const birthdays = birthdaysRes.rows || [];
      const tasks = tasksRes.rows || [];

      return {
        dayora_backup_version: 1,
        app_version: '0.0.1',
        exported_at: new Date().toISOString(),
        summary: {
          birthday_count: birthdays.length,
          task_count: tasks.length,
          has_user_profile: Boolean(userProfile),
        },
        data: {
          user_profile: userProfile ?? null,
          birthdays,
          tasks,
        },
      };
    } catch (error) {
      Logger.error('Failed to generate backup payload', error as Error);
      throw new Error(`Failed to generate backup: ${(error as Error).message}`);
    }
  }

  /**
   * Exports local data into a JSON file, saves to Downloads, and opens the system Share sheet.
   */
  public static async exportBackup(): Promise<ExportBackupResult> {
    const payload = await this.generateBackupPayload();
    const jsonString = JSON.stringify(payload, null, 2);

    const now = new Date();
    const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const suggestedFileName = `dayora_backup_${dateStamp}.json`;

    if (DayoraStorageModule && typeof DayoraStorageModule.exportBackupFile === 'function') {
      const nativeResult = await DayoraStorageModule.exportBackupFile(jsonString, suggestedFileName);
      return {
        success: nativeResult?.success ?? true,
        filePath: nativeResult?.filePath ?? '',
        fileName: nativeResult?.fileName ?? suggestedFileName,
        savedToDownloads: nativeResult?.savedToDownloads ?? false,
        birthdayCount: payload.summary.birthday_count,
        taskCount: payload.summary.task_count,
      };
    }

    // Fallback for tests or unsupported environments
    Logger.debug('DayoraStorageModule.exportBackupFile not available, returning payload summary');
    return {
      success: true,
      filePath: suggestedFileName,
      fileName: suggestedFileName,
      savedToDownloads: false,
      birthdayCount: payload.summary.birthday_count,
      taskCount: payload.summary.task_count,
    };
  }

  /**
   * Opens the system file picker, reads the chosen backup file, and validates its contents.
   */
  public static async pickAndValidateBackup(): Promise<DayoraBackupPayload> {
    if (!DayoraStorageModule || typeof DayoraStorageModule.pickAndImportBackupFile !== 'function') {
      throw new Error('Native file picker is not available on this platform.');
    }

    const rawJson = await DayoraStorageModule.pickAndImportBackupFile();
    if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
      throw new Error('Selected backup file is empty.');
    }

    return this.validateBackupPayload(rawJson);
  }

  /**
   * Validates and sanitizes a raw JSON string to ensure it is a valid Dayora backup.
   */
  public static validateBackupPayload(jsonString: string): DayoraBackupPayload {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Invalid JSON format: The selected file could not be parsed.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid backup file: Root must be a valid JSON object.');
    }

    if (!parsed.dayora_backup_version && !parsed.data) {
      throw new Error('Unrecognized backup format: Missing Dayora backup signature.');
    }

    const data = parsed.data || {};
    const birthdays = Array.isArray(data.birthdays) ? data.birthdays : [];
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const userProfile = data.user_profile && typeof data.user_profile === 'object' ? data.user_profile : null;

    // Validate that birthday items have required minimum fields
    const validBirthdays: BirthdayEntity[] = birthdays.filter(
      (b: any) => b && typeof b.name === 'string' && typeof b.birth_date === 'string'
    );

    // Validate that task items have required minimum fields
    const validTasks: TaskEntity[] = tasks.filter(
      (t: any) => t && typeof t.title === 'string'
    );

    return {
      dayora_backup_version: parsed.dayora_backup_version || 1,
      app_version: parsed.app_version || '0.0.1',
      exported_at: parsed.exported_at || new Date().toISOString(),
      summary: {
        birthday_count: validBirthdays.length,
        task_count: validTasks.length,
        has_user_profile: Boolean(userProfile),
      },
      data: {
        user_profile: userProfile,
        birthdays: validBirthdays,
        tasks: validTasks,
      },
    };
  }

  /**
   * Restores data from a validated backup payload into SQLite in a single transaction.
   * Supports 'merge' (upsert into existing) or 'replace' (clean existing and restore).
   */
  public static async restoreBackup(
    payload: DayoraBackupPayload,
    mode: 'merge' | 'replace'
  ): Promise<RestoreBackupResult> {
    const queries: Array<{ sql: string; params: unknown[] }> = [];

    if (mode === 'replace') {
      queries.push({ sql: 'DELETE FROM birthdays;', params: [] });
      queries.push({ sql: 'DELETE FROM tasks;', params: [] });
    }

    // 1. Insert or Replace Birthdays
    for (const b of payload.data.birthdays) {
      const birthDay = b.birth_day || (b.birth_date ? parseInt(b.birth_date.split('-')[2] || '1', 10) : 1);
      const birthMonth = b.birth_month || (b.birth_date ? parseInt(b.birth_date.split('-')[1] || '1', 10) : 1);
      const birthYear = b.birth_year ?? (b.birth_date && b.birth_date.split('-').length === 3 ? parseInt(b.birth_date.split('-')[0] || '', 10) : null);

      queries.push({
        sql: `INSERT OR REPLACE INTO birthdays (
          id, name, birth_date, birth_day, birth_month, birth_year,
          nickname, relationship, photo_uri, photo_thumbnail_uri,
          is_favorite, reminder_days_before, notes, is_archived,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        params: [
          b.id || `bday_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          b.name,
          b.birth_date,
          birthDay,
          birthMonth,
          birthYear,
          b.nickname || null,
          b.relationship || 'Friend',
          b.photo_uri || null,
          b.photo_thumbnail_uri || null,
          b.is_favorite ? 1 : 0,
          b.reminder_days_before ?? 1,
          b.notes || null,
          b.is_archived ? 1 : 0,
          b.created_at || new Date().toISOString(),
          b.updated_at || new Date().toISOString(),
        ],
      });
    }

    // 2. Insert or Replace Tasks
    for (const t of payload.data.tasks) {
      queries.push({
        sql: `INSERT OR REPLACE INTO tasks (
          id, title, description, due_date, due_time, priority, category,
          repeat_interval, reminder_minutes, location, photo_uri, photo_thumbnail_uri,
          status, is_completed, completed_at, cancelled_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        params: [
          t.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          t.title,
          t.description || null,
          t.due_date || null,
          t.due_time || null,
          t.priority || 'medium',
          t.category || 'personal',
          t.repeat_interval || 'none',
          t.reminder_minutes ?? null,
          t.location || null,
          t.photo_uri || null,
          t.photo_thumbnail_uri || null,
          t.status || (t.is_completed ? 'completed' : 'pending'),
          t.is_completed ? 1 : 0,
          t.completed_at || null,
          t.cancelled_at || null,
          t.created_at || new Date().toISOString(),
          t.updated_at || new Date().toISOString(),
        ],
      });
    }

    // 3. User Profile (update if present and valid)
    const profile = payload.data.user_profile;
    if (profile && profile.name) {
      queries.push({
        sql: `INSERT OR REPLACE INTO user_profile (
          id, name, display_name, date_of_birth, gender,
          photo_uri, photo_thumbnail_uri, email, theme_preference,
          notifications_enabled, is_profile_completed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        params: [
          profile.id || 'default_user',
          profile.name,
          profile.display_name || profile.name,
          profile.date_of_birth || '',
          profile.gender || 'prefer_not_to_say',
          profile.photo_uri || null,
          profile.photo_thumbnail_uri || null,
          profile.email || null,
          profile.theme_preference || 'system',
          profile.notifications_enabled ?? 1,
          profile.is_profile_completed ?? 1,
          profile.created_at || new Date().toISOString(),
          new Date().toISOString(),
        ],
      });
    }

    // Execute atomic transaction
    await databaseClient.executeTransaction(queries);

    // Reconcile and reschedule notifications for the restored items
    try {
      await notificationService.reconcileNotifications();
    } catch (err) {
      Logger.warn('Notification reconciliation after restore had minor error', err);
    }

    return {
      success: true,
      mode,
      birthdaysRestored: payload.data.birthdays.length,
      tasksRestored: payload.data.tasks.length,
      profileRestored: Boolean(profile?.name),
    };
  }
}

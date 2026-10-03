import { BackupService, DayoraBackupPayload } from '../src/services/backupService';
import { databaseClient } from '../src/database';
import { notificationService } from '../src/notifications/notificationService';
import { BirthdayEntity, TaskEntity, UserProfileEntity } from '../src/repositories/types';

describe('BackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a valid backup payload containing profile, birthdays, and tasks', async () => {
    const mockProfile: UserProfileEntity = {
      id: 'user_1',
      name: 'John Doe',
      display_name: 'Johnny',
      date_of_birth: '1995-05-12',
      gender: 'male',
      photo_uri: null,
      photo_thumbnail_uri: null,
      email: 'john@example.com',
      theme_preference: 'dark',
      notifications_enabled: 1,
      is_profile_completed: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };

    const mockBirthdays: BirthdayEntity[] = [
      {
        id: 'b1',
        name: 'Alice',
        birth_date: '1998-11-20',
        birth_day: 20,
        birth_month: 11,
        birth_year: 1998,
        nickname: null,
        relationship: 'Friend',
        photo_uri: null,
        photo_thumbnail_uri: null,
        is_favorite: 1,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ];

    const mockTasks: TaskEntity[] = [
      {
        id: 't1',
        title: 'Buy flowers',
        description: null,
        due_date: '2026-10-01',
        due_time: null,
        priority: 'high',
        category: 'personal',
        repeat_interval: 'none',
        reminder_minutes: null,
        location: null,
        photo_uri: null,
        photo_thumbnail_uri: null,
        status: 'pending',
        is_completed: 0,
        completed_at: null,
        cancelled_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ];

    jest.spyOn(databaseClient, 'execute').mockImplementation(async (sql: string) => {
      if (sql.includes('FROM user_profile')) {
        return { rowsAffected: 0, rows: [mockProfile] };
      }
      if (sql.includes('FROM birthdays')) {
        return { rowsAffected: 0, rows: mockBirthdays };
      }
      if (sql.includes('FROM tasks')) {
        return { rowsAffected: 0, rows: mockTasks };
      }
      return { rowsAffected: 0, rows: [] };
    });

    const payload = await BackupService.generateBackupPayload();

    expect(payload.dayora_backup_version).toBe(1);
    expect(payload.summary.birthday_count).toBe(1);
    expect(payload.summary.task_count).toBe(1);
    expect(payload.summary.has_user_profile).toBe(true);
    expect(payload.data.user_profile?.name).toBe('John Doe');
    expect(payload.data.birthdays[0]?.name).toBe('Alice');
    expect(payload.data.tasks[0]?.title).toBe('Buy flowers');
  });

  it('validates a correct JSON backup payload string', () => {
    const rawPayload: DayoraBackupPayload = {
      dayora_backup_version: 1,
      app_version: '0.0.1',
      exported_at: '2026-09-28T00:00:00.000Z',
      summary: {
        birthday_count: 1,
        task_count: 1,
        has_user_profile: false,
      },
      data: {
        user_profile: null,
        birthdays: [
          {
            id: 'b_import',
            name: 'Robert',
            birth_date: '1992-04-15',
            birth_day: 15,
            birth_month: 4,
            birth_year: 1992,
            is_favorite: 0,
            reminder_days_before: 1,
            notes: 'Colleague',
            is_archived: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        tasks: [
          {
            id: 't_import',
            title: 'Schedule dinner',
            description: null,
            due_date: '2026-10-01',
            priority: 'urgent',
            is_completed: 0,
            status: 'pending',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    };

    const validated = BackupService.validateBackupPayload(JSON.stringify(rawPayload));
    expect(validated.summary.birthday_count).toBe(1);
    expect(validated.summary.task_count).toBe(1);
    expect(validated.data.birthdays[0]?.name).toBe('Robert');
    expect(validated.data.tasks[0]?.title).toBe('Schedule dinner');
  });

  it('throws an error when validating invalid JSON or non-backup data', () => {
    expect(() => BackupService.validateBackupPayload('not json')).toThrow(
      'Invalid JSON format'
    );
    expect(() => BackupService.validateBackupPayload('{}')).toThrow(
      'Unrecognized backup format'
    );
  });

  it('restores backup data in merge mode without deleting existing records', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
    jest.spyOn(databaseClient, 'executeTransaction').mockImplementation(async (queries: any) => {
      executedQueries.push(...queries);
    });

    const backupData: DayoraBackupPayload = {
      dayora_backup_version: 1,
      app_version: '0.0.1',
      exported_at: '2026-09-28T00:00:00.000Z',
      summary: { birthday_count: 1, task_count: 1, has_user_profile: false },
      data: {
        user_profile: null,
        birthdays: [
          {
            id: 'b_new',
            name: 'New Friend',
            birth_date: '1995-07-07',
            birth_day: 7,
            birth_month: 7,
            is_favorite: 1,
            reminder_days_before: 1,
            notes: null,
            is_archived: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        tasks: [
          {
            id: 't_new',
            title: 'Prepare presentation',
            description: null,
            due_date: '2026-10-05',
            priority: 'high',
            is_completed: 0,
            status: 'pending',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    };

    const reconcileSpy = jest.spyOn(notificationService, 'reconcileNotifications').mockResolvedValue({
      scheduledBirthdays: 1,
      scheduledTasks: 1,
      scheduledUserBirthday: false,
      cancelledOrphaned: 0,
      cleanedExpired: 0,
    });

    const result = await BackupService.restoreBackup(backupData, 'merge');

    expect(result.success).toBe(true);
    expect(result.birthdaysRestored).toBe(1);
    expect(result.tasksRestored).toBe(1);

    // Merge mode should NOT have DELETE queries
    expect(executedQueries.some((q) => q.sql.includes('DELETE FROM birthdays'))).toBe(false);
    expect(executedQueries.some((q) => q.sql.includes('DELETE FROM tasks'))).toBe(false);
    // Should have INSERT OR REPLACE queries
    expect(executedQueries.some((q) => q.sql.includes('INSERT OR REPLACE INTO birthdays'))).toBe(true);
    expect(executedQueries.some((q) => q.sql.includes('INSERT OR REPLACE INTO tasks'))).toBe(true);
    expect(reconcileSpy).toHaveBeenCalled();
  });

  it('restores backup data in replace mode clearing previous records', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
    jest.spyOn(databaseClient, 'executeTransaction').mockImplementation(async (queries: any) => {
      executedQueries.push(...queries);
    });

    const backupData: DayoraBackupPayload = {
      dayora_backup_version: 1,
      app_version: '0.0.1',
      exported_at: '2026-09-28T00:00:00.000Z',
      summary: { birthday_count: 1, task_count: 0, has_user_profile: false },
      data: {
        user_profile: null,
        birthdays: [
          {
            id: 'b_fresh',
            name: 'Fresh Record',
            birth_date: '1999-12-12',
            birth_day: 12,
            birth_month: 12,
            is_favorite: 0,
            reminder_days_before: 1,
            notes: null,
            is_archived: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        tasks: [],
      },
    };

    jest.spyOn(notificationService, 'reconcileNotifications').mockResolvedValue({
      scheduledBirthdays: 1,
      scheduledTasks: 0,
      scheduledUserBirthday: false,
      cancelledOrphaned: 0,
      cleanedExpired: 0,
    });

    const result = await BackupService.restoreBackup(backupData, 'replace');

    expect(result.success).toBe(true);
    // Replace mode MUST execute DELETE statements first
    expect(executedQueries[0]?.sql).toContain('DELETE FROM birthdays;');
    expect(executedQueries[1]?.sql).toContain('DELETE FROM tasks;');
    expect(executedQueries.some((q) => q.sql.includes('INSERT OR REPLACE INTO birthdays'))).toBe(true);
  });
});

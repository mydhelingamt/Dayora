import { PermissionsAndroid, Platform } from 'react-native';
import {
  NotificationService,
  hashStringToCode,
  NOTIFICATION_CHANNELS,
} from '../src/notifications/notificationService';
import { NativeBridge } from '../src/notifications/nativeBridge';
import { DatabaseClient } from '../src/database/types';
import { BirthdayEntity, TaskEntity, UserProfileEntity } from '../src/repositories/types';

jest.mock('../src/notifications/nativeBridge', () => ({
  NativeBridge: {
    scheduleNotification: jest.fn(async () => true),
    cancelNotification: jest.fn(async () => true),
    cancelAllNotifications: jest.fn(async () => true),
    getInitialNotification: jest.fn(async () => null),
    playBirthdayTune: jest.fn(async () => true),
    stopBirthdayTune: jest.fn(async () => true),
    isBirthdayTunePlaying: jest.fn(async () => false),
    createNotificationChannels: jest.fn(async () => true),
  },
}));

describe('NotificationService', () => {
  let mockDb: DatabaseClient;
  let executedQueries: { sql: string; params?: unknown[] }[] = [];
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    executedQueries = [];

    mockDb = {
      initialize: jest.fn(async () => {}),
      isInitialized: jest.fn(() => true),
      close: jest.fn(async () => {}),
      execute: jest.fn(async (sql: string, params?: unknown[]) => {
        executedQueries.push({ sql, params });
        return {
          rowsAffected: 1,
          rows: [],
        };
      }) as unknown as DatabaseClient['execute'],
      executeTransaction: jest.fn(async () => {}),
    };

    service = new NotificationService(mockDb);
  });

  describe('Deterministic Notification Identifiers & Hashes', () => {
    it('generates consistent, deterministic notification IDs', () => {
      expect(service.getBirthdayNotificationId('bday-123')).toBe('bday_bday-123');
      expect(service.getTaskNotificationId('task-456')).toBe('task_task-456');
      expect(service.getUserBirthdayNotificationId()).toBe('user_birthday');
    });

    it('produces collision-resistant, deterministic positive integer codes', () => {
      const code1 = hashStringToCode('bday_bday-123');
      const code2 = hashStringToCode('bday_bday-123');
      const code3 = hashStringToCode('task_task-456');

      expect(code1).toBe(code2);
      expect(code1).not.toBe(code3);
      expect(code1).toBeGreaterThanOrEqual(100000);
      expect(code3).toBeGreaterThanOrEqual(100000);
      expect(Number.isInteger(code1)).toBe(true);
    });
  });

  describe('Permission Requests', () => {
    let requestSpy: jest.SpyInstance;

    beforeEach(() => {
      (PermissionsAndroid as unknown as Record<string, unknown>).PERMISSIONS = {
        POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
      };
      (PermissionsAndroid as unknown as Record<string, unknown>).RESULTS = {
        GRANTED: 'granted',
        DENIED: 'denied',
      };
      requestSpy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');
    });

    it('returns true on Android below API 33 without prompting', async () => {
      Platform.OS = 'android';
      Object.defineProperty(Platform, 'Version', { value: 30, configurable: true });

      const granted = await service.requestPermissions();
      expect(granted).toBe(true);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('prompts user on Android API 33+ and returns true if granted', async () => {
      Platform.OS = 'android';
      Object.defineProperty(Platform, 'Version', { value: 33, configurable: true });
      requestSpy.mockResolvedValueOnce('granted');

      const granted = await service.requestPermissions();
      expect(granted).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith(
        'android.permission.POST_NOTIFICATIONS'
      );
    });

    it('returns false if permission is denied on Android API 33+', async () => {
      Platform.OS = 'android';
      Object.defineProperty(Platform, 'Version', { value: 34, configurable: true });
      requestSpy.mockResolvedValueOnce('denied');

      const granted = await service.requestPermissions();
      expect(granted).toBe(false);
    });
  });

  describe('Birthday Notification Scheduling', () => {
    it('schedules birthday notification at midnight local time with turning age', async () => {
      const fixedRefDate = new Date(2026, 4, 1, 10, 0, 0); // May 1, 2026

      const birthday: BirthdayEntity = {
        id: 'b-99',
        name: 'Sarah Connor',
        birth_date: '1990-05-15',
        birth_day: 15,
        birth_month: 5,
        birth_year: 1990,
        nickname: 'Sarah',
        relationship: 'Sister',
        photo_uri: 'file:///photo.jpg',
        is_favorite: 1,
        reminder_days_before: 0,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      };

      const scheduled = await service.scheduleBirthdayNotification(birthday, fixedRefDate);
      expect(scheduled).toBe(true);

      // Verify SQLite insert
      const insertQuery = executedQueries.find((q) =>
        q.sql.includes('INSERT OR REPLACE INTO scheduled_notifications')
      );
      expect(insertQuery).toBeDefined();
      expect(insertQuery?.params?.[0]).toBe('bday_b-99');
      expect(insertQuery?.params?.[2]).toBe('birthday');
      expect(insertQuery?.params?.[3]).toBe('b-99');
      expect(insertQuery?.params?.[6]).toBe(NOTIFICATION_CHANNELS.BIRTHDAYS?.id);

      // Verify trigger time is midnight May 15, 2026
      const scheduledTriggerTime = insertQuery?.params?.[7] as number;
      const scheduledDate = new Date(scheduledTriggerTime);
      expect(scheduledDate.getFullYear()).toBe(2026);
      expect(scheduledDate.getMonth()).toBe(4); // May (0-indexed)
      expect(scheduledDate.getDate()).toBe(15);
      expect(scheduledDate.getHours()).toBe(0);
      expect(scheduledDate.getMinutes()).toBe(0);

      // Verify NativeBridge call
      expect(NativeBridge.scheduleNotification).toHaveBeenCalledWith(
        'bday_b-99',
        expect.any(Number),
        NOTIFICATION_CHANNELS.BIRTHDAYS?.id,
        expect.stringContaining('Sarah Connor'),
        expect.stringContaining('turning 36'),
        scheduledTriggerTime,
        'birthday',
        'b-99',
        expect.any(String)
      );
    });

    it('omits age in notification message when birth_year is unavailable', async () => {
      const fixedRefDate = new Date(2026, 4, 1, 10, 0, 0);

      const birthday: BirthdayEntity = {
        id: 'b-100',
        name: 'Alex',
        birth_date: '05-20',
        birth_day: 20,
        birth_month: 5,
        birth_year: null,
        nickname: null,
        relationship: 'Colleague',
        photo_uri: null,
        is_favorite: 0,
        reminder_days_before: 0,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      };

      const scheduled = await service.scheduleBirthdayNotification(birthday, fixedRefDate);
      expect(scheduled).toBe(true);

      expect(NativeBridge.scheduleNotification).toHaveBeenCalledWith(
        'bday_b-100',
        expect.any(Number),
        expect.any(String),
        expect.any(String),
        expect.not.stringContaining('turning'),
        expect.any(Number),
        'birthday',
        'b-100',
        expect.any(String)
      );
    });

    it('cancels notification if birthday is archived', async () => {
      const birthday: BirthdayEntity = {
        id: 'b-archived',
        name: 'Old Friend',
        birth_date: '1990-05-15',
        birth_day: 15,
        birth_month: 5,
        birth_year: 1990,
        nickname: null,
        relationship: null,
        photo_uri: null,
        is_favorite: 0,
        reminder_days_before: 0,
        notes: null,
        is_archived: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      };

      const scheduled = await service.scheduleBirthdayNotification(birthday);
      expect(scheduled).toBe(false);
      expect(NativeBridge.scheduleNotification).not.toHaveBeenCalled();
    });
  });

  describe('Task Notification Scheduling', () => {
    it('schedules task notification with exact due time and reminder offset', async () => {
      const fixedRefDate = new Date(2026, 8, 15, 10, 0, 0); // Sept 15, 2026, 10:00

      const task: TaskEntity = {
        id: 't-10',
        title: 'Review Project Architecture',
        description: 'Verify notifications',
        due_date: '2026-09-15',
        due_time: '14:30',
        priority: 'high',
        category: 'work',
        status: 'pending',
        is_completed: 0,
        reminder_minutes: 30, // 30 mins before 14:30 = 14:00
        repeat_interval: 'none',
        location: null,
        photo_uri: null,
        created_at: '2026-09-01',
        updated_at: '2026-09-01',
      };

      const scheduled = await service.scheduleTaskNotification(task, fixedRefDate);
      expect(scheduled).toBe(true);

      const insertQuery = executedQueries.find((q) =>
        q.sql.includes('INSERT OR REPLACE INTO scheduled_notifications')
      );
      expect(insertQuery).toBeDefined();

      const expectedTriggerDate = new Date(2026, 8, 15, 14, 0, 0);
      const scheduledTriggerMs = insertQuery?.params?.[7] as number;
      expect(scheduledTriggerMs).toBe(expectedTriggerDate.getTime());

      expect(NativeBridge.scheduleNotification).toHaveBeenCalledWith(
        'task_t-10',
        expect.any(Number),
        NOTIFICATION_CHANNELS.TASKS?.id,
        expect.stringContaining('Task Reminder'),
        expect.stringContaining('Due in 30 minutes'),
        scheduledTriggerMs,
        'task',
        't-10',
        expect.any(String)
      );
    });

    it('cancels existing notification if task is marked completed or cancelled', async () => {
      const completedTask: TaskEntity = {
        id: 't-comp',
        title: 'Completed Item',
        description: null,
        due_date: '2026-09-15',
        due_time: '14:30',
        priority: 'medium',
        category: 'other',
        status: 'completed',
        is_completed: 1,
        reminder_minutes: 15,
        repeat_interval: 'none',
        location: null,
        photo_uri: null,
        created_at: '2026-09-01',
        updated_at: '2026-09-01',
      };

      const scheduled = await service.scheduleTaskNotification(completedTask);
      expect(scheduled).toBe(false);
      expect(NativeBridge.scheduleNotification).not.toHaveBeenCalled();
    });

    it('skips scheduling if due trigger time has already passed', async () => {
      const pastRefDate = new Date(2026, 8, 15, 16, 0, 0); // 16:00

      const pastTask: TaskEntity = {
        id: 't-past',
        title: 'Morning Meeting',
        description: null,
        due_date: '2026-09-15',
        due_time: '09:00', // Already passed
        priority: 'low',
        category: 'work',
        status: 'pending',
        is_completed: 0,
        reminder_minutes: 0,
        repeat_interval: 'none',
        location: null,
        photo_uri: null,
        created_at: '2026-09-01',
        updated_at: '2026-09-01',
      };

      const scheduled = await service.scheduleTaskNotification(pastTask, pastRefDate);
      expect(scheduled).toBe(false);
      expect(NativeBridge.scheduleNotification).not.toHaveBeenCalled();
    });
  });

  describe('User Birthday Celebration Notification', () => {
    it('schedules user birthday celebration notification at midnight', async () => {
      const fixedRefDate = new Date(2026, 2, 1, 10, 0, 0); // March 1, 2026

      const profile: UserProfileEntity = {
        id: 'user',
        name: 'Mydhelingam',
        gender: 'male',
        date_of_birth: '1995-03-25',
        photo_uri: 'file:///my_photo.jpg',
        photo_thumbnail_uri: null,
        theme_preference: 'dark',
        notifications_enabled: 1,
        is_profile_completed: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      };

      const scheduled = await service.scheduleUserBirthdayNotification(profile, fixedRefDate);
      expect(scheduled).toBe(true);

      const insertQuery = executedQueries.find((q) =>
        q.sql.includes('INSERT OR REPLACE INTO scheduled_notifications')
      );
      expect(insertQuery).toBeDefined();
      expect(insertQuery?.params?.[0]).toBe('user_birthday');
      expect(insertQuery?.params?.[1]).toBe(999999);
      expect(insertQuery?.params?.[2]).toBe('user_birthday');

      const expectedMidnight = new Date(2026, 2, 25, 0, 0, 0, 0);
      expect(insertQuery?.params?.[7]).toBe(expectedMidnight.getTime());

      expect(NativeBridge.scheduleNotification).toHaveBeenCalledWith(
        'user_birthday',
        999999,
        NOTIFICATION_CHANNELS.BIRTHDAYS?.id,
        expect.stringContaining('Mydhelingam'),
        expect.stringContaining('Open Dayora to reveal your birthday celebration'),
        expectedMidnight.getTime(),
        'user_birthday',
        'user',
        expect.any(String)
      );
    });
  });

  describe('Reconciliation', () => {
    it('reconciles active birthdays, active tasks, user profile, and cleans orphaned alarms', async () => {
      const fixedRefDate = new Date(2026, 5, 1, 10, 0, 0); // June 1, 2026

      // Mock DB responses for reconcile queries
      (mockDb.execute as jest.Mock).mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT notification_code FROM scheduled_notifications') && sql.includes("type = 'birthday'")) {
          return {
            rows: [{ notification_code: 100010 }],
            rowsAffected: 1,
          };
        }
        if (sql.includes('SELECT notification_code FROM scheduled_notifications') && sql.includes("type = 'task'")) {
          return {
            rows: [{ notification_code: 200020 }],
            rowsAffected: 1,
          };
        }
        if (sql.includes('FROM birthdays WHERE is_archived = 0')) {
          return {
            rows: [
              {
                id: 'b-1',
                name: 'Emma',
                birth_date: '1998-06-10',
                birth_day: 10,
                birth_month: 6,
                birth_year: 1998,
                relationship: 'Friend',
                is_archived: 0,
                reminder_days_before: 0,
              },
            ],
            rowsAffected: 1,
          };
        }
        if (sql.includes('FROM tasks') && sql.includes("status = 'pending'")) {
          return {
            rows: [
              {
                id: 't-1',
                title: 'Team sync',
                due_date: '2026-06-02',
                due_time: '15:00',
                status: 'pending',
                is_completed: 0,
                reminder_minutes: 15,
              },
            ],
            rowsAffected: 1,
          };
        }
        if (sql.includes('FROM user_profile')) {
          return {
            rows: [
              {
                id: 'user',
                name: 'Alice',
                date_of_birth: '1994-06-20',
                gender: 'female',
              },
            ],
            rowsAffected: 1,
          };
        }
        return { rows: [], rowsAffected: 0 };
      });

      const stats = await service.reconcileNotifications(fixedRefDate);

      expect(stats.scheduledBirthdays).toBe(1);
      expect(stats.scheduledTasks).toBe(1);
      expect(stats.scheduledUserBirthday).toBe(true);
      expect(stats.cancelledOrphaned).toBe(2);
      expect(NativeBridge.cancelNotification).toHaveBeenCalledWith(100010);
      expect(NativeBridge.cancelNotification).toHaveBeenCalledWith(200020);
    });
  });

  describe('Audio Synthesizer Tune Controls', () => {
    it('plays and stops the native Happy Birthday tune', async () => {
      await service.playBirthdayTune();
      expect(NativeBridge.playBirthdayTune).toHaveBeenCalledTimes(1);

      await service.stopBirthdayTune();
      expect(NativeBridge.stopBirthdayTune).toHaveBeenCalledTimes(1);
    });
  });
});

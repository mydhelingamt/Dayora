import {
  BirthdayRepository,
  sortBirthdaysAlphabeticalWithFavorites,
} from '../src/repositories/birthdayRepository';
import { TaskRepository } from '../src/repositories/taskRepository';
import { UserRepository } from '../src/repositories/userRepository';
import { DatabaseClient } from '../src/database/types';

describe('Repositories Foundation', () => {
  let mockDb: DatabaseClient;
  let executedSql: string[] = [];

  beforeEach(() => {
    executedSql = [];
    mockDb = {
      initialize: jest.fn(async () => {}),
      isInitialized: jest.fn(() => true),
      close: jest.fn(async () => {}),
      execute: jest.fn(async (sql: string, _params?: unknown[]) => {
        executedSql.push(sql);
        return {
          rowsAffected: 1,
          rows: [],
        };
      }) as unknown as DatabaseClient['execute'],
      executeTransaction: jest.fn(async (queries) => {
        queries.forEach((q) => executedSql.push(q.sql));
      }),
    };
  });

  it('BirthdayRepository creates and queries birthdays', async () => {
    const repo = new BirthdayRepository(mockDb);
    await repo.create({
      id: 'b1',
      name: 'Alice',
      birth_date: '1992-05-20',
      birth_day: 20,
      birth_month: 5,
      birth_year: 1992,
      nickname: null,
      relationship: 'Friend',
      photo_uri: null,
      is_favorite: 0,
      reminder_days_before: 1,
      notes: null,
      is_archived: 0,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    });

    expect(mockDb.execute).toHaveBeenCalled();
    expect(executedSql[0]).toContain('INSERT INTO birthdays');

    await repo.findAll();
    expect(executedSql[1]).toContain('SELECT * FROM birthdays');
  });

  it('TaskRepository creates, queries, and toggles tasks', async () => {
    const repo = new TaskRepository(mockDb);
    await repo.create({
      id: 't1',
      title: 'Prepare release',
      description: 'Check build and signing',
      due_date: '2026-09-10',
      priority: 'high',
      is_completed: 0,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    });

    expect(mockDb.execute).toHaveBeenCalled();
    expect(executedSql[0]).toContain('INSERT INTO tasks');

    await repo.toggleComplete('t1', true);
    expect(executedSql[1]).toContain('UPDATE tasks SET is_completed');
  });

  it('UserRepository saves and updates profile preferences', async () => {
    const repo = new UserRepository(mockDb);
    await repo.updateThemePreference('dark');

    expect(mockDb.execute).toHaveBeenCalled();
    expect(executedSql[0]).toContain('theme_preference');
  });

  it('BirthdayRepository calculates upcoming birthdays with chronological countdown', async () => {
    const mockBirthdays = [
      {
        id: 'b1',
        name: 'Bob',
        birth_date: '1990-09-15', // In 5 days from 2026-09-10
        birth_day: 15,
        birth_month: 9,
        birth_year: 1990,
        nickname: 'Bobby',
        relationship: 'Family',
        photo_uri: null,
        is_favorite: 0,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'b2',
        name: 'Alice',
        birth_date: '1995-09-12', // In 2 days from 2026-09-10
        birth_day: 12,
        birth_month: 9,
        birth_year: 1995,
        nickname: 'Ali',
        relationship: 'Friend',
        photo_uri: 'preset:cosmic_indigo',
        is_favorite: 1,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'b3',
        name: 'Charlie',
        birth_date: '09-18', // Year omitted!
        birth_day: 18,
        birth_month: 9,
        birth_year: null,
        nickname: null,
        relationship: 'Work',
        photo_uri: null,
        is_favorite: 0,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    mockDb.execute = jest.fn(async (sql: string) => {
      executedSql.push(sql);
      return {
        rowsAffected: mockBirthdays.length,
        rows: mockBirthdays,
      };
    }) as unknown as DatabaseClient['execute'];

    const repo = new BirthdayRepository(mockDb);
    const refDate = new Date('2026-09-10T00:00:00Z');
    const upcoming = await repo.findUpcoming(10, refDate);

    expect(upcoming.length).toBe(3);
    // Alice (in 2 days) should be first, Bob (in 5 days) second, Charlie (in 8 days) third
    expect(upcoming[0]?.name).toBe('Alice');
    expect(upcoming[0]?.daysUntil).toBe(2);
    expect(upcoming[0]?.turningAge).toBe(31);

    expect(upcoming[1]?.name).toBe('Bob');
    expect(upcoming[1]?.daysUntil).toBe(5);
    expect(upcoming[1]?.turningAge).toBe(36);

    // CRITICAL: Charlie has no birth year, so turningAge MUST be null
    expect(upcoming[2]?.name).toBe('Charlie');
    expect(upcoming[2]?.daysUntil).toBe(8);
    expect(upcoming[2]?.turningAge).toBeNull();
    expect(upcoming[2]?.currentAge).toBeNull();

    const stats = await repo.getBirthdayStats(refDate);
    expect(stats.totalActive).toBe(3);
    expect(stats.next30DaysCount).toBe(3);
    expect(stats.thisMonthCount).toBe(3);
    expect(stats.favoriteCount).toBe(1);
    expect(stats.nearestBirthday?.name).toBe('Alice');
  });

  it('BirthdayRepository supports search, filtering, and favorite toggle', async () => {
    const repo = new BirthdayRepository(mockDb);
    await repo.toggleFavorite('b1', true);
    expect(executedSql[executedSql.length - 1]).toContain('UPDATE birthdays SET is_favorite');

    await repo.findAllWithOptions({
      filter: 'favorites',
      search: 'Ali',
    });
    expect(executedSql[executedSql.length - 1]).toContain('is_favorite = 1');
    expect(executedSql[executedSql.length - 1]).toContain('name LIKE ?');

    await repo.delete('b1');
    expect(executedSql[executedSql.length - 1]).toContain('DELETE FROM birthdays');
  });

  it('sortBirthdaysAlphabeticalWithFavorites places favorites first in A-Z order, followed by non-favorites in A-Z order', () => {
    const rawBirthdays = [
      { id: '1', name: 'Zachary', is_favorite: 1 },
      { id: '2', name: 'Charlie', is_favorite: 0 },
      { id: '3', name: 'Alice', is_favorite: 1 },
      { id: '4', name: 'Bob', is_favorite: 0 },
      { id: '5', name: 'David', is_favorite: 0 },
      { id: '6', name: 'Bella', is_favorite: 1 },
    ];

    const sorted = sortBirthdaysAlphabeticalWithFavorites(rawBirthdays);
    const sortedNames = sorted.map((b) => b.name);

    // Favorites: Alice, Bella, Zachary (A-Z)
    // Non-favorites: Bob, Charlie, David (A-Z)
    expect(sortedNames).toEqual(['Alice', 'Bella', 'Zachary', 'Bob', 'Charlie', 'David']);
  });

  it('BirthdayRepository.findAllWithOptions returns birthdays sorted with favorites first in A-Z order', async () => {
    const mockBirthdays = [
      {
        id: 'b1',
        name: 'Zara',
        birth_date: '1992-05-10',
        birth_day: 10,
        birth_month: 5,
        birth_year: 1992,
        nickname: null,
        relationship: 'Friend',
        photo_uri: null,
        is_favorite: 1,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'b2',
        name: 'Aaron',
        birth_date: '1995-03-12',
        birth_day: 12,
        birth_month: 3,
        birth_year: 1995,
        nickname: null,
        relationship: 'Work',
        photo_uri: null,
        is_favorite: 0,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'b3',
        name: 'Chloe',
        birth_date: '1998-07-20',
        birth_day: 20,
        birth_month: 7,
        birth_year: 1998,
        nickname: null,
        relationship: 'Family',
        photo_uri: null,
        is_favorite: 1,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'b4',
        name: 'Brian',
        birth_date: '1991-11-15',
        birth_day: 15,
        birth_month: 11,
        birth_year: 1991,
        nickname: null,
        relationship: 'Friend',
        photo_uri: null,
        is_favorite: 0,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    mockDb.execute = jest.fn(async (sql: string) => {
      executedSql.push(sql);
      return {
        rowsAffected: mockBirthdays.length,
        rows: mockBirthdays,
      };
    }) as unknown as DatabaseClient['execute'];

    const repo = new BirthdayRepository(mockDb);
    const result = await repo.findAllWithOptions();
    const resultNames = result.map((b) => b.name);

    // Favorites: Chloe, Zara (A-Z)
    // Non-favorites: Aaron, Brian (A-Z)
    expect(resultNames).toEqual(['Chloe', 'Zara', 'Aaron', 'Brian']);
  });

  it('TaskRepository queries today tasks and computes summary stats accurately', async () => {
    const mockTasks = [
      {
        id: 't1',
        title: 'Morning Standup',
        description: null,
        due_date: '2026-09-10',
        priority: 'high',
        is_completed: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 't2',
        title: 'Review PR',
        description: null,
        due_date: '2026-09-10',
        priority: 'urgent',
        is_completed: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 't3',
        title: 'Update dependencies',
        description: null,
        due_date: '2026-09-10',
        priority: 'medium',
        is_completed: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    mockDb.execute = jest.fn(async (sql: string) => {
      executedSql.push(sql);
      return {
        rowsAffected: mockTasks.length,
        rows: mockTasks,
      };
    }) as unknown as DatabaseClient['execute'];

    const repo = new TaskRepository(mockDb);
    const refDate = new Date('2026-09-10T10:00:00Z');

    const tasks = await repo.findTodayTasks(refDate);
    expect(tasks.length).toBe(3);

    const stats = await repo.getTaskStats(refDate);
    expect(stats.totalToday).toBe(3);
    expect(stats.completedToday).toBe(1);
    expect(stats.pendingToday).toBe(2);
    expect(stats.completionRatio).toBeCloseTo(1 / 3, 2);
  });
});

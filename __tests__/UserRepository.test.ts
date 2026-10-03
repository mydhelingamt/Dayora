import { UserRepository, DEFAULT_USER_ID } from '../src/repositories/userRepository';
import { DatabaseClient } from '../src/database/types';

describe('UserRepository Local SQLite Operations', () => {
  let mockDb: DatabaseClient;
  let executedQueries: Array<{ sql: string; params?: unknown[] }> = [];

  beforeEach(() => {
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
      executeTransaction: jest.fn(async (queries) => {
        queries.forEach((q) => executedQueries.push(q));
      }),
    };
  });

  it('returns null when profile does not exist in SQLite', async () => {
    const repo = new UserRepository(mockDb);
    const profile = await repo.getProfile();
    expect(profile).toBeNull();
    expect(executedQueries[0]?.sql).toContain('SELECT * FROM user_profile WHERE id = ?');
    expect(executedQueries[0]?.params).toEqual([DEFAULT_USER_ID]);
  });

  it('parses and returns full UserProfileEntity when row exists', async () => {
    (mockDb.execute as jest.Mock).mockResolvedValueOnce({
      rowsAffected: 1,
      rows: [
        {
          id: DEFAULT_USER_ID,
          name: 'Alex Morgan',
          display_name: 'Alex Morgan',
          date_of_birth: '1995-07-02',
          gender: 'female',
          photo_uri: 'file:///data/user/0/avatar.jpg',
          photo_thumbnail_uri: null,
          email: 'alex@dayora.app',
          theme_preference: 'dark',
          notifications_enabled: 1,
          is_profile_completed: 1,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    const repo = new UserRepository(mockDb);
    const profile = await repo.getProfile();

    expect(profile).not.toBeNull();
    expect(profile?.name).toBe('Alex Morgan');
    expect(profile?.date_of_birth).toBe('1995-07-02');
    expect(profile?.gender).toBe('female');
    expect(profile?.photo_uri).toBe('file:///data/user/0/avatar.jpg');
    expect(profile?.is_profile_completed).toBe(1);
    expect(profile?.theme_preference).toBe('dark');
  });

  it('correctly checks isProfileCompleted using indexed column', async () => {
    const repo = new UserRepository(mockDb);

    // Case 1: No profile found
    (mockDb.execute as jest.Mock).mockResolvedValueOnce({
      rowsAffected: 0,
      rows: [],
    });
    expect(await repo.isProfileCompleted()).toBe(false);

    // Case 2: Profile row exists but incomplete (is_profile_completed = 0)
    (mockDb.execute as jest.Mock).mockResolvedValueOnce({
      rowsAffected: 1,
      rows: [{ is_profile_completed: 0, name: null }],
    });
    expect(await repo.isProfileCompleted()).toBe(false);

    // Case 3: Profile completed (is_profile_completed = 1, name populated)
    (mockDb.execute as jest.Mock).mockResolvedValueOnce({
      rowsAffected: 1,
      rows: [{ is_profile_completed: 1, name: 'Alex Morgan' }],
    });
    expect(await repo.isProfileCompleted()).toBe(true);
  });

  it('saves and upserts user profile into SQLite with is_profile_completed = 1', async () => {
    const repo = new UserRepository(mockDb);
    const saved = await repo.saveProfile({
      name: 'Taylor Swift',
      date_of_birth: '1989-12-13',
      gender: 'female',
      photo_uri: 'preset:cosmic_indigo',
      notifications_enabled: true,
      theme_preference: 'dark',
    });

    expect(saved.name).toBe('Taylor Swift');
    expect(saved.date_of_birth).toBe('1989-12-13');
    expect(saved.is_profile_completed).toBe(1);
    expect(saved.photo_uri).toBe('preset:cosmic_indigo');

    const insertQuery = executedQueries.find((q) => q.sql.includes('INSERT INTO user_profile'));
    expect(insertQuery).toBeDefined();
    expect(insertQuery?.sql).toContain('ON CONFLICT(id) DO UPDATE SET');
    expect(insertQuery?.params).toContain('Taylor Swift');
    expect(insertQuery?.params).toContain('1989-12-13');
    expect(insertQuery?.params).toContain('female');
  });

  it('updates profile photo URI and timestamp separately', async () => {
    const repo = new UserRepository(mockDb);
    await repo.updateProfilePhoto('file:///data/user/0/new_avatar.jpg');

    const photoQuery = executedQueries.find((q) => q.sql.includes('photo_uri'));
    expect(photoQuery).toBeDefined();
    expect(photoQuery?.params).toContain('file:///data/user/0/new_avatar.jpg');
  });

  it('updates notification setting cleanly', async () => {
    const repo = new UserRepository(mockDb);
    await repo.updateNotificationsEnabled(false);

    const notifQuery = executedQueries.find((q) => q.sql.includes('notifications_enabled'));
    expect(notifQuery).toBeDefined();
    expect(notifQuery?.params).toContain(0);
  });
});

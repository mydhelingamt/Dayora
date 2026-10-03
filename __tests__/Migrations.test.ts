import { runMigrations, migrations } from '../src/database/migrations';
import { DatabaseClient } from '../src/database/types';

describe('SQLite Database Migrations', () => {
  let executedTransactions: Array<Array<{ sql: string; params?: unknown[] }>> = [];
  let executedSql: string[] = [];

  const createMockDb = (appliedVersions: number[] = []): DatabaseClient => {
    executedTransactions = [];
    executedSql = [];

    return {
      initialize: jest.fn(async () => {}),
      isInitialized: jest.fn(() => true),
      close: jest.fn(async () => {}),
      execute: jest.fn(async (sql: string) => {
        executedSql.push(sql);
        if (sql.includes('SELECT version FROM app_migrations')) {
          return {
            rowsAffected: appliedVersions.length,
            rows: appliedVersions.map((v) => ({ version: v })),
          };
        }
        return { rowsAffected: 1, rows: [] };
      }) as unknown as DatabaseClient['execute'],
      executeTransaction: jest.fn(async (queries) => {
        executedTransactions.push(queries);
      }),
    };
  };

  it('defines migrations in sequential order with versions 1 through 7', () => {
    expect(migrations.length).toBeGreaterThanOrEqual(7);
    expect(migrations[0]?.version).toBe(1);
    expect(migrations[1]?.version).toBe(2);
    expect(migrations[1]?.name).toBe('profile_and_media_v2');
    expect(migrations[2]?.version).toBe(3);
    expect(migrations[2]?.name).toBe('birthdays_enhancement_v3');
    expect(migrations[3]?.version).toBe(4);
    expect(migrations[3]?.name).toBe('birthdays_system_v4');
    expect(migrations[4]?.version).toBe(5);
    expect(migrations[4]?.name).toBe('tasks_system_v5');
    expect(migrations[5]?.version).toBe(6);
    expect(migrations[5]?.name).toBe('notifications_system_v6');
    expect(migrations[6]?.version).toBe(7);
    expect(migrations[6]?.name).toBe('media_storage_optimization_v7');
  });

  it('applies all pending migrations on fresh database', async () => {
    const mockDb = createMockDb([]);
    await runMigrations(mockDb);

    // Initial table creation + 7 migration transactions
    expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS app_migrations'));
    expect(executedTransactions.length).toBe(7);

    // Migration 1 check
    const m1Queries = executedTransactions[0]?.map((q) => q.sql);
    expect(m1Queries?.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS birthdays'))).toBe(true);
    expect(m1Queries?.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS tasks'))).toBe(true);
    expect(m1Queries?.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS user_profile'))).toBe(true);

    // Migration 2 check
    const m2Queries = executedTransactions[1]?.map((q) => q.sql);
    expect(m2Queries?.some((sql) => sql.includes('ALTER TABLE user_profile ADD COLUMN date_of_birth'))).toBe(true);
    expect(m2Queries?.some((sql) => sql.includes('ALTER TABLE user_profile ADD COLUMN gender'))).toBe(true);
    expect(m2Queries?.some((sql) => sql.includes('ALTER TABLE user_profile ADD COLUMN photo_uri'))).toBe(true);
    expect(m2Queries?.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS app_media'))).toBe(true);
    expect(m2Queries?.some((sql) => sql.includes('idx_user_profile_completed'))).toBe(true);

    // Migration 3 check
    const m3Queries = executedTransactions[2]?.map((q) => q.sql);
    expect(m3Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN relationship'))).toBe(true);
    expect(m3Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN photo_uri'))).toBe(true);

    // Migration 4 check
    const m4Queries = executedTransactions[3]?.map((q) => q.sql);
    expect(m4Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN birth_day'))).toBe(true);
    expect(m4Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN birth_month'))).toBe(true);
    expect(m4Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN birth_year'))).toBe(true);
    expect(m4Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN nickname'))).toBe(true);
    expect(m4Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN is_favorite'))).toBe(true);
    expect(m4Queries?.some((sql) => sql.includes('idx_birthdays_favorite'))).toBe(true);
    expect(m4Queries?.some((sql) => sql.includes('idx_birthdays_month_day'))).toBe(true);

    // Migration 5 check
    const m5Queries = executedTransactions[4]?.map((q) => q.sql);
    expect(m5Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN photo_uri'))).toBe(true);
    expect(m5Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN due_time'))).toBe(true);
    expect(m5Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN category'))).toBe(true);
    expect(m5Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN repeat_interval'))).toBe(true);
    expect(m5Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN reminder_minutes'))).toBe(true);
    expect(m5Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN location'))).toBe(true);
    expect(m5Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN status'))).toBe(true);
    expect(m5Queries?.some((sql) => sql.includes('idx_tasks_status'))).toBe(true);

    // Migration 6 check
    const m6Queries = executedTransactions[5]?.map((q) => q.sql);
    expect(m6Queries?.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS scheduled_notifications'))).toBe(true);
    expect(m6Queries?.some((sql) => sql.includes('idx_scheduled_notifications_trigger'))).toBe(true);

    // Migration 7 check
    const m7Queries = executedTransactions[6]?.map((q) => q.sql);
    expect(m7Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN photo_thumbnail_uri'))).toBe(true);
    expect(m7Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN photo_thumbnail_uri'))).toBe(true);
    expect(m7Queries?.some((sql) => sql.includes('idx_media_file_path'))).toBe(true);
  });

  it('preserves existing V1-V6 data and only runs V7 when V1-V6 are already applied', async () => {
    // Database that already applied Migration 1, 2, 3, 4, 5, and 6
    const mockDb = createMockDb([1, 2, 3, 4, 5, 6]);
    await runMigrations(mockDb);

    // Only Migration 7 should be executed
    expect(executedTransactions.length).toBe(1);

    const m7Queries = executedTransactions[0]?.map((q) => q.sql);
    expect(m7Queries?.some((sql) => sql.includes('ALTER TABLE birthdays ADD COLUMN photo_thumbnail_uri'))).toBe(true);
    expect(m7Queries?.some((sql) => sql.includes('ALTER TABLE tasks ADD COLUMN photo_thumbnail_uri'))).toBe(true);

    // Assert app_migrations table records version 7
    const migrationInsert = executedTransactions[0]?.find((q) => q.sql.includes('INSERT INTO app_migrations'));
    expect(migrationInsert?.params?.[0]).toBe(7);
    expect(migrationInsert?.params?.[1]).toBe('media_storage_optimization_v7');
  });

  it('skips migration execution when all migrations are already up to date', async () => {
    const mockDb = createMockDb([1, 2, 3, 4, 5, 6, 7]);
    await runMigrations(mockDb);

    expect(executedTransactions.length).toBe(0);
  });
});

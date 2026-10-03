import { Migration, DatabaseClient } from './types';
import {
  SCHEMA_V1_MIGRATIONS_TABLE,
  SCHEMA_V1_BIRTHDAYS_TABLE,
  SCHEMA_V1_TASKS_TABLE,
  SCHEMA_V1_USER_PROFILE_TABLE,
  SCHEMA_V1_INDEXES,
  SCHEMA_V2_PROFILE_MIGRATION_STATEMENTS,
  SCHEMA_V2_MEDIA_TABLE,
  SCHEMA_V2_MEDIA_INDEXES,
  SCHEMA_V3_BIRTHDAYS_MIGRATION_STATEMENTS,
  SCHEMA_V4_BIRTHDAYS_SYSTEM_STATEMENTS,
  SCHEMA_V5_TASKS_SYSTEM_STATEMENTS,
  SCHEMA_V6_NOTIFICATIONS_SYSTEM_STATEMENTS,
  SCHEMA_V7_MEDIA_OPTIMIZATION_STATEMENTS,
} from './schema';

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: [
      SCHEMA_V1_BIRTHDAYS_TABLE,
      SCHEMA_V1_TASKS_TABLE,
      SCHEMA_V1_USER_PROFILE_TABLE,
      ...SCHEMA_V1_INDEXES,
    ],
  },
  {
    version: 2,
    name: 'profile_and_media_v2',
    up: [
      ...SCHEMA_V2_PROFILE_MIGRATION_STATEMENTS,
      SCHEMA_V2_MEDIA_TABLE,
      ...SCHEMA_V2_MEDIA_INDEXES,
    ],
  },
  {
    version: 3,
    name: 'birthdays_enhancement_v3',
    up: [...SCHEMA_V3_BIRTHDAYS_MIGRATION_STATEMENTS],
  },
  {
    version: 4,
    name: 'birthdays_system_v4',
    up: [...SCHEMA_V4_BIRTHDAYS_SYSTEM_STATEMENTS],
  },
  {
    version: 5,
    name: 'tasks_system_v5',
    up: [...SCHEMA_V5_TASKS_SYSTEM_STATEMENTS],
  },
  {
    version: 6,
    name: 'notifications_system_v6',
    up: [...SCHEMA_V6_NOTIFICATIONS_SYSTEM_STATEMENTS],
  },
  {
    version: 7,
    name: 'media_storage_optimization_v7',
    up: [...SCHEMA_V7_MEDIA_OPTIMIZATION_STATEMENTS],
  },
];

export async function runMigrations(db: DatabaseClient): Promise<void> {
  // Ensure the migrations tracking table exists
  await db.execute(SCHEMA_V1_MIGRATIONS_TABLE);

  const appliedResult = await db.execute<{ version: number }>(
    'SELECT version FROM app_migrations ORDER BY version ASC;'
  );

  const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      const queries: Array<{ sql: string; params?: unknown[] }> = migration.up.map((sql) => ({ sql }));
      queries.push({
        sql: 'INSERT INTO app_migrations (version, name, applied_at) VALUES (?, ?, ?);',
        params: [migration.version, migration.name, new Date().toISOString()],
      });

      await db.executeTransaction(queries);
    }
  }
}

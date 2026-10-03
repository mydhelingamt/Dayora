/**
 * Dayora Database Schema DDL
 * Normalized SQLite table structures for local-first persistence.
 */

export const SCHEMA_V1_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS app_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );
`;

export const SCHEMA_V1_BIRTHDAYS_TABLE = `
  CREATE TABLE IF NOT EXISTS birthdays (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    reminder_days_before INTEGER DEFAULT 0,
    notes TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const SCHEMA_V1_TASKS_TABLE = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    is_completed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const SCHEMA_V1_USER_PROFILE_TABLE = `
  CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY NOT NULL,
    display_name TEXT,
    email TEXT,
    theme_preference TEXT DEFAULT 'system',
    notifications_enabled INTEGER DEFAULT 1,
    updated_at TEXT NOT NULL
  );
`;

export const SCHEMA_V1_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_birthdays_date ON birthdays(birth_date);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);`,
];

/**
 * Migration V2 Schema:
 * Expands user_profile with name, birth date, gender, photo path, completion flag, and media storage table.
 */
export const SCHEMA_V2_PROFILE_MIGRATION_STATEMENTS = [
  `ALTER TABLE user_profile ADD COLUMN name TEXT;`,
  `ALTER TABLE user_profile ADD COLUMN date_of_birth TEXT;`,
  `ALTER TABLE user_profile ADD COLUMN gender TEXT DEFAULT 'prefer_not_to_say';`,
  `ALTER TABLE user_profile ADD COLUMN photo_uri TEXT;`,
  `ALTER TABLE user_profile ADD COLUMN photo_thumbnail_uri TEXT;`,
  `ALTER TABLE user_profile ADD COLUMN is_profile_completed INTEGER DEFAULT 0;`,
  `ALTER TABLE user_profile ADD COLUMN created_at TEXT;`,
  `UPDATE user_profile SET name = display_name WHERE name IS NULL AND display_name IS NOT NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_user_profile_completed ON user_profile(is_profile_completed);`,
];

export const SCHEMA_V2_MEDIA_TABLE = `
  CREATE TABLE IF NOT EXISTS app_media (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    file_size_bytes INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    created_at TEXT NOT NULL
  );
`;

export const SCHEMA_V2_MEDIA_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_media_entity ON app_media(entity_type, entity_id);`,
];

/**
 * Migration V3 Schema:
 * Adds relationship and photo_uri to birthdays table.
 */
export const SCHEMA_V3_BIRTHDAYS_MIGRATION_STATEMENTS = [
  `ALTER TABLE birthdays ADD COLUMN relationship TEXT DEFAULT 'Friend';`,
  `ALTER TABLE birthdays ADD COLUMN photo_uri TEXT;`,
];

/**
 * Migration V4 Schema:
 * Expands birthdays with birth_day, birth_month, birth_year (optional), nickname, is_favorite,
 * backfills existing records, and adds indexes for fast filtering and searching.
 */
export const SCHEMA_V4_BIRTHDAYS_SYSTEM_STATEMENTS = [
  `ALTER TABLE birthdays ADD COLUMN birth_day INTEGER;`,
  `ALTER TABLE birthdays ADD COLUMN birth_month INTEGER;`,
  `ALTER TABLE birthdays ADD COLUMN birth_year INTEGER;`,
  `ALTER TABLE birthdays ADD COLUMN nickname TEXT;`,
  `ALTER TABLE birthdays ADD COLUMN is_favorite INTEGER DEFAULT 0;`,
  `UPDATE birthdays SET birth_day = CAST(strftime('%d', birth_date) AS INTEGER), birth_month = CAST(strftime('%m', birth_date) AS INTEGER), birth_year = CAST(strftime('%Y', birth_date) AS INTEGER) WHERE birth_day IS NULL AND birth_date IS NOT NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_birthdays_favorite ON birthdays(is_favorite);`,
  `CREATE INDEX IF NOT EXISTS idx_birthdays_month_day ON birthdays(birth_month, birth_day);`,
  `CREATE INDEX IF NOT EXISTS idx_birthdays_name ON birthdays(name);`,
];

/**
 * Migration V5 Schema:
 * Expands tasks with photo_uri, due_time, category, repeat_interval, reminder_minutes,
 * location, status ('pending' | 'completed' | 'cancelled'), completed_at, and cancelled_at.
 * Backfills status from is_completed, and adds indexes for rapid filtering and querying.
 */
export const SCHEMA_V5_TASKS_SYSTEM_STATEMENTS = [
  `ALTER TABLE tasks ADD COLUMN photo_uri TEXT;`,
  `ALTER TABLE tasks ADD COLUMN due_time TEXT;`,
  `ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'personal';`,
  `ALTER TABLE tasks ADD COLUMN repeat_interval TEXT DEFAULT 'none';`,
  `ALTER TABLE tasks ADD COLUMN reminder_minutes INTEGER;`,
  `ALTER TABLE tasks ADD COLUMN location TEXT;`,
  `ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'pending';`,
  `ALTER TABLE tasks ADD COLUMN completed_at TEXT;`,
  `ALTER TABLE tasks ADD COLUMN cancelled_at TEXT;`,
  `UPDATE tasks SET status = CASE WHEN is_completed = 1 THEN 'completed' ELSE 'pending' END WHERE status IS NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_due_date_time ON tasks(due_date, due_time);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);`,
];

/**
 * Migration V6 Schema:
 * Creates the scheduled_notifications table for storing notification scheduling metadata,
 * deterministic notification codes, triggers, delivery status, and indexes.
 */
export const SCHEMA_V6_NOTIFICATIONS_SYSTEM_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id TEXT PRIMARY KEY NOT NULL,
    notification_code INTEGER NOT NULL UNIQUE,
    type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    trigger_time_ms INTEGER NOT NULL,
    trigger_date_str TEXT NOT NULL,
    payload_json TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_type_ref ON scheduled_notifications(type, reference_id);`,
  `CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_trigger ON scheduled_notifications(trigger_time_ms);`,
  `CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);`,
];

/**
 * Migration V7 Schema:
 * Media and Storage Optimization:
 * Adds photo_thumbnail_uri to birthdays and tasks tables for fast lightweight list rendering.
 * Adds index on app_media(file_path) for deduplication and orphan cleanup.
 */
export const SCHEMA_V7_MEDIA_OPTIMIZATION_STATEMENTS = [
  `ALTER TABLE birthdays ADD COLUMN photo_thumbnail_uri TEXT;`,
  `ALTER TABLE tasks ADD COLUMN photo_thumbnail_uri TEXT;`,
  `CREATE INDEX IF NOT EXISTS idx_media_file_path ON app_media(file_path);`,
];


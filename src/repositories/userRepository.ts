import { BaseRepository } from './baseRepository';
import { UserProfileEntity, Gender } from './types';
import { DatabaseClient } from '../database';
import { Logger } from '../services/loggerService';
import { notificationService } from '../notifications/notificationService';

export interface SaveProfileInput {
  name: string;
  date_of_birth: string;
  gender: Gender;
  photo_uri?: string | null;
  photo_thumbnail_uri?: string | null;
  email?: string | null;
  theme_preference?: 'light' | 'dark' | 'system';
  notifications_enabled?: boolean;
}

export interface IUserRepository {
  getProfile(): Promise<UserProfileEntity | null>;
  saveProfile(input: SaveProfileInput): Promise<UserProfileEntity>;
  updateProfilePhoto(photoUri: string | null, thumbnailUri?: string | null): Promise<void>;
  updateThemePreference(preference: 'light' | 'dark' | 'system'): Promise<void>;
  updateNotificationsEnabled(enabled: boolean): Promise<void>;
  isProfileCompleted(): Promise<boolean>;
}

export const DEFAULT_USER_ID = 'default_user';

export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(db: DatabaseClient) {
    super(db);
  }

  public async getProfile(): Promise<UserProfileEntity | null> {
    try {
      const result = await this.db.execute<any>(
        'SELECT * FROM user_profile WHERE id = ? LIMIT 1;',
        [DEFAULT_USER_ID]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }

      return {
        id: row.id || DEFAULT_USER_ID,
        name: row.name || row.display_name || '',
        display_name: row.display_name || row.name || null,
        date_of_birth: row.date_of_birth || '',
        gender: (row.gender as Gender) || 'prefer_not_to_say',
        photo_uri: row.photo_uri || null,
        photo_thumbnail_uri: row.photo_thumbnail_uri || null,
        email: row.email || null,
        theme_preference: row.theme_preference || 'system',
        notifications_enabled: row.notifications_enabled !== undefined ? Number(row.notifications_enabled) : 1,
        is_profile_completed: row.is_profile_completed !== undefined ? Number(row.is_profile_completed) : 0,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      Logger.error('UserRepository.getProfile failed', error);
      return null;
    }
  }

  public async isProfileCompleted(): Promise<boolean> {
    try {
      const result = await this.db.execute<{
        is_profile_completed: number;
        name: string | null;
        display_name: string | null;
      }>(
        'SELECT is_profile_completed, name, display_name FROM user_profile WHERE id = ? LIMIT 1;',
        [DEFAULT_USER_ID]
      );
      const row = result.rows[0];
      if (!row) {
        return false;
      }
      const hasName = Boolean((row.name && row.name.trim().length > 0) || (row.display_name && row.display_name.trim().length > 0));
      return Number(row.is_profile_completed) === 1 && hasName;
    } catch (error) {
      Logger.error('UserRepository.isProfileCompleted failed', error);
      return false;
    }
  }

  public async saveProfile(input: SaveProfileInput): Promise<UserProfileEntity> {
    const now = new Date().toISOString();
    const existing = await this.getProfile();
    const createdAt = existing?.created_at || now;

    const profile: UserProfileEntity = {
      id: DEFAULT_USER_ID,
      name: input.name.trim(),
      display_name: input.name.trim(),
      date_of_birth: input.date_of_birth.trim(),
      gender: input.gender,
      photo_uri: input.photo_uri !== undefined ? input.photo_uri : existing?.photo_uri ?? null,
      photo_thumbnail_uri: input.photo_thumbnail_uri !== undefined ? input.photo_thumbnail_uri : existing?.photo_thumbnail_uri ?? null,
      email: input.email !== undefined ? input.email : existing?.email ?? null,
      theme_preference: input.theme_preference || existing?.theme_preference || 'system',
      notifications_enabled: input.notifications_enabled !== undefined ? (input.notifications_enabled ? 1 : 0) : existing?.notifications_enabled ?? 1,
      is_profile_completed: 1,
      created_at: createdAt,
      updated_at: now,
    };

    try {
      await this.db.execute(
        `INSERT INTO user_profile (
          id, name, display_name, date_of_birth, gender, photo_uri, photo_thumbnail_uri,
          email, theme_preference, notifications_enabled, is_profile_completed, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          display_name = excluded.display_name,
          date_of_birth = excluded.date_of_birth,
          gender = excluded.gender,
          photo_uri = excluded.photo_uri,
          photo_thumbnail_uri = excluded.photo_thumbnail_uri,
          email = excluded.email,
          theme_preference = excluded.theme_preference,
          notifications_enabled = excluded.notifications_enabled,
          is_profile_completed = 1,
          updated_at = excluded.updated_at;`,
        [
          profile.id,
          profile.name,
          profile.display_name,
          profile.date_of_birth,
          profile.gender,
          profile.photo_uri,
          profile.photo_thumbnail_uri,
          profile.email,
          profile.theme_preference,
          profile.notifications_enabled,
          profile.created_at,
          profile.updated_at,
        ]
      );

      await notificationService.scheduleUserBirthdayNotification(profile);

      return profile;
    } catch (error) {
      Logger.error('UserRepository.saveProfile failed', error);
      throw new Error(`Failed to save user profile: ${(error as Error).message}`);
    }
  }

  public async updateProfilePhoto(
    photoUri: string | null,
    thumbnailUri: string | null = null
  ): Promise<void> {
    const now = new Date().toISOString();
    try {
      await this.db.execute(
        `INSERT INTO user_profile (id, photo_uri, photo_thumbnail_uri, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           photo_uri = excluded.photo_uri,
           photo_thumbnail_uri = excluded.photo_thumbnail_uri,
           updated_at = excluded.updated_at;`,
        [DEFAULT_USER_ID, photoUri, thumbnailUri, now]
      );
    } catch (error) {
      Logger.error('UserRepository.updateProfilePhoto failed', error);
      throw new Error(`Failed to update profile photo: ${(error as Error).message}`);
    }
  }

  public async updateThemePreference(preference: 'light' | 'dark' | 'system'): Promise<void> {
    const now = new Date().toISOString();
    try {
      await this.db.execute(
        `INSERT INTO user_profile (id, theme_preference, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           theme_preference = excluded.theme_preference,
           updated_at = excluded.updated_at;`,
        [DEFAULT_USER_ID, preference, now]
      );
    } catch (error) {
      Logger.error('UserRepository.updateThemePreference failed', error);
      throw new Error(`Failed to update theme preference: ${(error as Error).message}`);
    }
  }

  public async updateNotificationsEnabled(enabled: boolean): Promise<void> {
    const now = new Date().toISOString();
    try {
      await this.db.execute(
        `INSERT INTO user_profile (id, notifications_enabled, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           notifications_enabled = excluded.notifications_enabled,
           updated_at = excluded.updated_at;`,
        [DEFAULT_USER_ID, enabled ? 1 : 0, now]
      );
    } catch (error) {
      Logger.error('UserRepository.updateNotificationsEnabled failed', error);
      throw new Error(`Failed to update notifications enabled: ${(error as Error).message}`);
    }
  }
}

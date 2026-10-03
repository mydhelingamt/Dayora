import { IStorageClient, StorageKey } from './types';
import { databaseClient } from '../database';

export class AppStorageClient implements IStorageClient {
  private cache: Map<string, string> = new Map();
  private tableReady: boolean = false;

  private async ensureTable(): Promise<void> {
    if (this.tableReady) {
      return;
    }
    if (!databaseClient.isInitialized()) {
      return;
    }
    try {
      await databaseClient.execute(`
        CREATE TABLE IF NOT EXISTS app_key_value (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
      this.tableReady = true;
    } catch {
      // Suppress during bootstrap
    }
  }

  public async getString(key: StorageKey): Promise<string | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }

    await this.ensureTable();
    if (this.tableReady) {
      try {
        const result = await databaseClient.execute<{ value: string }>(
          'SELECT value FROM app_key_value WHERE key = ? LIMIT 1;',
          [key]
        );
        const val = result.rows[0]?.value ?? null;
        if (val !== null) {
          this.cache.set(key, val);
        }
        return val;
      } catch {
        return null;
      }
    }
    return null;
  }

  public async setString(key: StorageKey, value: string): Promise<void> {
    this.cache.set(key, value);
    await this.ensureTable();
    if (this.tableReady) {
      try {
        await databaseClient.execute(
          `INSERT INTO app_key_value (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
          [key, value]
        );
      } catch {
        // Suppress
      }
    }
  }

  public async getBoolean(key: StorageKey): Promise<boolean | null> {
    const val = await this.getString(key);
    if (val === null) {
      return null;
    }
    return val === 'true';
  }

  public async setBoolean(key: StorageKey, value: boolean): Promise<void> {
    await this.setString(key, value ? 'true' : 'false');
  }

  public async getNumber(key: StorageKey): Promise<number | null> {
    const val = await this.getString(key);
    if (val === null) {
      return null;
    }
    const parsed = Number(val);
    return isNaN(parsed) ? null : parsed;
  }

  public async setNumber(key: StorageKey, value: number): Promise<void> {
    await this.setString(key, String(value));
  }

  public async remove(key: StorageKey): Promise<void> {
    this.cache.delete(key);
    await this.ensureTable();
    if (this.tableReady) {
      try {
        await databaseClient.execute('DELETE FROM app_key_value WHERE key = ?;', [key]);
      } catch {
        // Suppress
      }
    }
  }

  public async clear(): Promise<void> {
    this.cache.clear();
    await this.ensureTable();
    if (this.tableReady) {
      try {
        await databaseClient.execute('DELETE FROM app_key_value;');
      } catch {
        // Suppress
      }
    }
  }
}

export const storageClient: IStorageClient = new AppStorageClient();

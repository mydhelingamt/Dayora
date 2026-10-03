export type StorageKey =
  | 'THEME_MODE'
  | 'LAST_SYNC'
  | 'NOTIFICATIONS_ENABLED'
  | 'ONBOARDING_COMPLETED';

export interface IStorageClient {
  getString(key: StorageKey): Promise<string | null>;
  setString(key: StorageKey, value: string): Promise<void>;
  getBoolean(key: StorageKey): Promise<boolean | null>;
  setBoolean(key: StorageKey, value: boolean): Promise<void>;
  getNumber(key: StorageKey): Promise<number | null>;
  setNumber(key: StorageKey, value: number): Promise<void>;
  remove(key: StorageKey): Promise<void>;
  clear(): Promise<void>;
}

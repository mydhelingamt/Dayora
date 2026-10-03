import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { Logger } from './loggerService';
import { databaseClient } from '../database';

export interface OptimizedImageResult {
  uri: string;
  thumbnailUri?: string | null;
  width?: number;
  height?: number;
  fileSize?: number;
  type?: string;
  fileName?: string;
  isDuplicate?: boolean;
}

export interface PresetAvatar {
  id: string;
  label: string;
  initials: string;
  bgGradient: [string, string];
  accentColor: string;
}

export interface StorageMetrics {
  cacheSizeBytes: number;
  mediaSizeBytes: number;
  thumbnailSizeBytes: number;
  databaseSizeBytes: number;
  totalAppSizeBytes: number;
  mediaCount: number;
  thumbnailCount: number;
  formattedCache: string;
  formattedMedia: string;
  formattedThumbnail: string;
  formattedDatabase: string;
  formattedTotal: string;
}

export interface CachedMediaInfo {
  photoUri: string;
  thumbnailUri?: string | null;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  lastAccessed: number;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'preset:cosmic_indigo',
    label: 'Cosmic Indigo',
    initials: 'DY',
    bgGradient: ['#6366F1', '#4338CA'],
    accentColor: '#818CF8',
  },
  {
    id: 'preset:cyan_breeze',
    label: 'Cyan Breeze',
    initials: 'CB',
    bgGradient: ['#06B6D4', '#0E7490'],
    accentColor: '#22D3EE',
  },
  {
    id: 'preset:sunset_amber',
    label: 'Sunset Amber',
    initials: 'SA',
    bgGradient: ['#F59E0B', '#B45309'],
    accentColor: '#FBBF24',
  },
  {
    id: 'preset:emerald_bloom',
    label: 'Emerald Bloom',
    initials: 'EB',
    bgGradient: ['#10B981', '#047857'],
    accentColor: '#34D399',
  },
  {
    id: 'preset:rose_velvet',
    label: 'Rose Velvet',
    initials: 'RV',
    bgGradient: ['#EC4899', '#BE185D'],
    accentColor: '#F472B6',
  },
  {
    id: 'preset:violet_neon',
    label: 'Violet Neon',
    initials: 'VN',
    bgGradient: ['#8B5CF6', '#6D28D9'],
    accentColor: '#A78BFA',
  },
];

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Bounded In-Memory LRU Cache for media metadata
 * Evicts least-recently used items when capacity is reached (default 50).
 */
export class MediaLruCache {
  private readonly capacity: number;
  private readonly cache = new Map<string, CachedMediaInfo>();

  constructor(capacity = 50) {
    this.capacity = capacity;
  }

  public get(key: string): CachedMediaInfo | undefined {
    const item = this.cache.get(key);
    if (item) {
      item.lastAccessed = Date.now();
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  public set(key: string, value: CachedMediaInfo): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    value.lastAccessed = Date.now();
    this.cache.set(key, value);
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}

interface NativeStorageBridge {
  processAndStoreImage(
    sourceUri: string,
    entityType: string,
    entityId: string
  ): Promise<{
    photoUri: string;
    thumbnailUri: string;
    width: number;
    height: number;
    fileSizeBytes: number;
    hash: string;
    isDuplicate: boolean;
  }>;
  getStorageMetrics(): Promise<{
    cacheSizeBytes: number;
    mediaSizeBytes: number;
    thumbnailSizeBytes: number;
    databaseSizeBytes: number;
    totalAppSizeBytes: number;
    mediaCount: number;
    thumbnailCount: number;
  }>;
  cleanupTemporaryCache(): Promise<{
    bytesCleared: number;
    filesDeleted: number;
  }>;
  cleanOrphanedMedia(activeUris: string[]): Promise<{
    deletedFilesCount: number;
    reclaimedBytes: number;
  }>;
  releaseImageMemory(): Promise<boolean>;
}

const nativeBridge: NativeStorageBridge | null =
  Platform.OS === 'android' && NativeModules.DayoraStorageModule
    ? NativeModules.DayoraStorageModule
    : null;

export class MediaService {
  private static readonly lruCache = new MediaLruCache(50);
  private static readonly failedUriSet = new Set<string>();

  /**
   * Access to internal LRU cache for inspection & testing
   */
  public static getCache(): MediaLruCache {
    return this.lruCache;
  }

  /**
   * Prompts user with native gallery photo picker, compresses & resizes
   * the image, creates a lightweight thumbnail, computes SHA-256 for
   * deduplication, stores permanently in filesDir, and removes the temp picker file.
   */
  public static async pickAndStoreImage(
    entityType: 'profile' | 'birthday' | 'task',
    entityId: string
  ): Promise<OptimizedImageResult | null> {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.9,
        selectionLimit: 1,
        includeBase64: false,
      });

      if (response.didCancel) {
        return null;
      }

      if (response.errorMessage) {
        Logger.error('Image picker error', response.errorMessage);
        return null;
      }

      const asset: Asset | undefined = response.assets?.[0];
      if (!asset || !asset.uri) {
        return null;
      }

      // If native module is available, process & persist in filesDir
      if (nativeBridge) {
        const stored = await nativeBridge.processAndStoreImage(
          asset.uri,
          entityType,
          entityId
        );

        // Record in SQLite app_media table
        try {
          await databaseClient.execute(
            `INSERT OR REPLACE INTO app_media (
              id, entity_type, entity_id, file_path, thumbnail_path,
              file_size_bytes, mime_type, width, height, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              entityType,
              entityId,
              stored.photoUri,
              stored.thumbnailUri,
              stored.fileSizeBytes,
              'image/jpeg',
              stored.width,
              stored.height,
              new Date().toISOString(),
            ]
          );
        } catch (dbErr) {
          Logger.warn('Failed to insert app_media record:', dbErr);
        }

        const result: OptimizedImageResult = {
          uri: stored.photoUri,
          thumbnailUri: stored.thumbnailUri,
          width: stored.width,
          height: stored.height,
          fileSize: stored.fileSizeBytes,
          type: 'image/jpeg',
          fileName: asset.fileName,
          isDuplicate: stored.isDuplicate,
        };

        // Cache metadata in LRU cache
        this.lruCache.set(stored.photoUri, {
          photoUri: stored.photoUri,
          thumbnailUri: stored.thumbnailUri,
          width: stored.width,
          height: stored.height,
          fileSizeBytes: stored.fileSizeBytes,
          lastAccessed: Date.now(),
        });

        return result;
      }

      // Fallback for mock/test environments
      const fallbackResult: OptimizedImageResult = {
        uri: asset.uri,
        thumbnailUri: asset.uri,
        width: asset.width || 512,
        height: asset.height || 512,
        fileSize: asset.fileSize,
        type: asset.type,
        fileName: asset.fileName,
      };

      this.lruCache.set(asset.uri, {
        photoUri: asset.uri,
        thumbnailUri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSizeBytes: asset.fileSize,
        lastAccessed: Date.now(),
      });

      return fallbackResult;
    } catch (error) {
      Logger.error('MediaService.pickAndStoreImage failed', error);
      return null;
    }
  }

  /**
   * Captures a live photo using the device camera, compresses, creates a thumbnail, and stores permanently.
   */
  public static async captureAndStoreImage(
    entityType: 'profile' | 'birthday' | 'task',
    entityId: string
  ): Promise<OptimizedImageResult | null> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Dayora requires access to your camera to take photos.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Logger.warn('Camera permission denied');
          return null;
        }
      }

      const response = await launchCamera({
        mediaType: 'photo',
        cameraType: 'front',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.9,
        saveToPhotos: false,
        includeBase64: false,
      });

      if (response.didCancel) {
        return null;
      }

      if (response.errorMessage) {
        Logger.error('Camera capture error', response.errorMessage);
        return null;
      }

      const asset: Asset | undefined = response.assets?.[0];
      if (!asset || !asset.uri) {
        return null;
      }

      if (nativeBridge) {
        const stored = await nativeBridge.processAndStoreImage(
          asset.uri,
          entityType,
          entityId
        );

        try {
          await databaseClient.execute(
            `INSERT OR REPLACE INTO app_media (
              id, entity_type, entity_id, file_path, thumbnail_path,
              file_size_bytes, mime_type, width, height, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              entityType,
              entityId,
              stored.photoUri,
              stored.thumbnailUri,
              stored.fileSizeBytes,
              'image/jpeg',
              stored.width,
              stored.height,
              new Date().toISOString(),
            ]
          );
        } catch {
          // Suppress db error in test/mock environments
        }

        const result: OptimizedImageResult = {
          uri: stored.photoUri,
          thumbnailUri: stored.thumbnailUri,
          width: stored.width,
          height: stored.height,
          fileSize: stored.fileSizeBytes,
          type: 'image/jpeg',
          fileName: asset.fileName,
          isDuplicate: stored.isDuplicate,
        };

        this.lruCache.set(stored.photoUri, {
          photoUri: stored.photoUri,
          thumbnailUri: stored.thumbnailUri,
          width: stored.width,
          height: stored.height,
          fileSizeBytes: stored.fileSizeBytes,
          lastAccessed: Date.now(),
        });

        return result;
      }

      const fallbackResult: OptimizedImageResult = {
        uri: asset.uri,
        thumbnailUri: asset.uri,
        width: asset.width || 512,
        height: asset.height || 512,
        fileSize: asset.fileSize,
        type: asset.type,
        fileName: asset.fileName,
      };

      this.lruCache.set(asset.uri, {
        photoUri: asset.uri,
        thumbnailUri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSizeBytes: asset.fileSize,
        lastAccessed: Date.now(),
      });

      return fallbackResult;
    } catch (error) {
      Logger.error('MediaService.captureAndStoreImage failed', error);
      return null;
    }
  }

  public static async captureProfileImage(): Promise<OptimizedImageResult | null> {
    return this.captureAndStoreImage('profile', 'user');
  }

  public static async pickProfileImage(): Promise<OptimizedImageResult | null> {
    return this.pickAndStoreImage('profile', 'user');
  }

  public static async pickBirthdayPhoto(birthdayId: string = 'new'): Promise<OptimizedImageResult | null> {
    return this.pickAndStoreImage('birthday', birthdayId);
  }

  public static async pickTaskPhoto(taskId: string = 'new'): Promise<OptimizedImageResult | null> {
    return this.pickAndStoreImage('task', taskId);
  }

  public static async deleteMediaFile(uri?: string | null): Promise<void> {
    if (!uri || this.isPresetAvatar(uri)) {
      return;
    }
    this.lruCache.delete(uri);
    Logger.info('MediaService.deleteMediaFile referenced:', uri);
  }

  public static isPresetAvatar(uri?: string | null): boolean {
    if (!uri) return false;
    return uri.startsWith('preset:');
  }

  public static getPresetAvatar(id?: string | null): PresetAvatar | undefined {
    if (!id) return undefined;
    return PRESET_AVATARS.find((p) => p.id === id);
  }

  /**
   * Tracks an image URI that failed to load into memory or was missing on disk.
   */
  public static markImageFailed(uri: string): void {
    if (uri && !this.isPresetAvatar(uri)) {
      this.failedUriSet.add(uri);
    }
  }

  public static isImageFailed(uri: string): boolean {
    return this.failedUriSet.has(uri);
  }

  /**
   * Retrieves live metrics of application storage consumption.
   */
  public static async getStorageMetrics(): Promise<StorageMetrics> {
    if (nativeBridge) {
      const raw = await nativeBridge.getStorageMetrics();
      return {
        ...raw,
        formattedCache: formatBytes(raw.cacheSizeBytes),
        formattedMedia: formatBytes(raw.mediaSizeBytes),
        formattedThumbnail: formatBytes(raw.thumbnailSizeBytes),
        formattedDatabase: formatBytes(raw.databaseSizeBytes),
        formattedTotal: formatBytes(raw.totalAppSizeBytes),
      };
    }

    return {
      cacheSizeBytes: 0,
      mediaSizeBytes: 0,
      thumbnailSizeBytes: 0,
      databaseSizeBytes: 0,
      totalAppSizeBytes: 0,
      mediaCount: 0,
      thumbnailCount: 0,
      formattedCache: '0 B',
      formattedMedia: '0 B',
      formattedThumbnail: '0 B',
      formattedDatabase: '0 B',
      formattedTotal: '0 B',
    };
  }

  /**
   * Cleans only temporary cache files (temp_media, intermediate picker files).
   * Never removes persistent photos or database records.
   */
  public static async cleanupCache(): Promise<{ bytesCleared: number; filesDeleted: number }> {
    if (nativeBridge) {
      return await nativeBridge.cleanupTemporaryCache();
    }
    return { bytesCleared: 0, filesDeleted: 0 };
  }

  /**
   * Verifies all media files against active SQLite database records and deletes
   * only unreferenced/orphaned files while preserving active photos and database references.
   */
  public static async optimizeStorage(): Promise<{
    deletedFilesCount: number;
    reclaimedBytes: number;
    bytesCleared: number;
  }> {
    try {
      const [profileRows, birthdayRows, taskRows] = await Promise.all([
        databaseClient.execute<{ photo_uri: string | null; photo_thumbnail_uri: string | null }>(
          'SELECT photo_uri, photo_thumbnail_uri FROM user_profile WHERE photo_uri IS NOT NULL;'
        ),
        databaseClient.execute<{ photo_uri: string | null; photo_thumbnail_uri: string | null }>(
          'SELECT photo_uri, photo_thumbnail_uri FROM birthdays WHERE photo_uri IS NOT NULL;'
        ),
        databaseClient.execute<{ photo_uri: string | null; photo_thumbnail_uri: string | null }>(
          'SELECT photo_uri, photo_thumbnail_uri FROM tasks WHERE photo_uri IS NOT NULL;'
        ),
      ]);

      const activeUris = new Set<string>();
      const addUri = (u?: string | null) => {
        if (u && !MediaService.isPresetAvatar(u)) {
          activeUris.add(u);
        }
      };

      profileRows.rows.forEach((r) => {
        addUri(r.photo_uri);
        addUri(r.photo_thumbnail_uri);
      });
      birthdayRows.rows.forEach((r) => {
        addUri(r.photo_uri);
        addUri(r.photo_thumbnail_uri);
      });
      taskRows.rows.forEach((r) => {
        addUri(r.photo_uri);
        addUri(r.photo_thumbnail_uri);
      });

      let orphanResult = { deletedFilesCount: 0, reclaimedBytes: 0 };
      let cacheResult = { bytesCleared: 0, filesDeleted: 0 };

      if (nativeBridge) {
        orphanResult = await nativeBridge.cleanOrphanedMedia(Array.from(activeUris));
        cacheResult = await nativeBridge.cleanupTemporaryCache();
      }

      return {
        deletedFilesCount: orphanResult.deletedFilesCount,
        reclaimedBytes: orphanResult.reclaimedBytes,
        bytesCleared: cacheResult.bytesCleared,
      };
    } catch (error) {
      Logger.error('MediaService.optimizeStorage failed', error);
      return { deletedFilesCount: 0, reclaimedBytes: 0, bytesCleared: 0 };
    }
  }

  /**
   * Releases in-memory bitmap allocations and runs garbage collection.
   */
  public static async releaseMemory(): Promise<void> {
    if (nativeBridge) {
      await nativeBridge.releaseImageMemory();
    }
  }
}

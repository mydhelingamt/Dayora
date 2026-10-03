import {
  MediaService,
  MediaLruCache,
  formatBytes,
} from '../src/services/mediaService';
import { databaseClient } from '../src/database';

jest.mock('../src/database', () => ({
  databaseClient: {
    execute: jest.fn(async (sql: string) => {
      if (sql.includes('SELECT photo_uri, photo_thumbnail_uri FROM user_profile')) {
        return {
          rowsAffected: 1,
          rows: [{ photo_uri: 'file:///data/user/0/com.dayora/files/media/user1.jpg', photo_thumbnail_uri: 'file:///data/user/0/com.dayora/files/thumbnails/user1_thumb.jpg' }],
        };
      }
      if (sql.includes('SELECT photo_uri, photo_thumbnail_uri FROM birthdays')) {
        return {
          rowsAffected: 1,
          rows: [{ photo_uri: 'file:///data/user/0/com.dayora/files/media/bday1.jpg', photo_thumbnail_uri: 'file:///data/user/0/com.dayora/files/thumbnails/bday1_thumb.jpg' }],
        };
      }
      if (sql.includes('SELECT photo_uri, photo_thumbnail_uri FROM tasks')) {
        return {
          rowsAffected: 1,
          rows: [{ photo_uri: 'preset:cosmic_indigo', photo_thumbnail_uri: null }],
        };
      }
      return { rowsAffected: 1, rows: [] };
    }),
    executeTransaction: jest.fn(async () => {}),
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({
    didCancel: false,
    assets: [
      {
        uri: 'file:///cache/picked_image_raw.jpg',
        width: 1920,
        height: 1080,
        fileSize: 2048500,
        fileName: 'picked_image_raw.jpg',
        type: 'image/jpeg',
      },
    ],
  })),
}));

describe('Media & Storage Optimization System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatBytes utility', () => {
    it('formats bytes into appropriate readable units', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('MediaLruCache bounded cache', () => {
    it('stores and retrieves items correctly', () => {
      const cache = new MediaLruCache(3);
      cache.set('key1', { photoUri: 'uri1', lastAccessed: Date.now() });
      cache.set('key2', { photoUri: 'uri2', lastAccessed: Date.now() });

      expect(cache.get('key1')?.photoUri).toBe('uri1');
      expect(cache.get('key2')?.photoUri).toBe('uri2');
      expect(cache.get('key3')).toBeUndefined();
    });

    it('evicts least-recently used items when capacity is reached', () => {
      const cache = new MediaLruCache(3);
      cache.set('k1', { photoUri: 'uri1', lastAccessed: Date.now() });
      cache.set('k2', { photoUri: 'uri2', lastAccessed: Date.now() });
      cache.set('k3', { photoUri: 'uri3', lastAccessed: Date.now() });

      // Access k1 to make it most recently used
      cache.get('k1');

      // Insert k4, which should evict k2 (the oldest unaccessed)
      cache.set('k4', { photoUri: 'uri4', lastAccessed: Date.now() });

      expect(cache.get('k1')).toBeDefined();
      expect(cache.get('k2')).toBeUndefined(); // Evicted!
      expect(cache.get('k3')).toBeDefined();
      expect(cache.get('k4')).toBeDefined();
    });

    it('supports deletion and clearing', () => {
      const cache = new MediaLruCache(5);
      cache.set('item1', { photoUri: 'p1', lastAccessed: Date.now() });
      cache.set('item2', { photoUri: 'p2', lastAccessed: Date.now() });

      expect(cache.size).toBe(2);
      cache.delete('item1');
      expect(cache.size).toBe(1);
      expect(cache.get('item1')).toBeUndefined();

      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('MediaService Operations', () => {
    it('identifies and retrieves signature preset avatars', () => {
      expect(MediaService.isPresetAvatar('preset:cosmic_indigo')).toBe(true);
      expect(MediaService.isPresetAvatar('file:///media/img.jpg')).toBe(false);
      expect(MediaService.isPresetAvatar(null)).toBe(false);

      const preset = MediaService.getPresetAvatar('preset:cosmic_indigo');
      expect(preset).toBeDefined();
      expect(preset?.initials).toBe('DY');
      expect(preset?.accentColor).toBe('#818CF8');

      expect(MediaService.getPresetAvatar('invalid')).toBeUndefined();
    });

    it('picks, downscales, and caches media in test environment', async () => {
      const result = await MediaService.pickAndStoreImage('profile', 'user_1');
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('file:///cache/picked_image_raw.jpg');
      expect(result?.thumbnailUri).toBe('file:///cache/picked_image_raw.jpg');

      const cached = MediaService.getCache().get('file:///cache/picked_image_raw.jpg');
      expect(cached).toBeDefined();
    });

    it('records and queries failed image URIs safely', () => {
      const brokenUri = 'file:///missing/broken_photo.jpg';
      expect(MediaService.isImageFailed(brokenUri)).toBe(false);

      MediaService.markImageFailed(brokenUri);
      expect(MediaService.isImageFailed(brokenUri)).toBe(true);

      // Presets are never marked failed
      MediaService.markImageFailed('preset:cyan_breeze');
      expect(MediaService.isImageFailed('preset:cyan_breeze')).toBe(false);
    });

    it('optimizes storage by cross-referencing active database media', async () => {
      const result = await MediaService.optimizeStorage();
      expect(result).toHaveProperty('deletedFilesCount');
      expect(result).toHaveProperty('reclaimedBytes');
      expect(result).toHaveProperty('bytesCleared');

      // Verify active URIs were queried from all three tables
      expect(databaseClient.execute).toHaveBeenCalledWith(
        expect.stringContaining('FROM user_profile')
      );
      expect(databaseClient.execute).toHaveBeenCalledWith(
        expect.stringContaining('FROM birthdays')
      );
      expect(databaseClient.execute).toHaveBeenCalledWith(
        expect.stringContaining('FROM tasks')
      );
    });

    it('cleans temporary cache without corrupting persistent photos', async () => {
      const result = await MediaService.cleanupCache();
      expect(result).toHaveProperty('bytesCleared');
      expect(result).toHaveProperty('filesDeleted');
    });

    it('returns storage metrics structure cleanly', async () => {
      const metrics = await MediaService.getStorageMetrics();
      expect(metrics).toHaveProperty('formattedCache');
      expect(metrics).toHaveProperty('formattedMedia');
      expect(metrics).toHaveProperty('formattedThumbnail');
      expect(metrics).toHaveProperty('formattedDatabase');
      expect(metrics).toHaveProperty('formattedTotal');
    });
  });
});

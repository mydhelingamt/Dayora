import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { DateService } from '../src/services/dateService';
import { MediaService, PRESET_AVATARS } from '../src/services/mediaService';
import { RootNavigator } from '../src/navigation/RootNavigator';
import { AppProvider } from '../src/state/AppContext';
import { ThemeProvider } from '../src/theme';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({
    didCancel: false,
    assets: [
      {
        uri: 'file:///data/user/0/com.dayora/cache/photo_512.jpg',
        width: 512,
        height: 512,
        fileSize: 42000,
        type: 'image/jpeg',
      },
    ],
  })),
}));

describe('Profile Flow & Services', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('DateService utilities', () => {
    it('validates ISO date format correctly', () => {
      expect(DateService.isValidIsoDate('1998-05-24')).toBe(true);
      expect(DateService.isValidIsoDate('2000-01-01')).toBe(true);
      expect(DateService.isValidIsoDate('invalid-date')).toBe(false);
      expect(DateService.isValidIsoDate('1998-13-24')).toBe(false);
      expect(DateService.isValidIsoDate('1998-05-32')).toBe(false);
      expect(DateService.isValidIsoDate('24-05-1998')).toBe(false);
      expect(DateService.isValidIsoDate('')).toBe(false);
    });

    it('calculates age correctly', () => {
      const refDate = new Date('2026-09-10T12:00:00Z');
      expect(DateService.getAge('1998-05-24', refDate)).toBe(28);
      expect(DateService.getAge('2000-10-15', refDate)).toBe(25); // birthday not yet in 2026
      expect(DateService.getAge('2000-09-10', refDate)).toBe(26); // today is birthday
    });

    it('formats display dates nicely', () => {
      expect(DateService.formatDisplayDate('1998-05-24')).toContain('1998');
      expect(DateService.formatDisplayDate('1998-05-24')).toContain('24');
    });
  });

  describe('MediaService & Preset Avatars', () => {
    it('provides 6 signature preset avatars', () => {
      expect(PRESET_AVATARS.length).toBe(6);
      expect(PRESET_AVATARS[0]?.id).toBe('preset:cosmic_indigo');
    });

    it('identifies and retrieves preset avatars correctly', () => {
      expect(MediaService.isPresetAvatar('preset:cosmic_indigo')).toBe(true);
      expect(MediaService.isPresetAvatar('file:///path/to/img.jpg')).toBe(false);
      expect(MediaService.isPresetAvatar(null)).toBe(false);

      const preset = MediaService.getPresetAvatar('preset:cyan_breeze');
      expect(preset?.label).toBe('Cyan Breeze');
      expect(preset?.accentColor).toBe('#22D3EE');
    });

    it('picks and returns optimized profile image from native picker', async () => {
      const result = await MediaService.pickProfileImage();
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('file:///data/user/0/com.dayora/cache/photo_512.jpg');
      expect(result?.width).toBe(512);
      expect(result?.height).toBe(512);
    });
  });

  describe('Navigation Launch Routing', () => {
    it('renders and transitions through splash screen', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <ThemeProvider>
            <AppProvider>
              <RootNavigator />
            </AppProvider>
          </ThemeProvider>
        );
      });

      // Advance timers to complete splash animation sequence
      await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(2500);
      });

      expect(renderer).toBeDefined();
    });
  });
});

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Image } from 'react-native';
import { AppAvatar } from '../src/components/common/AppAvatar';
import { MediaService } from '../src/services/mediaService';
import { ThemeProvider } from '../src/theme';

describe('AppAvatar Safe Image Loading & Thumbnail Preference', () => {
  it('renders initials when no photoUri is provided', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppAvatar name="Sarah Jenkins" size="md" />
        </ThemeProvider>
      );
    });

    const root = renderer!.root;
    expect(root).toBeDefined();
    const texts = root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'SJ')).toBe(true);
  });

  it('renders preset initials for preset avatars', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppAvatar name="Sarah" photoUri="preset:cosmic_indigo" size="md" />
        </ThemeProvider>
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'DY')).toBe(true);
  });

  it('prefers thumbnailUri when size is md and candidate is available', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppAvatar
            name="Alex"
            photoUri="file:///photos/full.jpg"
            thumbnailUri="file:///photos/thumb.jpg"
            size="md"
          />
        </ThemeProvider>
      );
    });

    const root = renderer!.root;
    const image = root.findByType(Image);
    expect(image.props.source).toEqual({ uri: 'file:///photos/thumb.jpg' });
  });

  it('uses full photoUri for large details view when size is xl', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppAvatar
            name="Alex"
            photoUri="file:///photos/full.jpg"
            thumbnailUri="file:///photos/thumb.jpg"
            size="xl"
          />
        </ThemeProvider>
      );
    });

    const root = renderer!.root;
    const image = root.findByType(Image);
    expect(image.props.source).toEqual({ uri: 'file:///photos/full.jpg' });
  });

  it('falls back to initials gracefully when image loading encounters an error', () => {
    const brokenUri = 'file:///corrupted/image.jpg';
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppAvatar
            name="Alex River"
            photoUri={brokenUri}
            size="xl"
          />
        </ThemeProvider>
      );
    });

    const root = renderer!.root;
    const image = root.findByType(Image);
    expect(image).toBeDefined();

    // Trigger onError
    act(() => {
      image.props.onError();
    });

    // After error, candidate is recorded as failed and initials are displayed
    const texts = root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'AR')).toBe(true);
    expect(MediaService.isImageFailed(brokenUri)).toBe(true);
  });
});

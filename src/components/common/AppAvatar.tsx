import React, { useState } from 'react';
import {
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { getInitials } from '../../utilities/formatters';
import { MediaService } from '../../services/mediaService';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AppAvatarProps {
  name?: string;
  source?: ImageSourcePropType;
  photoUri?: string | null;
  thumbnailUri?: string | null;
  preferThumbnail?: boolean;
  size?: AvatarSize;
  badgeColor?: string;
  ringColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const AppAvatar: React.FC<AppAvatarProps> = React.memo(({
  name,
  source,
  photoUri,
  thumbnailUri,
  preferThumbnail,
  size = 'md',
  badgeColor,
  ringColor,
  style,
  onPress,
}) => {
  const { theme } = useTheme();
  const [loadFailed, setLoadFailed] = useState(false);

  const getDimension = (): number => {
    switch (size) {
      case 'xs':
        return theme.dimensions.avatarXs;
      case 'sm':
        return theme.dimensions.avatarSm;
      case 'lg':
        return theme.dimensions.avatarLg;
      case 'xl':
        return theme.dimensions.avatarXl;
      case 'md':
      default:
        return theme.dimensions.avatarMd;
    }
  };

  const dim = getDimension();
  const radius = dim / 2;

  // By default, prefer thumbnail for small and medium list avatars to save memory
  const shouldUseThumbnail =
    preferThumbnail !== undefined
      ? preferThumbnail
      : size === 'xs' || size === 'sm' || size === 'md';

  const candidateUri = shouldUseThumbnail && thumbnailUri ? thumbnailUri : photoUri;
  const isPreset = MediaService.isPresetAvatar(candidateUri);
  const preset = isPreset ? MediaService.getPresetAvatar(candidateUri) : undefined;

  const isFailed = candidateUri ? MediaService.isImageFailed(candidateUri) || loadFailed : false;

  let imageSource: ImageSourcePropType | undefined = source;
  if (!imageSource && candidateUri && !isPreset && !isFailed) {
    imageSource = { uri: candidateUri };
  }

  const handleImageError = () => {
    if (candidateUri) {
      MediaService.markImageFailed(candidateUri);
    }
    setLoadFailed(true);
  };

  const content = (
    <View
      style={[
        styles.avatarBase,
        ringColor ? styles.ring : styles.noRing,
        {
          width: dim,
          height: dim,
          borderRadius: radius,
          backgroundColor: preset ? preset.bgGradient[0] : theme.colors.cardElevated,
          borderColor: ringColor || 'transparent',
        },
        style,
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.image, { borderRadius: radius }]}
          resizeMode="cover"
          onError={handleImageError}
        />
      ) : preset ? (
        <AppText
          variant={size === 'xs' || size === 'sm' ? 'caption' : 'titleMedium'}
          color={preset.accentColor}
          weight="700"
        >
          {preset.initials}
        </AppText>
      ) : (
        <AppText
          variant={size === 'xs' || size === 'sm' ? 'caption' : 'titleMedium'}
          color={theme.colors.primaryLight}
          weight="700"
        >
          {getInitials(name || 'Dayora')}
        </AppText>
      )}

      {badgeColor ? (
        <View
          style={[
            styles.badge,
            {
              width: Math.max(8, dim * 0.25),
              height: Math.max(8, dim * 0.25),
              borderRadius: dim * 0.125,
              backgroundColor: badgeColor,
              borderColor: theme.colors.background,
            },
          ]}
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {content}
      </Pressable>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  avatarBase: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    borderWidth: 2,
  },
  noRing: {
    borderWidth: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
  },
});

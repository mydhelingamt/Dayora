import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { CloseIcon } from '../../assets/icons';

export interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  prefixIcon,
  suffixIcon,
  clearable = false,
  onClear,
  value,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = (): string => {
    if (error) {
      return theme.colors.error;
    }
    if (isFocused) {
      return theme.colors.primary;
    }
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText
          variant="labelMedium"
          color={isFocused ? theme.colors.primaryLight : theme.colors.textSecondary}
          style={styles.label}
        >
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.card,
            borderColor: getBorderColor(),
            borderRadius: theme.radii.md,
            minHeight: theme.dimensions.inputHeight,
          },
          isFocused ? styles.focusedBorder : styles.unfocusedBorder,
          inputStyle,
        ]}
      >
        {prefixIcon ? <View style={styles.prefixWrapper}>{prefixIcon}</View> : null}

        <TextInput
          value={value}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.bodyLarge?.fontSize ?? 16,
            },
          ]}
          {...rest}
        />

        {clearable && value && value.length > 0 ? (
          <Pressable
            onPress={onClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon size={16} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}

        {suffixIcon ? <View style={styles.suffixWrapper}>{suffixIcon}</View> : null}
      </View>

      {error ? (
        <AppText variant="caption" color={theme.colors.error} style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  focusedBorder: {
    borderWidth: 1.5,
  },
  unfocusedBorder: {
    borderWidth: 1,
  },
  prefixWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suffixWrapper: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
  },
});

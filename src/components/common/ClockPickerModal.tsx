import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  GestureResponderEvent,
} from 'react-native';
import { AppText } from './AppText';
import { KeyboardIcon, ClockIcon } from '../../assets/icons';
import { NativePickerService } from '../../services/nativePickerService';
import { useTheme } from '../../theme';

export interface ClockPickerModalProps {
  visible: boolean;
  initialTime?: string | null;
  onClose: () => void;
  onSelectTime: (timeString: string) => void;
  is24Hour?: boolean;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const DIAL_SIZE = 256;
const CENTER = DIAL_SIZE / 2;
const RADIUS = 92;

export const ClockPickerModal: React.FC<ClockPickerModalProps> = ({
  visible,
  initialTime,
  onClose,
  onSelectTime,
  is24Hour: is24HourProp,
}) => {
  const { theme, isDark, isGolden } = useTheme();

  const now = new Date();
  const currentRawHour = now.getHours();
  const currentParsedHour = currentRawHour % 12 === 0 ? 12 : currentRawHour % 12;
  const currentMinute = now.getMinutes();
  const currentPeriod: 'AM' | 'PM' = currentRawHour >= 12 ? 'PM' : 'AM';

  const [hour, setHour] = useState<number>(currentParsedHour);
  const [minute, setMinute] = useState<number>(currentMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(currentPeriod);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isInputMode, setIsInputMode] = useState<boolean>(false);
  const [manualHourText, setManualHourText] = useState<string>(String(currentParsedHour));
  const [manualMinuteText, setManualMinuteText] = useState<string>(
    String(currentMinute).padStart(2, '0')
  );

  useEffect(() => {
    if (!visible) return;

    if (NativePickerService.isAvailable()) {
      const nowInstance = new Date();
      let initialHour = nowInstance.getHours();
      let initialMinute = nowInstance.getMinutes();

      if (initialTime && /^\d{1,2}:\d{2}$/.test(initialTime.trim())) {
        const parts = initialTime.trim().split(':').map(Number);
        if (parts[0] !== undefined && !isNaN(parts[0])) initialHour = parts[0];
        if (parts[1] !== undefined && !isNaN(parts[1])) initialMinute = parts[1];
      }

      const pickerTheme = isGolden ? 'golden' : isDark ? 'dark' : 'light';

      NativePickerService.openTimePicker({
        hour: initialHour,
        minute: initialMinute,
        is24Hour: is24HourProp,
        theme: pickerTheme,
      }).then((result) => {
        if (
          result.action === 'timeSet' &&
          result.hour !== undefined &&
          result.minute !== undefined
        ) {
          const formatted = `${String(result.hour).padStart(2, '0')}:${String(
            result.minute
          ).padStart(2, '0')}`;
          onSelectTime(formatted);
        }
        onClose();
      });
      return;
    }

    if (initialTime && /^\d{1,2}:\d{2}$/.test(initialTime)) {
      const parts = initialTime.split(':').map(Number);
      const rawH = parts[0] ?? currentRawHour;
      const rawM = parts[1] ?? currentMinute;
      let parsedH = rawH % 12;
      if (parsedH === 0) parsedH = 12;
      setHour(parsedH);
      setMinute(rawM);
      setPeriod(rawH >= 12 ? 'PM' : 'AM');
      setManualHourText(String(parsedH));
      setManualMinuteText(String(rawM).padStart(2, '0'));
    } else {
      const liveDate = new Date();
      const liveH = liveDate.getHours();
      const liveM = liveDate.getMinutes();
      const parsedH = liveH % 12 === 0 ? 12 : liveH % 12;
      setHour(parsedH);
      setMinute(liveM);
      setPeriod(liveH >= 12 ? 'PM' : 'AM');
      setManualHourText(String(parsedH));
      setManualMinuteText(String(liveM).padStart(2, '0'));
    }
    setMode('hour');
    setIsInputMode(false);
  }, [
    initialTime,
    visible,
    isDark,
    isGolden,
    is24HourProp,
    onClose,
    onSelectTime,
    currentRawHour,
    currentMinute,
  ]);

  const handleSelectHour = useCallback((h: number) => {
    setHour(h);
    setManualHourText(String(h));
    setMode('minute');
  }, []);

  const handleSelectMinute = useCallback((m: number) => {
    setMinute(m);
    setManualMinuteText(String(m).padStart(2, '0'));
  }, []);

  const handleDialTouch = useCallback(
    (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      const dx = locationX - CENTER;
      const dy = locationY - CENTER;

      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (deg < 0) deg += 360;

      if (mode === 'hour') {
        let h = Math.round(deg / 30);
        if (h === 0) h = 12;
        setHour(h);
        setManualHourText(String(h));
      } else {
        const m = Math.round(deg / 6) % 60;
        setMinute(m);
        setManualMinuteText(String(m).padStart(2, '0'));
      }
    },
    [mode]
  );

  const handleConfirm = () => {
    let finalH = hour;
    let finalM = minute;

    if (isInputMode) {
      const parsedH = parseInt(manualHourText, 10);
      const parsedM = parseInt(manualMinuteText, 10);
      if (!isNaN(parsedH) && parsedH >= 1 && parsedH <= 12) {
        finalH = parsedH;
      }
      if (!isNaN(parsedM) && parsedM >= 0 && parsedM <= 59) {
        finalM = parsedM;
      }
    }

    let militaryHour = finalH % 12;
    if (period === 'PM') {
      militaryHour += 12;
    }
    const formatted = `${String(militaryHour).padStart(2, '0')}:${String(finalM).padStart(
      2,
      '0'
    )}`;
    onSelectTime(formatted);
    onClose();
  };

  // Selected angle calculation (degrees from top -90deg)
  const selectedAngleDeg = useMemo(() => {
    if (mode === 'hour') {
      const idx = hour % 12;
      return idx * 30 - 90;
    } else {
      return minute * 6 - 90;
    }
  }, [mode, hour, minute]);

  const selectedTargetPos = useMemo(() => {
    const rad = (selectedAngleDeg * Math.PI) / 180;
    return {
      x: CENTER + RADIUS * Math.cos(rad),
      y: CENTER + RADIUS * Math.sin(rad),
    };
  }, [selectedAngleDeg]);

  // Generate 12 dial positions for display
  const dialItems = useMemo(() => {
    const items = mode === 'hour' ? HOURS : MINUTES;
    return items.map((val, idx) => {
      const angleDeg = idx * 30 - 90;
      const rad = (angleDeg * Math.PI) / 180;
      const x = CENTER + RADIUS * Math.cos(rad) - 18;
      const y = CENTER + RADIUS * Math.sin(rad) - 18;
      const isSelected =
        mode === 'hour'
          ? hour === val
          : Math.abs(minute - val) <= 2 || (minute >= 58 && val === 0);

      return {
        value: val,
        label: mode === 'hour' ? String(val) : String(val).padStart(2, '0'),
        x,
        y,
        isSelected,
      };
    });
  }, [mode, hour, minute]);

  if (NativePickerService.isAvailable()) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header Label: Select time */}
          <AppText variant="caption" color={theme.colors.textSecondary} style={styles.headerLabel}>
            Select time
          </AppText>

          {/* Time Display Boxes & AM/PM Switch */}
          <View style={styles.timeRow}>
            {/* Hour Box */}
            <Pressable
              onPress={() => setMode('hour')}
              style={[
                styles.timeBox,
                mode === 'hour' ? styles.timeBoxActive : styles.timeBoxInactive,
                {
                  backgroundColor:
                    mode === 'hour' ? theme.colors.surfaceSubtle : theme.colors.card,
                  borderColor: mode === 'hour' ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <AppText
                variant="displayLarge"
                weight="700"
                color={mode === 'hour' ? theme.colors.primaryLight : theme.colors.text}
                style={styles.timeDigit}
              >
                {String(hour).padStart(2, '0')}
              </AppText>
            </Pressable>

            {/* Colon */}
            <AppText
              variant="displayLarge"
              weight="400"
              color={theme.colors.text}
              style={styles.colonText}
            >
              :
            </AppText>

            {/* Minute Box */}
            <Pressable
              onPress={() => setMode('minute')}
              style={[
                styles.timeBox,
                mode === 'minute' ? styles.timeBoxActive : styles.timeBoxInactive,
                {
                  backgroundColor:
                    mode === 'minute' ? theme.colors.surfaceSubtle : theme.colors.card,
                  borderColor: mode === 'minute' ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <AppText
                variant="displayLarge"
                weight="700"
                color={mode === 'minute' ? theme.colors.primaryLight : theme.colors.text}
                style={styles.timeDigit}
              >
                {String(minute).padStart(2, '0')}
              </AppText>
            </Pressable>

            {/* AM / PM Segmented Box */}
            <View style={[styles.ampmContainer, { borderColor: theme.colors.border }]}>
              <Pressable
                onPress={() => setPeriod('AM')}
                style={[
                  styles.ampmHalf,
                  styles.ampmTop,
                  {
                    backgroundColor:
                      period === 'AM' ? theme.colors.primary : theme.colors.surfaceSubtle,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <AppText
                  variant="labelSmall"
                  weight={period === 'AM' ? '700' : '500'}
                  color={period === 'AM' ? theme.colors.textInverse : theme.colors.textSecondary}
                  numberOfLines={1}
                >
                  AM
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => setPeriod('PM')}
                style={[
                  styles.ampmHalf,
                  {
                    backgroundColor:
                      period === 'PM' ? theme.colors.primary : theme.colors.surfaceSubtle,
                  },
                ]}
              >
                <AppText
                  variant="labelSmall"
                  weight={period === 'PM' ? '700' : '500'}
                  color={period === 'PM' ? theme.colors.textInverse : theme.colors.textSecondary}
                  numberOfLines={1}
                >
                  PM
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* Body: Circular Dial OR Keyboard Input Mode */}
          {!isInputMode ? (
            <View style={styles.clockDialWrapper}>
              <View
                style={[styles.clockDialFace, { backgroundColor: theme.colors.surfaceSubtle }]}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleDialTouch}
                onResponderMove={handleDialTouch}
                onResponderRelease={() => {
                  if (mode === 'hour') {
                    setMode('minute');
                  }
                }}
              >
                {/* Hand Pointer Line pivoting cleanly from center (CENTER, CENTER) */}
                <View
                  style={[
                    styles.clockHandContainer,
                    {
                      transform: [{ rotate: `${selectedAngleDeg + 90}deg` }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <View
                    style={[
                      styles.clockHandBar,
                      {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>

                {/* Selected Circle at target position */}
                <View
                  style={[
                    styles.selectedTargetCircle,
                    {
                      backgroundColor: theme.colors.primary,
                      left: selectedTargetPos.x - 24,
                      top: selectedTargetPos.y - 24,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <View style={styles.handTipDot} />
                </View>

                {/* Center Pivot Dot */}
                <View
                  style={[styles.clockCenterPivot, { backgroundColor: theme.colors.primary }]}
                  pointerEvents="none"
                />

                {/* 12 Dial Numbers */}
                {dialItems.map((item) => (
                  <Pressable
                    key={`dial-${item.label}`}
                    onPress={() =>
                      mode === 'hour'
                        ? handleSelectHour(item.value)
                        : handleSelectMinute(item.value)
                    }
                    style={[styles.clockNumberCell, { left: item.x, top: item.y }]}
                  >
                    <AppText
                      variant="bodyMedium"
                      weight={item.isSelected ? '700' : '500'}
                      color={item.isSelected ? theme.colors.textInverse : theme.colors.text}
                      style={mode === 'hour' ? styles.hourNumText : styles.minNumText}
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            /* Direct Text Input Mode */
            <View style={styles.manualInputContainer}>
              <View style={styles.manualInputRow}>
                <View style={styles.manualInputCol}>
                  <AppText
                    variant="caption"
                    color={theme.colors.textSecondary}
                    style={styles.manualLabel}
                  >
                    Hour
                  </AppText>
                  <TextInput
                    style={[
                      styles.manualTextInput,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        color: theme.colors.text,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={manualHourText}
                    onChangeText={(val) => {
                      setManualHourText(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num >= 1 && num <= 12) {
                        setHour(num);
                      }
                    }}
                  />
                </View>

                <AppText
                  variant="headlineMedium"
                  color={theme.colors.text}
                  style={styles.manualColon}
                >
                  :
                </AppText>

                <View style={styles.manualInputCol}>
                  <AppText
                    variant="caption"
                    color={theme.colors.textSecondary}
                    style={styles.manualLabel}
                  >
                    Minute
                  </AppText>
                  <TextInput
                    style={[
                      styles.manualTextInput,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        color: theme.colors.text,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={manualMinuteText}
                    onChangeText={(val) => {
                      setManualMinuteText(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num >= 0 && num <= 59) {
                        setMinute(num);
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Bottom Row: Keyboard Icon (left) and Cancel / OK (right) */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setIsInputMode(!isInputMode)}
              hitSlop={10}
              style={styles.modeToggleBtn}
              accessibilityLabel={
                isInputMode ? 'Switch to Clock Dial' : 'Switch to Keyboard Input'
              }
            >
              {isInputMode ? (
                <ClockIcon size={22} color={theme.colors.text} />
              ) : (
                <KeyboardIcon size={22} color={theme.colors.text} />
              )}
            </Pressable>

            <View style={styles.buttonsRightRow}>
              <Pressable onPress={onClose} hitSlop={10} style={styles.actionBtn}>
                <AppText variant="labelLarge" weight="600" color={theme.colors.textSecondary} numberOfLines={1}>
                  Cancel
                </AppText>
              </Pressable>
              <Pressable onPress={handleConfirm} hitSlop={10} style={styles.actionBtn}>
                <AppText variant="labelLarge" weight="700" color={theme.colors.primaryLight} numberOfLines={1}>
                  OK
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  headerLabel: {
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  timeBox: {
    width: 84,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBoxActive: {},
  timeBoxInactive: {},
  timeDigit: {
    fontSize: 44,
    lineHeight: 52,
  },
  colonText: {
    fontSize: 38,
    lineHeight: 46,
    marginBottom: 4,
  },
  ampmContainer: {
    width: 44,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginLeft: 6,
  },
  ampmHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmTop: {
    borderBottomWidth: 1,
  },
  clockDialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  clockDialFace: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    position: 'relative',
  },
  clockHandContainer: {
    position: 'absolute',
    left: CENTER,
    top: CENTER,
    width: 0,
    height: 0,
  },
  clockHandBar: {
    position: 'absolute',
    left: -1,
    top: -RADIUS,
    width: 2,
    height: RADIUS,
  },
  selectedTargetCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handTipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  clockCenterPivot: {
    position: 'absolute',
    left: CENTER - 4,
    top: CENTER - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clockNumberCell: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  hourNumText: {
    fontSize: 15,
  },
  minNumText: {
    fontSize: 13,
  },
  manualInputContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  manualInputCol: {
    alignItems: 'center',
  },
  manualLabel: {
    marginBottom: 6,
  },
  manualTextInput: {
    width: 80,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  manualColon: {
    marginTop: 20,
    fontSize: 32,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 8,
  },
  modeToggleBtn: {
    padding: 8,
  },
  buttonsRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

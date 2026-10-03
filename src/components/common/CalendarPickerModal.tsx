import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { AppText } from './AppText';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from '../../assets/icons';
import { DateService } from '../../services/dateService';
import { NativePickerService } from '../../services/nativePickerService';
import { useTheme } from '../../theme';

export interface CalendarPickerModalProps {
  visible: boolean;
  initialDate?: string | null;
  onClose: () => void;
  onSelectDate: (dateString: string) => void;
  title?: string;
  allowPast?: boolean;
}

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  initialDate,
  onClose,
  onSelectDate,
}) => {
  const { theme, isDark, isGolden } = useTheme();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(
    () =>
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`,
    [today]
  );

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');

  useEffect(() => {
    if (!visible) return;

    if (NativePickerService.isAvailable()) {
      let y = today.getFullYear();
      let m = today.getMonth() + 1;
      let d = today.getDate();

      if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
        const parts = initialDate.split('-').map(Number);
        y = parts[0] ?? y;
        m = parts[1] ?? m;
        d = parts[2] ?? d;
      }

      const pickerTheme = isGolden ? 'golden' : isDark ? 'dark' : 'light';

      NativePickerService.openDatePicker({
        year: y,
        month: m,
        day: d,
        theme: pickerTheme,
      }).then((result) => {
        if (result.action === 'dateSet' && result.year && result.month && result.day) {
          const dateStr = `${result.year}-${String(result.month).padStart(2, '0')}-${String(
            result.day
          ).padStart(2, '0')}`;
          onSelectDate(dateStr);
        }
        onClose();
      });
      return;
    }

    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const parts = initialDate.split('-').map(Number);
      const y = parts[0] ?? today.getFullYear();
      const m = parts[1] ?? (today.getMonth() + 1);
      setCurrentYear(y);
      setCurrentMonth(m);
      setSelectedDate(initialDate);
    } else {
      setSelectedDate(todayStr);
      setCurrentYear(today.getFullYear());
      setCurrentMonth(today.getMonth() + 1);
    }
    setViewMode('days');
  }, [initialDate, todayStr, visible, today, isDark, isGolden, onClose, onSelectDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const daysInMonth = useMemo(
    () => DateService.getDaysInMonth(currentMonth, currentYear),
    [currentMonth, currentYear]
  );

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentYear, currentMonth]);

  const handleDayPress = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const handleSelectYear = (yr: number) => {
    setCurrentYear(yr);
    const parts = selectedDate.split('-').map(Number);
    const m = parts[1] ?? currentMonth;
    const d = Math.min(parts[2] ?? 1, DateService.getDaysInMonth(m, yr));
    setSelectedDate(`${yr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    setViewMode('days');
  };

  const handleConfirm = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  // Formatted date string for Material 3 header: "Sat, Jan 1"
  const formattedHeaderDate = useMemo(() => {
    const parts = selectedDate.split('-').map(Number);
    const y = parts[0] ?? currentYear;
    const m = parts[1] ?? currentMonth;
    const d = parts[2] ?? 1;
    const dateObj = new Date(y, m - 1, d);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[dateObj.getDay()]}, ${months[m - 1]} ${d}`;
  }, [selectedDate, currentYear, currentMonth]);

  // Single-letter weekday headers: S M T W T F S
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Years list from current year + 10 down to 1920
  const years = useMemo(() => {
    const end = today.getFullYear() + 10;
    const start = 1920;
    const list: number[] = [];
    for (let y = end; y >= start; y--) {
      list.push(y);
    }
    return list;
  }, [today]);

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
          {/* Top Header */}
          <View style={styles.header}>
            <AppText variant="caption" color={theme.colors.textSecondary} style={styles.headerSubtitle}>
              Select date
            </AppText>
            <View style={styles.headerDateRow}>
              <AppText variant="headlineMedium" weight="700" color={theme.colors.text} style={styles.headerMainDate}>
                {formattedHeaderDate}
              </AppText>
              <Pressable
                onPress={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                hitSlop={10}
                style={styles.headerEditBtn}
              >
                <EditIcon size={20} color={theme.colors.primaryLight} />
              </Pressable>
            </View>
          </View>

          {/* Header Divider Line */}
          <View style={[styles.headerDivider, { backgroundColor: theme.colors.divider }]} />

          {/* Month / Year Navigator */}
          {viewMode === 'days' ? (
            <>
              <View style={styles.navRow}>
                <Pressable
                  onPress={() => setViewMode('years')}
                  style={[styles.yearDropdownPill, { backgroundColor: theme.colors.surfaceSubtle }]}
                  hitSlop={6}
                >
                  <AppText variant="bodyMedium" weight="600" color={theme.colors.text} numberOfLines={1}>
                    {DateService.MONTH_NAMES[currentMonth - 1]} {currentYear}  ▾
                  </AppText>
                </Pressable>

                <View style={styles.navArrowsRow}>
                  <Pressable onPress={handlePrevMonth} style={styles.navArrowBtn} hitSlop={10}>
                    <ChevronLeftIcon size={16} color={theme.colors.text} />
                  </Pressable>
                  <Pressable onPress={handleNextMonth} style={styles.navArrowBtn} hitSlop={10}>
                    <ChevronRightIcon size={16} color={theme.colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Day-of-week header: S M T W T F S */}
              <View style={styles.weekRow}>
                {weekDays.map((wd, i) => (
                  <View key={`wd-${i}`} style={styles.dayHeaderCell}>
                    <AppText variant="caption" weight="600" color={theme.colors.textMuted}>
                      {wd}
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Day Numbers Grid */}
              <View style={styles.daysGrid}>
                {/* Leading blanks */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.dayCell} />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(
                    day
                  ).padStart(2, '0')}`;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <Pressable
                      key={`day-${day}`}
                      onPress={() => handleDayPress(day)}
                      style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <AppText
                        variant="bodyMedium"
                        weight={isSelected ? '700' : '400'}
                        color={isSelected ? theme.colors.textInverse : theme.colors.text}
                      >
                        {day}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            /* Year Selection Grid View */
            <View style={styles.yearGridContainer}>
              <View style={styles.yearHeaderRow}>
                <AppText variant="bodyMedium" weight="600" color={theme.colors.text} numberOfLines={1}>
                  Select Year
                </AppText>
                <Pressable
                  onPress={() => setViewMode('days')}
                  style={styles.backToDaysBtn}
                >
                  <AppText variant="caption" weight="600" color={theme.colors.primaryLight} numberOfLines={1}>
                    Back to Calendar
                  </AppText>
                </Pressable>
              </View>

              <ScrollView
                style={styles.yearScrollView}
                contentContainerStyle={styles.yearScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {years.map((yr) => {
                  const isSelected = yr === currentYear;
                  return (
                    <Pressable
                      key={`yr-${yr}`}
                      onPress={() => handleSelectYear(yr)}
                      style={[
                        styles.yearChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surfaceSubtle,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodyMedium"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? theme.colors.textInverse : theme.colors.text}
                      >
                        {yr}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Bottom Action Buttons: Cancel and OK */}
          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.actionBtn}>
              <AppText variant="labelLarge" weight="600" color={theme.colors.textSecondary}>
                Cancel
              </AppText>
            </Pressable>
            <Pressable onPress={handleConfirm} hitSlop={10} style={styles.actionBtn}>
              <AppText variant="labelLarge" weight="700" color={theme.colors.primaryLight}>
                OK
              </AppText>
            </Pressable>
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
    padding: 16,
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
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  headerDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerMainDate: {
    fontSize: 32,
    lineHeight: 38,
  },
  headerEditBtn: {
    padding: 6,
  },
  headerDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearDropdownPill: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  navArrowsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navArrowBtn: {
    padding: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    marginHorizontal: (340 - 48 - 38 * 7) / 14 > 0 ? (340 - 48 - 38 * 7) / 14 : 1,
    borderRadius: 19,
  },
  selectedDayCell: {},
  yearGridContainer: {
    height: 260,
  },
  yearHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backToDaysBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  yearScrollView: {
    flex: 1,
  },
  yearScrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  yearChip: {
    width: '22%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  selectedYearChip: {},
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
    paddingRight: 4,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});

export default CalendarPickerModal;

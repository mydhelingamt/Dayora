import { NativeModules, Platform } from 'react-native';

export interface DatePickerOptions {
  year?: number;
  month?: number; // 1 - 12
  day?: number;
  minDate?: number; // Unix timestamp in ms
  maxDate?: number; // Unix timestamp in ms
  theme?: 'dark' | 'light' | 'golden';
}

export interface DatePickerResult {
  action: 'dateSet' | 'dismissed';
  year?: number;
  month?: number; // 1 - 12
  day?: number;
}

export interface TimePickerOptions {
  hour?: number; // 0 - 23
  minute?: number; // 0 - 59
  is24Hour?: boolean;
  theme?: 'dark' | 'light' | 'golden';
}

export interface TimePickerResult {
  action: 'timeSet' | 'dismissed';
  hour?: number;
  minute?: number;
}

const { DayoraPicker } = NativeModules;

export class NativePickerService {
  public static isAvailable(): boolean {
    return Platform.OS === 'android' && Boolean(DayoraPicker);
  }

  public static async openDatePicker(options: DatePickerOptions = {}): Promise<DatePickerResult> {
    if (this.isAvailable()) {
      try {
        return await DayoraPicker.openDatePicker(options);
      } catch {
        return { action: 'dismissed' };
      }
    }
    return { action: 'dismissed' };
  }

  public static async openTimePicker(options: TimePickerOptions = {}): Promise<TimePickerResult> {
    if (this.isAvailable()) {
      try {
        return await DayoraPicker.openTimePicker(options);
      } catch {
        return { action: 'dismissed' };
      }
    }
    return { action: 'dismissed' };
  }
}

/**
 * Dayora Date Service
 * Pure TypeScript date and calendar utilities with zero external dependencies.
 * Handles leap years (Feb 29), accurate age and turning-age calculations,
 * optional birth year handling, and countdown sorting.
 */

export interface ZodiacSignInfo {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
}

export class DateService {
  public static readonly MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  public static readonly MONTH_ABBR = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  /**
   * Determines if a given calendar year is a leap year.
   */
  public static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Returns the maximum number of days in a given month (1 - 12).
   * If year is provided, accounts for leap year February (29 vs 28).
   * If year is omitted, February allows up to 29 days.
   */
  public static getDaysInMonth(month: number, year?: number | null): number {
    if (month < 1 || month > 12) return 31;
    if (month === 2) {
      if (year != null && !isNaN(year)) {
        return this.isLeapYear(year) ? 29 : 28;
      }
      return 29;
    }
    if ([4, 6, 9, 11].includes(month)) {
      return 30;
    }
    return 31;
  }

  /**
   * Calculates the next celebration date and remaining days for a birthday.
   * Accurately handles leap-year birthdays (Feb 29):
   * In non-leap years, celebrated on Feb 28. In leap years, celebrated on Feb 29.
   */
  public static getNextBirthday(
    day: number,
    month: number,
    referenceDate: Date = new Date()
  ): { nextDate: Date; daysUntil: number; isLeapDay: boolean } {
    const today = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    );

    const isLeapDay = month === 2 && day === 29;

    const buildDateForYear = (targetYear: number): Date => {
      let targetDay = day;
      if (isLeapDay && !this.isLeapYear(targetYear)) {
        targetDay = 28; // In non-leap years, celebrate on Feb 28
      }
      return new Date(targetYear, month - 1, targetDay);
    };

    let nextDate = buildDateForYear(today.getFullYear());

    if (nextDate.getTime() < today.getTime()) {
      nextDate = buildDateForYear(today.getFullYear() + 1);
    }

    const diffTime = nextDate.getTime() - today.getTime();
    const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return {
      nextDate,
      daysUntil: Math.max(0, daysUntil),
      isLeapDay,
    };
  }

  /**
   * Checks whether a birthday falls on today according to the local calendar date.
   * Accurately handles leap-year birthdays (Feb 29):
   * In non-leap years, celebrated on Feb 28. In leap years, celebrated on Feb 29.
   * Uses local calendar components (zero timezone shift).
   */
  public static isBirthdayToday(
    day: number,
    month: number,
    referenceDate: Date = new Date()
  ): boolean {
    const currentMonth = referenceDate.getMonth() + 1;
    const currentDay = referenceDate.getDate();

    if (month === currentMonth && day === currentDay) {
      return true;
    }

    // Leap-day edge case: Feb 29 celebrated on Feb 28 in non-leap years
    if (month === 2 && day === 29 && !this.isLeapYear(referenceDate.getFullYear())) {
      return currentMonth === 2 && currentDay === 28;
    }

    return false;
  }

  /**
   * Checks whether a profile DOB string (YYYY-MM-DD or MM-DD) matches today's date.
   */
  public static isDobToday(
    dob: string | null | undefined,
    referenceDate: Date = new Date()
  ): boolean {
    if (!dob || typeof dob !== 'string') return false;
    const parts = dob.trim().split('-').map(Number);
    if (parts.length === 3) {
      const month = parts[1];
      const day = parts[2];
      if (month && day) {
        return this.isBirthdayToday(day, month, referenceDate);
      }
    } else if (parts.length === 2) {
      const month = parts[0];
      const day = parts[1];
      if (month && day) {
        return this.isBirthdayToday(day, month, referenceDate);
      }
    }
    return false;
  }

  /**
   * Calculates turning age on the upcoming birthday.
   * STRICT REQUIREMENT: If birthYear is null, undefined, or invalid, returns NULL.
   * Age must NEVER be displayed when the birth year is unavailable.
   */
  public static getTurningAge(
    birthYear: number | null | undefined,
    birthMonth: number,
    birthDay: number,
    referenceDate: Date = new Date()
  ): number | null {
    if (birthYear == null || isNaN(birthYear) || birthYear <= 0) {
      return null;
    }

    const { nextDate } = this.getNextBirthday(birthDay, birthMonth, referenceDate);
    const turningAge = nextDate.getFullYear() - birthYear;
    return Math.max(0, turningAge);
  }

  /**
   * Calculates current age.
   * STRICT REQUIREMENT: Returns NULL if birthYear is unavailable.
   */
  public static getCurrentAge(
    birthYear: number | null | undefined,
    birthMonth: number,
    birthDay: number,
    referenceDate: Date = new Date()
  ): number | null {
    if (birthYear == null || isNaN(birthYear) || birthYear <= 0) {
      return null;
    }

    const currentYear = referenceDate.getFullYear();
    let age = currentYear - birthYear;

    const currentMonth = referenceDate.getMonth() + 1;
    const currentDay = referenceDate.getDate();

    if (
      currentMonth < birthMonth ||
      (currentMonth === birthMonth && currentDay < birthDay)
    ) {
      age--;
    }

    return Math.max(0, age);
  }

  /**
   * Calculates detailed age broken down into years, months, and days old.
   * Returns NULL if birthYear is unavailable.
   */
  public static getDetailedAge(
    birthYear: number | null | undefined,
    birthMonth: number,
    birthDay: number,
    referenceDate: Date = new Date()
  ): {
    years: number;
    months: number;
    days: number;
    formattedFull: string;
    formattedShort: string;
  } | null {
    if (birthYear == null || isNaN(birthYear) || birthYear <= 0) {
      return null;
    }

    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth() + 1;
    const currentDay = referenceDate.getDate();

    let years = currentYear - birthYear;
    let months = currentMonth - birthMonth;
    let days = currentDay - birthDay;

    if (days < 0) {
      months -= 1;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      days += this.getDaysInMonth(prevMonth, prevYear);
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years < 0) {
      return null;
    }

    const yrStr = `${years} ${years === 1 ? 'Year' : 'Years'}`;
    const moStr = `${months} ${months === 1 ? 'Month' : 'Months'}`;
    const dyStr = `${days} ${days === 1 ? 'Day' : 'Days'}`;

    let formattedFull = `${yrStr}, ${moStr}, ${dyStr} old`;
    let formattedShort = `${years}y ${months}m ${days}d old`;

    if (years === 0 && months === 0) {
      formattedFull = `${dyStr} old`;
      formattedShort = `${days}d old`;
    } else if (years === 0) {
      formattedFull = `${moStr}, ${dyStr} old`;
      formattedShort = `${months}m ${days}d old`;
    }

    return {
      years,
      months,
      days,
      formattedFull,
      formattedShort,
    };
  }

  /**
   * Formats birthday for prominent display:
   * With year: "September 15, 1995"
   * Without year: "September 15"
   */
  public static formatBirthdayDisplay(
    day: number,
    month: number,
    year?: number | null
  ): string {
    const monthName = this.MONTH_NAMES[month - 1] || 'Unknown';
    if (year != null && !isNaN(year) && year > 0) {
      return `${monthName} ${day}, ${year}`;
    }
    return `${monthName} ${day}`;
  }

  /**
   * Short formatted birthday: "Sep 15"
   */
  public static formatShortDate(day: number, month: number): string {
    const monthAbbr = this.MONTH_ABBR[month - 1] || '';
    return `${monthAbbr} ${day}`;
  }

  /**
   * Formats countdown badge:
   * 0 -> "Today!"
   * 1 -> "Tomorrow"
   * X -> "In X days"
   */
  public static getCountdownLabel(daysUntil: number): string {
    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  }

  /**
   * Returns Western Zodiac Sign and Element for a given day and month.
   */
  public static getZodiacSign(day: number, month: number): ZodiacSignInfo {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      return { name: 'Aries', symbol: '♈', element: 'Fire' };
    }
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      return { name: 'Taurus', symbol: '♉', element: 'Earth' };
    }
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      return { name: 'Gemini', symbol: '♊', element: 'Air' };
    }
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      return { name: 'Cancer', symbol: '♋', element: 'Water' };
    }
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      return { name: 'Leo', symbol: '♌', element: 'Fire' };
    }
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      return { name: 'Virgo', symbol: '♍', element: 'Earth' };
    }
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      return { name: 'Libra', symbol: '♎', element: 'Air' };
    }
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      return { name: 'Scorpio', symbol: '♏', element: 'Water' };
    }
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      return { name: 'Sagittarius', symbol: '♐', element: 'Fire' };
    }
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
      return { name: 'Capricorn', symbol: '♑', element: 'Earth' };
    }
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      return { name: 'Aquarius', symbol: '♒', element: 'Air' };
    }
    return { name: 'Pisces', symbol: '♓', element: 'Water' };
  }

  // --- Backward compatibility methods ---

  public static getDaysUntilBirthday(birthDateIso: string, referenceDate: Date = new Date()): number {
    const parts = this.parseDateString(birthDateIso);
    if (!parts) {
      const birthDate = new Date(birthDateIso);
      return this.getNextBirthday(birthDate.getDate(), birthDate.getMonth() + 1, referenceDate).daysUntil;
    }
    return this.getNextBirthday(parts.day, parts.month, referenceDate).daysUntil;
  }

  public static getAge(birthDateIso: string, referenceDate: Date = new Date()): number {
    const parts = this.parseDateString(birthDateIso);
    if (!parts || parts.year == null) {
      const birth = new Date(birthDateIso);
      let age = referenceDate.getFullYear() - birth.getFullYear();
      const monthDiff = referenceDate.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
        age--;
      }
      return Math.max(0, age);
    }
    return this.getCurrentAge(parts.year, parts.month, parts.day, referenceDate) ?? 0;
  }

  public static formatDisplayDate(dateIso: string): string {
    const parts = this.parseDateString(dateIso);
    if (parts) {
      return this.formatBirthdayDisplay(parts.day, parts.month, parts.year);
    }
    const date = new Date(dateIso);
    return `${this.MONTH_ABBR[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  public static isToday(dateIso: string, referenceDate: Date = new Date()): boolean {
    const parts = this.parseDateString(dateIso);
    if (parts) {
      return parts.month === referenceDate.getMonth() + 1 && parts.day === referenceDate.getDate();
    }
    const d = new Date(dateIso);
    return (
      d.getFullYear() === referenceDate.getFullYear() &&
      d.getMonth() === referenceDate.getMonth() &&
      d.getDate() === referenceDate.getDate()
    );
  }

  public static isValidIsoDate(dateString: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    if (!match || !match[1] || !match[2] || !match[3]) {
      return false;
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  public static parseDateString(dateStr: string): { day: number; month: number; year: number | null } | null {
    if (!dateStr) return null;
    const matchFull = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (matchFull && matchFull[1] && matchFull[2] && matchFull[3]) {
      const year = parseInt(matchFull[1], 10);
      return {
        year: year > 0 ? year : null,
        month: parseInt(matchFull[2], 10),
        day: parseInt(matchFull[3], 10),
      };
    }
    const matchMonthDay = /^(\d{2})-(\d{2})$/.exec(dateStr);
    if (matchMonthDay && matchMonthDay[1] && matchMonthDay[2]) {
      return {
        year: null,
        month: parseInt(matchMonthDay[1], 10),
        day: parseInt(matchMonthDay[2], 10),
      };
    }
    return null;
  }
}

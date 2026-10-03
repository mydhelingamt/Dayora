import { DateService } from '../src/services/dateService';

describe('DateService Calendar & Age Computations', () => {
  describe('Leap year detection', () => {
    it('identifies leap years correctly', () => {
      expect(DateService.isLeapYear(2024)).toBe(true);
      expect(DateService.isLeapYear(2028)).toBe(true);
      expect(DateService.isLeapYear(2000)).toBe(true);
      expect(DateService.isLeapYear(2026)).toBe(false);
      expect(DateService.isLeapYear(2025)).toBe(false);
      expect(DateService.isLeapYear(1900)).toBe(false);
    });

    it('returns correct days in month with leap year considerations', () => {
      // February in leap year
      expect(DateService.getDaysInMonth(2, 2024)).toBe(29);
      // February in non-leap year
      expect(DateService.getDaysInMonth(2, 2026)).toBe(28);
      // February when year is omitted allows 29
      expect(DateService.getDaysInMonth(2, null)).toBe(29);
      // Months with 30 days
      expect(DateService.getDaysInMonth(4, 2026)).toBe(30);
      expect(DateService.getDaysInMonth(9, 2026)).toBe(30);
      // Months with 31 days
      expect(DateService.getDaysInMonth(1, 2026)).toBe(31);
      expect(DateService.getDaysInMonth(12, 2026)).toBe(31);
    });
  });

  describe('Next Birthday and Leap Day Handling', () => {
    it('calculates days until upcoming birthday accurately', () => {
      const today = new Date(2026, 8, 9); // Sep 9, 2026
      const { daysUntil } = DateService.getNextBirthday(14, 9, today); // Sep 14
      expect(daysUntil).toBe(5);
    });

    it('calculates birthday today as 0 days', () => {
      const today = new Date(2026, 8, 9); // Sep 9, 2026
      const { daysUntil } = DateService.getNextBirthday(9, 9, today);
      expect(daysUntil).toBe(0);
    });

    it('calculates birthday tomorrow as 1 day', () => {
      const today = new Date(2026, 8, 9); // Sep 9, 2026
      const { daysUntil } = DateService.getNextBirthday(10, 9, today);
      expect(daysUntil).toBe(1);
    });

    it('rolls over to next year if birthday already occurred', () => {
      const today = new Date(2026, 8, 15); // Sep 15, 2026
      const { daysUntil, nextDate } = DateService.getNextBirthday(10, 9, today); // Sep 10
      expect(nextDate.getFullYear()).toBe(2027);
      expect(daysUntil).toBeGreaterThan(300);
    });

    it('handles February 29 leap day birthdays properly', () => {
      // In non-leap year 2026: Feb 29 celebrated on Feb 28
      const todayNonLeap = new Date(2026, 1, 1); // Feb 1, 2026
      const resultNonLeap = DateService.getNextBirthday(29, 2, todayNonLeap);
      expect(resultNonLeap.isLeapDay).toBe(true);
      expect(resultNonLeap.nextDate.getDate()).toBe(28);
      expect(resultNonLeap.daysUntil).toBe(27);

      // In leap year 2028: Feb 29 celebrated on Feb 29
      const todayLeap = new Date(2028, 1, 1); // Feb 1, 2028
      const resultLeap = DateService.getNextBirthday(29, 2, todayLeap);
      expect(resultLeap.isLeapDay).toBe(true);
      expect(resultLeap.nextDate.getDate()).toBe(29);
      expect(resultLeap.daysUntil).toBe(28);
    });
  });

  describe('Age Calculations & Strict Missing Year Rule', () => {
    const today = new Date(2026, 8, 10); // Sep 10, 2026

    it('calculates current and turning age correctly when year is present', () => {
      // Born Sep 15, 1996 -> currently 29, turning 30 in 5 days
      expect(DateService.getCurrentAge(1996, 9, 15, today)).toBe(29);
      expect(DateService.getTurningAge(1996, 9, 15, today)).toBe(30);

      // Born Sep 10, 2000 -> birthday is today, currently 26, turning 26
      expect(DateService.getCurrentAge(2000, 9, 10, today)).toBe(26);
      expect(DateService.getTurningAge(2000, 9, 10, today)).toBe(26);

      // Born Sep 5, 2000 -> birthday passed this year, currently 26, turning 27 next year
      expect(DateService.getCurrentAge(2000, 9, 5, today)).toBe(26);
      expect(DateService.getTurningAge(2000, 9, 5, today)).toBe(27);
    });

    it('DOES NOT display/calculate age when birth year is unavailable', () => {
      expect(DateService.getTurningAge(null, 9, 15, today)).toBeNull();
      expect(DateService.getTurningAge(undefined, 9, 15, today)).toBeNull();
      expect(DateService.getTurningAge(0, 9, 15, today)).toBeNull();

      expect(DateService.getCurrentAge(null, 9, 15, today)).toBeNull();
      expect(DateService.getCurrentAge(undefined, 9, 15, today)).toBeNull();
      expect(DateService.getCurrentAge(0, 9, 15, today)).toBeNull();
    });
  });

  describe('Formatting & Zodiac', () => {
    it('formats display dates with and without year', () => {
      expect(DateService.formatBirthdayDisplay(15, 9, 1995)).toBe('September 15, 1995');
      expect(DateService.formatBirthdayDisplay(15, 9, null)).toBe('September 15');
      expect(DateService.formatBirthdayDisplay(15, 9, undefined)).toBe('September 15');
      expect(DateService.formatShortDate(15, 9)).toBe('Sep 15');
    });

    it('generates friendly countdown labels', () => {
      expect(DateService.getCountdownLabel(0)).toBe('Today!');
      expect(DateService.getCountdownLabel(1)).toBe('Tomorrow');
      expect(DateService.getCountdownLabel(4)).toBe('In 4 days');
    });

    it('calculates Western zodiac signs and elements', () => {
      const virgo = DateService.getZodiacSign(15, 9);
      expect(virgo.name).toBe('Virgo');
      expect(virgo.element).toBe('Earth');

      const aries = DateService.getZodiacSign(25, 3);
      expect(aries.name).toBe('Aries');
      expect(aries.element).toBe('Fire');

      const cancer = DateService.getZodiacSign(1, 7);
      expect(cancer.name).toBe('Cancer');
      expect(cancer.element).toBe('Water');
    });
  });

  describe('isBirthdayToday & isDobToday', () => {
    it('returns true when day and month match reference date', () => {
      const ref = new Date(2026, 8, 11); // Sep 11, 2026
      expect(DateService.isBirthdayToday(11, 9, ref)).toBe(true);
      expect(DateService.isBirthdayToday(12, 9, ref)).toBe(false);
      expect(DateService.isBirthdayToday(11, 10, ref)).toBe(false);
    });

    it('handles February 29 on non-leap year (celebrated Feb 28)', () => {
      const nonLeapRef = new Date(2026, 1, 28); // Feb 28, 2026
      expect(DateService.isBirthdayToday(29, 2, nonLeapRef)).toBe(true);

      const nonLeapOther = new Date(2026, 1, 27);
      expect(DateService.isBirthdayToday(29, 2, nonLeapOther)).toBe(false);
    });

    it('handles February 29 on leap year (celebrated Feb 29)', () => {
      const leapRef = new Date(2028, 1, 29); // Feb 29, 2028
      expect(DateService.isBirthdayToday(29, 2, leapRef)).toBe(true);

      const leapFeb28 = new Date(2028, 1, 28); // Feb 28, 2028
      expect(DateService.isBirthdayToday(29, 2, leapFeb28)).toBe(false);
    });

    it('evaluates isDobToday with YYYY-MM-DD and MM-DD strings', () => {
      const ref = new Date(2026, 8, 11); // Sep 11, 2026
      expect(DateService.isDobToday('1998-09-11', ref)).toBe(true);
      expect(DateService.isDobToday('09-11', ref)).toBe(true);
      expect(DateService.isDobToday('1998-09-12', ref)).toBe(false);
      expect(DateService.isDobToday(null, ref)).toBe(false);
      expect(DateService.isDobToday(undefined, ref)).toBe(false);
      expect(DateService.isDobToday('', ref)).toBe(false);
    });
  });
});

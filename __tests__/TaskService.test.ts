import { TaskService } from '../src/services/taskService';

describe('TaskService Unit Tests', () => {
  const referenceDate = new Date(2026, 8, 10, 14, 0, 0); // 2026-09-10 at 14:00 (2:00 PM)

  describe('isTaskOverdue', () => {
    it('returns false when dueDate is null', () => {
      expect(TaskService.isTaskOverdue(null, null, referenceDate)).toBe(false);
    });

    it('returns true when dueDate is in the past', () => {
      expect(TaskService.isTaskOverdue('2026-09-09', null, referenceDate)).toBe(true);
      expect(TaskService.isTaskOverdue('2026-08-15', '18:00', referenceDate)).toBe(true);
    });

    it('returns false when dueDate is in the future', () => {
      expect(TaskService.isTaskOverdue('2026-09-11', null, referenceDate)).toBe(false);
      expect(TaskService.isTaskOverdue('2026-09-15', '09:00', referenceDate)).toBe(false);
    });

    it('handles due date today with due_time', () => {
      // Current time is 14:00
      // Due at 13:30 (past) -> overdue
      expect(TaskService.isTaskOverdue('2026-09-10', '13:30', referenceDate)).toBe(true);
      // Due at 15:00 (future) -> not overdue
      expect(TaskService.isTaskOverdue('2026-09-10', '15:00', referenceDate)).toBe(false);
      // Due today with no due_time -> not overdue yet
      expect(TaskService.isTaskOverdue('2026-09-10', null, referenceDate)).toBe(false);
    });
  });

  describe('isTaskToday & isTaskUpcoming', () => {
    it('correctly identifies today tasks', () => {
      expect(TaskService.isTaskToday('2026-09-10', referenceDate)).toBe(true);
      expect(TaskService.isTaskToday('2026-09-11', referenceDate)).toBe(false);
      expect(TaskService.isTaskToday(null, referenceDate)).toBe(false);
    });

    it('correctly identifies upcoming tasks', () => {
      expect(TaskService.isTaskUpcoming('2026-09-11', referenceDate)).toBe(true);
      expect(TaskService.isTaskUpcoming('2026-09-10', referenceDate)).toBe(false);
      expect(TaskService.isTaskUpcoming('2026-09-09', referenceDate)).toBe(false);
      expect(TaskService.isTaskUpcoming(null, referenceDate)).toBe(false);
    });
  });

  describe('getNextRecurringDate', () => {
    it('preserves date when repeat interval is none', () => {
      expect(TaskService.getNextRecurringDate('2026-09-10', 'none')).toBe('2026-09-10');
    });

    it('advances daily task by 1 day', () => {
      expect(TaskService.getNextRecurringDate('2026-09-10', 'daily')).toBe('2026-09-11');
      expect(TaskService.getNextRecurringDate('2026-09-30', 'daily')).toBe('2026-10-01');
    });

    it('advances weekly task by 7 days', () => {
      expect(TaskService.getNextRecurringDate('2026-09-10', 'weekly')).toBe('2026-09-17');
    });

    it('advances monthly task by 1 month with month-end clamping', () => {
      expect(TaskService.getNextRecurringDate('2026-09-15', 'monthly')).toBe('2026-10-15');
      // Jan 31 -> Feb 28 in non-leap year (2026)
      expect(TaskService.getNextRecurringDate('2026-01-31', 'monthly')).toBe('2026-02-28');
      // Dec 10 -> Jan 10 next year
      expect(TaskService.getNextRecurringDate('2026-12-10', 'monthly')).toBe('2027-01-10');
    });

    it('advances yearly task by 1 year handling Feb 29 leap years', () => {
      expect(TaskService.getNextRecurringDate('2026-09-10', 'yearly')).toBe('2027-09-10');
      // 2024 is a leap year; 2025 is not -> Feb 28
      expect(TaskService.getNextRecurringDate('2024-02-29', 'yearly')).toBe('2025-02-28');
    });
  });

  describe('formatDueDisplay', () => {
    it('formats today task with time', () => {
      const res = TaskService.formatDueDisplay('2026-09-10', '16:30', referenceDate);
      expect(res.isToday).toBe(true);
      expect(res.isOverdue).toBe(false);
      expect(res.label).toBe('Today, 4:30 PM');
    });

    it('formats overdue today task', () => {
      const res = TaskService.formatDueDisplay('2026-09-10', '10:00', referenceDate);
      expect(res.isToday).toBe(true);
      expect(res.isOverdue).toBe(true);
      expect(res.label).toBe('Overdue today, 10:00 AM');
    });

    it('formats tomorrow task', () => {
      const res = TaskService.formatDueDisplay('2026-09-11', '11:00', referenceDate);
      expect(res.isUpcoming).toBe(true);
      expect(res.label).toBe('Tomorrow, 11:00 AM');
    });

    it('formats overdue past day task', () => {
      const res = TaskService.formatDueDisplay('2026-09-08', null, referenceDate);
      expect(res.isOverdue).toBe(true);
      expect(res.label).toContain('Overdue by 2 days');
    });
  });

  describe('formatReminderLabel', () => {
    it('formats standard reminder options', () => {
      expect(TaskService.formatReminderLabel(null)).toBe('No reminder');
      expect(TaskService.formatReminderLabel(0)).toBe('At time of event');
      expect(TaskService.formatReminderLabel(15)).toBe('15 minutes before');
      expect(TaskService.formatReminderLabel(60)).toBe('1 hour before');
      expect(TaskService.formatReminderLabel(1440)).toBe('1 day before');
    });
  });

  describe('category and priority configurations', () => {
    it('provides distinct colors and labels for categories', () => {
      const work = TaskService.getCategoryConfig('work');
      expect(work.label).toBe('Work');
      expect(work.color).toBeTruthy();

      const personal = TaskService.getCategoryConfig('personal');
      expect(personal.label).toBe('Personal');

      const celebration = TaskService.getCategoryConfig('celebration');
      expect(celebration.label).toBe('Celebration');
    });

    it('provides distinct colors and labels for priorities', () => {
      const urgent = TaskService.getPriorityConfig('urgent');
      expect(urgent.label).toBe('Urgent');
      expect(urgent.color).toBe('#EF4444');

      const low = TaskService.getPriorityConfig('low');
      expect(low.label).toBe('Low');
    });
  });
});

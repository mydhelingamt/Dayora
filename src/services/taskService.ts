import { TaskCategory, TaskPriority, TaskRepeatInterval } from '../repositories/types';
import { DateService } from './dateService';

export interface TaskDueStatus {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isUpcoming: boolean;
  relativeDays: number;
}

export interface CategoryDisplayInfo {
  label: string;
  color: string;
  bgColor: string;
}

export interface PriorityDisplayInfo {
  label: string;
  color: string;
  bgColor: string;
}

export class TaskService {
  /**
   * Formats a Date object to YYYY-MM-DD
   */
  public static toDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a Date object to HH:mm (24-hour)
   */
  public static toTimeString(d: Date): string {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Checks if a task is overdue given its due date and optional time.
   */
  public static isTaskOverdue(
    dueDate: string | null,
    dueTime?: string | null,
    referenceDate: Date = new Date()
  ): boolean {
    if (!dueDate) return false;

    const todayStr = this.toDateString(referenceDate);
    if (dueDate < todayStr) return true;

    if (dueDate === todayStr && dueTime) {
      const nowTimeStr = this.toTimeString(referenceDate);
      return dueTime < nowTimeStr;
    }

    return false;
  }

  /**
   * Checks if a task is scheduled for today.
   */
  public static isTaskToday(
    dueDate: string | null,
    referenceDate: Date = new Date()
  ): boolean {
    if (!dueDate) return false;
    const todayStr = this.toDateString(referenceDate);
    return dueDate === todayStr;
  }

  /**
   * Checks if a task is scheduled for the future.
   */
  public static isTaskUpcoming(
    dueDate: string | null,
    referenceDate: Date = new Date()
  ): boolean {
    if (!dueDate) return false;
    const todayStr = this.toDateString(referenceDate);
    return dueDate > todayStr;
  }

  /**
   * Calculates the difference in days between two calendar dates (YYYY-MM-DD).
   */
  public static getDayDifference(targetDate: string, referenceDate: Date = new Date()): number {
    const todayStr = this.toDateString(referenceDate);
    const targetParts = targetDate.split('-').map(Number);
    const refParts = todayStr.split('-').map(Number);

    const tY = targetParts[0] ?? 2026;
    const tM = targetParts[1] ?? 1;
    const tD = targetParts[2] ?? 1;

    const rY = refParts[0] ?? 2026;
    const rM = refParts[1] ?? 1;
    const rD = refParts[2] ?? 1;

    const targetUtc = Date.UTC(tY, tM - 1, tD);
    const refUtc = Date.UTC(rY, rM - 1, rD);

    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((targetUtc - refUtc) / msPerDay);
  }

  /**
   * Formats human-readable due date & time display with overdue status.
   */
  public static formatDueDisplay(
    dueDate: string | null,
    dueTime?: string | null,
    referenceDate: Date = new Date()
  ): TaskDueStatus {
    if (!dueDate) {
      return {
        label: 'No due date',
        isOverdue: false,
        isToday: false,
        isUpcoming: false,
        relativeDays: 0,
      };
    }

    const diff = this.getDayDifference(dueDate, referenceDate);
    const isOverdue = this.isTaskOverdue(dueDate, dueTime, referenceDate);
    const isToday = diff === 0;
    const isUpcoming = diff > 0;

    let timeFormatted = '';
    if (dueTime) {
      const timeParts = dueTime.split(':');
      const hStr = timeParts[0] ?? '0';
      const mStr = timeParts[1] ?? '00';
      const h = parseInt(hStr, 10);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHours = h % 12 === 0 ? 12 : h % 12;
      timeFormatted = `, ${displayHours}:${mStr} ${period}`;
    }

    let label = '';
    if (isToday) {
      label = isOverdue ? `Overdue today${timeFormatted}` : `Today${timeFormatted}`;
    } else if (diff === 1) {
      label = `Tomorrow${timeFormatted}`;
    } else if (diff === -1) {
      label = `Yesterday (Overdue)${timeFormatted}`;
    } else if (diff < -1) {
      label = `Overdue by ${Math.abs(diff)} days${timeFormatted}`;
    } else if (diff <= 7) {
      const parts = dueDate.split('-');
      const dY = Number(parts[0] ?? '2026');
      const dM = Number(parts[1] ?? '1') - 1;
      const dD = Number(parts[2] ?? '1');
      const d = new Date(dY, dM, dD);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[d.getDay()] ?? 'Today';
      label = `${dayName}${timeFormatted} (in ${diff}d)`;
    } else {
      const parts = dueDate.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = Number(parts[1] ?? '1') - 1;
      const mName = monthNames[monthIdx] ?? 'Jan';
      const dayNum = Number(parts[2] ?? '1');
      label = `${mName} ${dayNum}${timeFormatted}`;
    }

    return {
      label,
      isOverdue,
      isToday,
      isUpcoming,
      relativeDays: diff,
    };
  }

  /**
   * Calculates the exact next date for a recurring task.
   */
  public static getNextRecurringDate(
    currentDateStr: string,
    interval: TaskRepeatInterval
  ): string {
    if (interval === 'none') {
      return currentDateStr;
    }

    const parts = currentDateStr.split('-').map(Number);
    const y = parts[0] ?? 2026;
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    const current = new Date(y, m - 1, d);

    if (interval === 'daily') {
      current.setDate(current.getDate() + 1);
      return this.toDateString(current);
    }

    if (interval === 'weekly') {
      current.setDate(current.getDate() + 7);
      return this.toDateString(current);
    }

    if (interval === 'monthly') {
      let targetMonth = m; // Next month index (1-based is m+1, 0-based is m)
      let targetYear = y;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
      const daysInTargetMonth = DateService.getDaysInMonth(targetMonth + 1, targetYear);
      const targetDay = Math.min(d, daysInTargetMonth);
      const nextDate = new Date(targetYear, targetMonth, targetDay);
      return this.toDateString(nextDate);
    }

    if (interval === 'yearly') {
      const targetYear = y + 1;
      // Handle Feb 29 leap year
      let targetDay = d;
      if (m === 2 && d === 29 && !DateService.isLeapYear(targetYear)) {
        targetDay = 28;
      }
      const nextDate = new Date(targetYear, m - 1, targetDay);
      return this.toDateString(nextDate);
    }

    return currentDateStr;
  }

  /**
   * Returns human-readable label for reminder interval in minutes.
   */
  public static formatReminderLabel(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) {
      return 'No reminder';
    }
    if (minutes === 0) {
      return 'At time of event';
    }
    if (minutes === 15) {
      return '15 minutes before';
    }
    if (minutes === 30) {
      return '30 minutes before';
    }
    if (minutes === 60) {
      return '1 hour before';
    }
    if (minutes === 120) {
      return '2 hours before';
    }
    if (minutes === 1440) {
      return '1 day before';
    }
    return `${minutes} mins before`;
  }

  /**
   * Category display configuration (colors & labels)
   */
  public static getCategoryConfig(category?: TaskCategory): CategoryDisplayInfo {
    switch (category) {
      case 'work':
        return {
          label: 'Work',
          color: '#38BDF8', // Cyan
          bgColor: 'rgba(56, 189, 248, 0.15)',
        };
      case 'celebration':
        return {
          label: 'Celebration',
          color: '#FB7185', // Rose
          bgColor: 'rgba(251, 113, 133, 0.15)',
        };
      case 'shopping':
        return {
          label: 'Shopping',
          color: '#34D399', // Emerald
          bgColor: 'rgba(52, 211, 153, 0.15)',
        };
      case 'health':
        return {
          label: 'Health',
          color: '#FBBF24', // Amber
          bgColor: 'rgba(251, 191, 36, 0.15)',
        };
      case 'other':
        return {
          label: 'Other',
          color: '#94A3B8', // Slate
          bgColor: 'rgba(148, 163, 184, 0.15)',
        };
      case 'personal':
      default:
        return {
          label: 'Personal',
          color: '#818CF8', // Indigo
          bgColor: 'rgba(129, 140, 248, 0.15)',
        };
    }
  }

  /**
   * Priority display configuration (colors & labels)
   */
  public static getPriorityConfig(priority: TaskPriority): PriorityDisplayInfo {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.15)',
        };
      case 'high':
        return {
          label: 'High',
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.15)',
        };
      case 'medium':
        return {
          label: 'Medium',
          color: '#8B5CF6',
          bgColor: 'rgba(139, 92, 246, 0.15)',
        };
      case 'low':
      default:
        return {
          label: 'Low',
          color: '#64748B',
          bgColor: 'rgba(100, 116, 139, 0.15)',
        };
    }
  }
}

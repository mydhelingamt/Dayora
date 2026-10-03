export interface NotificationChannelConfig {
  id: string;
  name: string;
  description: string;
  importance: 'default' | 'high' | 'max';
  vibration: boolean;
}

export type NotificationType = 'birthday' | 'task' | 'user_birthday';
export type NotificationStatus = 'scheduled' | 'delivered' | 'cancelled';

export interface NotificationPayload {
  id: string;
  code: number;
  title: string;
  body: string;
  channelId: string;
  type: NotificationType;
  referenceId: string;
  triggerTimeMs: number;
  data?: Record<string, string>;
}

export interface ScheduledNotification {
  id: string;
  payload: NotificationPayload;
  triggerDate: Date;
}

export interface ScheduledNotificationEntity {
  id: string;
  notification_code: number;
  type: NotificationType;
  reference_id: string;
  title: string;
  body: string;
  channel_id: string;
  trigger_time_ms: number;
  trigger_date_str: string;
  payload_json: string | null;
  status: NotificationStatus;
  created_at: string;
  updated_at: string;
}

export interface CelebrationPayload {
  type: 'birthday' | 'user_birthday';
  referenceId?: string;
  name: string;
  turningAge?: number | null;
  relationship?: string;
  photoUri?: string | null;
  message?: string;
}

export interface NotificationClickEvent {
  type: string;
  referenceId: string;
  payloadJson?: string;
  code: number;
}

export interface ReconciliationStats {
  scheduledBirthdays: number;
  scheduledTasks: number;
  scheduledUserBirthday: boolean;
  cancelledOrphaned: number;
  cleanedExpired: number;
}

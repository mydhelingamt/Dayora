import { NativeModules, Platform } from 'react-native';
import { Logger } from '../services/loggerService';
import { NotificationClickEvent } from './types';

interface IDayoraNotificationNativeModule {
  createNotificationChannels(): Promise<boolean>;
  scheduleNotification(
    id: string,
    code: number,
    channelId: string,
    title: string,
    body: string,
    triggerTimeMs: number,
    type: string,
    referenceId: string,
    payloadJson: string
  ): Promise<boolean>;
  cancelNotification(code: number): Promise<boolean>;
  cancelAllNotifications(): Promise<boolean>;
  getInitialNotification(): Promise<NotificationClickEvent | null>;
  playBirthdayTune(): Promise<boolean>;
  stopBirthdayTune(): Promise<boolean>;
}

const NativeModuleInstance = NativeModules.DayoraNotificationModule as IDayoraNotificationNativeModule | undefined;

export const NativeBridge = {
  isAvailable(): boolean {
    return Platform.OS === 'android' && Boolean(NativeModuleInstance);
  },

  async createNotificationChannels(): Promise<boolean> {
    if (!this.isAvailable() || !NativeModuleInstance) {
      return true;
    }
    try {
      return await NativeModuleInstance.createNotificationChannels();
    } catch (error) {
      Logger.error('NativeBridge.createNotificationChannels failed', error);
      return false;
    }
  },

  async scheduleNotification(
    id: string,
    code: number,
    channelId: string,
    title: string,
    body: string,
    triggerTimeMs: number,
    type: string,
    referenceId: string,
    payloadJson: string
  ): Promise<boolean> {
    if (!this.isAvailable() || !NativeModuleInstance) {
      Logger.debug(`[Mock NativeBridge] Scheduled notification ${id} (code=${code}) at ${new Date(triggerTimeMs).toISOString()}`);
      return true;
    }
    try {
      return await NativeModuleInstance.scheduleNotification(
        id,
        code,
        channelId,
        title,
        body,
        triggerTimeMs,
        type,
        referenceId,
        payloadJson
      );
    } catch (error) {
      Logger.error(`NativeBridge.scheduleNotification failed for ${id}`, error);
      return false;
    }
  },

  async cancelNotification(code: number): Promise<boolean> {
    if (!this.isAvailable() || !NativeModuleInstance) {
      Logger.debug(`[Mock NativeBridge] Cancelled notification code=${code}`);
      return true;
    }
    try {
      return await NativeModuleInstance.cancelNotification(code);
    } catch (error) {
      Logger.error(`NativeBridge.cancelNotification failed for code=${code}`, error);
      return false;
    }
  },

  async cancelAllNotifications(): Promise<boolean> {
    if (!this.isAvailable() || !NativeModuleInstance) {
      return true;
    }
    try {
      return await NativeModuleInstance.cancelAllNotifications();
    } catch (error) {
      Logger.error('NativeBridge.cancelAllNotifications failed', error);
      return false;
    }
  },

  async getInitialNotification(): Promise<NotificationClickEvent | null> {
    if (!this.isAvailable() || !NativeModuleInstance) {
      return null;
    }
    try {
      return await NativeModuleInstance.getInitialNotification();
    } catch (error) {
      Logger.error('NativeBridge.getInitialNotification failed', error);
      return null;
    }
  },

  async playBirthdayTune(): Promise<boolean> {
    if (!this.isAvailable() || !NativeModuleInstance) {
      Logger.debug('[Mock NativeBridge] Playing birthday tune');
      return true;
    }
    try {
      return await NativeModuleInstance.playBirthdayTune();
    } catch (error) {
      Logger.error('NativeBridge.playBirthdayTune failed', error);
      return false;
    }
  },

  async stopBirthdayTune(): Promise<boolean> {
    if (!this.isAvailable() || !NativeModuleInstance) {
      Logger.debug('[Mock NativeBridge] Stopped birthday tune');
      return true;
    }
    try {
      return await NativeModuleInstance.stopBirthdayTune();
    } catch (error) {
      Logger.error('NativeBridge.stopBirthdayTune failed', error);
      return false;
    }
  },
};

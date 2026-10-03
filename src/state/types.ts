import { ThemeMode } from '../theme';
import { UserProfileEntity } from '../repositories/types';

export interface AppState {
  isReady: boolean;
  isProfileLoaded: boolean;
  isProfileCompleted: boolean;
  userProfile: UserProfileEntity | null;
  themePreference: ThemeMode;
  notificationsEnabled: boolean;
}

export type AppAction =
  | { type: 'SET_READY'; payload: boolean }
  | { type: 'SET_PROFILE_LOADED'; payload: boolean }
  | { type: 'SET_USER_PROFILE'; payload: UserProfileEntity | null }
  | { type: 'SET_PROFILE_COMPLETED'; payload: boolean }
  | { type: 'SET_THEME_PREFERENCE'; payload: ThemeMode }
  | { type: 'SET_NOTIFICATIONS_ENABLED'; payload: boolean };

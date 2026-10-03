import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import { AppState, AppAction } from './types';
import { databaseClient } from '../database';
import { UserRepository, SaveProfileInput } from '../repositories/userRepository';
import { UserProfileEntity } from '../repositories/types';
import { Logger } from '../services/loggerService';
import { ThemeMode } from '../theme';
import { notificationService } from '../notifications/notificationService';

const initialState: AppState = {
  isReady: false,
  isProfileLoaded: false,
  isProfileCompleted: false,
  userProfile: null,
  themePreference: 'system',
  notificationsEnabled: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_READY':
      return { ...state, isReady: action.payload };
    case 'SET_PROFILE_LOADED':
      return { ...state, isProfileLoaded: action.payload };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_PROFILE_COMPLETED':
      return { ...state, isProfileCompleted: action.payload };
    case 'SET_THEME_PREFERENCE':
      return { ...state, themePreference: action.payload };
    case 'SET_NOTIFICATIONS_ENABLED':
      return { ...state, notificationsEnabled: action.payload };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveProfile: (input: SaveProfileInput) => Promise<UserProfileEntity>;
  updateProfilePhoto: (photoUri: string | null, thumbnailUri?: string | null) => Promise<void>;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateNotifications: (enabled: boolean) => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const userRepo = useMemo(() => new UserRepository(databaseClient), []);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await userRepo.getProfile();
      const completed = await userRepo.isProfileCompleted();

      dispatch({ type: 'SET_USER_PROFILE', payload: profile });
      dispatch({ type: 'SET_PROFILE_COMPLETED', payload: completed });

      if (profile?.theme_preference) {
        dispatch({
          type: 'SET_THEME_PREFERENCE',
          payload: profile.theme_preference as ThemeMode,
        });
      }
      if (profile?.notifications_enabled !== undefined) {
        dispatch({
          type: 'SET_NOTIFICATIONS_ENABLED',
          payload: profile.notifications_enabled === 1,
        });
      }
    } catch (error) {
      Logger.error('Failed to load profile in AppProvider', error);
    } finally {
      dispatch({ type: 'SET_PROFILE_LOADED', payload: true });
    }
  }, [userRepo]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await databaseClient.initialize();
        if (isMounted) {
          await loadProfile();
        }
      } catch (error) {
        Logger.error('Database bootstrap error', error);
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_READY', payload: true });

          // Check and request notification permissions at startup
          setTimeout(async () => {
            try {
              const hasPermission = await notificationService.checkPermissions();
              if (!hasPermission) {
                const granted = await notificationService.requestPermissions();
                dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: granted });
              } else {
                dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: true });
              }
              // Reconcile notifications once permission state is settled
              await notificationService.reconcileNotifications();
            } catch (err) {
              Logger.error('Startup notification permission/reconciliation error', err);
            }
          }, 300);
        }
      }
    }

    bootstrap();

    // AppState change listener: When user returns from settings or background, check permission & reconcile
    const subscription = RNAppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        try {
          const hasPerm = await notificationService.checkPermissions();
          dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: hasPerm });
          if (hasPerm) {
            await notificationService.reconcileNotifications();
          }
        } catch (err) {
          Logger.error('AppState foreground notification check error', err);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [loadProfile]);


  const saveProfile = useCallback(
    async (input: SaveProfileInput): Promise<UserProfileEntity> => {
      const saved = await userRepo.saveProfile(input);
      dispatch({ type: 'SET_USER_PROFILE', payload: saved });
      dispatch({ type: 'SET_PROFILE_COMPLETED', payload: true });
      return saved;
    },
    [userRepo]
  );

  const updateProfilePhoto = useCallback(
    async (photoUri: string | null, thumbnailUri: string | null = null): Promise<void> => {
      await userRepo.updateProfilePhoto(photoUri, thumbnailUri);
      if (state.userProfile) {
        const updated: UserProfileEntity = {
          ...state.userProfile,
          photo_uri: photoUri,
          photo_thumbnail_uri: thumbnailUri,
          updated_at: new Date().toISOString(),
        };
        dispatch({ type: 'SET_USER_PROFILE', payload: updated });
      }
    },
    [userRepo, state.userProfile]
  );

  const updateTheme = useCallback(
    async (theme: ThemeMode): Promise<void> => {
      dispatch({ type: 'SET_THEME_PREFERENCE', payload: theme });
      await userRepo.updateThemePreference(theme);
    },
    [userRepo]
  );

  const updateNotifications = useCallback(
    async (enabled: boolean): Promise<void> => {
      dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: enabled });
      await userRepo.updateNotificationsEnabled(enabled);
    },
    [userRepo]
  );

  const reloadProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      saveProfile,
      updateProfilePhoto,
      updateTheme,
      updateNotifications,
      reloadProfile,
    }),
    [
      state,
      saveProfile,
      updateProfilePhoto,
      updateTheme,
      updateNotifications,
      reloadProfile,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import React, { useMemo, useEffect } from 'react';
import { View } from 'react-native';
import {
  NavigationContainer,
  Theme as NavTheme,
  DefaultTheme,
  DarkTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { RootStackParamList } from './types';
import { BirthdayDetailScreen } from '../screens/birthdays/BirthdayDetailScreen';
import { AddEditBirthdayScreen } from '../screens/birthdays/AddEditBirthdayScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { AddEditTaskScreen } from '../screens/tasks/AddEditTaskScreen';
import { BirthdayCelebrationScreen } from '../screens/celebration/BirthdayCelebrationScreen';
import { UserBirthdayCelebrationScreen } from '../screens/celebration/UserBirthdayCelebrationScreen';
import { ProfileSetupScreen } from '../screens/profile/ProfileSetupScreen';
import { useTheme } from '../theme';
import { useApp } from '../state';
import { notificationService } from '../notifications/notificationService';
import { Logger } from '../services/loggerService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { state } = useApp();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  const navigationTheme: NavTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
      },
    };
  }, [theme, isDark]);

  useEffect(() => {
    function handleNotificationRouting(event: any) {
      if (!navigationRef.isReady()) return;

      const type = event.type || event.notification_type;
      let payload: any = {};
      try {
        payload = typeof event.payloadJson === 'string' ? JSON.parse(event.payloadJson) : event;
      } catch {
        payload = {};
      }

      if (type === 'birthday') {
        navigationRef.navigate('BirthdayCelebration', {
          birthdayId: event.referenceId || payload.referenceId,
          name: payload.name || 'Friend',
          turningAge: payload.turningAge ?? null,
          relationship: payload.relationship || 'Friend',
          photoUri: payload.photoUri ?? null,
          message: payload.message,
        });
      } else if (type === 'user_birthday') {
        navigationRef.navigate('UserBirthdayCelebration', {
          name: payload.name || state.userProfile?.name || 'You',
          age: payload.turningAge ?? null,
          photoUri: payload.photoUri || (state.userProfile?.photo_uri ?? null),
        });
      } else if (type === 'task') {
        const taskId = event.referenceId || payload.referenceId || payload.taskId;
        if (taskId) {
          navigationRef.navigate('TaskDetail', { taskId });
        }
      }
    }

    async function checkInitialNotification() {
      try {
        const initial = await notificationService.getInitialNotification();
        if (initial) {
          handleNotificationRouting(initial);
        }
      } catch (err) {
        Logger.error('Error handling initial notification', err);
      }
    }

    async function checkStartupNotificationPermission() {
      try {
        const hasPermission = await notificationService.checkPermissions();
        if (!hasPermission) {
          await notificationService.requestPermissions();
        }
      } catch (err) {
        Logger.error('Error checking startup notification permission', err);
      }
    }

    const removeListener = notificationService.addNotificationClickListener((event) => {
      handleNotificationRouting(event);
    });

    const timer = setTimeout(checkInitialNotification, 500);
    checkStartupNotificationPermission();

    return () => {
      clearTimeout(timer);
      removeListener();
    };
  }, [navigationRef, state.userProfile]);

  // Wait for SQLite database to bootstrap and user profile to be queried
  if (!state.isReady || !state.isProfileLoaded) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  // First launch check: Profile Setup -> Home
  if (!state.isProfileCompleted) {
    return <ProfileSetupScreen onComplete={() => {}} />;
  }

  // Subsequent launches: Splash -> Home
  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="BirthdayDetail" component={BirthdayDetailScreen} />
        <Stack.Screen
          name="AddEditBirthday"
          component={AddEditBirthdayScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        <Stack.Screen
          name="AddEditTask"
          component={AddEditTaskScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="BirthdayCelebration"
          component={BirthdayCelebrationScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="UserBirthdayCelebration"
          component={UserBirthdayCelebrationScreen}
          options={{
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

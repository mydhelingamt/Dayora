import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootTabParamList } from './types';
import { HomeScreen, BirthdaysScreen, TasksScreen, ProfileScreen } from '../screens';
import { HomeIcon, BirthdayIcon, TasksIcon, ProfileIcon } from '../assets';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const HomeTabIcon = ({ focused, color, size }: TabBarIconProps): React.JSX.Element => (
  <View style={styles.iconContainer}>
    <HomeIcon color={color} size={size} focused={focused} />
    {focused ? <View style={[styles.activeDot, { backgroundColor: color }]} /> : null}
  </View>
);

const BirthdayTabIcon = ({ focused, color, size }: TabBarIconProps): React.JSX.Element => (
  <View style={styles.iconContainer}>
    <BirthdayIcon color={color} size={size} focused={focused} />
    {focused ? <View style={[styles.activeDot, { backgroundColor: color }]} /> : null}
  </View>
);

const TasksTabIcon = ({ focused, color, size }: TabBarIconProps): React.JSX.Element => (
  <View style={styles.iconContainer}>
    <TasksIcon color={color} size={size} focused={focused} />
    {focused ? <View style={[styles.activeDot, { backgroundColor: color }]} /> : null}
  </View>
);

const ProfileTabIcon = ({ focused, color, size }: TabBarIconProps): React.JSX.Element => (
  <View style={styles.iconContainer}>
    <ProfileIcon color={color} size={size} focused={focused} />
    {focused ? <View style={[styles.activeDot, { backgroundColor: color }]} /> : null}
  </View>
);

export const BottomTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const screenOptions = useMemo(() => {
    const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12);
    const tabBarHeight = 58 + bottomPadding;

    return {
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primaryLight,
      tabBarInactiveTintColor: theme.colors.textMuted,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        height: tabBarHeight,
        paddingBottom: bottomPadding,
        paddingTop: 8,
        elevation: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      tabBarAllowFontScaling: false,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600' as const,
        marginTop: 2,
      },
      tabBarItemStyle: {
        minHeight: 48,
      },
    };
  }, [theme, insets.bottom]);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="Birthdays"
        component={BirthdaysScreen}
        options={{
          tabBarLabel: 'Birthdays',
          tabBarIcon: BirthdayTabIcon,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: TasksTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: -6,
  },
});

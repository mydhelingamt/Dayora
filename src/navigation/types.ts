import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import { BirthdayEntity, TaskEntity } from '../repositories/types';

export type RootTabParamList = {
  Home: undefined;
  Birthdays: undefined;
  Tasks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  BirthdayDetail: { birthdayId: string };
  AddEditBirthday: { birthdayId?: string; initialData?: Partial<BirthdayEntity> };
  TaskDetail: { taskId: string };
  AddEditTask: { taskId?: string; initialData?: Partial<TaskEntity> };
  BirthdayCelebration: {
    birthdayId?: string;
    name: string;
    turningAge?: number | null;
    relationship?: string;
    photoUri?: string | null;
    message?: string;
  };
  UserBirthdayCelebration: {
    name?: string;
    age?: number | null;
    photoUri?: string | null;
  };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type HomeTabScreenProps<T extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

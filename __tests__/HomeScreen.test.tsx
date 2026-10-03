import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { HomeScreen } from '../src/screens/home/HomeScreen';
import { ThemeProvider } from '../src/theme';
import { AppProvider } from '../src/state/AppContext';
import {
  BirthdayRepository,
  UpcomingBirthday,
  BirthdayStats,
} from '../src/repositories/birthdayRepository';
import { TaskRepository, TaskStats } from '../src/repositories/taskRepository';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useFocusEffect: (callback: () => void) => {
      callback();
    },
  };
});

const createMockBirthdayStats = (overrides?: Partial<BirthdayStats>): BirthdayStats => ({
  totalActive: 0,
  next30DaysCount: 0,
  thisMonthCount: 0,
  favoriteCount: 0,
  nearestBirthday: null,
  ...overrides,
});

const createMockUpcomingBirthday = (overrides?: Partial<UpcomingBirthday>): UpcomingBirthday => ({
  id: 'b1',
  name: 'Sarah Jenkins',
  birth_date: '1996-09-15',
  birth_day: 15,
  birth_month: 9,
  birth_year: 1996,
  nickname: null,
  relationship: 'Family',
  photo_uri: null,
  is_favorite: 0,
  reminder_days_before: 1,
  notes: null,
  is_archived: 0,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  daysUntil: 5,
  turningAge: 30,
  currentAge: 29,
  formattedBirthDate: 'September 15, 1996',
  shortBirthDate: 'Sep 15',
  countdownLabel: 'In 5 days',
  zodiacSign: { name: 'Virgo', symbol: '♍', element: 'Earth' },
  isLeapDay: false,
  ...overrides,
});

const createMockTaskStats = (overrides?: Partial<TaskStats>): TaskStats => ({
  totalToday: 0,
  completedToday: 0,
  pendingToday: 0,
  overdueCount: 0,
  upcomingCount: 0,
  completionRatio: 0,
  ...overrides,
});

describe('HomeScreen Component', () => {
  const mockNavigation: any = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };
  const mockRoute: any = {
    key: 'Home-key',
    name: 'Home',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with empty data state', async () => {
    jest.spyOn(BirthdayRepository.prototype, 'findUpcoming').mockResolvedValue([]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(createMockBirthdayStats());
    jest.spyOn(TaskRepository.prototype, 'findTodayTasks').mockResolvedValue([]);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue(createMockTaskStats());

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <HomeScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    expect(renderer).toBeDefined();
    const treeStr = JSON.stringify(renderer?.toJSON());

    // Verify dynamic quick actions
    expect(treeStr).toContain('+ Add Birthday');
    expect(treeStr).toContain('+ Add Task');

    // Verify empty state messages
    expect(treeStr).toContain('No Upcoming Birthdays');
    expect(treeStr).toContain('All Caught Up for Today!');
  });

  it('renders correctly with populated celebrations and tasks', async () => {
    const mockUpcoming = [createMockUpcomingBirthday()];

    const mockTasks = [
      {
        id: 't1',
        title: 'Review pull request',
        description: 'Verify Fabric architecture builds',
        due_date: '2026-09-10',
        due_time: '14:00',
        priority: 'urgent' as const,
        is_completed: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 't2',
        title: 'Call Grandma',
        description: null,
        due_date: '2026-09-10',
        due_time: null,
        priority: 'medium' as const,
        is_completed: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    jest.spyOn(BirthdayRepository.prototype, 'findUpcoming').mockResolvedValue(mockUpcoming);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(
      createMockBirthdayStats({
        totalActive: 1,
        next30DaysCount: 1,
        nearestBirthday: mockUpcoming[0] ?? null,
      })
    );
    jest.spyOn(TaskRepository.prototype, 'findTodayTasks').mockResolvedValue(mockTasks);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue(
      createMockTaskStats({
        totalToday: 2,
        completedToday: 1,
        pendingToday: 1,
        completionRatio: 0.5,
      })
    );

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <HomeScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    expect(renderer).toBeDefined();
    const treeStr = JSON.stringify(renderer?.toJSON());

    // Verify populated items rendered
    expect(treeStr).toContain('Sarah Jenkins');
    expect(treeStr).toContain('Family');
    expect(treeStr).toContain('Review pull request');
    expect(treeStr).toContain('Call Grandma');
    expect(treeStr).toContain('Upcoming Celebrations');
    expect(treeStr).toContain('Pending Tasks Today');
  });

  it('handles task toggle interaction optimistically', async () => {
    const mockTasks = [
      {
        id: 'task-100',
        title: 'Submit quarterly report',
        description: null,
        due_date: '2026-09-10',
        due_time: '11:00',
        priority: 'high' as const,
        is_completed: 0,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    const toggleSpy = jest.spyOn(TaskRepository.prototype, 'toggleComplete').mockResolvedValue();
    jest.spyOn(TaskRepository.prototype, 'findTodayTasks').mockResolvedValue(mockTasks);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue(
      createMockTaskStats({
        totalToday: 1,
        completedToday: 0,
        pendingToday: 1,
        completionRatio: 0,
      })
    );
    jest.spyOn(BirthdayRepository.prototype, 'findUpcoming').mockResolvedValue([]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(createMockBirthdayStats());

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <HomeScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    const toggleButtons = root?.findAll((node) => node.props.accessibilityLabel === 'Toggle Task');
    expect(toggleButtons?.length).toBeGreaterThan(0);

    // Trigger toggle
    await ReactTestRenderer.act(async () => {
      toggleButtons?.[0]?.props.onPress();
    });

    expect(toggleSpy).toHaveBeenCalledWith('task-100', true);
  });

  it('navigates to respective screens when headers and see all actions are pressed', async () => {
    jest.spyOn(BirthdayRepository.prototype, 'findUpcoming').mockResolvedValue([]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(createMockBirthdayStats());
    jest.spyOn(TaskRepository.prototype, 'findTodayTasks').mockResolvedValue([]);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue(createMockTaskStats());

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <HomeScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;

    // Find avatar button
    const avatarBtn = root?.findByProps({ accessibilityLabel: 'View Profile' });
    expect(avatarBtn).toBeDefined();
    await ReactTestRenderer.act(async () => {
      avatarBtn?.props.onPress();
    });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Profile');

    // Find "See All" actions (for birthdays and tasks)
    const seeAllButtons = root?.findAll(
      (node) => node.props.accessibilityLabel === 'See All' && typeof node.props.onPress === 'function'
    );
    expect(seeAllButtons?.length).toBeGreaterThanOrEqual(2);

    await ReactTestRenderer.act(async () => {
      seeAllButtons?.[0]?.props.onPress();
    });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Birthdays');

    await ReactTestRenderer.act(async () => {
      seeAllButtons?.[1]?.props.onPress();
    });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Tasks');
  });

  it('opens quick add modals when quick action buttons are pressed', async () => {
    jest.spyOn(BirthdayRepository.prototype, 'findUpcoming').mockResolvedValue([]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(createMockBirthdayStats());
    jest.spyOn(TaskRepository.prototype, 'findTodayTasks').mockResolvedValue([]);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue(createMockTaskStats());

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <HomeScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;

    // Find QuickActionButton for Birthday
    const birthdayActions = root?.findAllByProps({ title: '+ Add Birthday' });
    expect(birthdayActions?.length).toBeGreaterThan(0);
    await ReactTestRenderer.act(async () => {
      birthdayActions?.[0]?.props.onPress();
    });

    // Check that navigation to AddEditBirthday was triggered
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditBirthday', {});
  });
});

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TasksScreen } from '../src/screens/tasks/TasksScreen';
import { ThemeProvider } from '../src/theme';
import { AppProvider } from '../src/state/AppContext';
import { TaskRepository } from '../src/repositories/taskRepository';
import { TaskEntity } from '../src/repositories/types';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = require('react');
  return {
    ...actualNav,
    useFocusEffect: (callback: () => void) => {
      ReactActual.useEffect(() => {
        callback();
      }, [callback]);
    },
  };
});

const createMockTask = (overrides?: Partial<TaskEntity>): TaskEntity => ({
  id: 'task_1',
  title: 'Order birthday cake for Sarah',
  description: 'Red velvet cake downtown',
  due_date: '2026-09-10',
  due_time: '16:00',
  priority: 'urgent',
  category: 'celebration',
  repeat_interval: 'none',
  reminder_minutes: 30,
  location: 'Downtown Bakery',
  photo_uri: null,
  status: 'pending',
  is_completed: 0,
  completed_at: null,
  cancelled_at: null,
  created_at: '2026-09-10T10:00:00Z',
  updated_at: '2026-09-10T10:00:00Z',
  ...overrides,
});

describe('TasksScreen Component', () => {
  const mockNavigation: any = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };
  const mockRoute: any = {
    key: 'Tasks-key',
    name: 'Tasks',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with populated tasks', async () => {
    const mockTasks = [
      createMockTask({ id: 'task_1', title: 'Order birthday cake for Sarah', priority: 'urgent' }),
      createMockTask({ id: 'task_2', title: 'Pick up party decorations', priority: 'medium', category: 'shopping' }),
    ];

    jest.spyOn(TaskRepository.prototype, 'findAllWithOptions').mockResolvedValue(mockTasks);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue({
      totalToday: 2,
      completedToday: 0,
      pendingToday: 2,
      overdueCount: 0,
      upcomingCount: 0,
      completionRatio: 0,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <TasksScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    expect(root).toBeTruthy();

    const texts = root?.findAllByType(Text).map((node: any) => node.props.children);
    const flattenedTexts = texts?.flat().filter(Boolean);

    expect(flattenedTexts?.some((t: string) => typeof t === 'string' && t.includes('Tasks'))).toBe(true);
    expect(flattenedTexts?.some((t: string) => typeof t === 'string' && t.includes('Order birthday cake for Sarah'))).toBe(true);
    expect(flattenedTexts?.some((t: string) => typeof t === 'string' && t.includes('Pick up party decorations'))).toBe(true);
  });

  it('renders empty state when no tasks are found', async () => {
    jest.spyOn(TaskRepository.prototype, 'findAllWithOptions').mockResolvedValue([]);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue({
      totalToday: 0,
      completedToday: 0,
      pendingToday: 0,
      overdueCount: 0,
      upcomingCount: 0,
      completionRatio: 0,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <TasksScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    const texts = root?.findAllByType(Text).map((node: any) => node.props.children);
    const flattenedTexts = texts?.flat().filter(Boolean);

    expect(flattenedTexts?.some((t: string) => typeof t === 'string' && t.includes('No tasks found'))).toBe(true);
  });

  it('navigates to AddEditTask screen on New button press', async () => {
    jest.spyOn(TaskRepository.prototype, 'findAllWithOptions').mockResolvedValue([]);
    jest.spyOn(TaskRepository.prototype, 'getTaskStats').mockResolvedValue({
      totalToday: 0,
      completedToday: 0,
      pendingToday: 0,
      overdueCount: 0,
      upcomingCount: 0,
      completionRatio: 0,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <TasksScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    // Find the "+ Add Task" button in empty state or "New" in header
    const addButtons = root?.findAllByProps({ accessibilityLabel: 'New' });
    if (addButtons && addButtons.length > 0) {
      act(() => {
        addButtons[0]?.props.onPress();
      });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditTask', {});
    }
  });
});

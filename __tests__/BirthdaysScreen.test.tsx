import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { BirthdaysScreen } from '../src/screens/birthdays/BirthdaysScreen';
import { ThemeProvider } from '../src/theme';
import { AppProvider } from '../src/state/AppContext';
import {
  BirthdayRepository,
  UpcomingBirthday,
  BirthdayStats,
} from '../src/repositories/birthdayRepository';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useFocusEffect: (callback: () => void) => {
      callback();
    },
  };
});

const createMockBirthday = (overrides?: Partial<UpcomingBirthday>): UpcomingBirthday => ({
  id: 'b1',
  name: 'Sarah Jenkins',
  birth_date: '1996-09-15',
  birth_day: 15,
  birth_month: 9,
  birth_year: 1996,
  nickname: 'Sari',
  relationship: 'Family',
  photo_uri: null,
  is_favorite: 0,
  reminder_days_before: 1,
  notes: 'Loves photography',
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

const createMockStats = (overrides?: Partial<BirthdayStats>): BirthdayStats => ({
  totalActive: 1,
  next30DaysCount: 1,
  thisMonthCount: 1,
  favoriteCount: 0,
  nearestBirthday: createMockBirthday(),
  ...overrides,
});

describe('BirthdaysScreen Component', () => {
  const mockNavigation: any = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };
  const mockRoute: any = {
    key: 'Birthdays-key',
    name: 'Birthdays',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with populated birthdays and hero spotlight card', async () => {
    const mockItems = [
      createMockBirthday({ id: 'b1', name: 'Sarah Jenkins', birth_year: 1996, turningAge: 30 }),
      createMockBirthday({
        id: 'b2',
        name: 'Alex Taylor',
        birth_year: null,
        turningAge: null,
        currentAge: null,
        formattedBirthDate: 'October 4',
        shortBirthDate: 'Oct 4',
        daysUntil: 24,
        countdownLabel: 'In 24 days',
      }),
    ];

    jest.spyOn(BirthdayRepository.prototype, 'findAllWithOptions').mockResolvedValue(mockItems);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(
      createMockStats({
        totalActive: 2,
        next30DaysCount: 2,
        nearestBirthday: mockItems[0] ?? null,
      })
    );

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <BirthdaysScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    expect(renderer).toBeDefined();
    const root = renderer?.root;
    const allTextNodes = root?.findAll((node) => typeof node.props.children === 'string' || Array.isArray(node.props.children));
    const allText = allTextNodes?.map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children)).join(' ') || '';

    // Verify header and filter options
    expect(allText).toContain('Birthdays');
    expect(allText).toContain('All (2)');
    expect(allText).toContain('Next 30 Days (2)');

    // Verify Sarah Jenkins rendered with age
    expect(allText).toContain('Sarah Jenkins');
    expect(allText).toContain('Turning 30');

    // Verify Alex Taylor rendered WITHOUT turning age (year omitted)
    expect(allText).toContain('Alex Taylor');
    expect(allText).not.toContain('Alex Taylor • Turning');
  });

  it('renders empty state when no birthdays are found', async () => {
    jest.spyOn(BirthdayRepository.prototype, 'findAllWithOptions').mockResolvedValue([]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue({
      totalActive: 0,
      next30DaysCount: 0,
      thisMonthCount: 0,
      favoriteCount: 0,
      nearestBirthday: null,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <BirthdaysScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    const emptyTitle = root?.findByProps({ children: 'No Birthdays Added Yet' });
    expect(emptyTitle).toBeDefined();
  });

  it('toggles favorite on birthday item press', async () => {
    const mockItem = createMockBirthday({ id: 'b1', is_favorite: 0 });
    const toggleSpy = jest.spyOn(BirthdayRepository.prototype, 'toggleFavorite').mockResolvedValue();

    jest.spyOn(BirthdayRepository.prototype, 'findAllWithOptions').mockResolvedValue([mockItem]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(createMockStats());

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <BirthdaysScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    const favButton = root?.findByProps({ accessibilityLabel: 'Favorite' });
    expect(favButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      favButton?.props.onPress();
    });

    expect(toggleSpy).toHaveBeenCalledWith('b1', true);
  });

  it('navigates to BirthdayDetail when a birthday card is tapped', async () => {
    const mockItem = createMockBirthday({ id: 'target-birthday-id' });

    jest.spyOn(BirthdayRepository.prototype, 'findAllWithOptions').mockResolvedValue([mockItem]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue(createMockStats({
      nearestBirthday: mockItem,
    }));

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <BirthdaysScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    const birthdayCard = root?.findByProps({ accessibilityLabel: `Birthday item ${mockItem.name}` });
    expect(birthdayCard).toBeDefined();

    // Tap card
    await ReactTestRenderer.act(async () => {
      birthdayCard?.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('BirthdayDetail', { birthdayId: 'target-birthday-id' });
  });

  it('navigates to AddEditBirthday when "+ Add" header button is pressed', async () => {
    jest.spyOn(BirthdayRepository.prototype, 'findAllWithOptions').mockResolvedValue([]);
    jest.spyOn(BirthdayRepository.prototype, 'getBirthdayStats').mockResolvedValue({
      totalActive: 0,
      next30DaysCount: 0,
      thisMonthCount: 0,
      favoriteCount: 0,
      nearestBirthday: null,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <AppProvider>
            <BirthdaysScreen navigation={mockNavigation} route={mockRoute} />
          </AppProvider>
        </ThemeProvider>
      );
    });

    const root = renderer?.root;
    const addBtn = root?.findByProps({ title: 'Add' });
    expect(addBtn).toBeDefined();

    await ReactTestRenderer.act(async () => {
      addBtn?.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditBirthday', {});
  });
});

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { UserBirthdayCelebrationScreen } from '../src/screens/celebration/UserBirthdayCelebrationScreen';
import { ThemeProvider } from '../src/theme';
import { AppButton } from '../src/components';
import { notificationService } from '../src/notifications/notificationService';

jest.mock('../src/notifications/notificationService', () => ({
  notificationService: {
    playBirthdayTune: jest.fn(async () => true),
    stopBirthdayTune: jest.fn(async () => true),
    isBirthdayTunePlaying: jest.fn(async () => false),
  },
}));

describe('UserBirthdayCelebrationScreen', () => {
  const mockGoBack = jest.fn();
  const mockNavigation = {
    goBack: mockGoBack,
    navigate: jest.fn(),
  };

  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (renderer) {
      act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
    act(() => {
      jest.clearAllTimers();
    });
    jest.useRealTimers();
  });

  it('renders countdown sequence stage initially', () => {
    const route = {
      params: {
        name: 'Mydhelingam',
        age: 30,
      },
    };

    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <UserBirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    const jsonStr = JSON.stringify(renderer!.toJSON());
    expect(jsonStr).toContain('Get ready for your special Dayora celebration');
    expect(jsonStr).toContain('Skip');
  });

  it('transitions to full celebration stage when Skip is pressed and plays music', async () => {
    const route = {
      params: {
        name: 'Mydhelingam',
        age: 30,
      },
    };

    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <UserBirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    const buttons = renderer!.root.findAllByType(AppButton);
    const skipBtn = buttons.find((b) => b.props.title === 'Skip');
    expect(skipBtn).toBeDefined();

    await act(async () => {
      skipBtn?.props.onPress();
    });

    expect(notificationService.playBirthdayTune).toHaveBeenCalled();

    const jsonStr = JSON.stringify(renderer!.toJSON());
    expect(jsonStr).toContain('Happy Birthday, Mydhelingam!');
    expect(jsonStr).toContain('Cheers to turning 30');
    expect(jsonStr).toContain('Tap the cake to blow out your candles');
  });

  it('blows out candles when cake is tapped and displays wish granted', async () => {
    const route = {
      params: {
        name: 'Alex',
        age: null, // age omitted/unknown
      },
    };

    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <UserBirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    // Skip countdown
    const skipBtn = renderer!.root.findAllByType(AppButton).find((b) => b.props.title === 'Skip');
    await act(async () => {
      skipBtn?.props.onPress();
    });

    // Verify age is not displayed when null
    const jsonBeforeBlowout = JSON.stringify(renderer!.toJSON());
    expect(jsonBeforeBlowout).toContain('Here is to another spectacular year of life and joy');
    expect(jsonBeforeBlowout).not.toContain('Cheers to turning');

    // Find interactive cake Pressable
    const cakePressable = renderer!.root.findByProps({
      accessibilityLabel: 'Birthday Cake. Tap to blow out candles.',
    });
    expect(cakePressable).toBeDefined();

    // Tap cake to blow out candles
    await act(async () => {
      cakePressable.props.onPress();
      jest.advanceTimersByTime(600);
    });

    const jsonAfterBlowout = JSON.stringify(renderer!.toJSON());
    expect(jsonAfterBlowout).toContain('Wish Granted!');
    expect(jsonAfterBlowout).toContain('May all your dreams blossom into reality');
  });

  it('stops music and navigates back when Continue button is pressed', async () => {
    const route = {
      params: {
        name: 'Mydhelingam',
      },
    };

    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <UserBirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    // Skip countdown
    const skipBtn = renderer!.root.findAllByType(AppButton).find((b) => b.props.title === 'Skip');
    await act(async () => {
      skipBtn?.props.onPress();
    });

    const continueBtn = renderer!.root
      .findAllByType(AppButton)
      .find((b) => b.props.title?.includes('Continue to Dayora'));
    expect(continueBtn).toBeDefined();

    await act(async () => {
      continueBtn?.props.onPress();
    });

    expect(notificationService.stopBirthdayTune).toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalled();
  });
});

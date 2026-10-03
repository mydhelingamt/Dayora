import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Share } from 'react-native';
import { BirthdayCelebrationScreen } from '../src/screens/celebration/BirthdayCelebrationScreen';
import { ThemeProvider } from '../src/theme';
import { AppButton } from '../src/components';

describe('BirthdayCelebrationScreen', () => {
  const mockGoBack = jest.fn();
  const mockNavigation = {
    goBack: mockGoBack,
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockImplementation(async () => ({ action: 'sharedAction', activityType: undefined }));
  });

  it('renders friend birthday celebration with milestone age badge', () => {
    const route = {
      params: {
        birthdayId: 'b-1',
        name: 'Elena Rostova',
        turningAge: 25,
        relationship: 'Best Friend',
        photoUri: null,
        message: 'Wishing Elena the happiest birthday ever!',
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <BirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    const root = renderer!.root;
    const jsonStr = JSON.stringify(renderer!.toJSON());

    expect(jsonStr).toContain('Elena Rostova');
    expect(jsonStr).toContain('BEST FRIEND');
    expect(jsonStr).toContain('CELEBRATING THEIR 25TH BIRTHDAY');
    expect(jsonStr).toContain('Wishing Elena the happiest birthday ever!');
    expect(root).toBeDefined();
  });

  it('suppresses age when turningAge is null', () => {
    const route = {
      params: {
        birthdayId: 'b-2',
        name: 'Marcus Vance',
        turningAge: null,
        relationship: 'Colleague',
        photoUri: null,
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <BirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    const jsonStr = JSON.stringify(renderer!.toJSON());
    expect(jsonStr).toContain('Marcus Vance');
    expect(jsonStr).toContain('COLLEAGUE');
    expect(jsonStr).toContain('TODAY IS THEIR SPECIAL DAY');
    expect(jsonStr).not.toContain('CELEBRATING THEIR');
  });

  it('handles Send Wishes button press with native Share intent', async () => {
    const route = {
      params: {
        birthdayId: 'b-3',
        name: 'Chloe',
        turningAge: 21,
        relationship: 'Sister',
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <BirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    const buttons = renderer!.root.findAllByType(AppButton);
    const sendWishesBtn = buttons.find((b) => b.props.title?.includes('Send Wishes'));
    expect(sendWishesBtn).toBeDefined();

    await act(async () => {
      sendWishesBtn?.props.onPress();
    });

    expect(Share.share).toHaveBeenCalledWith({
      title: 'Happy Birthday Chloe!',
      message: expect.stringContaining('Happy 21st Birthday, Chloe!'),
    });
  });

  it('navigates back when Done is pressed', () => {
    const route = {
      params: {
        birthdayId: 'b-4',
        name: 'Oliver',
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <BirthdayCelebrationScreen navigation={mockNavigation} route={route} />
        </ThemeProvider>
      );
    });

    const buttons = renderer!.root.findAllByType(AppButton);
    const doneBtn = buttons.find((b) => b.props.title === 'Done');
    expect(doneBtn).toBeDefined();

    act(() => {
      doneBtn?.props.onPress();
    });

    expect(mockGoBack).toHaveBeenCalled();
  });
});

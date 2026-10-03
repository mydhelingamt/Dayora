/* eslint-env jest */
// Include mock for react-native-safe-area-context
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Mock op-sqlite
jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => ({
    execute: jest.fn(async () => ({ rowsAffected: 0, rows: [] })),
    executeBatch: jest.fn(async () => {}),
    close: jest.fn(async () => {}),
  })),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({
    didCancel: false,
    assets: [
      {
        uri: 'file:///mock/avatar.jpg',
        width: 512,
        height: 512,
        fileSize: 50000,
        type: 'image/jpeg',
      },
    ],
  })),
  launchCamera: jest.fn(async () => ({
    didCancel: false,
    assets: [
      {
        uri: 'file:///mock/camera.jpg',
        width: 512,
        height: 512,
        fileSize: 50000,
        type: 'image/jpeg',
      },
    ],
  })),
}));

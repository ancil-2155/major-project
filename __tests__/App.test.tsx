/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/navigation/AppNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text>AppNavigator</Text>;
});

jest.mock('../src/services/notifications/fcmService', () => ({
  requestNotificationPermission: jest.fn(async () => false),
  setupFCMToken: jest.fn(async () => undefined),
  initializeNotifee: jest.fn(async () => undefined),
  setupForegroundHandler: jest.fn(() => jest.fn()),
  setupBackgroundHandler: jest.fn(),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });
});

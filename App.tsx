import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationService from './src/services/NotificationService';

NotificationService.setupBackgroundHandler();

const App = () => {
  useEffect(() => {
    NotificationService.requestUserPermission();
    const unsubscribeTokenRefresh = NotificationService.setupTokenRefreshListener();
    const unsubscribeForeground = NotificationService.setupForegroundHandler();

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
    };
  }, []);

  return <AppNavigator />;
};

export default App;
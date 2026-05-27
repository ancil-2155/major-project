import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AppThemeProvider } from './src/theme/appTheme';
import { LanguageProvider } from './src/context/LanguageContext';
import { 
  requestNotificationPermission, 
  setupFCMToken, 
  initializeNotifee, 
  setupForegroundHandler, 
  setupBackgroundHandler 
} from './src/services/notifications/fcmService';

setupBackgroundHandler();

const App = () => {
  useEffect(() => {
    const initNotifications = async () => {
      await initializeNotifee();
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await setupFCMToken();
      }
    };
    
    initNotifications();
    const unsubscribeForeground = setupForegroundHandler();

    return () => {
      unsubscribeForeground();
    };
  }, []);

  return (
    <LanguageProvider>
      <AppThemeProvider>
        <AppNavigator />
      </AppThemeProvider>
    </LanguageProvider>
  );
};

export default App;

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Notification permission denied');
      return false;
    }
  }
  
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
  return enabled;
};

export const setupFCMToken = async () => {
  const user = auth().currentUser;
  if (!user) return;
  
  try {
    const token = await messaging().getToken();
    if (token) {
      await firestore().collection('users').doc(user.uid).update({
        fcmToken: token,
      });
    }
    
    messaging().onTokenRefresh(async (newToken) => {
      await firestore().collection('users').doc(user.uid).update({
        fcmToken: newToken,
      });
    });
  } catch (error) {
    console.error('Failed to get FCM token', error);
  }
};

export const initializeNotifee = async () => {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
};

export const displayLocalNotification = async (title: string, body: string, data?: any) => {
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: 'default',
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const setupForegroundHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('FCM Message arrived in foreground:', remoteMessage);
    const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'New Notification';
    const body = remoteMessage.notification?.body || remoteMessage.data?.body || '';
    
    await displayLocalNotification(title, body, remoteMessage.data);
  });
};

export const setupBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('FCM Message arrived in background:', remoteMessage);
    // Background messages are automatically displayed by the system tray if they contain a notification payload
  });
};

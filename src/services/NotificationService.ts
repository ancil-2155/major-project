import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
  requestPermission as firebaseRequestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';

class NotificationService {
  private get messaging() {
    return getMessaging(getApp());
  }

  async requestUserPermission() {
    try {
      const authStatus = await firebaseRequestPermission(this.messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted, status:', authStatus);
        this.getFCMToken();
      }
    } catch (error) {
      console.log('Error requesting notification permission:', error);
    }
  }

  async getFCMToken() {
    try {
      const token = await getToken(this.messaging);
      if (token) {
        console.log('Firebase FCM Token:', token);
        await this.saveTokenToDatabase(token);
      }
    } catch (error) {
      console.log('Failed to get FCM token:', error);
    }
  }

  async saveTokenToDatabase(token: string) {
    try {
      const app = getApp();
      const userId = getAuth(app).currentUser?.uid;
      if (!userId) return;

      await firestore().collection('users').doc(userId).update({
        fcmToken: token,
      });
      console.log('FCM token saved to Firestore successfully.');
    } catch (error) {
      console.log('Error saving FCM token:', error);
    }
  }

  setupTokenRefreshListener() {
    return onTokenRefresh(this.messaging, token => {
      this.saveTokenToDatabase(token);
    });
  }

  setupBackgroundHandler() {
    setBackgroundMessageHandler(this.messaging, async remoteMessage => {
      console.log('Background message received:', remoteMessage);
    });
  }

  setupForegroundHandler() {
    return onMessage(this.messaging, async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'New Notification',
        remoteMessage.notification?.body || 'You have a new message.'
      );
    });
  }
}

export default new NotificationService();

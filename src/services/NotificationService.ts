import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert, Platform } from 'react-native';

class NotificationService {
  async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      this.getFCMToken();
    }
  }

  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        console.log('Your Firebase Token is:', token);
        await this.saveTokenToDatabase(token);
      }
    } catch (error) {
      console.log('Failed to get FCM token', error);
    }
  }

  async saveTokenToDatabase(token: string) {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    try {
      await firestore().collection('users').doc(userId).update({
        fcmToken: token,
      });
      console.log('FCM token saved successfully.');
    } catch (error) {
      console.log('Error saving FCM token:', error);
    }
  }

  setupTokenRefreshListener() {
    return messaging().onTokenRefresh(token => {
      this.saveTokenToDatabase(token);
    });
  }

  setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }

  setupForegroundHandler() {
    return messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'New Message',
        remoteMessage.notification?.body || 'You have a new message.'
      );
    });
  }
}

export default new NotificationService();

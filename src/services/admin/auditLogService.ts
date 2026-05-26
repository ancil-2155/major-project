import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { AdminAuditLog } from '../../types/admin';

export const logAdminAction = async (
  action: string,
  targetUserId?: string,
  targetRole?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.warn('Attempted to log admin action without authenticated user');
      return;
    }

    // Attempt to get admin name
    let adminName = 'Admin';
    try {
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      if (userDoc.exists) {
        adminName = userDoc.data()?.name || 'Admin';
      }
    } catch (e) {
      // Ignore
    }

    const logEntry: AdminAuditLog = {
      adminId: currentUser.uid,
      adminName,
      action,
      targetUserId,
      targetRole,
      details,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    await firestore().collection('adminAuditLogs').add(logEntry);
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Non-blocking failure
  }
};

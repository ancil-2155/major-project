import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { logAdminAction } from './auditLogService';
import { UserRole } from '../../types/user';

export const suspendUser = async (uid: string, role: UserRole): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Unauthenticated');
  if (currentUser.uid === uid) throw new Error('Cannot suspend yourself');
  if (role === 'admin') throw new Error('Cannot suspend another admin');

  await firestore().collection('users').doc(uid).update({
    status: 'suspended',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
  await logAdminAction('user_suspended', uid, role);
};

export const reactivateUser = async (uid: string, role: UserRole): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Unauthenticated');

  await firestore().collection('users').doc(uid).update({
    status: role === 'teacher' ? 'approved' : 'active',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
  await logAdminAction('user_reactivated', uid, role);
};

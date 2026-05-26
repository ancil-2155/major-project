import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Notice, TargetRole } from '../../types/notice';
import { logAdminAction } from './auditLogService';

export const createNotice = async (
  title: string,
  message: string,
  targetRole: TargetRole
): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Unauthenticated');

  const newNotice: Notice = {
    title,
    message,
    targetRole,
    createdBy: currentUser.uid,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection('notices').add(newNotice);
  await logAdminAction('notice_created', undefined, undefined, { title, targetRole });
};

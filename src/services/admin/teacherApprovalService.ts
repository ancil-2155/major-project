import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { logAdminAction } from './auditLogService';

export const approveTeacher = async (teacherUid: string): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Unauthenticated');

  const updateData = {
    status: 'approved',
    isApproved: true,
    approvedBy: currentUser.uid,
    approvedAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection('users').doc(teacherUid).update(updateData);
  await logAdminAction('teacher_approved', teacherUid, 'teacher');
};

export const rejectTeacher = async (teacherUid: string, reason: string): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Unauthenticated');

  const updateData = {
    status: 'rejected',
    isApproved: false,
    rejectedBy: currentUser.uid,
    rejectedAt: firestore.FieldValue.serverTimestamp(),
    rejectionReason: reason,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection('users').doc(teacherUid).update(updateData);
  await logAdminAction('teacher_rejected', teacherUid, 'teacher', { reason });
};

export const suspendTeacher = async (teacherUid: string): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Unauthenticated');

  const updateData = {
    status: 'suspended',
    isApproved: false,
    suspendedBy: currentUser.uid,
    suspendedAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection('users').doc(teacherUid).update(updateData);
  await logAdminAction('teacher_suspended', teacherUid, 'teacher');
};

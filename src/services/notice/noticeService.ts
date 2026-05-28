import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Notice, TargetRole, NoticePriority, TargetEducationLevel } from '../../types/notice';
import { removeUndefinedFields } from '../../utils/firestoreSanitizer';
import { logAdminAction } from '../admin/auditLogService';

const NOTICES_COL = 'notices';

export const createNotice = async (
  data: Omit<Notice, 'noticeId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Unauthenticated');

  const docRef = firestore().collection(NOTICES_COL).doc();

  const newNotice: Notice = {
    ...data,
    noticeId: docRef.id,
    status: 'active',
    targetDepartmentCode: data.targetDepartmentCode || null,
    targetYearNumber: data.targetYearNumber || null,
    targetSemesterNumber: data.targetSemesterNumber || null,
    targetClassLevel: data.targetClassLevel || null,
    createdByName: data.createdByName || null,
    expiresAt: data.expiresAt || null,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  const cleanData = removeUndefinedFields(newNotice);
  await docRef.set(cleanData);
  await logAdminAction('notice_created', undefined, undefined, { noticeId: docRef.id, title: cleanData.title });
  
  return docRef.id;
};

export const hideNotice = async (noticeId: string): Promise<void> => {
  await firestore().collection(NOTICES_COL).doc(noticeId).update({
    status: 'hidden',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const deleteNoticeSoft = async (noticeId: string): Promise<void> => {
  await firestore().collection(NOTICES_COL).doc(noticeId).update({
    status: 'deleted',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const markNoticeAsRead = async (noticeId: string, userId: string): Promise<void> => {
  const readRef = firestore()
    .collection(NOTICES_COL)
    .doc(noticeId)
    .collection('reads')
    .doc(userId);

  // We set with merge to avoid errors if already read
  await readRef.set({
    userId,
    readAt: firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

// Subscribes to active notices for a given user profile.
// Filters mostly client-side to avoid composite index requirements in prototype stage.
export const subscribeActiveNoticesForUser = (
  userProfile: any,
  role: TargetRole,
  callback: (notices: Notice[], unreadCount: number) => void
) => {
  if (!userProfile) return () => {};

  return firestore()
    .collection(NOTICES_COL)
    .where('status', '==', 'active')
    .limit(50)
    .onSnapshot(async (snapshot) => {
      if (!snapshot) return;

      const now = new Date();
      let activeNotices: Notice[] = [];
      const userId = userProfile.uid || auth().currentUser?.uid;

      for (const doc of snapshot.docs) {
        const notice = { ...doc.data(), noticeId: doc.id } as Notice;

        // Role filter
        if (notice.targetRole !== 'all' && notice.targetRole !== role) continue;

        // Expiry filter
        if (notice.expiresAt && notice.expiresAt.toDate) {
          if (notice.expiresAt.toDate() < now) continue;
        }

        // Academic filters
        if (notice.targetEducationLevel !== 'all') {
          if (userProfile.educationLevel && notice.targetEducationLevel !== userProfile.educationLevel) continue;
        }
        if (notice.targetDepartmentCode && userProfile.department && notice.targetDepartmentCode !== userProfile.department) continue;
        if (notice.targetYearNumber && userProfile.year && notice.targetYearNumber !== Number(userProfile.year)) continue;
        if (notice.targetSemesterNumber && userProfile.semester && notice.targetSemesterNumber !== Number(userProfile.semester)) continue;
        if (notice.targetClassLevel && userProfile.classLevel && notice.targetClassLevel !== userProfile.classLevel) continue;

        activeNotices.push(notice);
      }

      // Sort by createdAt desc
      activeNotices.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      // Calculate unread count
      let unreadCount = 0;
      if (userId) {
        await Promise.all(
          activeNotices.map(async (n) => {
            try {
              const readDoc = await firestore()
                .collection(NOTICES_COL)
                .doc(n.noticeId)
                .collection('reads')
                .doc(userId)
                .get();
              if (!readDoc.exists) unreadCount++;
            } catch {
              // ignore
            }
          })
        );
      }

      callback(activeNotices, unreadCount);
    });
};

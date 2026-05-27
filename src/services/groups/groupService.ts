import firestore from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { CreateGroupInput, GroupListItem, StudentAcademicProfile } from '../../types/groups';

const isIndexError = (error: any) =>
  error?.code === 'firestore/failed-precondition' ||
  String(error?.message || '').toLowerCase().includes('requires an index');

const toNumber = (value: any): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeGroup = (doc: FirebaseFirestoreTypes.DocumentSnapshot): GroupListItem => {
  const data = (doc.data() || {}) as Record<string, any>;
  return {
    groupId: String(data.groupId || doc.id),
    groupName: String(data.groupName || 'Group'),
    description: data.description ?? null,
    createdBy: String(data.createdBy || ''),
    createdByName: String(data.createdByName || 'Teacher'),
    createdByRole: data.createdByRole === 'admin' ? 'admin' : 'teacher',
    educationLevel: data.educationLevel === 'school' ? 'school' : data.educationLevel === 'college' ? 'college' : 'btech',
    departmentCode: data.departmentCode ?? null,
    department: data.department ?? null,
    yearNumber: toNumber(data.yearNumber),
    semesterNumber: toNumber(data.semesterNumber),
    classLevel: data.classLevel ?? null,
    subject: data.subject ?? null,
    groupType: data.groupType === 'subject' ? 'subject' : data.groupType === 'private' ? 'private' : 'class',
    status: data.status === 'archived' ? 'archived' : data.status === 'deleted' ? 'deleted' : 'active',
    lastMessageText: data.lastMessageText ?? null,
    lastMessageAt: data.lastMessageAt ?? null,
    lastMessageBy: data.lastMessageBy ?? null,
    memberCount: toNumber(data.memberCount) || 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    unreadCount: 0,
  };
};

const readMemberLastReadAt = async (groupId: string, userId: string): Promise<number> => {
  try {
    const memberDoc = await firestore()
      .collection('classGroups')
      .doc(groupId)
      .collection('members')
      .doc(userId)
      .get();

    const lastReadAt = memberDoc.data()?.lastReadAt;
    if (lastReadAt?.toMillis) {
      return lastReadAt.toMillis();
    }
    return 0;
  } catch {
    return 0;
  }
};

const computeUnreadCount = async (groupId: string, userId: string): Promise<number> => {
  try {
    const lastReadAtMs = await readMemberLastReadAt(groupId, userId);
    const snapshot = await firestore()
      .collection('classGroups')
      .doc(groupId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    let unread = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (String(data.senderId || '') === userId) {
        return;
      }
      if (data.deletedAt) {
        return;
      }
      const createdAtMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
      if (createdAtMs > lastReadAtMs) {
        unread += 1;
      }
    });
    return unread;
  } catch {
    return 0;
  }
};

const matchesStudentProfile = (
  group: GroupListItem,
  profile: StudentAcademicProfile,
): boolean => {
  if (group.status !== 'active') {
    return false;
  }

  const level = String(profile.educationLevel || '').toLowerCase();
  if (level === 'school') {
    if (group.educationLevel !== 'school') {
      return false;
    }
    const studentClass = String(profile.classLevel || '').trim().toLowerCase();
    const groupClass = String(group.classLevel || '').trim().toLowerCase();
    return studentClass ? studentClass === groupClass : false;
  }

  if (!(group.educationLevel === 'btech' || group.educationLevel === 'college')) {
    return false;
  }

  const studentDept = String(profile.departmentCode || profile.department || '').trim().toLowerCase();
  const groupDept = String(group.departmentCode || group.department || '').trim().toLowerCase();
  if (!studentDept || studentDept !== groupDept) {
    return false;
  }

  const studentYear = toNumber(profile.yearNumber ?? String(profile.year || '').match(/\d+/)?.[0]);
  const studentSem = toNumber(
    profile.semesterNumber ?? String(profile.semester || '').match(/\d+/)?.[0],
  );

  if (studentYear === null || studentSem === null) {
    return false;
  }

  return group.yearNumber === studentYear && group.semesterNumber === studentSem;
};

export const createClassGroup = async (input: CreateGroupInput): Promise<string> => {
  const groupsRef = firestore().collection('classGroups');
  const groupRef = groupsRef.doc();
  const now = firestore.FieldValue.serverTimestamp();

  await groupRef.set({
    groupId: groupRef.id,
    groupName: input.groupName.trim(),
    description: input.description ? input.description.trim() : null,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdByRole: input.createdByRole,
    educationLevel: input.educationLevel,
    departmentCode: input.departmentCode ?? null,
    department: input.department ?? null,
    yearNumber: input.yearNumber ?? null,
    semesterNumber: input.semesterNumber ?? null,
    classLevel: input.classLevel ?? null,
    subject: input.subject ?? null,
    groupType: input.groupType,
    status: input.status || 'active',
    lastMessageText: null,
    lastMessageAt: null,
    lastMessageBy: null,
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  });

  const memberDoc = {
    userId: input.createdBy,
    userName: input.createdByName,
    role: input.createdByRole,
    joinedAt: now,
    muted: false,
    lastReadAt: now,
  };

  await groupRef.collection('members').doc(input.createdBy).set(memberDoc, { merge: true });
  return groupRef.id;
};

export const loadTeacherGroups = async (teacherId: string): Promise<GroupListItem[]> => {
  try {
    const snapshot = await firestore()
      .collection('classGroups')
      .where('createdBy', '==', teacherId)
      .limit(100)
      .get();
    const groups = snapshot.docs.map(normalizeGroup);
    groups.sort((a, b) => {
      const aMs = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
      const bMs = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
      return bMs - aMs;
    });

    const withUnread = await Promise.all(
      groups.map(async item => ({
        ...item,
        unreadCount: await computeUnreadCount(item.groupId, teacherId),
      })),
    );
    return withUnread;
  } catch (error) {
    if (!isIndexError(error)) {
      throw error;
    }
    const fallback = await firestore().collection('classGroups').limit(100).get();
    const groups = fallback.docs.map(normalizeGroup).filter(item => item.createdBy === teacherId);
    return groups;
  }
};

export const loadStudentGroups = async (
  profile: StudentAcademicProfile,
  userId: string,
): Promise<GroupListItem[]> => {
  try {
    const snapshot = await firestore()
      .collection('classGroups')
      .where('status', '==', 'active')
      .limit(100)
      .get();

    const filtered = snapshot.docs
      .map(normalizeGroup)
      .filter(item => matchesStudentProfile(item, profile));

    filtered.sort((a, b) => {
      const aMs = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : 0;
      const bMs = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : 0;
      return bMs - aMs;
    });

    const withUnread = await Promise.all(
      filtered.map(async item => ({
        ...item,
        unreadCount: await computeUnreadCount(item.groupId, userId),
      })),
    );
    return withUnread;
  } catch (error) {
    if (!isIndexError(error)) {
      throw error;
    }
    const fallback = await firestore().collection('classGroups').limit(100).get();
    return fallback.docs.map(normalizeGroup).filter(item => matchesStudentProfile(item, profile));
  }
};

export const ensureGroupMember = async (
  groupId: string,
  user: { uid: string; name: string; role: 'student' | 'teacher' | 'admin' },
): Promise<void> => {
  const db = firestore();
  const groupRef = db.collection('classGroups').doc(groupId);
  const memberRef = groupRef.collection('members').doc(user.uid);
  await db.runTransaction(async tx => {
    const [groupDoc, memberDoc] = await Promise.all([tx.get(groupRef), tx.get(memberRef)]);
    const now = firestore.FieldValue.serverTimestamp();
    tx.set(
      memberRef,
      {
        userId: user.uid,
        userName: user.name,
        role: user.role,
        joinedAt: now,
        muted: false,
        lastReadAt: now,
      },
      { merge: true },
    );

    if (!memberDoc.exists && groupDoc.exists) {
      const currentCount = Number(groupDoc.data()?.memberCount || 0);
      tx.update(groupRef, {
        memberCount: currentCount + 1,
        updatedAt: now,
      });
    }
  });
};

export const markGroupAsRead = async (groupId: string, userId: string): Promise<void> => {
  const memberRef = firestore().collection('classGroups').doc(groupId).collection('members').doc(userId);
  await memberRef.set(
    {
      userId,
      muted: false,
      lastReadAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

export const getGroupById = async (groupId: string): Promise<GroupListItem | null> => {
  const doc = await firestore().collection('classGroups').doc(groupId).get();
  if (!doc.exists) {
    return null;
  }
  return normalizeGroup(doc);
};

import firestore from '@react-native-firebase/firestore';
import { LibraryResource } from '../../types/library';
import { sanitizeFirestoreData } from '../../utils/firestoreSanitizer';

const LIB_COLLECTION = 'libraryResources';

export const uploadLibraryResource = async (data: Omit<LibraryResource, 'resourceId' | 'createdAt' | 'updatedAt' | 'viewCount' | 'downloadCount' | 'bookmarkCount' | 'status'>) => {
  const docRef = firestore().collection(LIB_COLLECTION).doc();
  const resource: LibraryResource = {
    ...data,
    resourceId: docRef.id,
    viewCount: 0,
    downloadCount: 0,
    bookmarkCount: 0,
    status: 'active',
    createdAt: firestore.FieldValue.serverTimestamp() as any,
    updatedAt: firestore.FieldValue.serverTimestamp() as any,
  };

  const cleanData = sanitizeFirestoreData(resource);
  await docRef.set(cleanData);
  return docRef.id;
};

export const getResourcesForStudent = async (studentProfile: any) => {
  // Simplify query to avoid index errors. In production, use composite indexes.
  const snapshot = await firestore()
    .collection(LIB_COLLECTION)
    .where('status', '==', 'active')
    .get();

  const resources = snapshot.docs.map(doc => doc.data() as LibraryResource);
  
  // Filter locally
  return resources.filter(res => {
    if (res.educationLevel === 'all') return true;
    if (studentProfile.education === 'school' && res.educationLevel === 'school') {
      return res.classLevel === studentProfile.class;
    }
    if (studentProfile.education === 'btech' && res.educationLevel === 'btech') {
      return res.departmentCode === studentProfile.departmentCode && 
             res.yearNumber === studentProfile.year && 
             res.semesterNumber === studentProfile.semester;
    }
    return false;
  }).sort((a, b) => {
    const timeA = a.createdAt && (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : 0;
    const timeB = b.createdAt && (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : 0;
    return timeB - timeA;
  });
};

export const getTeacherResources = async (teacherId: string) => {
  const snapshot = await firestore()
    .collection(LIB_COLLECTION)
    .where('uploadedBy', '==', teacherId)
    .get();

  const resources = snapshot.docs.map(doc => doc.data() as LibraryResource);
  return resources.sort((a, b) => {
    const timeA = a.createdAt && (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : 0;
    const timeB = b.createdAt && (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : 0;
    return timeB - timeA;
  });
};

export const incrementResourceView = async (resourceId: string) => {
  await firestore().collection(LIB_COLLECTION).doc(resourceId).update({
    viewCount: firestore.FieldValue.increment(1)
  }).catch(() => {});
};

export const incrementResourceDownload = async (resourceId: string) => {
  await firestore().collection(LIB_COLLECTION).doc(resourceId).update({
    downloadCount: firestore.FieldValue.increment(1)
  }).catch(() => {});
};

export const bookmarkResource = async (resourceId: string, studentId: string, studentName: string) => {
  const ref = firestore().collection(LIB_COLLECTION).doc(resourceId);
  const bookmarkRef = ref.collection('bookmarks').doc(studentId);

  await firestore().runTransaction(async (t) => {
    const bDoc = await t.get(bookmarkRef);
    if (bDoc.exists) return; // gracefully return
    
    t.set(bookmarkRef, sanitizeFirestoreData({
      studentId,
      studentName,
      createdAt: firestore.FieldValue.serverTimestamp()
    }));
    t.update(ref, { bookmarkCount: firestore.FieldValue.increment(1) });
  });
};

export const unbookmarkResource = async (resourceId: string, studentId: string) => {
  const ref = firestore().collection(LIB_COLLECTION).doc(resourceId);
  const bookmarkRef = ref.collection('bookmarks').doc(studentId);

  await firestore().runTransaction(async (t) => {
    const bDoc = await t.get(bookmarkRef);
    if (!bDoc.exists) return; // gracefully return
    
    t.delete(bookmarkRef);
    t.update(ref, { bookmarkCount: firestore.FieldValue.increment(-1) });
  });
};

export const checkBookmarked = async (resourceId: string, studentId: string) => {
  const doc = await firestore().collection(LIB_COLLECTION).doc(resourceId).collection('bookmarks').doc(studentId).get();
  return doc.exists;
};

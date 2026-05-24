import firestore from '@react-native-firebase/firestore';

export const createStudent = async (data) => {
  return await firestore().collection('students').add({
    ...data,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const updateStudentFaces = async (uid, faceUrls) => {
  const snapshot = await firestore()
    .collection('students')
    .where('uid', '==', uid)
    .get();

  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;

    await firestore()
      .collection('students')
      .doc(docId)
      .update({
        faces: faceUrls,
      });
  }
};
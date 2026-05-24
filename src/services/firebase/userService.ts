import firestore from '@react-native-firebase/firestore';
import { User, FaceEmbeddingsDoc } from '../../types/user';

const USERS_COLLECTION = 'users';
const EMBEDDINGS_COLLECTION = 'faceEmbeddings';

/**
 * Saves the public/self-accessible User document to Firestore.
 */
export const saveUserRecord = async (user: User): Promise<void> => {
  const userRef = firestore().collection(USERS_COLLECTION).doc(user.uid);
  
  await userRef.set({
    ...user,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Saves the protected Face Embeddings document to Firestore.
 * This is isolated from the users collection for security.
 */
export const saveFaceEmbeddings = async (uid: string, embeddingsData: Omit<FaceEmbeddingsDoc, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  const embedRef = firestore().collection(EMBEDDINGS_COLLECTION).doc(uid);
  
  await embedRef.set({
    uid,
    ...embeddingsData,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

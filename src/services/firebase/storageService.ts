import storage from '@react-native-firebase/storage';

/**
 * Uploads the raw front face image to Firebase Storage and returns the public download URL.
 * Only the front face is stored. Left and right captures are not stored permanently.
 */
export const uploadProfilePhoto = async (uid: string, localFilePath: string): Promise<string> => {
  const reference = storage().ref(`profile_photos/${uid}.jpg`);
  await reference.putFile(localFilePath);
  return await reference.getDownloadURL();
};

import storage from '@react-native-firebase/storage';
import ReactNativeBlobUtil from 'react-native-blob-util';

/**
 * Uploads the raw front face image to Firebase Storage and returns the public download URL.
 * Only the front face is stored. Left and right captures are not stored permanently.
 */
export const uploadProfilePhoto = async (uid: string, localFilePath: string): Promise<string> => {
  const reference = storage().ref(`profile_photos/${uid}/profile.jpg`);
  
  const actualPath = localFilePath.replace('file://', '');
  const base64Data = await ReactNativeBlobUtil.fs.readFile(actualPath, 'base64');
  
  return new Promise((resolve, reject) => {
    const task = reference.putString(base64Data, 'base64', { contentType: 'image/jpeg' });
    
    // Prevent Unhandled Promise Rejection warnings from the task itself
    task.catch(() => {});
    
    task.on('state_changed', 
      (snapshot) => {
        console.log(`Upload progress: ${snapshot.bytesTransferred} / ${snapshot.totalBytes}`);
      },
      (error) => {
        console.error('Firebase Storage Error:', error);
        // We reject with a highly visible custom error so it shows up on your screen!
        reject(new Error(`Upload Failed: [${error.code}] ${error.message}`));
      },
      async () => {
        try {
          const url = await reference.getDownloadURL();
          resolve(url);
        } catch (e: any) {
          reject(new Error(`Upload succeeded, but getting URL failed: ${e.message}`));
        }
      }
    );
  });
};

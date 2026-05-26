import storage from '@react-native-firebase/storage';
import ReactNativeBlobUtil from 'react-native-blob-util';

export interface StorageUploadResult {
  downloadUrl: string;
  path: string;
}

/**
 * Safely fetches a download URL for a given path.
 * If the object does not exist, it silently returns null instead of throwing an error.
 */
export const safeGetDownloadUrl = async (path: string): Promise<string | null> => {
  if (!path) return null;
  
  try {
    const url = await storage().ref(path).getDownloadURL();
    return url;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      // Expected case for missing photos, do not throw.
      return null;
    }
    console.warn(`Error getting download URL for ${path}:`, error);
    return null;
  }
};

/**
 * Uploads the raw front face image to Firebase Storage and returns the public download URL and the storage path.
 * The path is structured as: profilePhotos/{uid}/front.jpg
 */
export const uploadProfilePhoto = async (uid: string, localFilePath: string): Promise<StorageUploadResult> => {
  const path = `profilePhotos/${uid}/front.jpg`;
  const reference = storage().ref(path);
  
  const actualPath = localFilePath.replace('file://', '');
  const base64Data = await ReactNativeBlobUtil.fs.readFile(actualPath, 'base64');
  
  return new Promise((resolve, reject) => {
    const task = reference.putString(base64Data, 'base64', { contentType: 'image/jpeg' });
    
    task.catch(() => {});
    
    task.on('state_changed', 
      (snapshot) => {
        console.log(`Upload progress: ${snapshot.bytesTransferred} / ${snapshot.totalBytes}`);
      },
      (error) => {
        console.error('Firebase Storage Error:', error);
        reject(new Error(`Upload Failed: [${error.code}] ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await reference.getDownloadURL();
          resolve({ downloadUrl, path });
        } catch (e: any) {
          reject(new Error(`Upload succeeded, but getting URL failed: ${e.message}`));
        }
      }
    );
  });
};

/**
 * Convenience method to get the best profile photo URL from a user document safely.
 */
export const getProfilePhotoUrl = async (userProfile: any): Promise<string | null> => {
  if (!userProfile) return null;

  // 1. Try directly saved URL (remote)
  if (userProfile.profilePhotoUrl && userProfile.profilePhotoUrl.startsWith('http')) {
    return userProfile.profilePhotoUrl;
  }

  // 2. Fallback to Storage path lookup
  if (userProfile.profilePhotoPath) {
    const url = await safeGetDownloadUrl(userProfile.profilePhotoPath);
    if (url) return url;
  }

  // 3. Fallback to local file URI (saved when Storage upload failed)
  if (userProfile.profilePhotoUrl && userProfile.profilePhotoUrl.startsWith('file://')) {
    return userProfile.profilePhotoUrl;
  }
  if (userProfile.localProfilePhotoUri) {
    return userProfile.localProfilePhotoUri;
  }

  // 4. Fallback to older faces array if present
  if (userProfile.faces && userProfile.faces.length > 0) {
    const face0 = userProfile.faces[0];
    if (face0 && (face0.startsWith('http') || face0.startsWith('file://'))) {
      return face0;
    }
  }

  return null;
};

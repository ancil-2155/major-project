import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GalleryPost } from '../../types/gallery';
import { removeUndefinedFields } from '../../utils/firestoreSanitizer';

const GALLERY_COLLECTION = 'galleryPosts';

export const createGalleryPost = async (
  postData: Omit<GalleryPost, 'postId' | 'likeCount' | 'commentCount' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = firestore().collection(GALLERY_COLLECTION).doc();
    
    const newPost: GalleryPost = {
      ...postData,
      uploaderName: postData.uploaderName || 'Unknown User',
      uploaderRole: postData.uploaderRole || 'student',
      uploaderPhotoUrl: postData.uploaderPhotoUrl || null,
      thumbnailUrl: postData.thumbnailUrl || null,
      cloudinaryResourceType: postData.cloudinaryResourceType || postData.mediaType,
      format: postData.format || null,
      width: postData.width ?? null,
      height: postData.height ?? null,
      duration: postData.duration ?? null,
      bytes: postData.bytes ?? null,
      visibility: postData.visibility || 'school',
      department: postData.department || null,
      year: postData.year || null,
      semester: postData.semester || null,
      classLevel: postData.classLevel || null,
      section: postData.section || null,
      postId: docRef.id,
      likeCount: 0,
      commentCount: 0,
      status: postData.status || 'approved',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      approvedBy: postData.approvedBy || null,
      approvedAt: postData.approvedAt || null,
    };

    const cleanData = removeUndefinedFields(newPost);
    
    console.log('[Gallery] Clean post data:', cleanData);

    Object.entries(cleanData).forEach(([key, value]) => {
      if (value === undefined) {
        console.error('[Gallery] Undefined field detected:', key);
      }
    });

    await docRef.set(cleanData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating gallery post:', error);
    throw error;
  }
};

export const likePost = async (postId: string, userId: string, userName: string) => {
  const postRef = firestore().collection(GALLERY_COLLECTION).doc(postId);
  const likeRef = postRef.collection('likes').doc(userId);

  try {
    await firestore().runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      if (likeDoc.exists) {
        return { alreadyLiked: true };
      }

      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error('Post does not exist.');
      }

      transaction.set(likeRef, {
        userId,
        userName,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(postRef, {
        likeCount: firestore.FieldValue.increment(1),
      });
    });
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  const postRef = firestore().collection(GALLERY_COLLECTION).doc(postId);
  const likeRef = postRef.collection('likes').doc(userId);

  try {
    await firestore().runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      if (!likeDoc.exists) {
        return { notLiked: true };
      }

      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error('Post does not exist.');
      }

      transaction.delete(likeRef);

      // Prevent negative likeCount
      const currentCount = postDoc.data()?.likeCount || 0;
      if (currentCount > 0) {
        transaction.update(postRef, {
          likeCount: firestore.FieldValue.increment(-1),
        });
      }
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

export const checkUserLiked = async (postId: string, userId: string): Promise<boolean> => {
  const likeDoc = await firestore()
    .collection(GALLERY_COLLECTION)
    .doc(postId)
    .collection('likes')
    .doc(userId)
    .get();
  
  return typeof (likeDoc as any).exists === 'function'
    ? (likeDoc as any).exists()
    : Boolean((likeDoc as any).exists);
};

export const deleteOwnPost = async (postId: string, userId: string) => {
  try {
    const postRef = firestore().collection(GALLERY_COLLECTION).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) throw new Error('Post not found');
    
    const postData = postDoc.data() as GalleryPost;
    if (postData.uploaderId !== userId) {
      throw new Error('You can only delete your own posts');
    }
    
    // Soft delete since Cloudinary media cleanup requires backend
    await postRef.update({
      status: 'deleted',
      deletedAt: firestore.FieldValue.serverTimestamp(),
      deletedBy: userId
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

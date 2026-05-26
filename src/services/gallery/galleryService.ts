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
      postId: docRef.id,
      likeCount: 0,
      commentCount: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
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
        throw new Error('User already liked this post.');
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
        throw new Error('User has not liked this post.');
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
  
  return likeDoc.exists;
};

export const deleteOwnPendingPost = async (postId: string, userId: string) => {
  try {
    const postRef = firestore().collection(GALLERY_COLLECTION).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) throw new Error('Post not found');
    
    const postData = postDoc.data() as GalleryPost;
    if (postData.uploaderId !== userId) {
      throw new Error('You can only delete your own posts');
    }
    
    // Cloudinary media cleanup needs to be handled via backend in a real scenario
    // For now, just delete the Firestore doc
    await postRef.delete();
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

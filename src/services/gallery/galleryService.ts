import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GalleryComment, GalleryPost } from '../../types/gallery';
import { removeUndefinedFields } from '../../utils/firestoreSanitizer';

const GALLERY_COLLECTION = 'galleryPosts';

export const createGalleryPost = async (
  postData: Omit<GalleryPost, 'postId' | 'likeCount' | 'commentCount' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = firestore().collection(GALLERY_COLLECTION).doc();
    
    const newPost: GalleryPost = {
      ...postData,
      userId: postData.userId || postData.uploaderId,
      userName: postData.userName || postData.uploaderName || 'Unknown User',
      role: postData.role || postData.uploaderRole || 'student',
      category: postData.category || 'campus',
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
  return deleteGalleryPost(postId, userId, false);
};

export const deleteGalleryPost = async (
  postId: string,
  userId: string,
  isAdmin = false,
) => {
  try {
    const postRef = firestore().collection(GALLERY_COLLECTION).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) throw new Error('Post not found');
    
    const postData = postDoc.data() as GalleryPost;
    const ownerId = postData.userId || postData.uploaderId;
    if (!isAdmin && ownerId !== userId) {
      throw new Error('You can only delete your own posts');
    }
    
    // Soft delete since Cloudinary media cleanup requires backend
    await postRef.update({
      status: 'deleted',
      deletedAt: firestore.FieldValue.serverTimestamp(),
      deletedBy: userId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const addGalleryComment = async (
  postId: string,
  input: Omit<GalleryComment, 'commentId' | 'postId' | 'createdAt'>,
): Promise<string> => {
  const postRef = firestore().collection(GALLERY_COLLECTION).doc(postId);
  const commentRef = postRef.collection('comments').doc();

  await firestore().runTransaction(async transaction => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists) {
      throw new Error('Post does not exist.');
    }

    transaction.set(
      commentRef,
      removeUndefinedFields({
        ...input,
        commentId: commentRef.id,
        postId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      }),
    );

    transaction.update(postRef, {
      commentCount: firestore.FieldValue.increment(1),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  return commentRef.id;
};

export const subscribeGalleryComments = (
  postId: string,
  onNext: (comments: GalleryComment[]) => void,
  onError?: (error: Error) => void,
) =>
  firestore()
    .collection(GALLERY_COLLECTION)
    .doc(postId)
    .collection('comments')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot => {
        onNext(
          snapshot.docs.map(doc => ({
            ...(doc.data() as GalleryComment),
            commentId: (doc.data() as GalleryComment).commentId || doc.id,
            postId,
          })),
        );
      },
      error => onError?.(error as Error),
    );

export const deleteGalleryComment = async (
  postId: string,
  comment: GalleryComment,
  userId: string,
  isAdmin = false,
) => {
  if (!isAdmin && comment.userId !== userId) {
    throw new Error('You can only delete your own comments.');
  }

  const postRef = firestore().collection(GALLERY_COLLECTION).doc(postId);
  const commentRef = postRef.collection('comments').doc(comment.commentId);

  await firestore().runTransaction(async transaction => {
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists) {
      return;
    }

    transaction.delete(commentRef);
    transaction.update(postRef, {
      commentCount: firestore.FieldValue.increment(-1),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

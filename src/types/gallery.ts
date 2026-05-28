import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type GalleryCategory = 'campus' | 'events' | 'classes' | 'sports' | 'arts';
export type GalleryMediaType = 'image' | 'video';
export type GalleryPostStatus = 'pending' | 'approved' | 'rejected' | 'deleted';

export interface GalleryPost {
  postId: string;

  // Current prompt schema. Kept alongside the older uploader* fields for
  // backward compatibility with existing documents.
  userId?: string;
  userName?: string;
  role?: 'student' | 'teacher' | 'admin' | 'parent';
  category?: GalleryCategory;

  uploaderId: string;
  uploaderName: string;
  uploaderRole: 'student' | 'teacher' | 'admin' | 'parent';
  uploaderPhotoUrl: string | null;

  heading: string;
  caption: string;

  mediaType: GalleryMediaType;
  mediaUrl: string;
  thumbnailUrl: string | null; // Optional for images, might be used for videos
  cloudinaryPublicId: string;
  cloudinaryResourceType: GalleryMediaType;
  format: string | null;

  width: number | null;
  height: number | null;
  duration: number | null;
  bytes: number | null;

  likeCount: number;
  commentCount: number;

  status: GalleryPostStatus;
  visibility: 'school' | 'department' | 'class' | 'public';

  department: string | null;
  year: string | null;
  semester: string | null;
  classLevel: string | null;
  section: string | null;

  createdAt: FirebaseFirestoreTypes.Timestamp | any;
  updatedAt: FirebaseFirestoreTypes.Timestamp | any;
  approvedBy?: string;
  approvedAt?: FirebaseFirestoreTypes.Timestamp | any;
}

export interface GalleryLike {
  userId: string;
  userName: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | any;
}

export interface GalleryComment {
  commentId: string;
  postId: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'admin' | 'parent';
  userPhotoUrl: string | null;
  text: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | any;
  deletedAt?: FirebaseFirestoreTypes.Timestamp | any;
  deletedBy?: string | null;
}

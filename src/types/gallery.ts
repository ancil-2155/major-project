import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface GalleryPost {
  postId: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: 'student' | 'teacher' | 'admin' | 'parent';
  uploaderPhotoUrl: string | null;

  heading: string;
  caption: string;

  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl: string | null; // Optional for images, might be used for videos
  cloudinaryPublicId: string;
  cloudinaryResourceType: 'image' | 'video';
  format: string | null;

  width: number | null;
  height: number | null;
  duration: number | null;
  bytes: number | null;

  likeCount: number;
  commentCount: number;

  status: 'pending' | 'approved' | 'rejected';
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

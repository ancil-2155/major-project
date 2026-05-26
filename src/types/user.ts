import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface FaceEmbeddingsDoc {
  uid: string;
  embedding: number[];
  frontEmbedding: number[];
  leftEmbedding: number[];
  rightEmbedding: number[];
  modelName: "facenet" | "mobilefacenet";
  modelVersion: "v1";
  qualityScore: number;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date | any;
  updatedAt: FirebaseFirestoreTypes.Timestamp | Date | any;
}

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';
export type UserStatus = 'active' | 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  isApproved?: boolean;
  
  // Specific to Student/Teacher
  department?: string;
  year?: string;
  semester?: string;
  qualification?: string;

  // Enrollment fields
  profilePhotoUrl?: string;
  faceEnrollmentStatus?: boolean; 
  
  // Approval tracking (Teacher specific primarily)
  approvedBy?: string;
  approvedAt?: FirebaseFirestoreTypes.Timestamp | Date | any;
  rejectedBy?: string;
  rejectedAt?: FirebaseFirestoreTypes.Timestamp | Date | any;
  rejectionReason?: string;
  suspendedBy?: string;
  suspendedAt?: FirebaseFirestoreTypes.Timestamp | Date | any;

  createdAt?: FirebaseFirestoreTypes.Timestamp | Date | any;
  updatedAt?: FirebaseFirestoreTypes.Timestamp | Date | any;
}

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
  createdAt: FirebaseFirestoreTypes.Timestamp | any;
  updatedAt: FirebaseFirestoreTypes.Timestamp | any;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  year: string;
  department: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  profilePhotoUrl?: string;
  faceEnrollmentStatus?: boolean; // Set to true after successful enrollment
  createdAt?: FirebaseFirestoreTypes.Timestamp | any;
  updatedAt?: FirebaseFirestoreTypes.Timestamp | any;
}

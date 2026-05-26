import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { UserRole } from './user';

export type TargetRole = UserRole | 'all';

export interface Notice {
  id?: string;
  title: string;
  message: string;
  targetRole: TargetRole;
  createdBy: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date | any;
  updatedAt: FirebaseFirestoreTypes.Timestamp | Date | any;
}

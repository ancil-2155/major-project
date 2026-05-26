import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface AdminAuditLog {
  id?: string;
  adminId: string;
  adminName?: string;
  action: string;
  targetUserId?: string;
  targetRole?: string;
  details?: Record<string, any>;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date | any;
}

export interface AdminSettings {
  teacherSignupEnabled: boolean;
  studentSignupEnabled: boolean;
  maintenanceMode: boolean;
  institutionName: string;
  attendanceMatchThreshold: number;
  updatedAt: FirebaseFirestoreTypes.Timestamp | Date | any;
}

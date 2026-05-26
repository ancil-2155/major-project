import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Department {
  id?: string;
  name: string;
  code?: string;
  active: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date | any;
}

export interface Subject {
  id?: string;
  name: string;
  code?: string;
  department: string;
  year?: string;
  semester?: string;
  active: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date | any;
}

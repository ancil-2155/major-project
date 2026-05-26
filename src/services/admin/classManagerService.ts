import firestore from '@react-native-firebase/firestore';
import { Department, Subject } from '../../types/class';
import { logAdminAction } from './auditLogService';

export const createDepartment = async (name: string, code?: string): Promise<void> => {
  const newDept: Omit<Department, 'id'> = {
    name,
    code,
    active: true,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };
  await firestore().collection('departments').add(newDept);
  await logAdminAction('department_created', undefined, undefined, { name });
};

export const createSubject = async (
  name: string,
  department: string,
  year?: string,
  semester?: string,
  code?: string
): Promise<void> => {
  const newSubj: Omit<Subject, 'id'> = {
    name,
    code,
    department,
    year,
    semester,
    active: true,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };
  await firestore().collection('subjects').add(newSubj);
  await logAdminAction('subject_created', undefined, undefined, { name, department });
};

import firestore from '@react-native-firebase/firestore';
import { ClassFilter } from '../../types/teacher';
import {
  AttendanceClassConfig,
  ClassLoadDiagnostics,
  ClassLoadResult,
  MissingEmbeddingInfo,
  StudentFaceEmbedding,
  StudentProfile,
} from '../../types/academic';
import {
  extractSemesterNumber,
  extractYearNumber,
  normalizeDepartment,
} from '../academic/academicConfigService';
import { validateFaceEmbeddingDoc } from '../face/faceEmbeddingValidator';
import { ClassStudent } from './faceMatchingService';

const buildDiagnostics = (config: AttendanceClassConfig): ClassLoadDiagnostics => ({
  totalUserDocsScanned: 0,
  totalClassMatched: 0,
  totalWithEnrollmentFlag: 0,
  totalWithValidEmbedding: 0,
  missingDepartmentCount: 0,
  missingYearCount: 0,
  missingSemesterCount: 0,
  missingEmbeddingCount: 0,
  selectedFilters: {
    educationLevel: config.educationLevel,
    departmentCode: config.departmentCode,
    department: config.department,
    classLevel: config.classLevel,
    className: config.className,
    yearNumber: config.yearNumber,
    semesterNumber: config.semesterNumber,
    subject: config.subject,
  },
});

const toNumberOrNull = (value: any): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const studentFromUserDoc = (doc: any): StudentProfile => {
  const data = doc.data() || {};
  return {
    uid: doc.id,
    name: data.name || data.studentName || 'Unknown Student',
    email: data.email || null,
    rollNo: data.rollNo || null,
    educationLevel: data.educationLevel || 'btech',
    departmentCode: data.departmentCode || data.department || null,
    department: data.department || data.departmentCode || null,
    yearNumber: toNumberOrNull(data.yearNumber) || extractYearNumber(data.year) || null,
    semesterNumber:
      toNumberOrNull(data.semesterNumber) || extractSemesterNumber(data.semester) || null,
    classLevel: data.classLevel || data.className || null,
  };
};

const matchesClass = (
  student: StudentProfile,
  data: Record<string, any>,
  config: AttendanceClassConfig,
  diagnostics: ClassLoadDiagnostics
) => {
  if (config.educationLevel === 'school') {
    if ((data.educationLevel || student.educationLevel) !== 'school') return false;
    const selectedClass = String(config.classLevel || config.className || '').toLowerCase().trim();
    const studentClass = String(student.classLevel || data.className || '').toLowerCase().trim();
    if (!selectedClass) return true;
    return (
      studentClass === selectedClass ||
      studentClass === `class ${selectedClass}` ||
      `class ${studentClass}` === selectedClass
    );
  }

  const level = data.educationLevel || student.educationLevel || 'btech';
  if (level !== 'btech' && level !== 'college') return false;

  const deptVariants = config.departmentCode
    ? normalizeDepartment(config.departmentCode)
    : config.department
    ? normalizeDepartment(config.department)
    : [];

  if (deptVariants.length > 0) {
    const studentDept = String(student.department || data.department || '').toLowerCase().trim();
    const studentDeptCode = String(student.departmentCode || data.departmentCode || '')
      .toLowerCase()
      .trim();
    const deptMatched = deptVariants.some(variant => {
      const lower = variant.toLowerCase().trim();
      return studentDept === lower || studentDeptCode === lower;
    });
    if (!deptMatched) {
      diagnostics.missingDepartmentCount++;
      return false;
    }
  }

  if (config.yearNumber && student.yearNumber !== config.yearNumber) {
    diagnostics.missingYearCount++;
    return false;
  }

  if (config.semesterNumber && student.semesterNumber !== config.semesterNumber) {
    diagnostics.missingSemesterCount++;
    return false;
  }

  return true;
};

const loadEmbeddingForStudent = async (
  student: StudentProfile,
  userData: Record<string, any>
): Promise<StudentFaceEmbedding | MissingEmbeddingInfo> => {
  const directDoc = await firestore().collection('faceEmbeddings').doc(student.uid).get();

  if (directDoc.exists) {
    const validation = await validateFaceEmbeddingDoc(directDoc, student.uid, userData);
    if (validation.valid && validation.embedding) {
      return {
        ...student,
        embedding: validation.embedding,
        embeddingDocId: directDoc.id,
        modelName: validation.data.modelName,
        modelVersion: validation.data.modelVersion,
      };
    }

    return {
      ...student,
      reason:
        validation.reason === 'Embedding not linked to student'
          ? 'Embedding not linked to student'
          : validation.reason || 'Invalid embedding',
    };
  }

  const fallbackSnap = await firestore()
    .collection('faceEmbeddings')
    .where('studentId', '==', student.uid)
    .limit(1)
    .get();

  if (!fallbackSnap.empty) {
    const fallbackDoc = fallbackSnap.docs[0];
    const validation = await validateFaceEmbeddingDoc(fallbackDoc, student.uid, userData);
    if (validation.valid && validation.embedding) {
      return {
        ...student,
        embedding: validation.embedding,
        embeddingDocId: fallbackDoc.id,
        modelName: validation.data.modelName,
        modelVersion: validation.data.modelVersion,
      };
    }

    return {
      ...student,
      reason: validation.reason || 'Invalid embedding',
    };
  }

  return {
    ...student,
    reason: 'No embedding found',
  };
};

export const loadEnrolledStudentsForAttendance = async (
  config: AttendanceClassConfig
): Promise<ClassLoadResult> => {
  const diagnostics = buildDiagnostics(config);

  const usersSnap = await firestore()
    .collection('users')
    .where('role', '==', 'student')
    .get();

  diagnostics.totalUserDocsScanned = usersSnap.docs.length;

  const students: StudentProfile[] = [];
  const userDataById: Record<string, Record<string, any>> = {};

  usersSnap.docs.forEach(doc => {
    const data = doc.data() || {};
    const student = studentFromUserDoc(doc);
    if (!matchesClass(student, data, config, diagnostics)) return;

    diagnostics.totalClassMatched++;
    if (data.faceEnrollmentStatus === true) {
      diagnostics.totalWithEnrollmentFlag++;
    }
    students.push(student);
    userDataById[student.uid] = data;
  });

  const validEmbeddings: StudentFaceEmbedding[] = [];
  const missingEmbeddings: MissingEmbeddingInfo[] = [];

  for (const student of students) {
    const result = await loadEmbeddingForStudent(student, userDataById[student.uid] || {});
    if ('embedding' in result) {
      validEmbeddings.push(result);
    } else {
      missingEmbeddings.push(result);
    }
  }

  diagnostics.totalWithValidEmbedding = validEmbeddings.length;
  diagnostics.missingEmbeddingCount = missingEmbeddings.length;

  return {
    students,
    validEmbeddings,
    missingEmbeddings,
    missingEmbeddingStudents: missingEmbeddings,
    diagnostics,
  };
};

export const loadClassEmbeddings = async (
  filter: ClassFilter
): Promise<ClassStudent[]> => {
  const config: AttendanceClassConfig = {
    educationLevel: 'btech',
    department: filter.department,
    departmentCode: filter.department,
    yearNumber: extractYearNumber(filter.year) || undefined,
    semesterNumber: extractSemesterNumber(filter.semester) || undefined,
    subject: filter.subject,
  };

  const result = await loadEnrolledStudentsForAttendance(config);
  return result.validEmbeddings.map(student => ({
    uid: student.uid,
    name: student.name,
    rollNo: student.rollNo || undefined,
    embedding: student.embedding,
  }));
};

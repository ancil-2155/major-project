import firestore from '@react-native-firebase/firestore';
import { ClassFilter } from '../../types/teacher';
import { ClassStudent } from './faceMatchingService';
import {
  AttendanceClassConfig,
  ClassLoadResult,
  ClassLoadDiagnostics,
} from '../../types/academic';
import {
  normalizeDepartment,
  extractYearNumber,
  extractSemesterNumber,
} from '../academic/academicConfigService';

// ═══════════════════════════════════════════════════
// NEW: Multi-match class loading with detailed diagnostics
// ═══════════════════════════════════════════════════

export const loadEnrolledStudentsForAttendance = async (
  config: AttendanceClassConfig
): Promise<ClassLoadResult> => {
  const diagnostics: ClassLoadDiagnostics = {
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
  };

  try {
    // ── Step 1: Build the broadest safe Firestore query ──
    let query = firestore().collection('users').where('role', '==', 'student');

    const usersSnap = await query.get();
    diagnostics.totalUserDocsScanned = usersSnap.docs.length;

    if (usersSnap.empty) {
      return { students: [], missingEmbeddingStudents: [], diagnostics };
    }

    // ── Step 2: Strict Class Matching ──
    const deptVariants = config.departmentCode
      ? normalizeDepartment(config.departmentCode)
      : config.department
      ? normalizeDepartment(config.department)
      : [];

    const matchedUsers: Array<{ uid: string; name: string; rollNo?: string; hasEnrollmentFlag: boolean }> = [];

    usersSnap.docs.forEach(doc => {
      const data = doc.data();

      // Ensure education level matches
      if (config.educationLevel === 'btech' || config.educationLevel === 'college') {
        const docLevel = data.educationLevel || 'btech'; // assume btech if missing for legacy
        if (docLevel !== 'btech' && docLevel !== 'college') return;

        // Strict BTech Match:
        // Must match Department, Year, Semester
        
        let deptMatched = false;
        let yearMatched = false;
        let semMatched = false;

        // 1. Department
        if (deptVariants.length > 0) {
          const studentDept = (data.department || '').toLowerCase().trim();
          const studentDeptCode = (data.departmentCode || '').toLowerCase().trim();
          deptMatched = deptVariants.some(v => {
            const lv = v.toLowerCase();
            return studentDept === lv || studentDeptCode === lv;
          });
        }
        if (!deptMatched) { diagnostics.missingDepartmentCount++; return; }

        // 2. Year
        if (config.yearNumber) {
          const studentYearNum = data.yearNumber;
          const studentYearStr = (data.year || '').toLowerCase().trim();
          yearMatched = 
            studentYearNum === config.yearNumber || 
            studentYearStr === String(config.yearNumber) ||
            studentYearStr === `${config.yearNumber}rd year` ||
            studentYearStr === `${config.yearNumber}th year` ||
            studentYearStr === `${config.yearNumber}nd year` ||
            studentYearStr === `${config.yearNumber}st year` ||
            studentYearStr.includes(String(config.yearNumber));
        }
        if (config.yearNumber && !yearMatched) { diagnostics.missingYearCount++; return; }

        // 3. Semester
        if (config.semesterNumber) {
          const studentSemNum = data.semesterNumber;
          const studentSemStr = (data.semester || '').toLowerCase().trim();
          semMatched = 
            studentSemNum === config.semesterNumber || 
            studentSemStr === String(config.semesterNumber) ||
            studentSemStr === `semester ${config.semesterNumber}` ||
            studentSemStr === `sem ${config.semesterNumber}` ||
            studentSemStr.includes(String(config.semesterNumber));
        }
        if (config.semesterNumber && !semMatched) { diagnostics.missingSemesterCount++; return; }

      } else if (config.educationLevel === 'school') {
        if (data.educationLevel !== 'school') return;
        
        // Strict School Match
        const studentClassLevel = (data.classLevel || data.className || '').toLowerCase().trim();
        const targetLevel = (config.classLevel || '').toLowerCase().trim();
        const targetName = (config.className || `class ${config.classLevel}` || '').toLowerCase().trim();

        if (targetLevel) {
          const classMatch =
            studentClassLevel === targetLevel ||
            studentClassLevel === targetName ||
            studentClassLevel === `class ${targetLevel}`;
          if (!classMatch) return;
        }
      }

      // If we get here, the student matches the class filters exactly!
      diagnostics.totalClassMatched++;
      
      const hasEnrollmentFlag = data.faceEnrollmentStatus === true;
      if (hasEnrollmentFlag) diagnostics.totalWithEnrollmentFlag++;

      matchedUsers.push({
        uid: doc.id,
        name: data.name || 'Unknown Student',
        rollNo: data.rollNo,
        hasEnrollmentFlag,
      });
    });

    if (matchedUsers.length === 0) {
      return { students: [], missingEmbeddingStudents: [], diagnostics };
    }

    // ── Step 3: Load valid embeddings (length >= 128) ──
    const classUids = matchedUsers.map(u => u.uid);
    const userMap: Record<string, typeof matchedUsers[0]> = {};
    matchedUsers.forEach(u => { userMap[u.uid] = u; });

    const chunks: string[][] = [];
    for (let i = 0; i < classUids.length; i += 10) {
      chunks.push(classUids.slice(i, i + 10));
    }

    const classStudents: ClassStudent[] = [];
    const missingEmbeddingStudents: Array<{ uid: string; name: string; rollNo?: string }> = [];
    const foundIds = new Set<string>();

    for (const chunk of chunks) {
      // Fetch documents by ID individually using Promise.all
      const embedDocsSnaps = await Promise.all(
        chunk.map(uid => firestore().collection('faceEmbeddings').doc(uid).get())
      );

      embedDocsSnaps.forEach(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        if (!data) return;
        
        // Check for embedding (could be 'embedding' or 'embeddings')
        const embedding = data.embedding || data.embeddings;

        if (embedding && Array.isArray(embedding) && embedding.length >= 128) {
          foundIds.add(doc.id);
          classStudents.push({
            uid: doc.id,
            name: userMap[doc.id].name,
            rollNo: userMap[doc.id].rollNo,
            embedding: embedding,
          });
        }
      });

      // Fallback query by studentId for old docs
      const missingChunk = chunk.filter(uid => !foundIds.has(uid));
      if (missingChunk.length > 0) {
        const fallbackSnap = await firestore()
          .collection('faceEmbeddings')
          .where('studentId', 'in', missingChunk)
          .get();

        fallbackSnap.docs.forEach(doc => {
          const embData = doc.data();
          const uid = embData.studentId;
          const embedding = embData.embedding || embData.embeddings;

          if (uid && embedding && Array.isArray(embedding) && embedding.length >= 128 && !foundIds.has(uid)) {
            foundIds.add(uid);
            classStudents.push({
              uid,
              name: userMap[uid].name,
              rollNo: userMap[uid].rollNo,
              embedding: embData.embedding,
            });
          }
        });
      }
    }

    // Tally missing
    classUids.forEach(uid => {
      if (!foundIds.has(uid)) {
        missingEmbeddingStudents.push({
          uid,
          name: userMap[uid].name,
          rollNo: userMap[uid].rollNo,
        });
      }
    });

    diagnostics.totalWithValidEmbedding = classStudents.length;
    diagnostics.missingEmbeddingCount = missingEmbeddingStudents.length;

    return { students: classStudents, missingEmbeddingStudents, diagnostics };

  } catch (error) {
    console.error('Error in loadEnrolledStudentsForAttendance:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════
// LEGACY: Keep old function for backwards compatibility
// ═══════════════════════════════════════════════════

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
  return result.students;
};

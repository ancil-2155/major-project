import firestore from '@react-native-firebase/firestore';

export type TeacherOption = {
  uid: string;
  name: string;
  email: string;
  department?: string;
  year?: string;
  yearIncharge?: string;
  semester?: string;
  subjects?: string[];
  status?: string;
  isApproved?: boolean;
  displayName: string;
};

/**
 * Normalizes a Firestore user document into a safe TeacherOption object
 */
const normalizeTeacherUser = (doc: any): TeacherOption | null => {
  const data = doc.data();
  
  if (!data || !data.name || !data.email) {
    return null; // Skip invalid records
  }

  return {
    uid: doc.id,
    name: data.name,
    email: data.email,
    department: data.department || '',
    year: data.year || '',
    yearIncharge: data.yearIncharge || '',
    semester: data.semester || '',
    subjects: data.subjects || [],
    status: data.status || 'unknown',
    isApproved: data.isApproved === true,
    displayName: `${data.name} (${data.department || 'Teacher'})`,
  };
};

/**
 * Sorts teachers:
 * 1. Exact Department Match
 * 2. Alphabetical by Name
 */
const sortTeachersForStudent = (teachers: TeacherOption[], studentProfile: any): TeacherOption[] => {
  const studentDept = studentProfile?.department?.toLowerCase() || '';

  return teachers.sort((a, b) => {
    const aDept = a.department?.toLowerCase() || '';
    const bDept = b.department?.toLowerCase() || '';

    // Department match
    if (aDept === studentDept && bDept !== studentDept) return -1;
    if (bDept === studentDept && aDept !== studentDept) return 1;

    // Alphabetical
    return a.name.localeCompare(b.name);
  });
};

/**
 * Fetches all approved teachers for the student to select from.
 * Combines logic for old schemas (approved) and new schemas (isApproved / status="approved")
 */
export const getApprovedTeachersForStudent = async (studentProfile: any): Promise<TeacherOption[]> => {
  try {
    // We run two queries because Firestore OR queries can be limited/tricky with missing fields.
    // Query 1: users where role == "teacher" and isApproved == true
    const approvedQuery = await firestore()
      .collection('users')
      .where('role', '==', 'teacher')
      .where('isApproved', '==', true)
      .get();

    // Query 2: users where role == "teacher" and status == "approved"
    const statusQuery = await firestore()
      .collection('users')
      .where('role', '==', 'teacher')
      .where('status', '==', 'approved')
      .get();

    // Map to normalized objects
    const teacherMap = new Map<string, TeacherOption>();

    const processDocs = (docs: any[]) => {
      docs.forEach(doc => {
        const teacher = normalizeTeacherUser(doc);
        if (teacher) {
          // Filter out suspended/rejected explicitly just in case
          if (teacher.status !== 'suspended' && teacher.status !== 'rejected') {
            teacherMap.set(teacher.uid, teacher);
          }
        }
      });
    };

    processDocs(approvedQuery.docs);
    processDocs(statusQuery.docs);

    const mergedTeachers = Array.from(teacherMap.values());
    
    // Sort
    return sortTeachersForStudent(mergedTeachers, studentProfile);
    
  } catch (error) {
    console.error('Error in getApprovedTeachersForStudent:', error);
    return [];
  }
};

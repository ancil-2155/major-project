// ─── Education Level ──────────────────────────────
export type EducationLevel = 'school' | 'btech' | 'college';

// ─── Attendance Class Config ──────────────────────
export interface AttendanceClassConfig {
  educationLevel: EducationLevel;
  departmentCode?: string;
  department?: string;
  classLevel?: string;
  className?: string;
  yearNumber?: number;
  semesterNumber?: number;
  subject: string;
}

// ─── Subject Option ───────────────────────────────
export type SubjectOption = {
  id: string;
  name: string;
  code?: string;
  educationLevel: EducationLevel;
  departmentCode?: string;
  departmentName?: string;
  yearNumber?: number;
  semesterNumber?: number;
  classLevel?: string;
  active: boolean;
};

// ─── Department Option ────────────────────────────
export interface AcademicDepartment {
  code: string;
  name: string;
  label: string; // "CSE - Computer Science Engineering"
}

// ─── School Class Option ──────────────────────────
export interface SchoolClass {
  level: string;
  name: string;
}

// ─── Diagnostics returned from class loading ──────
export interface ClassLoadDiagnostics {
  totalUserDocsScanned: number;
  totalClassMatched: number;
  totalWithEnrollmentFlag: number;
  totalWithValidEmbedding: number;
  missingDepartmentCount: number;
  missingYearCount: number;
  missingSemesterCount: number;
  missingEmbeddingCount: number;
  selectedFilters: Record<string, string | number | undefined>;
}

export interface ClassLoadResult {
  students: Array<{
    uid: string;
    name: string;
    rollNo?: string;
    embedding: number[];
  }>;
  missingEmbeddingStudents: Array<{
    uid: string;
    name: string;
    rollNo?: string;
  }>;
  diagnostics: ClassLoadDiagnostics;
}

// ─── Normalization maps ───────────────────────────
export const DEPARTMENT_CODE_MAP: Record<string, string> = {
  'CSE': 'Computer Science Engineering',
  'ME': 'Mechanical Engineering',
  'CE': 'Civil Engineering',
  'ECE': 'Electronics and Communication Engineering',
  'EEE': 'Electrical and Electronics Engineering',
  'IT': 'Information Technology',
  'AI/DS': 'Artificial Intelligence and Data Science',
  'AIML': 'Artificial Intelligence and Machine Learning',
  'CIVIL': 'Civil Engineering',
};

export const DEPARTMENT_NAME_TO_CODE: Record<string, string> = {};
// Build the reverse map
Object.entries(DEPARTMENT_CODE_MAP).forEach(([code, name]) => {
  DEPARTMENT_NAME_TO_CODE[name.toLowerCase()] = code;
});

export const YEAR_NUMBER_MAP: Record<string, number> = {
  '1': 1, '1st': 1, '1st year': 1, 'first': 1, 'first year': 1,
  '2': 2, '2nd': 2, '2nd year': 2, 'second': 2, 'second year': 2,
  '3': 3, '3rd': 3, '3rd year': 3, 'third': 3, 'third year': 3,
  '4': 4, '4th': 4, '4th year': 4, 'fourth': 4, 'fourth year': 4,
};

export const SEMESTER_NUMBER_MAP: Record<string, number> = {
  '1': 1, 'i': 1, 'semester 1': 1,
  '2': 2, 'ii': 2, 'semester 2': 2,
  '3': 3, 'iii': 3, 'semester 3': 3,
  '4': 4, 'iv': 4, 'semester 4': 4,
  '5': 5, 'v': 5, 'semester 5': 5,
  '6': 6, 'vi': 6, 'semester 6': 6,
  '7': 7, 'vii': 7, 'semester 7': 7,
  '8': 8, 'viii': 8, 'semester 8': 8,
};

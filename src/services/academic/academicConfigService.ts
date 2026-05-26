import {
  EducationLevel,
  AcademicDepartment,
  SchoolClass,
  DEPARTMENT_CODE_MAP,
  DEPARTMENT_NAME_TO_CODE,
  YEAR_NUMBER_MAP,
  SEMESTER_NUMBER_MAP,
} from '../../types/academic';

// ═══════════════════════════════════════════════════
// EDUCATION LEVELS
// ═══════════════════════════════════════════════════

export const getEducationLevels = (): Array<{ value: EducationLevel; label: string; icon: string }> => [
  { value: 'school', label: 'School', icon: '🏫' },
  { value: 'btech', label: 'BTech / College', icon: '🎓' },
];

// ═══════════════════════════════════════════════════
// SCHOOL OPTIONS
// ═══════════════════════════════════════════════════

export const getSchoolClasses = (): SchoolClass[] => [
  { level: 'nursery', name: 'Nursery' },
  { level: 'lkg', name: 'LKG' },
  { level: 'ukg', name: 'UKG' },
  { level: '1', name: 'Class 1' },
  { level: '2', name: 'Class 2' },
  { level: '3', name: 'Class 3' },
  { level: '4', name: 'Class 4' },
  { level: '5', name: 'Class 5' },
  { level: '6', name: 'Class 6' },
  { level: '7', name: 'Class 7' },
  { level: '8', name: 'Class 8' },
  { level: '9', name: 'Class 9' },
  { level: '10', name: 'Class 10' },
  { level: '11', name: 'Class 11' },
  { level: '12', name: 'Class 12' },
];

export const getSchoolSubjects = (): string[] => [
  'English',
  'Hindi',
  'Malayalam',
  'Mathematics',
  'Science',
  'Social Science',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Accountancy',
  'Business Studies',
  'Economics',
  'Other',
];

// ═══════════════════════════════════════════════════
// BTECH / COLLEGE OPTIONS
// ═══════════════════════════════════════════════════

export const getBtechDepartments = (): AcademicDepartment[] => [
  { code: 'CSE', name: 'Computer Science Engineering', label: 'CSE - Computer Science Engineering' },
  { code: 'ME', name: 'Mechanical Engineering', label: 'ME - Mechanical Engineering' },
  { code: 'CE', name: 'Civil Engineering', label: 'CE - Civil Engineering' },
  { code: 'ECE', name: 'Electronics and Communication Engineering', label: 'ECE - Electronics & Communication' },
  { code: 'EEE', name: 'Electrical and Electronics Engineering', label: 'EEE - Electrical & Electronics' },
  { code: 'IT', name: 'Information Technology', label: 'IT - Information Technology' },
  { code: 'AI/DS', name: 'Artificial Intelligence and Data Science', label: 'AI/DS - AI & Data Science' },
  { code: 'AIML', name: 'Artificial Intelligence and Machine Learning', label: 'AIML - AI & Machine Learning' },
  { code: 'OTHER', name: 'Other', label: 'Other Department' },
];

export const getBtechYears = (): Array<{ number: number; label: string }> => [
  { number: 1, label: '1st Year' },
  { number: 2, label: '2nd Year' },
  { number: 3, label: '3rd Year' },
  { number: 4, label: '4th Year' },
];

export const getBtechSemesters = (): Array<{ number: number; label: string }> => [
  { number: 1, label: 'Semester 1' },
  { number: 2, label: 'Semester 2' },
  { number: 3, label: 'Semester 3' },
  { number: 4, label: 'Semester 4' },
  { number: 5, label: 'Semester 5' },
  { number: 6, label: 'Semester 6' },
  { number: 7, label: 'Semester 7' },
  { number: 8, label: 'Semester 8' },
];

export const getValidSemestersForYear = (yearNumber: number | null): Array<{ number: number; label: string }> => {
  if (!yearNumber) return [];
  if (yearNumber === 1) return [{ number: 1, label: 'Semester 1' }, { number: 2, label: 'Semester 2' }];
  if (yearNumber === 2) return [{ number: 3, label: 'Semester 3' }, { number: 4, label: 'Semester 4' }];
  if (yearNumber === 3) return [{ number: 5, label: 'Semester 5' }, { number: 6, label: 'Semester 6' }];
  if (yearNumber === 4) return [{ number: 7, label: 'Semester 7' }, { number: 8, label: 'Semester 8' }];
  return [];
};

export const getSections = (): string[] => ['A', 'B', 'C', 'D'];

// ═══════════════════════════════════════════════════
// NORMALIZATION FUNCTIONS
// ═══════════════════════════════════════════════════

/**
 * Given any department string, returns all possible values it could match against.
 * e.g., "CSE" → ["CSE", "cse", "computer science engineering"]
 */
export const normalizeDepartment = (value: string): string[] => {
  if (!value) return [];
  const lower = value.toLowerCase().trim();
  const variants: Set<string> = new Set([value, lower, value.toUpperCase()]);

  // If it's a known code, add the full name
  const upperVal = value.toUpperCase().trim();
  if (DEPARTMENT_CODE_MAP[upperVal]) {
    variants.add(DEPARTMENT_CODE_MAP[upperVal]);
    variants.add(DEPARTMENT_CODE_MAP[upperVal].toLowerCase());
  }

  // If it's a known full name, add the code
  if (DEPARTMENT_NAME_TO_CODE[lower]) {
    variants.add(DEPARTMENT_NAME_TO_CODE[lower]);
    variants.add(DEPARTMENT_NAME_TO_CODE[lower].toLowerCase());
  }

  return Array.from(variants);
};

/**
 * Given any year string/number, returns all possible values it could match against.
 * e.g., 3 → ["3", "3rd", "3rd year", "3rd Year", "third year"]
 */
export const normalizeYear = (value: string | number): string[] => {
  const strVal = String(value).toLowerCase().trim();
  const variants: Set<string> = new Set([String(value), strVal]);

  const num = YEAR_NUMBER_MAP[strVal] || (typeof value === 'number' ? value : parseInt(strVal, 10));
  if (!isNaN(num)) {
    variants.add(String(num));
    const suffixes: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
    if (suffixes[num]) {
      variants.add(suffixes[num]);
      variants.add(`${suffixes[num]} year`);
      variants.add(`${suffixes[num]} Year`);
    }
  }

  return Array.from(variants);
};

/**
 * Given any semester string/number, returns all possible values it could match against.
 * e.g., 6 → ["6", "vi", "VI", "semester 6", "Semester 6"]
 */
export const normalizeSemester = (value: string | number): string[] => {
  const strVal = String(value).toLowerCase().trim();
  const variants: Set<string> = new Set([String(value), strVal]);

  const num = SEMESTER_NUMBER_MAP[strVal] || (typeof value === 'number' ? value : parseInt(strVal, 10));
  if (!isNaN(num)) {
    variants.add(String(num));
    const roman: Record<number, string> = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII', 8:'VIII' };
    if (roman[num]) {
      variants.add(roman[num]);
      variants.add(roman[num].toLowerCase());
    }
    variants.add(`semester ${num}`);
    variants.add(`Semester ${num}`);
  }

  return Array.from(variants);
};

/**
 * Extracts a numeric year from any year string.
 */
export const extractYearNumber = (value: string | number | undefined): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const strVal = String(value).toLowerCase().trim();
  const mapped = YEAR_NUMBER_MAP[strVal];
  if (mapped) return mapped;
  const parsed = parseInt(strVal, 10);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Extracts a numeric semester from any semester string.
 */
export const extractSemesterNumber = (value: string | number | undefined): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const strVal = String(value).toLowerCase().trim();
  const mapped = SEMESTER_NUMBER_MAP[strVal];
  if (mapped) return mapped;
  const parsed = parseInt(strVal, 10);
  return isNaN(parsed) ? null : parsed;
};

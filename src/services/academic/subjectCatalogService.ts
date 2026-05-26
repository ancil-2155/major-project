import firestore from '@react-native-firebase/firestore';
import { SubjectOption, EducationLevel, AttendanceClassConfig } from '../../types/academic';

// ═══════════════════════════════════════════════════
// DEFAULT BTECH SUBJECT CATALOG
// ═══════════════════════════════════════════════════

const DEFAULT_BTECH_SUBJECTS: SubjectOption[] = [
  // ─── ME - Mechanical Engineering ───
  // Year 1 Sem 1/2
  ...['Engineering Mathematics', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Mechanics', 'Basic Mechanical Engineering', 'Basic Electrical Engineering', 'Engineering Graphics']
    .map((name, i) => ({ id: `me-1-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ME', yearNumber: 1, active: true })),
  // Year 2 Sem 3
  ...['Strength of Materials', 'Thermodynamics', 'Fluid Mechanics', 'Manufacturing Processes', 'Material Science']
    .map((name, i) => ({ id: `me-3-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ME', yearNumber: 2, semesterNumber: 3, active: true })),
  // Year 2 Sem 4
  ...['Theory of Machines', 'Applied Thermodynamics', 'Fluid Machinery', 'Manufacturing Technology', 'Machine Drawing']
    .map((name, i) => ({ id: `me-4-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ME', yearNumber: 2, semesterNumber: 4, active: true })),
  // Year 3 Sem 5
  ...['Machine Design', 'Heat and Mass Transfer', 'Internal Combustion Engines', 'Dynamics of Machines', 'Industrial Engineering']
    .map((name, i) => ({ id: `me-5-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ME', yearNumber: 3, semesterNumber: 5, active: true })),
  // Year 3 Sem 6
  ...['Thermal Engineering and Gas Dynamics', 'Refrigeration and Air Conditioning', 'Automobile Engineering', 'Mechanical Vibrations', 'Power Plant Engineering', 'Robotics', 'CAD/CAM']
    .map((name, i) => ({ id: `me-6-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ME', yearNumber: 3, semesterNumber: 6, active: true })),
  // Year 4 Sem 7
  ...['Finite Element Method', 'Mechatronics', 'Operations Research', 'Renewable Energy Systems', 'Project Work Phase 1']
    .map((name, i) => ({ id: `me-7-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ME', yearNumber: 4, semesterNumber: 7, active: true })),
  // Year 4 Sem 8
  ...['Major Project', 'Industrial Training', 'Advanced Manufacturing', 'Energy Management']
    .map((name, i) => ({ id: `me-8-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ME', yearNumber: 4, semesterNumber: 8, active: true })),

  // ─── CSE - Computer Science Engineering ───
  // Year 1 Sem 1/2
  ...['Engineering Mathematics', 'Engineering Physics', 'Engineering Chemistry', 'Basic Computer Engineering', 'Programming in C', 'Basic Electrical Engineering']
    .map((name, i) => ({ id: `cse-1-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CSE', yearNumber: 1, active: true })),
  // Year 2 Sem 3
  ...['Data Structures', 'Digital Logic Design', 'Object Oriented Programming', 'Computer Organization', 'Discrete Mathematics']
    .map((name, i) => ({ id: `cse-3-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CSE', yearNumber: 2, semesterNumber: 3, active: true })),
  // Year 2 Sem 4
  ...['Database Management Systems', 'Operating Systems', 'Design and Analysis of Algorithms', 'Computer Networks', 'Software Engineering']
    .map((name, i) => ({ id: `cse-4-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CSE', yearNumber: 2, semesterNumber: 4, active: true })),
  // Year 3 Sem 5
  ...['Web Technology', 'Theory of Computation', 'Compiler Design', 'Artificial Intelligence', 'Data Communication']
    .map((name, i) => ({ id: `cse-5-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CSE', yearNumber: 3, semesterNumber: 5, active: true })),
  // Year 3 Sem 6
  ...['Machine Learning', 'Cloud Computing', 'Information Security', 'Internet of Things', 'Mobile Application Development']
    .map((name, i) => ({ id: `cse-6-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CSE', yearNumber: 3, semesterNumber: 6, active: true })),
  // Year 4 Sem 7
  ...['Big Data Analytics', 'Cyber Security', 'Distributed Systems', 'Project Work Phase 1']
    .map((name, i) => ({ id: `cse-7-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CSE', yearNumber: 4, semesterNumber: 7, active: true })),
  // Year 4 Sem 8
  ...['Major Project', 'Internship', 'Advanced AI', 'Blockchain Technology']
    .map((name, i) => ({ id: `cse-8-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CSE', yearNumber: 4, semesterNumber: 8, active: true })),

  // ─── CE - Civil Engineering ───
  ...['Strength of Materials', 'Surveying', 'Building Materials', 'Fluid Mechanics', 'Engineering Geology'].map((name, i) => ({ id: `ce-3-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CE', yearNumber: 2, semesterNumber: 3, active: true })),
  ...['Structural Analysis', 'Concrete Technology', 'Transportation Engineering', 'Hydraulics', 'Environmental Engineering'].map((name, i) => ({ id: `ce-4-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CE', yearNumber: 2, semesterNumber: 4, active: true })),
  ...['Design of RCC Structures', 'Geotechnical Engineering', 'Water Resources Engineering', 'Highway Engineering', 'Estimation and Costing'].map((name, i) => ({ id: `ce-5-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CE', yearNumber: 3, semesterNumber: 5, active: true })),
  ...['Design of Steel Structures', 'Foundation Engineering', 'Irrigation Engineering', 'Construction Planning and Management', 'Environmental Engineering II'].map((name, i) => ({ id: `ce-6-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CE', yearNumber: 3, semesterNumber: 6, active: true })),
  ...['Advanced Structural Design', 'Bridge Engineering', 'Remote Sensing and GIS', 'Project Work Phase 1'].map((name, i) => ({ id: `ce-7-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CE', yearNumber: 4, semesterNumber: 7, active: true })),
  ...['Major Project', 'Internship', 'Disaster Management'].map((name, i) => ({ id: `ce-8-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'CE', yearNumber: 4, semesterNumber: 8, active: true })),

  // ─── ECE - Electronics and Communication Engineering ───
  ...['Electronic Devices and Circuits', 'Network Analysis', 'Digital Electronics', 'Signals and Systems', 'Electromagnetic Theory'].map((name, i) => ({ id: `ece-3-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ECE', yearNumber: 2, semesterNumber: 3, active: true })),
  ...['Analog Circuits', 'Microprocessors', 'Communication Systems', 'Control Systems', 'Linear Integrated Circuits'].map((name, i) => ({ id: `ece-4-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ECE', yearNumber: 2, semesterNumber: 4, active: true })),
  ...['Digital Signal Processing', 'Antenna and Wave Propagation', 'VLSI Design', 'Embedded Systems', 'Digital Communication'].map((name, i) => ({ id: `ece-5-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ECE', yearNumber: 3, semesterNumber: 5, active: true })),
  ...['Microwave Engineering', 'Optical Communication', 'Wireless Communication', 'Internet of Things', 'Information Theory and Coding'].map((name, i) => ({ id: `ece-6-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ECE', yearNumber: 3, semesterNumber: 6, active: true })),
  ...['Satellite Communication', 'Radar Systems', 'Advanced VLSI', 'Project Work Phase 1'].map((name, i) => ({ id: `ece-7-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ECE', yearNumber: 4, semesterNumber: 7, active: true })),
  ...['Major Project', 'Internship', 'Advanced Communication Systems'].map((name, i) => ({ id: `ece-8-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'ECE', yearNumber: 4, semesterNumber: 8, active: true })),

  // ─── EEE - Electrical and Electronics Engineering ───
  ...['Electrical Machines I', 'Network Theory', 'Analog Electronics', 'Electromagnetic Fields', 'Electrical Measurements'].map((name, i) => ({ id: `eee-3-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'EEE', yearNumber: 2, semesterNumber: 3, active: true })),
  ...['Electrical Machines II', 'Power Systems I', 'Power Electronics', 'Control Systems', 'Digital Electronics'].map((name, i) => ({ id: `eee-4-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'EEE', yearNumber: 2, semesterNumber: 4, active: true })),
  ...['Power Systems II', 'Microprocessors and Microcontrollers', 'Electrical Drives', 'Switchgear and Protection', 'Renewable Energy Systems'].map((name, i) => ({ id: `eee-5-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'EEE', yearNumber: 3, semesterNumber: 5, active: true })),
  ...['High Voltage Engineering', 'Power System Analysis', 'Utilization of Electrical Energy', 'Industrial Automation', 'Smart Grid'].map((name, i) => ({ id: `eee-6-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'EEE', yearNumber: 3, semesterNumber: 6, active: true })),
  ...['Power System Operation and Control', 'Electric Vehicles', 'Energy Management', 'Project Work Phase 1'].map((name, i) => ({ id: `eee-7-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'EEE', yearNumber: 4, semesterNumber: 7, active: true })),
  ...['Major Project', 'Internship', 'Advanced Power Electronics'].map((name, i) => ({ id: `eee-8-${i}`, name, educationLevel: 'btech' as EducationLevel, departmentCode: 'EEE', yearNumber: 4, semesterNumber: 8, active: true })),
];

// IT: CSE Base + Additions
const itSubjects = DEFAULT_BTECH_SUBJECTS.filter(s => s.departmentCode === 'CSE').map(s => ({ ...s, id: s.id.replace('cse-', 'it-'), departmentCode: 'IT' }));
['Web Technologies', 'Data Mining', 'Network Security', 'Cloud Computing', 'Mobile Computing', 'Software Testing'].forEach((name, i) => {
  itSubjects.push({ id: `it-extra-${i}`, name, educationLevel: 'btech', departmentCode: 'IT', yearNumber: 3, active: true });
});
DEFAULT_BTECH_SUBJECTS.push(...itSubjects);

// AIML: CSE Base + Additions
const aimlSubjects = DEFAULT_BTECH_SUBJECTS.filter(s => s.departmentCode === 'CSE').map(s => ({ ...s, id: s.id.replace('cse-', 'aiml-'), departmentCode: 'AIML' }));
['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Neural Networks', 'Data Science'].forEach((name, i) => {
  aimlSubjects.push({ id: `aiml-extra-${i}`, name, educationLevel: 'btech', departmentCode: 'AIML', yearNumber: 3, active: true });
});
DEFAULT_BTECH_SUBJECTS.push(...aimlSubjects);

// AIDS: CSE Base + Additions
const aidsSubjects = DEFAULT_BTECH_SUBJECTS.filter(s => s.departmentCode === 'CSE').map(s => ({ ...s, id: s.id.replace('cse-', 'aids-'), departmentCode: 'AI/DS' }));
['Data Science', 'Big Data Analytics', 'Machine Learning', 'Deep Learning', 'Data Visualization', 'Artificial Intelligence', 'Data Mining'].forEach((name, i) => {
  aidsSubjects.push({ id: `aids-extra-${i}`, name, educationLevel: 'btech', departmentCode: 'AI/DS', yearNumber: 3, active: true });
});
DEFAULT_BTECH_SUBJECTS.push(...aidsSubjects);


// ═══════════════════════════════════════════════════
// DEFAULT SCHOOL SUBJECT CATALOG
// ═══════════════════════════════════════════════════

const DEFAULT_SCHOOL_SUBJECTS: SubjectOption[] = [];

// Classes 1-5
const primaryClasses = ['1', '2', '3', '4', '5'];
primaryClasses.forEach(cls => {
  ['English', 'Mathematics', 'Environmental Studies', 'Hindi', 'Malayalam', 'Computer'].forEach((name, i) => {
    DEFAULT_SCHOOL_SUBJECTS.push({ id: `sch-${cls}-${i}`, name, educationLevel: 'school', classLevel: cls, active: true });
  });
});

// Classes 6-10
const middleClasses = ['6', '7', '8', '9', '10'];
middleClasses.forEach(cls => {
  ['English', 'Hindi', 'Malayalam', 'Mathematics', 'Science', 'Social Science', 'Computer Science'].forEach((name, i) => {
    DEFAULT_SCHOOL_SUBJECTS.push({ id: `sch-${cls}-${i}`, name, educationLevel: 'school', classLevel: cls, active: true });
  });
});

// Classes 11-12
const highClasses = ['11', '12'];
highClasses.forEach(cls => {
  ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Accountancy', 'Business Studies', 'Economics', 'Political Science', 'History', 'Geography'].forEach((name, i) => {
    DEFAULT_SCHOOL_SUBJECTS.push({ id: `sch-${cls}-${i}`, name, educationLevel: 'school', classLevel: cls, active: true });
  });
});

// ═══════════════════════════════════════════════════
// SERVICE FUNCTIONS
// ═══════════════════════════════════════════════════

export const getDefaultBTechSubjects = () => DEFAULT_BTECH_SUBJECTS;
export const getDefaultSchoolSubjects = () => DEFAULT_SCHOOL_SUBJECTS;

/**
 * Loads subjects based on the provided configuration.
 * Prioritizes Firestore 'academicSubjects' collection. Falls back to default catalogs.
 */
export const loadSubjectsFromFirestoreOrDefault = async (
  config: AttendanceClassConfig
): Promise<SubjectOption[]> => {
  try {
    let query = firestore().collection('academicSubjects')
      .where('educationLevel', '==', config.educationLevel)
      .where('active', '==', true);
      
    if (config.educationLevel === 'btech' || config.educationLevel === 'college') {
      if (config.departmentCode) query = query.where('departmentCode', '==', config.departmentCode);
      if (config.yearNumber) query = query.where('yearNumber', '==', config.yearNumber);
      if (config.semesterNumber) query = query.where('semesterNumber', '==', config.semesterNumber);
    } else if (config.educationLevel === 'school' && config.classLevel) {
      query = query.where('classLevel', '==', config.classLevel);
    }

    const snapshot = await query.get();
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubjectOption));
    }
  } catch (error) {
    console.error('Failed to load subjects from Firestore, falling back to defaults', error);
  }

  // Fallback to defaults
  let filtered = config.educationLevel === 'school' ? DEFAULT_SCHOOL_SUBJECTS : DEFAULT_BTECH_SUBJECTS;
  
  if (config.educationLevel === 'btech' || config.educationLevel === 'college') {
    filtered = filtered.filter(s => 
      (!config.departmentCode || s.departmentCode === config.departmentCode) &&
      (!config.yearNumber || s.yearNumber === config.yearNumber) &&
      (!config.semesterNumber || s.semesterNumber === config.semesterNumber || !s.semesterNumber) // allow subjects that don't have sem specific if missing
    );
  } else if (config.educationLevel === 'school') {
    filtered = filtered.filter(s => !config.classLevel || s.classLevel === config.classLevel);
  }

  return filtered;
};

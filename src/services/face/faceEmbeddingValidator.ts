import firestore from '@react-native-firebase/firestore';

export const EXPECTED_FACE_EMBEDDING_SIZE = 128;

export type FaceEmbeddingValidationResult = {
  valid: boolean;
  reason: string | null;
  studentId: string | null;
  embedding: number[] | null;
  data: Record<string, any>;
};

type FirestoreDocLike = {
  id?: string;
  exists?: boolean;
  data?: () => Record<string, any> | undefined;
};

const getDocData = (doc: FirestoreDocLike | Record<string, any>) => {
  if (typeof (doc as FirestoreDocLike).data === 'function') {
    return ((doc as FirestoreDocLike).data?.() || {}) as Record<string, any>;
  }
  return (doc || {}) as Record<string, any>;
};

const hasAcademicFields = (data: Record<string, any>, userData?: Record<string, any> | null) => {
  const level = data.educationLevel || userData?.educationLevel;
  const hasYear =
    (data.yearNumber !== undefined && data.yearNumber !== null) ||
    (userData?.yearNumber !== undefined && userData?.yearNumber !== null) ||
    !!data.year ||
    !!userData?.year;
  const hasSemester =
    (data.semesterNumber !== undefined && data.semesterNumber !== null) ||
    (userData?.semesterNumber !== undefined && userData?.semesterNumber !== null) ||
    !!data.semester ||
    !!userData?.semester;

  if (!level) return false;

  if (level === 'school') {
    return !!(data.classLevel || data.className || userData?.classLevel || userData?.className);
  }

  return !!(
    (data.departmentCode || data.department || userData?.departmentCode || userData?.department) &&
    hasYear &&
    hasSemester
  );
};

export const validateFaceEmbeddingDoc = async (
  doc: FirestoreDocLike | Record<string, any>,
  expectedStudentId?: string,
  loadedUserData?: Record<string, any> | null
): Promise<FaceEmbeddingValidationResult> => {
  const data = getDocData(doc);
  const studentId = data.studentId || data.uid || null;
  const embedding = data.embedding || data.embeddings || null;

  if (!studentId) {
    return {
      valid: false,
      reason: 'Embedding not linked to student',
      studentId: null,
      embedding: null,
      data,
    };
  }

  if (expectedStudentId && studentId !== expectedStudentId) {
    return {
      valid: false,
      reason: 'Embedding belongs to a different student',
      studentId,
      embedding: null,
      data,
    };
  }

  if (!Array.isArray(embedding)) {
    return {
      valid: false,
      reason: 'No embedding found',
      studentId,
      embedding: null,
      data,
    };
  }

  if (!embedding.every(value => typeof value === 'number' && Number.isFinite(value))) {
    return {
      valid: false,
      reason: 'Invalid embedding values',
      studentId,
      embedding: null,
      data,
    };
  }

  const expectedSize = Number(data.embeddingSize || EXPECTED_FACE_EMBEDDING_SIZE);
  if (embedding.length !== EXPECTED_FACE_EMBEDDING_SIZE && embedding.length !== expectedSize) {
    return {
      valid: false,
      reason: 'Invalid embedding length',
      studentId,
      embedding: null,
      data,
    };
  }

  if (!data.modelName) {
    return {
      valid: false,
      reason: 'Missing model name',
      studentId,
      embedding: null,
      data,
    };
  }

  let userData = loadedUserData || null;
  if (!hasAcademicFields(data, userData)) {
    const userDoc = await firestore().collection('users').doc(studentId).get();
    userData = userDoc.exists ? userDoc.data() || null : null;
  }

  if (!hasAcademicFields(data, userData)) {
    return {
      valid: false,
      reason: 'Missing academic fields',
      studentId,
      embedding: null,
      data,
    };
  }

  return {
    valid: true,
    reason: null,
    studentId,
    embedding,
    data: { ...(userData || {}), ...data },
  };
};

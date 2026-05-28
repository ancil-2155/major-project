import { cosineSimilarity, l2Distance } from '../face/embeddingMathService';

export interface ClassStudent {
  uid: string;
  name: string;
  rollNo?: string | null;
  embedding: number[];
}

export type FaceMatchMethod = 'euclidean' | 'cosine';

export interface FaceMatchResult {
  matched: boolean;
  studentId: string | null;
  studentName: string | null;
  rollNo?: string | null;
  score: number;
  secondBestScore: number | null;
  confidence: 'high' | 'medium' | 'low';
  method: FaceMatchMethod;
}

export const MATCH_METHOD: FaceMatchMethod = 'euclidean';
export const MATCH_THRESHOLD = 0.9;
export const COSINE_MATCH_THRESHOLD = 0.65;

export const isMatch = (
  score: number,
  threshold: number = MATCH_THRESHOLD,
  method: FaceMatchMethod = MATCH_METHOD
): boolean => {
  return method === 'cosine' ? score >= threshold : score <= threshold;
};

const getConfidence = (
  matched: boolean,
  bestScore: number,
  secondBestScore: number | null,
  method: FaceMatchMethod
): 'high' | 'medium' | 'low' => {
  if (!matched) return 'low';
  if (secondBestScore === null) return 'high';

  const gap =
    method === 'cosine'
      ? bestScore - secondBestScore
      : secondBestScore - bestScore;

  if (gap <= 0.12) return 'low';
  if (gap <= 0.24) return 'medium';
  return 'high';
};

export const findBestFaceMatch = (
  liveEmbedding: number[],
  storedEmbeddings: ClassStudent[],
  method: FaceMatchMethod = MATCH_METHOD
): FaceMatchResult => {
  let bestMatch: ClassStudent | null = null;
  let bestScore = method === 'cosine' ? -1 : Number.POSITIVE_INFINITY;
  let secondBestScore: number | null = null;

  for (const student of storedEmbeddings) {
    if (!student.embedding || student.embedding.length !== liveEmbedding.length) {
      continue;
    }

    const score =
      method === 'cosine'
        ? cosineSimilarity(liveEmbedding, student.embedding)
        : l2Distance(liveEmbedding, student.embedding);

    const better = method === 'cosine' ? score > bestScore : score < bestScore;
    if (better) {
      secondBestScore = bestMatch ? bestScore : secondBestScore;
      bestScore = score;
      bestMatch = student;
      continue;
    }

    if (secondBestScore === null) {
      secondBestScore = score;
      continue;
    }

    const secondBetter =
      method === 'cosine' ? score > secondBestScore : score < secondBestScore;
    if (secondBetter) {
      secondBestScore = score;
    }
  }

  if (!bestMatch) {
    return {
      matched: false,
      studentId: null,
      studentName: null,
      score: method === 'cosine' ? -1 : Number.POSITIVE_INFINITY,
      secondBestScore: null,
      confidence: 'low',
      method,
    };
  }

  const threshold = method === 'cosine' ? COSINE_MATCH_THRESHOLD : MATCH_THRESHOLD;
  const thresholdMatched = isMatch(bestScore, threshold, method);
  const confidence = getConfidence(thresholdMatched, bestScore, secondBestScore, method);

  return {
    matched: thresholdMatched && confidence !== 'low',
    studentId: bestMatch.uid,
    studentName: bestMatch.name,
    rollNo: bestMatch.rollNo,
    score: bestScore,
    secondBestScore,
    confidence,
    method,
  };
};

export const findBestMatch = (
  liveEmbedding: number[],
  classEmbeddings: ClassStudent[]
): FaceMatchResult | null => {
  const result = findBestFaceMatch(liveEmbedding, classEmbeddings);
  return result.studentId ? result : null;
};

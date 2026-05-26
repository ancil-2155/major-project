import { MatchResult } from '../../types/attendance';

export interface ClassStudent {
  uid: string;
  name: string;
  rollNo?: string;
  embedding: number[];
}

// Configurable threshold for Euclidean distance matching
// NOTE: This must be tested with real student data to find the optimal balance 
// between false positives and false negatives. 0.9 is a standard starting point for L2-normalized FaceNet.
export const MATCH_THRESHOLD = 0.9;

export const normalizeEmbedding = (embedding: number[]): number[] => {
  const sum = embedding.reduce((acc, val) => acc + val * val, 0);
  const norm = Math.sqrt(sum);
  if (norm === 0) return embedding;
  return embedding.map(val => val / norm);
};

export const l2Distance = (emb1: number[], emb2: number[]): number => {
  if (emb1.length !== emb2.length) return 999;
  let sum = 0;
  for (let i = 0; i < emb1.length; i++) {
    const diff = emb1[i] - emb2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

export const cosineSimilarity = (emb1: number[], emb2: number[]): number => {
  if (emb1.length !== emb2.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < emb1.length; i++) {
    dotProduct += emb1[i] * emb2[i];
    normA += emb1[i] * emb1[i];
    normB += emb2[i] * emb2[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const isMatch = (score: number, threshold: number = MATCH_THRESHOLD): boolean => {
  return score < threshold;
};

export const findBestMatch = (
  liveEmbedding: number[],
  classEmbeddings: ClassStudent[]
): MatchResult | null => {
  if (classEmbeddings.length === 0) return null;

  let bestMatch: ClassStudent | null = null;
  let secondBestMatch: ClassStudent | null = null;
  let bestScore = 999;
  let secondBestScore = 999;

  for (const student of classEmbeddings) {
    if (!student.embedding || student.embedding.length !== liveEmbedding.length) {
      continue;
    }

    const distance = l2Distance(liveEmbedding, student.embedding);

    if (distance < bestScore) {
      secondBestScore = bestScore;
      secondBestMatch = bestMatch;

      bestScore = distance;
      bestMatch = student;
    } else if (distance < secondBestScore) {
      secondBestScore = distance;
      secondBestMatch = student;
    }
  }

  if (!bestMatch) return null;

  // Safe matching rule implementation:
  // Calculate confidence based on the gap between the best match and the second best match.
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (bestScore < MATCH_THRESHOLD) {
    const scoreDiff = secondBestScore - bestScore;
    if (scoreDiff > 0.3) {
      confidence = 'high';
    } else if (scoreDiff > 0.15) {
      confidence = 'medium';
    } else {
      confidence = 'low'; // Best and second-best are very close
    }
  }

  return {
    studentId: bestMatch.uid,
    studentName: bestMatch.name,
    rollNo: bestMatch.rollNo,
    score: bestScore,
    confidence,
  };
};

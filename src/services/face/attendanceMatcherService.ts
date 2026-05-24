import { euclideanDistance } from './embeddingMathService';

// The threshold for FaceNet embeddings to be considered a match.
// This might need tuning based on real-world testing (usually around 0.8 - 1.0 for L2 normalized FaceNet).
const MATCH_THRESHOLD = 0.9;

export interface StudentFaceData {
  uid: string;
  name?: string;
  rollNo?: string;
  embedding: number[];
}

export interface MatchResult {
  matched: boolean;
  student?: StudentFaceData;
  distance: number;
}

/**
 * Compares a live face embedding against an array of enrolled student embeddings.
 * Returns the closest match if it falls below the predefined threshold.
 */
export const findClosestMatch = (
  liveEmbedding: number[],
  studentDatabase: StudentFaceData[]
): MatchResult => {
  if (studentDatabase.length === 0) {
    return { matched: false, distance: 999 };
  }

  let bestMatch: StudentFaceData | undefined = undefined;
  let lowestDistance = 999;

  for (const student of studentDatabase) {
    if (!student.embedding || student.embedding.length !== liveEmbedding.length) {
      continue;
    }

    const distance = euclideanDistance(liveEmbedding, student.embedding);

    if (distance < lowestDistance) {
      lowestDistance = distance;
      bestMatch = student;
    }
  }

  if (lowestDistance < MATCH_THRESHOLD && bestMatch) {
    return { matched: true, student: bestMatch, distance: lowestDistance };
  }

  return { matched: false, distance: lowestDistance };
};

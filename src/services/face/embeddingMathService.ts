/**
 * Normalizes an embedding vector using L2 normalization.
 * FaceNet models output 128D embeddings that should be normalized
 * to calculate cosine distance easily later.
 */
export const normalizeEmbedding = (embedding: number[]): number[] => {
  const sum = embedding.reduce((acc, val) => acc + val * val, 0);
  const norm = Math.sqrt(sum);
  if (norm === 0) return embedding; // Prevent division by zero
  return embedding.map(val => val / norm);
};

/**
 * Averages an array of embedding vectors and normalizes the result.
 * This is used to create a single robust face profile from Front, Left, and Right captures.
 */
export const averageEmbeddings = (embeddings: number[][]): number[] => {
  if (embeddings.length === 0) return [];
  const length = embeddings[0].length;
  const avg = new Array(length).fill(0);
  
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = 0; j < length; j++) {
      avg[j] += embeddings[i][j];
    }
  }
  
  for (let j = 0; j < length; j++) {
    avg[j] /= embeddings.length;
  }
  
  return normalizeEmbedding(avg);
};

/**
 * Calculates the Euclidean distance between two embeddings.
 * FaceNet embeddings threshold is typically ~1.0 for Euclidean distance, 
 * but requires testing depending on the specific model variant.
 */
export const euclideanDistance = (emb1: number[], emb2: number[]): number => {
  if (emb1.length !== emb2.length) throw new Error('Embeddings must have the same length');
  let sum = 0;
  for (let i = 0; i < emb1.length; i++) {
    const diff = emb1[i] - emb2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

// Backward-compatible alias used by attendance matching service.
export const l2Distance = euclideanDistance;

/**
 * Calculates Cosine Similarity between two embeddings.
 * Returns a value between -1 and 1, where 1 means identical.
 */
export const cosineSimilarity = (emb1: number[], emb2: number[]): number => {
  if (emb1.length !== emb2.length) throw new Error('Embeddings must have the same length');
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

import OpenAI from 'openai';
import { config } from '../config';
import logger from './logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generate embeddings for text using OpenAI's embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding generated');
    }
    return embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find top K most similar vectors
 */
export function findTopKSimilar(
  queryVector: number[],
  vectors: Array<{ id: string; vector: number[]; data: any }>,
  k: number = 3
): Array<{ id: string; similarity: number; data: any }> {
  const similarities = vectors.map(({ id, vector, data }) => ({
    id,
    similarity: cosineSimilarity(queryVector, vector),
    data,
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(
      texts.map(text => generateEmbedding(text))
    );
    return embeddings;
  } catch (error) {
    logger.error('Error generating batch embeddings:', error);
    throw new Error(`Failed to generate batch embeddings: ${error}`);
  }
} 
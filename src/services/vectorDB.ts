import { DocumentChunk, SearchResult } from '../types';
import { generateEmbedding, findTopKSimilar } from '../utils/embeddings';
import logger from '../utils/logger';

export class VectorDBService {
  private documents: Array<{
    id: string;
    content: string;
    source: string;
    metadata: Record<string, any>;
    embedding: number[];
  }> = [];

  /**
   * Add document chunks to the vector database
   */
  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    try {
      logger.info(`Adding ${chunks.length} document chunks to vector database`);

      // Generate embeddings for all chunks
      const embeddings = await Promise.all(
        chunks.map(chunk => generateEmbedding(chunk.content))
      );

      // Store documents with embeddings
      for (let i = 0; i < chunks.length; i++) {
        const embedding = embeddings[i];
        if (embedding) {
          this.documents.push({
            id: chunks[i]?.id || `chunk_${i}`,
            content: chunks[i]?.content || '',
            source: chunks[i]?.source || 'unknown',
            metadata: chunks[i]?.metadata || {},
            embedding,
          });
        }
      }

      logger.info(`Successfully added ${chunks.length} chunks to vector database`);
    } catch (error) {
      logger.error('Error adding documents to vector database:', error);
      throw new Error(`Failed to add documents: ${error}`);
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string,
    topK: number = 3,
    threshold: number = 0.7
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query);

      // Find similar documents
      const similarDocs = findTopKSimilar(
        queryEmbedding,
        this.documents.map(doc => ({
          id: doc.id,
          vector: doc.embedding,
          data: {
            content: doc.content,
            source: doc.source,
            metadata: doc.metadata,
          },
        })),
        topK
      );

      // Filter by threshold and format results
      const searchResults: SearchResult[] = similarDocs
        .filter(result => result.similarity >= threshold)
        .map(result => ({
          content: result.data.content,
          source: result.data.source,
          similarity: result.similarity,
          metadata: result.data.metadata,
        }));

      logger.info(`Found ${searchResults.length} relevant documents for query`);
      return searchResults;
    } catch (error) {
      logger.error('Error searching vector database:', error);
      throw new Error(`Failed to search documents: ${error}`);
    }
  }

  /**
   * Get database statistics
   */
  getStats(): { count: number; name: string } {
    return {
      count: this.documents.length,
      name: 'in_memory_vector_db',
    };
  }

  /**
   * Clear all documents from the database
   */
  clearDatabase(): void {
    this.documents = [];
    logger.info('Cleared vector database');
  }

  /**
   * Get all documents (for debugging)
   */
  getAllDocuments(): Array<{
    id: string;
    content: string;
    source: string;
    metadata: Record<string, any>;
  }> {
    return this.documents.map(doc => ({
      id: doc.id,
      content: doc.content,
      source: doc.source,
      metadata: doc.metadata,
    }));
  }
}

// Export singleton instance
export const vectorDBService = new VectorDBService(); 
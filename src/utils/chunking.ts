import fs from 'fs';
import path from 'path';
import { DocumentChunk } from '../types';
import logger from './logger';

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.7) {
        chunk = text.slice(start, breakPoint + 1);
        start = breakPoint + 1;
      } else {
        start = end - overlap;
      }
    } else {
      start = end;
    }

    // Clean up the chunk
    chunk = chunk.trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Process markdown file and create chunks
 */
export function processMarkdownFile(
  filePath: string,
  chunkSize: number = 1000,
  overlap: number = 200
): DocumentChunk[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    
    // Remove markdown metadata (frontmatter)
    const cleanContent = removeFrontmatter(content);
    
    // Split into chunks
    const chunks = chunkText(cleanContent, chunkSize, overlap);
    
    // Create document chunks
    return chunks.map((chunk, index) => ({
      id: `${fileName}_chunk_${index}`,
      content: chunk,
      source: fileName,
      metadata: {
        chunkIndex: index,
        totalChunks: chunks.length,
        filePath,
        chunkSize: chunk.length,
      },
    }));
  } catch (error) {
    logger.error(`Error processing markdown file ${filePath}:`, error);
    throw new Error(`Failed to process markdown file: ${error}`);
  }
}

/**
 * Remove YAML frontmatter from markdown content
 */
function removeFrontmatter(content: string): string {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  return content.replace(frontmatterRegex, '');
}

/**
 * Process multiple markdown files
 */
export function processMarkdownFiles(
  filePaths: string[],
  chunkSize: number = 1000,
  overlap: number = 200
): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];
  
  for (const filePath of filePaths) {
    try {
      const chunks = processMarkdownFile(filePath, chunkSize, overlap);
      allChunks.push(...chunks);
      logger.info(`Processed ${filePath}: ${chunks.length} chunks`);
    } catch (error) {
      logger.error(`Failed to process ${filePath}:`, error);
      // Continue with other files
    }
  }
  
  return allChunks;
}

/**
 * Load markdown files from a directory
 */
export function loadMarkdownFilesFromDirectory(dirPath: string): string[] {
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(dirPath, file));
  } catch (error) {
    logger.error(`Error reading directory ${dirPath}:`, error);
    throw new Error(`Failed to read directory: ${error}`);
  }
} 
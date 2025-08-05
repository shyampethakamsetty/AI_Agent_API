import { AgentMessage, AgentResponse, PromptContext } from '../types';
import { vectorDBService } from './vectorDB';
import { memoryService } from './memory';
import { pluginManager } from './plugins';
import { llmService } from './llm';
import { config } from '../config';
import logger from '../utils/logger';

export class AgentService {
  /**
   * Process a message and generate a response
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      logger.info(`Processing message for session: ${message.session_id}`);

      // Step 1: Get session memory
      const memory = await memoryService.getSession(message.session_id);
      const memorySummary = await memoryService.createMemorySummary(message.session_id);

      // Step 2: Detect intent first to determine workflow
      const intent = await pluginManager.detectIntent(message.message);

      // Step 3: Execute plugins if needed
      const pluginResults = await pluginManager.executePlugins(intent);

      // Step 4: Only do RAG if no plugins were called or if it's a knowledge query
      let contextChunks: string[] = [];
      if (intent.plugins.length === 0 || intent.type === 'general_knowledge') {
        const searchResults = await vectorDBService.search(
          message.message,
          config.rag.topK,
          config.rag.similarityThreshold
        );
        
        contextChunks = searchResults.map(result => result.content);
        logger.info(`Found ${contextChunks.length} relevant documents for query`);
      }

      // Step 5: Construct prompt context
      const promptContext: PromptContext = {
        systemInstructions: llmService.getDefaultSystemInstructions(),
        memory,
        context: contextChunks,
        plugins: pluginResults,
        userMessage: message.message,
      };

      // Step 6: Generate response using LLM
      const response = await llmService.generateResponse(promptContext);

      // Step 7: Update memory
      await memoryService.addMessage(message.session_id, 'user', message.message);
      await memoryService.addMessage(message.session_id, 'assistant', response);

      // Step 8: Create response object
      const agentResponse: AgentResponse = {
        response,
        session_id: message.session_id,
        context_used: contextChunks,
        plugins_called: intent.plugins,
        timestamp: new Date().toISOString(),
      };

      const processingTime = Date.now() - startTime;
      logger.info(`Message processed successfully in ${processingTime}ms`);

      return agentResponse;
    } catch (error) {
      logger.error('Error processing message:', error);
      
      // Return error response
      return {
        response: `I apologize, but I encountered an error while processing your message: ${error}`,
        session_id: message.session_id,
        context_used: [],
        plugins_called: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Initialize the agent (load documents, setup services)
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AI Agent...');

      // Test LLM connection
      const llmConnected = await llmService.testConnection();
      if (!llmConnected) {
        throw new Error('Failed to connect to OpenAI');
      }
      logger.info('LLM connection established');

      // Load and process markdown documents
      await this.loadDocuments();

      logger.info('AI Agent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Agent:', error);
      throw error;
    }
  }

  /**
   * Load and process markdown documents
   */
  private async loadDocuments(): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Path to the sample markdown files
      const docsPath = path.join(process.cwd(), 'assignment_details', 'sample-md-files');
      
      if (!fs.existsSync(docsPath)) {
        logger.warn('Sample documents directory not found, skipping document loading');
        return;
      }

      // Get all markdown files
      const files = fs.readdirSync(docsPath)
        .filter((file: string) => file.endsWith('.md'))
        .map((file: string) => path.join(docsPath, file));

      if (files.length === 0) {
        logger.warn('No markdown files found in documents directory');
        return;
      }

      logger.info(`Found ${files.length} markdown files to process`);

      // Process documents
      const { processMarkdownFiles } = require('../utils/chunking');
      const chunks = processMarkdownFiles(files, config.rag.chunkSize, config.rag.chunkOverlap);

      // Add to vector database
      await vectorDBService.addDocuments(chunks);

      logger.info(`Successfully loaded ${chunks.length} document chunks`);
    } catch (error) {
      logger.error('Error loading documents:', error);
      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  async getStats(): Promise<{
    vectorDB: { count: number; name: string };
    memory: { totalSessions: number; totalMessages: number };
    plugins: Array<{ name: string; description: string }>;
  }> {
    return {
      vectorDB: vectorDBService.getStats(),
      memory: memoryService.getStats(),
      plugins: pluginManager.getPlugins().map(p => ({
        name: p.name,
        description: p.description,
      })),
    };
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    vectorDBService.clearDatabase();
    memoryService.clearAllSessions();
    logger.info('All agent data cleared');
  }
}

// Export singleton instance
export const agentService = new AgentService(); 
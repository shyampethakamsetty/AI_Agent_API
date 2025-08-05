import dotenv from 'dotenv';
import { LLMConfig, ChromaConfig } from '../types';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
  } as LLMConfig,
  
  // ChromaDB configuration
  chroma: {
    host: process.env.CHROMADB_HOST || 'localhost',
    port: parseInt(process.env.CHROMADB_PORT || '8000', 10),
    collection_name: process.env.CHROMADB_COLLECTION_NAME || 'ai_agent_docs',
  } as ChromaConfig,
  
  // Weather API configuration (WeatherAPI.com)
  weather: {
    apiKey: process.env.WEATHER_API_KEY || '7d699ec4a3734231b3450454250508',
    baseUrl: 'http://api.weatherapi.com/v1',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // RAG configuration
  rag: {
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 3,
    similarityThreshold: 0.7,
  },
  
  // Memory configuration
  memory: {
    maxMessagesPerSession: 10,
    maxSessions: 1000,
  },
  
  // Plugin configuration
  plugins: {
    weather: {
      enabled: true,
      cacheTimeout: 300000, // 5 minutes
    },
    math: {
      enabled: true,
    },
  },
};

// Validation
export function validateConfig(): void {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Export individual config sections for convenience
export const { openai, chroma, weather, logging, rag, memory, plugins } = config; 
// Core message types
export interface AgentMessage {
  message: string;
  session_id: string;
}

export interface AgentResponse {
  response: string;
  session_id: string;
  context_used: string[];
  plugins_called: string[];
  timestamp: string;
}

// Memory types
export interface MemoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SessionMemory {
  session_id: string;
  messages: MemoryEntry[];
  last_updated: Date;
}

// RAG types
export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  metadata: Record<string, any>;
}

export interface SearchResult {
  content: string;
  source: string;
  similarity: number;
  metadata: Record<string, any>;
}

// Plugin types
export interface Plugin {
  name: string;
  description: string;
  keywords: string[];
  execute: (params: any) => Promise<PluginResult>;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface IntentDetection {
  type: 'general_knowledge' | 'weather_query' | 'math_query' | 'plugin_request';
  plugins: string[];
  confidence: number;
  extracted_params?: Record<string, any>;
}

// Weather plugin types
export interface WeatherParams {
  location: string;
  time?: string;
}

export interface WeatherResult {
  temperature: string;
  condition: string;
  humidity: string;
  wind: string;
  location: string;
}

// Math plugin types
export interface MathParams {
  expression: string;
}

export interface MathResult {
  expression: string;
  result: number;
  steps: string;
}

// LLM types
export interface LLMConfig {
  apiKey: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface PromptContext {
  systemInstructions: string;
  memory: MemoryEntry[];
  context: string[];
  plugins: PluginResult[];
  userMessage: string;
  memorySummary?: string;
}

// ChromaDB types
export interface ChromaConfig {
  host: string;
  port: number;
  collection_name: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  code: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
} 
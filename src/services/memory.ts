import { MemoryEntry, SessionMemory } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

export class MemoryService {
  private sessions: Map<string, SessionMemory> = new Map();

  /**
   * Get session memory
   */
  async getSession(sessionId: string): Promise<MemoryEntry[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    // Return last N messages (configurable)
    const maxMessages = config.memory.maxMessagesPerSession;
    return session.messages.slice(-maxMessages);
  }

  /**
   * Add message to session memory
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const message: MemoryEntry = {
      role,
      content,
      timestamp: new Date(),
    };

    if (!this.sessions.has(sessionId)) {
      // Create new session
      this.sessions.set(sessionId, {
        session_id: sessionId,
        messages: [message],
        last_updated: new Date(),
      });
    } else {
      // Add to existing session
      const session = this.sessions.get(sessionId)!;
      session.messages.push(message);
      session.last_updated = new Date();

      // Limit messages per session
      const maxMessages = config.memory.maxMessagesPerSession;
      if (session.messages.length > maxMessages) {
        session.messages = session.messages.slice(-maxMessages);
      }
    }

    // Clean up old sessions if we have too many
    this.cleanupOldSessions();
  }

  /**
   * Create a concise summary of the last two messages in the session
   */
  async createMemorySummary(sessionId: string): Promise<string> {
    const messages = await this.getSession(sessionId);

    if (messages.length === 0) {
      return 'No previous conversation';
    }

    const lastTwo = messages.slice(-2);

    const format = (entry: MemoryEntry) => {
      // Collapse whitespace and truncate long messages for brevity
      const collapsed = entry.content.replace(/\s+/g, ' ').trim();
      return `${entry.role}: ${collapsed.length > 240 ? collapsed.slice(0, 237) + '...' : collapsed}`;
    };

    return lastTwo.map(format).join(' | ');
  }

  /**
   * Extract topics from messages
   */
  private extractTopics(messages: MemoryEntry[]): string[] {
    const topics = new Set<string>();
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Simple keyword extraction
      const keywords = [
        'markdown', 'blogging', 'weather', 'math', 'calculation',
        'programming', 'code', 'documentation', 'writing', 'content'
      ];
      
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      }
    }
    
    return Array.from(topics);
  }

  /**
   * Clean up old sessions
   */
  private cleanupOldSessions(): void {
    const maxSessions = config.memory.maxSessions;
    
    if (this.sessions.size > maxSessions) {
      // Sort sessions by last updated time
      const sortedSessions = Array.from(this.sessions.entries())
        .sort((a, b) => a[1].last_updated.getTime() - b[1].last_updated.getTime());
      
      // Remove oldest sessions
      const sessionsToRemove = sortedSessions.slice(0, this.sessions.size - maxSessions);
      
      for (const [sessionId] of sessionsToRemove) {
        this.sessions.delete(sessionId);
      }
      
      logger.info(`Cleaned up ${sessionsToRemove.length} old sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getStats(): { totalSessions: number; totalMessages: number } {
    let totalMessages = 0;
    
    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
    }
    
    return {
      totalSessions: this.sessions.size,
      totalMessages,
    };
  }

  /**
   * Clear a specific session
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    logger.info(`Cleared session: ${sessionId}`);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
    logger.info('Cleared all sessions');
  }
}

// Export singleton instance
export const memoryService = new MemoryService(); 
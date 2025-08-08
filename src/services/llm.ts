import OpenAI from 'openai';
import { config } from '../config';
import { PromptContext } from '../types';
import logger from '../utils/logger';

export class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Generate response using OpenAI
   */
  async generateResponse(promptContext: PromptContext): Promise<string> {
    try {
      const prompt = this.constructPrompt(promptContext);
      
      logger.info('Generating LLM response...');
      
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
        ],
        temperature: config.openai.temperature,
        max_tokens: config.openai.max_tokens,
      });

      const generatedResponse = response.choices[0]?.message?.content;
      
      if (!generatedResponse) {
        throw new Error('No response generated from OpenAI');
      }

      logger.info('LLM response generated successfully');
      return generatedResponse;
    } catch (error) {
      logger.error('Error generating LLM response:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Construct the system prompt
   */
  private constructPrompt(context: PromptContext): string {
    let prompt = context.systemInstructions + '\n\n';

    // Add memory summary (last two messages)
    if (context.memorySummary && context.memorySummary.trim().length > 0) {
      prompt += 'MEMORY SUMMARY (last 2):\n';
      prompt += `${context.memorySummary}\n\n`;
    }

    // Add memory context (raw recent turns)
    if (context.memory.length > 0) {
      prompt += 'MEMORY CONTEXT:\n';
      prompt += this.formatMemory(context.memory);
      prompt += '\n\n';
    }

    // Add retrieved context
    if (context.context.length > 0) {
      prompt += 'RELEVANT DOCUMENTATION:\n';
      context.context.forEach((chunk, i) => {
        prompt += `[Chunk ${i + 1}] ${chunk}\n`;
      });
      prompt += '\n';
    }

    // Add plugin outputs
    if (context.plugins.length > 0) {
      prompt += 'PLUGIN OUTPUTS:\n';
      context.plugins.forEach(plugin => {
        if (plugin.success && plugin.data) {
          // Format weather data
          if (plugin.data.temperature && plugin.data.location) {
            prompt += `Weather for ${plugin.data.location}: ${plugin.data.temperature}, ${plugin.data.condition}, Humidity: ${plugin.data.humidity}, Wind: ${plugin.data.wind}\n`;
          }
          // Format math data
          else if (plugin.data.expression && plugin.data.result !== undefined) {
            prompt += `Math calculation: ${plugin.data.expression} = ${plugin.data.result}${plugin.data.steps ? ` (${plugin.data.steps})` : ''}\n`;
          }
          // Generic format for other plugins
          else {
            prompt += `${JSON.stringify(plugin.data)}\n`;
          }
        } else if (plugin.error) {
          prompt += `Error: ${plugin.error}\n`;
        }
      });
      prompt += '\n';
    }

    // Add user message
    prompt += `USER MESSAGE:\n${context.userMessage}`;

    return prompt;
  }

  /**
   * Format memory for prompt
   */
  private formatMemory(memory: Array<{ role: string; content: string }>): string {
    return memory
      .slice(-4) // Last 4 messages
      .map(entry => `${entry.role}: ${entry.content}`)
      .join('\n');
  }

  /**
   * Get default system instructions
   */
  getDefaultSystemInstructions(): string {
    return `You are an intelligent AI assistant with expertise in Markdown, blogging, and technical writing. You have access to relevant documentation and can execute plugins when needed.

Your responses should be:
- Helpful and informative
- Based on the provided context when available
- Natural and conversational
- Accurate and well-structured
- Professional yet friendly

When using plugin outputs, incorporate them naturally into your response. If you're asked about weather, provide the weather information clearly. If you're asked to calculate something, show the calculation and result.

Always be helpful and provide detailed, accurate information based on the context provided.`;
  }

  /**
   * Test the LLM connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });
      
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      logger.error('LLM connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const llmService = new LLMService(); 
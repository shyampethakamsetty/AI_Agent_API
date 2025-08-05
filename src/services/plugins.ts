import axios from 'axios';
import * as math from 'mathjs';
import { Plugin, PluginResult, IntentDetection, WeatherParams, WeatherResult, MathParams, MathResult } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Weather Plugin
 */
class WeatherPlugin implements Plugin {
  name = 'weather';
  description = 'Get current weather information for a location';
  keywords = ['weather', 'temperature', 'forecast', 'climate', 'hot', 'cold', 'rain', 'sunny'];

  async execute(params: WeatherParams): Promise<PluginResult> {
    try {
      const weatherUrl = `${config.weather.baseUrl}/current.json?key=${config.weather.apiKey}&q=${encodeURIComponent(params.location)}`;
      const weatherResponse = await axios.get(weatherUrl, { timeout: 10000 });
      const weatherData = weatherResponse.data;
      
      if (!weatherData.current || !weatherData.location) {
        return {
          success: false,
          error: `Location not found: ${params.location}`,
        };
      }
      
      const { current, location } = weatherData;
      
      const weatherResult: WeatherResult = {
        temperature: `${Math.round(current.temp_c)}°C`,
        condition: current.condition.text,
        humidity: `${current.humidity}%`,
        wind: `${current.wind_kph} km/h`,
        location: location.name,
      };

      return {
        success: true,
        data: weatherResult,
      };
    } catch (error) {
      logger.error('Weather plugin error:', error);
      return {
        success: false,
        error: `Failed to get weather data: ${error}`,
      };
    }
  }
}

/**
 * Math Plugin
 */
class MathPlugin implements Plugin {
  name = 'math';
  description = 'Evaluate mathematical expressions';
  keywords = ['calculate', 'solve', 'math', 'compute', 'add', 'subtract', 'multiply', 'divide', '+', '-', '*', '/', '=', 'equation'];

  async execute(params: MathParams): Promise<PluginResult> {
    try {
      // Clean the expression
      const cleanExpression = params.expression
        .replace(/[^\d+\-*/().\s]/g, '') // Remove non-math characters
        .trim();

      if (!cleanExpression) {
        return {
          success: false,
          error: 'Invalid mathematical expression',
        };
      }

      // Evaluate the expression
      const result = math.evaluate(cleanExpression);
      
      // Generate steps for simple expressions
      let steps = '';
      if (cleanExpression.includes('+') || cleanExpression.includes('-') || 
          cleanExpression.includes('*') || cleanExpression.includes('/')) {
        steps = `Evaluated: ${cleanExpression} = ${result}`;
      }

      const mathResult: MathResult = {
        expression: cleanExpression,
        result: typeof result === 'number' ? result : parseFloat(result),
        steps,
      };

      return {
        success: true,
        data: mathResult,
      };
    } catch (error) {
      logger.error('Math plugin error:', error);
      return {
        success: false,
        error: `Failed to evaluate expression: ${error}`,
      };
    }
  }
}

/**
 * Plugin Manager
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  constructor() {
    // Register plugins
    this.registerPlugin(new WeatherPlugin());
    this.registerPlugin(new MathPlugin());
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
    logger.info(`Registered plugin: ${plugin.name}`);
  }

  /**
   * Detect intent and determine which plugins to use
   */
  async detectIntent(message: string): Promise<IntentDetection> {
    const lowerMessage = message.toLowerCase();
    const triggeredPlugins: string[] = [];
    const extractedParams: Record<string, any> = {};

    // Check each plugin for keywords
    for (const plugin of this.plugins.values()) {
      const hasKeyword = plugin.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        triggeredPlugins.push(plugin.name);
        
        // Extract parameters based on plugin type
        if (plugin.name === 'weather') {
          const location = this.extractLocation(message);
          if (location) {
            extractedParams.location = location;
          }
        } else if (plugin.name === 'math') {
          const expression = this.extractMathExpression(message);
          if (expression) {
            extractedParams.expression = expression;
          }
        }
      }
    }

    // Determine intent type
    let intentType: IntentDetection['type'] = 'general_knowledge';
    if (triggeredPlugins.includes('weather')) {
      intentType = 'weather_query';
    } else if (triggeredPlugins.includes('math')) {
      intentType = 'math_query';
    } else if (triggeredPlugins.length > 0) {
      intentType = 'plugin_request';
    }

    return {
      type: intentType,
      plugins: triggeredPlugins,
      confidence: triggeredPlugins.length > 0 ? 0.8 : 0.1,
      extracted_params: extractedParams,
    };
  }

  /**
   * Execute plugins based on intent
   */
  async executePlugins(intent: IntentDetection): Promise<PluginResult[]> {
    const results: PluginResult[] = [];

    for (const pluginName of intent.plugins) {
      const plugin = this.plugins.get(pluginName);
      if (!plugin) {
        continue;
      }

      try {
        let params: any = {};
        
        // Set parameters based on plugin type
        if (pluginName === 'weather' && intent.extracted_params?.location) {
          params = { location: intent.extracted_params.location };
        } else if (pluginName === 'math' && intent.extracted_params?.expression) {
          params = { expression: intent.extracted_params.expression };
        }

        const result = await plugin.execute(params);
        results.push(result);
      } catch (error) {
        logger.error(`Error executing plugin ${pluginName}:`, error);
        results.push({
          success: false,
          error: `Plugin execution failed: ${error}`,
        });
      }
    }

    return results;
  }

  /**
   * Extract location from weather query
   */
  private extractLocation(message: string): string | null {
    // More specific location extraction patterns
    const patterns = [
      /weather\s+(?:like\s+)?(?:in\s+)?([A-Za-z\s]+?)(?:\?|$|\s+and|\s+how)/i,
      /(?:in|at)\s+([A-Za-z\s]+?)(?:\?|$|\s+and|\s+how)/i,
      /weather\s+(?:for\s+)?([A-Za-z\s]+?)(?:\?|$|\s+and|\s+how)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Filter out common words that aren't locations
        const commonWords = ['like', 'what', 'is', 'the', 'weather', 'temperature', 'forecast'];
        const words = location.split(' ').filter(word => !commonWords.includes(word.toLowerCase()));
        if (words.length > 0) {
          return words.join(' ');
        }
      }
    }

    return null;
  }

  /**
   * Extract mathematical expression from message
   */
  private extractMathExpression(message: string): string | null {
    // Look for mathematical expressions
    const patterns = [
      /(\d+\s*[\+\-\*\/]\s*\d+)/,
      /calculate\s+(.+)/i,
      /solve\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}

// Export singleton instance
export const pluginManager = new PluginManager(); 
import { Router, Request, Response } from 'express';
import { AgentMessage, AgentResponse, ApiResponse } from '../types';
import { agentService } from '../services/agent';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /agent/message
 * Process a message and return AI response
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { message, session_id }: AgentMessage = req.body;

    // Validate input
    if (!message || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message and session_id',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    if (typeof message !== 'string' || typeof session_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid field types: message and session_id must be strings',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    logger.info(`Received message request for session: ${session_id}`);

    // Process message through agent
    const response: AgentResponse = await agentService.processMessage({
      message,
      session_id,
    });

    // Return success response
    const apiResponse: ApiResponse<AgentResponse> = {
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(apiResponse);
  } catch (error) {
    logger.error('Error in /agent/message route:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: new Date().toISOString(),
    };

    return res.status(500).json(errorResponse);
  }
});

/**
 * GET /agent/stats
 * Get agent statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await agentService.getStats();
    
    const apiResponse: ApiResponse = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(apiResponse);
  } catch (error) {
    logger.error('Error in /agent/stats route:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * POST /agent/clear
 * Clear all agent data (for testing/reset)
 */
router.post('/clear', async (req: Request, res: Response) => {
  try {
    await agentService.clearAllData();
    
    const apiResponse: ApiResponse = {
      success: true,
      data: { message: 'All agent data cleared successfully' },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(apiResponse);
  } catch (error) {
    logger.error('Error in /agent/clear route:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * GET /agent/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  const healthResponse: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(healthResponse);
});

export default router; 
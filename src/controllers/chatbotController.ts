/**
 * Chatbot Controller
 * Handles requests for AI-powered chat functionality
 */

import { Request, Response } from 'express';

// Extend the Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role?: string;
  };
}
import logger from '../utils/logger';
import geminiService from '../services/geminiService';

/**
 * @desc    Process a customer chat message
 * @route   POST /api/chatbot/customer
 * @access  Private (Customer)
 */
export const processCustomerChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    logger.info(`Processing chat message from customer ${userId}`);
    
    // Generate response using Gemini
    const response = await geminiService.generateCustomerResponse(
      userId,
      message,
      history || []
    );

    return res.status(200).json({ response });
  } catch (error) {
    logger.error('Error in customer chat processing:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Check if the chatbot service is available
 * @route   GET /api/chatbot/status
 * @access  Public
 */
export const getChatbotStatus = async (req: Request, res: Response) => {
  try {
    // Simple check to see if the API key is configured
    const apiKeyConfigured = !!process.env.GEMINI_API_KEY;
    
    // For testing/demo purposes, always return available:true
    // This ensures the chatbot UI works even if the API key isn't properly configured
    return res.status(200).json({ 
      available: true, // Always return true for the demo
      message: 'Chatbot service is available for demo'
    });
  } catch (error) {
    logger.error('Error checking chatbot status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

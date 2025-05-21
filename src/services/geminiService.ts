/**
 * Gemini AI Service
 * Handles integration with Google's Gemini API for chatbot functionality
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import logger from '../utils/logger';
import { Business } from '../models/business';

// Initialize the Google Generative AI with the API key
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Safety settings to ensure appropriate responses
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Define the model to use
const MODEL_NAME = 'gemini-1.5-pro';

/**
 * Gemini Service for handling AI-powered chat functionality
 */
class GeminiService {
  private model;
  
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      safetySettings,
    });
  }

  /**
   * Generate a response for customer queries
   * @param userId The ID of the user making the request
   * @param message The message from the user
   * @param history Optional chat history for context
   * @returns The AI-generated response
   */
  async generateCustomerResponse(userId: string, message: string, history: any[] = []) {
    try {
      // Get relevant businesses to provide context to the AI
      const businesses = await this.getRelevantBusinesses();
      
      // Create a system prompt that includes context about available businesses
      const systemPrompt = this.createCustomerSystemPrompt(businesses);
      
      // Start a chat session
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Send the message with the system prompt
      const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
      const response = result.response.text();
      
      logger.info(`Generated response for user ${userId}`);
      return response;
    } catch (error) {
      logger.error('Error generating Gemini response:', error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
  }

  /**
   * Get relevant businesses to provide context to the AI
   * @returns Array of business data
   */
  private async getRelevantBusinesses() {
    try {
      // Get a sample of active businesses across different categories
      const businesses = await Business.find({ status: 'active' })
        .select('name category description city')
        .limit(20);
      
      return businesses;
    } catch (error) {
      logger.error('Error fetching businesses for Gemini context:', error);
      return [];
    }
  }

  /**
   * Create a system prompt for the customer chatbot
   * @param businesses Array of businesses to include in context
   * @returns Formatted system prompt
   */
  private createCustomerSystemPrompt(businesses: any[]) {
    // Format business data for the prompt
    const businessContext = businesses.map(business => 
      `- ${business.name}: ${business.category} in ${business.city}. ${business.description || ''}`
    ).join('\n');

    return `You are Khanut Assistant, a helpful AI assistant for the Khanut platform which connects customers with local businesses.
    
Your goal is to help customers find businesses that match their needs, answer questions about the platform, and provide useful recommendations.

Here are some businesses currently available on the platform:
${businessContext}

When recommending businesses:
1. Focus on the businesses listed above
2. Consider the user's specific needs and preferences
3. Provide specific business names when appropriate
4. Be conversational and helpful

If you don't know something or if a business isn't listed, be honest and suggest alternatives.
Keep your responses concise, friendly, and focused on helping the customer.`;
  }
}

export default new GeminiService();

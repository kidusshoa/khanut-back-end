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
  private model: any;
  
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
      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        // Return demo responses for presentation purposes
        return this.getDemoResponse(message);
      }
      
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
      // Fall back to demo responses if there's an error
      return this.getDemoResponse(message);
    }
  }
  
  /**
   * Get a demo response for presentation purposes when the API key isn't configured
   * @param message The user's message
   * @returns A predefined response based on the message content
   */
  private getDemoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check for common questions and provide relevant responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm Khanut Assistant. How can I help you today?";
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggestion')) {
      return "Based on your preferences, I'd recommend checking out System Electronics for your tech needs, or Liyu Coffee if you're looking for a nice café to relax in.";
    }
    
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      return "For dining options, I recommend Habesha Restaurant for authentic Ethiopian cuisine, or KT Cafe for a more casual experience. Both have excellent ratings from other customers.";
    }
    
    if (lowerMessage.includes('electronics') || lowerMessage.includes('tech') || lowerMessage.includes('computer')) {
      return "For electronics, System Electronics offers a wide range of products and services. They have a 4.5-star rating and are known for their excellent customer service.";
    }
    
    if (lowerMessage.includes('beauty') || lowerMessage.includes('salon') || lowerMessage.includes('hair')) {
      return "For beauty services, Kira Beauty Salon is highly rated. They offer a variety of services including haircuts, styling, and skincare treatments.";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're welcome! If you need anything else, feel free to ask. I'm here to help you find the best businesses in your area.";
    }
    
    // Default response for other queries
    return "I can help you find businesses based on your needs. Would you like recommendations for restaurants, electronics, beauty services, or something else?";
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

/**
 * Gemini AI Service
 * Handles integration with Google's Gemini API for chatbot functionality
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import logger from '../utils/logger';
import { Business } from '../models/business';
import chatbotDataPuller from '../utils/chatbotDataPuller';

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

// Cache for training data to avoid frequent database queries
let trainingDataCache: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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
    
    // Initialize training data cache
    this.refreshTrainingData();
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
      
      // Get training data from cache or refresh if needed
      const trainingData = await this.getTrainingData();
      
      // Create a system prompt that includes context about available businesses
      const systemPrompt = this.createCustomerSystemPrompt(trainingData);
      
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
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm Khanut Assistant. How can I help you today? I can provide information about businesses, help with bookings, or answer questions about using the Khanut platform.";
    }
    
    // About Khanut
    if (lowerMessage.includes('about khanut') || lowerMessage.includes('what is khanut') || lowerMessage.includes('tell me about khanut')) {
      return "Khanut is a comprehensive platform that connects customers with local businesses in Ethiopia. Our mission is to help you discover and engage with the best local services. Khanut offers business listings, appointment booking, reviews, and personalized recommendations to enhance your shopping and service experience.";
    }

    // User Manual - General
    if (lowerMessage.includes('how to use') || lowerMessage.includes('user manual') || lowerMessage.includes('guide') || lowerMessage.includes('tutorial')) {
      return "Here's a quick guide to using Khanut:\n\n1. Browse businesses by category or search for specific services\n2. View business profiles, including services, hours, and reviews\n3. Book appointments directly through the platform\n4. Manage your appointments from your dashboard\n5. Leave reviews after your experience\n\nIs there a specific feature you'd like to learn more about?";
    }
    
    // User Manual - Booking
    if (lowerMessage.includes('how to book') || lowerMessage.includes('make appointment') || lowerMessage.includes('schedule')) {
      return "To book an appointment on Khanut:\n\n1. Find a business you're interested in\n2. Click on the business profile\n3. Select 'Book Appointment'\n4. Choose your preferred date and time\n5. Select the service you need\n6. Confirm your booking\n\nYou'll receive a confirmation and can manage all your appointments from your dashboard.";
    }
    
    // Recommendations - General
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggestion')) {
      return "Based on popular choices in Khanut, I'd recommend:\n\n• System Electronics for tech needs (4.5★)\n• Liyu Coffee for a relaxing café experience (4.7★)\n• Habesha Restaurant for authentic cuisine (4.6★)\n• Kira Beauty Salon for beauty services (4.8★)\n\nWould you like more specific recommendations based on your preferences?";
    }
    
    // Recommendations - Restaurants
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      return "For dining options, I recommend Habesha Restaurant for authentic Ethiopian cuisine, or KT Cafe for a more casual experience. Both have excellent ratings from other customers.";
    }
    
    // Recommendations - Electronics
    if (lowerMessage.includes('electronics') || lowerMessage.includes('tech') || lowerMessage.includes('computer')) {
      return "For electronics, System Electronics offers a wide range of products and services. They have a 4.5-star rating and are known for their excellent customer service.";
    }
    
    // Recommendations - Beauty
    if (lowerMessage.includes('beauty') || lowerMessage.includes('salon') || lowerMessage.includes('hair')) {
      return "For beauty services, Kira Beauty Salon is highly rated. They offer a variety of services including haircuts, styling, and skincare treatments.";
    }
    
    // Thank you messages
    if (lowerMessage.includes('thank')) {
      return "You're welcome! If you need anything else, feel free to ask. I'm here to help you find the best businesses in your area.";
    }
    
    // Default response for other queries
    return "I can help you find businesses based on your needs. Would you like recommendations for restaurants, electronics, beauty services, or something else?";
  }

  /**
   * Get training data from cache or refresh if needed
   * @returns Chatbot training data
   */
  private async getTrainingData() {
    const now = Date.now();
    
    // Check if cache is valid
    if (!trainingDataCache || now - lastCacheTime > CACHE_TTL) {
      await this.refreshTrainingData();
    }
    
    return trainingDataCache;
  }
  
  /**
   * Refresh the training data cache
   */
  private async refreshTrainingData() {
    try {
      // Pull fresh data from the database
      trainingDataCache = await chatbotDataPuller.pullTrainingData();
      lastCacheTime = Date.now();
      logger.info('Refreshed chatbot training data cache');
    } catch (error) {
      logger.error('Error refreshing training data:', error);
      // Initialize with empty data if there's an error
      if (!trainingDataCache) {
        trainingDataCache = {
          businesses: [],
          categories: [],
          popularServices: [],
          topRatedBusinesses: []
        };
      }
    }
  }

  /**
   * Create a system prompt for the customer chatbot
   * @param trainingData Data to include in the prompt
   * @returns Formatted system prompt
   */
  private createCustomerSystemPrompt(trainingData: any) {
    // Format business data for the prompt
    const businessContext = trainingData.businesses.map((business: any) => 
      `- ${business.name}: ${business.category} in ${business.city}. ${business.description} (${business.rating}★)`
    ).join('\n');
    
    // Format top-rated businesses
    const topBusinessesContext = trainingData.topRatedBusinesses.map((business: any) => 
      `- ${business.name}: ${business.category} in ${business.city}. Rating: ${business.rating}★. Services: ${business.services.join(', ')}`
    ).join('\n');
    
    // Format categories
    const categoriesContext = trainingData.categories.join(', ');
    
    // Format popular services
    const servicesContext = trainingData.popularServices.join(', ');

    return `You are Khanut Assistant, a helpful AI assistant for the Khanut platform which connects customers with local businesses in Ethiopia.
    
Your goal is to help customers find businesses that match their needs, answer questions about the platform, and provide useful recommendations.

== PLATFORM INFORMATION ==
Khanut is a comprehensive platform that connects customers with local businesses in Ethiopia. The platform offers business listings, appointment booking, reviews, and personalized recommendations.

== AVAILABLE BUSINESS CATEGORIES ==
${categoriesContext}

== POPULAR SERVICES ==
${servicesContext}

== TOP-RATED BUSINESSES ==
${topBusinessesContext}

== ALL AVAILABLE BUSINESSES ==
${businessContext}

When helping customers:
1. Focus on the businesses and services listed above
2. Consider the user's specific needs and preferences
3. Provide specific business names when appropriate
4. Include ratings when recommending businesses
5. Be conversational, helpful, and concise

You can also help with:
- How to use the Khanut platform
- How to book appointments
- How to leave reviews
- Finding businesses by category or service

If you don't know something or if a business isn't listed, be honest and suggest alternatives.
Keep your responses friendly and focused on helping the customer.`;
  }
}

export default new GeminiService();

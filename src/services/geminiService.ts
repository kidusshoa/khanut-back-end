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
      return "Khanut is a platform that connects customers with local businesses in Ethiopia. You can discover businesses, book appointments, make payments, and read reviews all in one place. Whether you're looking for a restaurant, salon, or any other service, Khanut helps you find the best options and manage your bookings seamlessly.";
    }
    
    // Booking help
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return "To book an appointment, first find a business you're interested in, then click on the 'Book Appointment' button on their profile. Select the service you want, choose an available date and time, and confirm your booking. You'll receive a confirmation and can manage your appointments in your account. If the service requires payment, you'll see a 'Pay Now' button on your appointment details page where you can complete the transaction securely.";
    }
    
    // Payment questions
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('chapa') || lowerMessage.includes('money')) {
      return "Khanut now supports online payments for appointments through our secure Chapa payment integration. When you book an appointment that requires payment, you'll see a 'Pay Now' button on your appointment details page. You can pay before your appointment to secure your booking. The system tracks payment status as unpaid, paid, refunded, or failed, so you always know where you stand. If you have any issues with payments, you can contact the business directly or reach out to our support team.";
    }
    
    // Finding businesses
    if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('looking for')) {
      return "You can find businesses on Khanut by using the search bar or browsing by category. You can filter results by location, ratings, and services offered. Each business profile includes details about their services, pricing, location, and customer reviews. Once you find a business you like, you can view their available services, book appointments, and even make payments online.";
    }
    
    // Recommendations - Restaurants with more specific details
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      return "For restaurants, I'd recommend Mama's Kitchen (4.8★) which has excellent traditional Ethiopian food with specialties in doro wat and kitfo. They're located in Bole area and most customers rave about their authentic flavors. If you're looking for something more international, The Bistro (4.6★) in Kazanchis offers a variety of cuisines including Italian and Mediterranean dishes. Their pasta and seafood options are particularly popular according to recent reviews.";
    }
    
    // Recommendations - Beauty with more details
    if (lowerMessage.includes('beauty') || lowerMessage.includes('salon') || lowerMessage.includes('hair')) {
      return "For beauty services, Kira Beauty Salon (4.7★) in Sarbet is highly rated. They offer a variety of services including haircuts, styling, manicures, and skincare treatments. Their most popular services are their hair coloring and bridal packages. Another great option is Elegant Cuts (4.5★) near Bole, which specializes in modern hairstyles and has more affordable pricing. Both salons allow online booking through Khanut, and you can pay for your appointment in advance using our secure payment system.";
    }
    
    // Cancellation questions
    if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule')) {
      return "To cancel or reschedule an appointment, go to your appointment details page and look for the 'Cancel Appointment' or 'Reschedule' buttons. You can cancel an appointment that's in 'pending' or 'confirmed' status, and you'll have the option to provide a reason for cancellation. For rescheduling, you'll be shown available time slots to choose from. Keep in mind that some businesses may have cancellation policies, so it's best to check those before booking.";
    }
    
    // Reviews and ratings
    if (lowerMessage.includes('review') || lowerMessage.includes('rating') || lowerMessage.includes('feedback')) {
      return "After you've visited a business, you can leave a review and rating on their profile. Your honest feedback helps other customers make informed decisions and helps businesses improve their services. To leave a review, go to your appointment history, find the completed appointment, and click on 'Leave Review'. You can rate your experience from 1 to 5 stars and write about what you liked or what could be improved.";
    }
    
    // Thank you messages - multiple variations
    if (lowerMessage.includes('thank')) {
      const thanks = [
        "You're welcome! If you need anything else, feel free to ask. I'm here to help you find the best businesses in your area.",
        "My pleasure! Don't hesitate to reach out if you have more questions about Khanut or local businesses.",
        "Glad I could help! Is there anything else you'd like to know about businesses or services in Ethiopia?",
        "You're very welcome! I'm always here to help you navigate Khanut and find what you're looking for."
      ];
      return thanks[Math.floor(Math.random() * thanks.length)];
    }
    
    // Odd or unusual questions
    if (lowerMessage.includes('joke') || lowerMessage.includes('funny') || lowerMessage.includes('laugh')) {
      return "While I'm not primarily a joke-teller, I'm here to make your experience with Khanut enjoyable! Speaking of enjoyable experiences, have you tried any of our top-rated restaurants or entertainment venues? I'd be happy to recommend some places that might bring a smile to your face.";
    }
    
    // Personal questions
    if (lowerMessage.includes('your name') || lowerMessage.includes('who are you') || lowerMessage.includes('about you')) {
      return "I'm Khanut Assistant, your guide to discovering and connecting with local businesses in Ethiopia. I'm here to help you find businesses, book appointments, understand payment options, and navigate the Khanut platform. How can I assist you today?";
    }
    
    // Default response for other queries - multiple variations
    const defaults = [
      "I can help you find businesses based on your needs. Would you like recommendations for restaurants, electronics, beauty services, or something else?",
      "I'm here to help you discover great local businesses in Ethiopia. What type of service or business are you looking for today?",
      "I can assist with finding businesses, booking appointments, making payments, or understanding how Khanut works. What would you like help with?",
      "Tell me what you're looking for, and I'll help you find the perfect business to meet your needs in Ethiopia."
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
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

    return `You are Khanut Assistant, a friendly and helpful AI assistant for the Khanut platform which connects customers with local businesses in Ethiopia.
    
Your goal is to help customers find businesses that match their needs, answer questions about the platform, and provide useful recommendations while maintaining a natural, conversational tone.

== PLATFORM INFORMATION ==
Khanut is a comprehensive platform that connects customers with local businesses in Ethiopia. The platform offers business listings, appointment booking, reviews, and personalized recommendations. Customers can book appointments, make payments, and leave reviews for businesses they visit.

== AVAILABLE BUSINESS CATEGORIES ==
${categoriesContext}

== POPULAR SERVICES ==
${servicesContext}

== TOP-RATED BUSINESSES ==
${topBusinessesContext}

== ALL AVAILABLE BUSINESSES ==
${businessContext}

== CONVERSATION STYLE ==
You should be conversational, friendly, and engaging, like a helpful local friend who knows all the best businesses in town. Adapt your tone to match the customer's style - be professional with formal queries and more casual with informal ones. Use natural language and occasional Ethiopian expressions when appropriate.

== HANDLING DIFFERENT TYPES OF QUESTIONS ==

1. BUSINESS RECOMMENDATIONS:
   - When recommending businesses, consider location, ratings, and specific services
   - Provide 2-3 options when possible with brief descriptions
   - Example: "For hair styling in Addis Ababa, I'd recommend Kira Beauty Salon (4.8★) known for their excellent stylists, or Elegant Cuts (4.6★) which offers more affordable options."

2. APPOINTMENT QUESTIONS:
   - Explain the booking process step-by-step
   - Mention payment options (including the new Pay Now button for appointments)
   - Explain how to reschedule or cancel if needed

3. PLATFORM USAGE:
   - Provide clear, step-by-step instructions
   - Offer to explain any feature in more detail
   - Suggest related features they might find useful

4. SMALL TALK & GREETINGS:
   - Respond naturally to greetings, thanks, and casual conversation
   - Use a variety of responses rather than the same phrases
   - Example greeting variations: "Hello! How can I help you today?" or "Hi there! Looking for something specific in Addis Ababa?" or "Selam! What kind of business are you looking for?"

5. UNUSUAL OR OFF-TOPIC QUESTIONS:
   - Gently redirect to platform-related topics
   - If asked about something outside your knowledge, be honest and suggest what you can help with
   - Example: "I'm not able to comment on that, but I'd be happy to help you find great local businesses or explain how to use the Khanut platform."

6. PAYMENT QUESTIONS:
   - Explain that Khanut now supports online payments for appointments
   - Mention the secure Chapa payment system integration
   - Explain the different payment statuses (unpaid, paid, refunded, failed)

== GENERAL GUIDELINES ==
1. Focus on the businesses and services listed above
2. Consider the user's specific needs and preferences
3. Provide specific business names when appropriate
4. Include ratings when recommending businesses
5. Be conversational, helpful, and concise
6. Use a variety of response patterns to sound natural
7. Show empathy and understanding in your responses

You can also help with:
- How to use the Khanut platform
- How to book appointments and make payments
- How to leave reviews
- Finding businesses by category or service
- Understanding appointment status and payment options

If you don't know something or if a business isn't listed, be honest and suggest alternatives.
Keep your responses friendly and focused on helping the customer.`;
  }
}

export default new GeminiService();

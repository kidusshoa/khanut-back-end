/**
 * Chatbot Data Puller
 * Utility to pull data from the database to train the chatbot
 */

import { Business, IBusiness } from '../models/business';
import { Service, IService } from '../models/service';
import { Review, IReview } from '../models/review';
import logger from './logger';
import mongoose from 'mongoose';

// Define interfaces for the data models
interface ICategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  status: string;
}

// Define a type that extends IBusiness but with the populated category field
interface BusinessWithCategory extends Omit<IBusiness, 'category'> {
  category: ICategory;
  averageRating?: number;
  _id: mongoose.Types.ObjectId;
}

interface BusinessData {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  address: string;
  rating: number;
  services: string[];
  reviewHighlights: string[];
}

interface ChatbotTrainingData {
  businesses: BusinessData[];
  categories: string[];
  popularServices: string[];
  topRatedBusinesses: BusinessData[];
}

/**
 * Utility class to pull and format data for chatbot training
 */
class ChatbotDataPuller {
  /**
   * Pull all relevant data from the database
   * @returns Formatted data for chatbot training
   */
  async pullTrainingData(): Promise<ChatbotTrainingData> {
    try {
      logger.info('Pulling data for chatbot training');
      
      // Get active businesses
      const businesses = await this.getBusinessData();
      
      // Get categories
      const categories = await this.getCategories();
      
      // Get popular services
      const popularServices = await this.getPopularServices();
      
      // Get top-rated businesses
      const topRatedBusinesses = await this.getTopRatedBusinesses();
      
      logger.info(`Pulled data for ${businesses.length} businesses, ${categories.length} categories`);
      
      return {
        businesses,
        categories,
        popularServices,
        topRatedBusinesses
      };
    } catch (error) {
      logger.error('Error pulling chatbot training data:', error);
      return {
        businesses: [],
        categories: [],
        popularServices: [],
        topRatedBusinesses: []
      };
    }
  }
  
  /**
   * Get formatted business data including services and reviews
   * @returns Array of business data
   */
  private async getBusinessData(): Promise<BusinessData[]> {
    try {
      // Get active businesses with populated category
      const businesses = await Business.find({ status: 'active' })
        .populate<{ category: ICategory }>('category')
        .select('name description category city address averageRating')
        .limit(50);
      
      const businessData: BusinessData[] = [];
      
      // Process each business to include services and reviews
      for (const business of businesses) {
        const businessId = business._id as mongoose.Types.ObjectId;
        
        // Get services for this business
        const services = await Service.find({ business: businessId })
          .select('name description')
          .limit(10);
        
        // Get reviews for this business
        const reviews = await Review.find({ business: businessId, status: 'approved' })
          .sort({ createdAt: -1 })
          .select('comment rating')
          .limit(5);
        
        const businessWithCategory = business as unknown as BusinessWithCategory;
        
        // Format the business data
        businessData.push({
          id: businessId.toString(),
          name: business.name || '',
          description: business.description || '',
          category: businessWithCategory.category?.name || 'Uncategorized',
          city: business.city || '',
          address: business.address || '',
          rating: businessWithCategory.averageRating || 0,
          services: services.map(service => `${service.name || ''}: ${service.description || ''}`),
          reviewHighlights: reviews.map(review => `"${review.comment || ''}" (${review.rating || 0}★)`)
        });
      }
      
      return businessData;
    } catch (error) {
      logger.error('Error getting business data:', error);
      return [];
    }
  }
  
  /**
   * Get all active categories
   * @returns Array of category names
   */
  private async getCategories(): Promise<string[]> {
    try {
      // Since we don't have direct access to the Category model, we'll get unique categories from businesses
      const businesses = await Business.find({ status: 'active' })
        .populate<{ category: ICategory }>('category')
        .select('category');
      
      const categorySet = new Set<string>();
      
      businesses.forEach(business => {
        const businessWithCategory = business as unknown as BusinessWithCategory;
        if (businessWithCategory.category?.name) {
          categorySet.add(businessWithCategory.category.name);
        }
      });
      
      return Array.from(categorySet);
    } catch (error) {
      logger.error('Error getting categories:', error);
      return [];
    }
  }
  
  /**
   * Get popular services based on business ratings
   * @returns Array of service names
   */
  private async getPopularServices(): Promise<string[]> {
    try {
      // Get services from top-rated businesses
      const topBusinesses = await Business.find({ status: 'active', averageRating: { $gte: 4 } })
        .select('_id')
        .limit(10);
      
      const businessIds = topBusinesses.map(business => business._id);
      
      const services = await Service.find({ business: { $in: businessIds } })
        .select('name')
        .limit(20);
      
      return services.map(service => service.name || '');
    } catch (error) {
      logger.error('Error getting popular services:', error);
      return [];
    }
  }
  
  /**
   * Get top-rated businesses
   * @returns Array of top-rated business data
   */
  private async getTopRatedBusinesses(): Promise<BusinessData[]> {
    try {
      // Get top-rated businesses
      const businesses = await Business.find({ status: 'active', averageRating: { $gte: 4.5 } })
        .populate<{ category: ICategory }>('category')
        .select('name description category city address averageRating')
        .sort({ averageRating: -1 })
        .limit(10);
      
      const businessData: BusinessData[] = [];
      
      // Process each business
      for (const business of businesses) {
        const businessId = business._id as mongoose.Types.ObjectId;
        
        // Get services for this business
        const services = await Service.find({ business: businessId })
          .select('name')
          .limit(5);
        
        const businessWithCategory = business as unknown as BusinessWithCategory;
        
        // Format the business data
        businessData.push({
          id: businessId.toString(),
          name: business.name || '',
          description: business.description || '',
          category: businessWithCategory.category?.name || 'Uncategorized',
          city: business.city || '',
          address: business.address || '',
          rating: businessWithCategory.averageRating || 0,
          services: services.map(service => service.name || ''),
          reviewHighlights: []
        });
      }
      
      return businessData;
    } catch (error) {
      logger.error('Error getting top-rated businesses:', error);
      return [];
    }
  }
}

export default new ChatbotDataPuller();

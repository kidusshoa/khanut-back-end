import { Chapa } from 'chapa-nodejs';
import config from '../config/config';

// Initialize Chapa with secret key from config
const chapa = new Chapa({
  secretKey: config.chapa.secretKey,
});

/**
 * Service for handling Chapa payment gateway operations
 */
export const chapaService = {
  /**
   * Initialize a payment transaction
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} - Chapa response with checkout URL
   */
  initializePayment: async (paymentData: {
    amount: string;
    currency: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    tx_ref?: string;
    callback_url?: string;
    return_url?: string;
    customization?: {
      title?: string;
      description?: string;
      logo?: string;
    };
  }) => {
    try {
      // Generate transaction reference if not provided
      const tx_ref = paymentData.tx_ref || await chapa.genTxRef();
      
      // Initialize payment
      const response = await chapa.initialize({
        amount: paymentData.amount,
        currency: paymentData.currency,
        email: paymentData.email,
        first_name: paymentData.first_name,
        last_name: paymentData.last_name,
        tx_ref,
        callback_url: paymentData.callback_url || config.chapa.callbackUrl,
        return_url: paymentData.return_url || config.chapa.returnUrl,
        customization: paymentData.customization || {
          title: 'Khanut Payment',
          description: 'Payment for services/products',
        },
        phone_number: paymentData.phone_number,
      });
      
      return response;
    } catch (error) {
      console.error('Chapa payment initialization error:', error);
      throw error;
    }
  },
  
  /**
   * Verify a payment transaction
   * @param {string} tx_ref - Transaction reference
   * @returns {Promise<Object>} - Verification result
   */
  verifyPayment: async (tx_ref: string) => {
    try {
      const response = await chapa.verify({ tx_ref });
      return response;
    } catch (error) {
      console.error('Chapa payment verification error:', error);
      throw error;
    }
  },
  
  /**
   * Generate a transaction reference
   * @param {Object} options - Options for generating transaction reference
   * @returns {Promise<string>} - Generated transaction reference
   */
  generateTxRef: async (options?: {
    removePrefix?: boolean;
    prefix?: string;
    size?: number;
  }) => {
    try {
      return await chapa.genTxRef(options);
    } catch (error) {
      console.error('Error generating transaction reference:', error);
      throw error;
    }
  },
  
  /**
   * Initialize a mobile payment transaction
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} - Chapa response
   */
  initializeMobilePayment: async (paymentData: {
    amount: string;
    currency: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    tx_ref?: string;
    callback_url?: string;
    return_url?: string;
    customization?: {
      title?: string;
      description?: string;
      logo?: string;
    };
  }) => {
    try {
      // Generate transaction reference if not provided
      const tx_ref = paymentData.tx_ref || await chapa.genTxRef();
      
      // Initialize mobile payment
      const response = await chapa.mobileInitialize({
        amount: paymentData.amount,
        currency: paymentData.currency,
        email: paymentData.email,
        first_name: paymentData.first_name,
        last_name: paymentData.last_name,
        phone_number: paymentData.phone_number,
        tx_ref,
        callback_url: paymentData.callback_url || config.chapa.callbackUrl,
        return_url: paymentData.return_url || config.chapa.returnUrl,
        customization: paymentData.customization || {
          title: 'Khanut Mobile Payment',
          description: 'Mobile payment for services/products',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Chapa mobile payment initialization error:', error);
      throw error;
    }
  },
  
  /**
   * Process a direct charge (e.g., Telebirr)
   * @param {Object} chargeData - Charge data
   * @returns {Promise<Object>} - Chapa response
   */
  processDirectCharge: async (chargeData: {
    amount: string;
    currency: string;
    email: string;
    first_name: string;
    last_name: string;
    mobile: string;
    tx_ref?: string;
    type: 'telebirr' | 'mpesa' | 'Amole' | 'CBEBirr' | 'Coopay-Ebirr' | 'AwashBirr';
  }) => {
    try {
      // Generate transaction reference if not provided
      const tx_ref = chargeData.tx_ref || await chapa.genTxRef();
      
      // Process direct charge
      const response = await chapa.directCharge({
        amount: chargeData.amount,
        currency: chargeData.currency,
        email: chargeData.email,
        first_name: chargeData.first_name,
        last_name: chargeData.last_name,
        mobile: chargeData.mobile,
        tx_ref,
        type: chargeData.type,
      });
      
      return response;
    } catch (error) {
      console.error('Chapa direct charge error:', error);
      throw error;
    }
  },
  
  /**
   * Authorize a direct charge
   * @param {Object} authData - Authorization data
   * @returns {Promise<Object>} - Chapa response
   */
  authorizeDirectCharge: async (authData: {
    reference: string;
    client: string;
    type: 'telebirr' | 'mpesa' | 'Amole' | 'CBEBirr' | 'Coopay-Ebirr' | 'AwashBirr';
  }) => {
    try {
      const response = await chapa.authorizeDirectCharge({
        reference: authData.reference,
        client: authData.client,
        type: authData.type,
      });
      
      return response;
    } catch (error) {
      console.error('Chapa direct charge authorization error:', error);
      throw error;
    }
  },
};

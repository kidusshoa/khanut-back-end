import { Chapa } from 'chapa-nodejs';
import { chapaConfig } from '../config/chapa';
import { Order } from '../models/order';
import { Service } from '../models/service';
import { User } from '../models/user';
import { Business } from '../models/business';
import { ActivityLog } from '../models/activityLog';

// Initialize Chapa
const chapa = new Chapa({
  secretKey: chapaConfig.secretKey,
});

/**
 * Initialize a payment for an order
 */
export const initializePayment = async (orderId: string) => {
  try {
    // Get order details
    const order = await Order.findById(orderId)
      .populate('customerId', 'name email phone')
      .populate('items.serviceId', 'name price businessId');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Check if order is already paid
    if (order.status === 'payment_received' || order.status === 'processing' || 
        order.status === 'shipped' || order.status === 'delivered') {
      throw new Error('Order is already paid');
    }
    
    // Get customer details
    const customer = order.customerId as any;
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Generate transaction reference
    const tx_ref = await chapa.genTxRef();
    
    // Extract first and last name from customer name
    const nameParts = customer.name.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    // Initialize payment
    const response = await chapa.initialize({
      first_name: firstName,
      last_name: lastName,
      email: customer.email,
      phone_number: customer.phone || '',
      amount: order.totalAmount.toString(),
      currency: 'ETB',
      tx_ref: tx_ref,
      callback_url: chapaConfig.callbackUrl,
      return_url: `${chapaConfig.returnUrl}?orderId=${order._id}`,
      customization: {
        title: `Payment for Order #${order._id}`,
        description: `Payment for your order at Khanut`,
      },
    });
    
    // Update order with payment details
    order.paymentDetails = {
      transactionRef: tx_ref,
      paymentMethod: 'chapa',
      paymentStatus: 'pending',
      paymentDate: new Date(),
    };
    
    await order.save();
    
    // Create activity log
    await ActivityLog.create({
      action: 'PAYMENT_INITIATED',
      userId: customer._id,
      details: `Payment initiated for order ${order._id} with transaction reference ${tx_ref}`,
    });
    
    return {
      success: true,
      checkoutUrl: response.data.checkout_url,
      transactionRef: tx_ref,
      order: order,
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

/**
 * Verify a payment
 */
export const verifyPayment = async (transactionRef: string) => {
  try {
    // Verify payment with Chapa
    const verificationResult = await chapa.verify({
      tx_ref: transactionRef,
    });
    
    // Find the order with this transaction reference
    const order = await Order.findOne({
      'paymentDetails.transactionRef': transactionRef,
    });
    
    if (!order) {
      throw new Error('Order not found for this transaction reference');
    }
    
    // Check if payment is successful
    if (verificationResult.data.status === 'success') {
      // Update order status
      order.status = 'payment_received';
      order.paymentDetails.paymentStatus = 'completed';
      order.paymentDetails.paymentDate = new Date();
      
      await order.save();
      
      // Create activity log
      await ActivityLog.create({
        action: 'PAYMENT_COMPLETED',
        userId: order.customerId,
        details: `Payment completed for order ${order._id} with transaction reference ${transactionRef}`,
      });
      
      // Update product inventory if applicable
      for (const item of order.items) {
        const service = await Service.findById(item.serviceId);
        if (service && service.type === 'product' && service.stock !== undefined) {
          service.stock = Math.max(0, service.stock - item.quantity);
          await service.save();
        }
      }
      
      return {
        success: true,
        order: order,
        paymentDetails: verificationResult.data,
      };
    } else {
      // Payment failed
      order.paymentDetails.paymentStatus = 'failed';
      await order.save();
      
      // Create activity log
      await ActivityLog.create({
        action: 'PAYMENT_FAILED',
        userId: order.customerId,
        details: `Payment failed for order ${order._id} with transaction reference ${transactionRef}`,
      });
      
      return {
        success: false,
        order: order,
        paymentDetails: verificationResult.data,
      };
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

/**
 * Handle payment webhook
 */
export const handlePaymentWebhook = async (webhookData: any) => {
  try {
    const { tx_ref, status } = webhookData;
    
    // Find the order with this transaction reference
    const order = await Order.findOne({
      'paymentDetails.transactionRef': tx_ref,
    });
    
    if (!order) {
      throw new Error('Order not found for this transaction reference');
    }
    
    // Update order based on payment status
    if (status === 'success') {
      order.status = 'payment_received';
      order.paymentDetails.paymentStatus = 'completed';
      order.paymentDetails.paymentDate = new Date();
      
      // Create activity log
      await ActivityLog.create({
        action: 'PAYMENT_COMPLETED',
        userId: order.customerId,
        details: `Payment completed for order ${order._id} with transaction reference ${tx_ref}`,
      });
      
      // Update product inventory if applicable
      for (const item of order.items) {
        const service = await Service.findById(item.serviceId);
        if (service && service.type === 'product' && service.stock !== undefined) {
          service.stock = Math.max(0, service.stock - item.quantity);
          await service.save();
        }
      }
    } else {
      order.paymentDetails.paymentStatus = 'failed';
      
      // Create activity log
      await ActivityLog.create({
        action: 'PAYMENT_FAILED',
        userId: order.customerId,
        details: `Payment failed for order ${order._id} with transaction reference ${tx_ref}`,
      });
    }
    
    await order.save();
    
    return {
      success: true,
      order: order,
    };
  } catch (error) {
    console.error('Payment webhook handling error:', error);
    throw error;
  }
};

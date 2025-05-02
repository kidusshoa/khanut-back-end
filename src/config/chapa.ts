import dotenv from 'dotenv';

dotenv.config();

export const chapaConfig = {
  secretKey: process.env.CHAPA_SECRET_KEY || '',
  publicKey: process.env.CHAPA_PUBLIC_KEY || '',
  webhookUrl: process.env.CHAPA_WEBHOOK_URL || '',
  callbackUrl: process.env.CHAPA_CALLBACK_URL || 'https://khanut.onrender.com/api/payments/callback',
  returnUrl: process.env.CHAPA_RETURN_URL || 'https://khanut-front-end.vercel.app/payment/success',
};

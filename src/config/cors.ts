import cors from 'cors';

// Configure CORS options
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Frontend development server
    'https://khanut.vercel.app', // Production frontend (update with your actual domain)
    /\.vercel\.app$/, // Allow all Vercel preview deployments
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // Allow cookies to be sent with requests
  maxAge: 86400, // Cache preflight requests for 24 hours
};

export const corsMiddleware = cors(corsOptions);

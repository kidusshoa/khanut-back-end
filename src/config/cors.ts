import cors from "cors";

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://khanut.vercel.app",
    /\.vercel\.app$/,
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
};

export const corsMiddleware = cors(corsOptions);

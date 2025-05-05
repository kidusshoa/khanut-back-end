import { Request } from "express";

export interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
    businessId?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

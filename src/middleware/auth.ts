import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    businessId?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export const protect = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      req.user = {
        id: decoded.id,
        role: decoded.role,
        businessId: decoded.businessId,
        location: decoded.location,
      };

      if (roles.length && !roles.includes(decoded.role))
        return res.status(403).json({ message: "Forbidden" });

      next();
    } catch (error) {
      console.error("JWT verification failed:", error);

      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          message: "Token expired",
          code: "TOKEN_EXPIRED",
          expiredAt: error.expiredAt,
        });
      }

      res.status(401).json({ message: "Invalid token" });
    }
  };
};

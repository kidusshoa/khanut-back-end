import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export const isCustomer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Access denied. Customers only." });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      location: decoded.location, // optional: include lat/lng if stored in token
    };

    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./auth";

export const isBusiness = (
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

    if (decoded.role !== "business") {
      return res
        .status(403)
        .json({ message: "Not authorized. Business access only." });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      businessId: decoded.businessId,
    };

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

    return res.status(401).json({ message: "Invalid token" });
  }
};

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const isBusiness = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== "business") {
      return res
        .status(403)
        .json({ message: "Not authorized. Business access only." });
    }

    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

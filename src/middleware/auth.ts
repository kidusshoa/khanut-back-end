import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      // @ts-ignore
      req.user = decoded;
      if (roles.length && !roles.includes((decoded as any).role))
        return res.status(403).json({ message: "Forbidden" });

      next();
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { logger } from "@repo/shared";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    phoneNumber?: string;
    profileImage?: string;
  }={};
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        logger.error("Unauthorized");
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthRequest["user"];

    req.user = decoded;

    next();
  } catch (error:unknown) {
    logger.error("Invalid token");
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
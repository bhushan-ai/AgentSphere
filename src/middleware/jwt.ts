import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
const accessSecret = process.env.ACCESS_TOKEN_SECRET;

export const jwtMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const decode = jwt.verify(token, accessSecret as string) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decode.id },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token", error });
  }
};

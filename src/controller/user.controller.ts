import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/genTokens";

//create
export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      res.status(400).json({
        success: "false",
        message: "All Fields are required",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: "Email already Exist" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "User Registered", data: newUser });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while registering the user`, err);

    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "all fields are required" });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "Email is Invalid" });
      return;
    }
    const checkPass = await bcrypt.compare(password, user?.password as string);

    if (!checkPass) {
      res.status(401).json({ success: false, message: "password incorrect" });
      return;
    }

    const accessToken = generateAccessToken(user.id as string);
    const refreshToken = generateRefreshToken(user.id as string);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
      maxAge: 4 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "LoggedIn Successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while refreshing`, err);

    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//update
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    let hashedPassword;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(password && { password: hashedPassword }),
      },
    });

    res
      .status(200)
      .json({ success: true, message: "user updated", data: user });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while updating user`, err);

    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while logging out`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

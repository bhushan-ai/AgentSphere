import jwt from "jsonwebtoken";

const accessSecret = process.env.ACCESS_TOKEN_SECRET as string;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;

export const generateAccessToken = (id: string) => {
  return jwt.sign({ id }, accessSecret, {
    expiresIn: "45m",
  });
};

export const generateRefreshToken = (id: string) => {
  return jwt.sign({ id }, refreshSecret, {
    expiresIn: "7d",
  });
};

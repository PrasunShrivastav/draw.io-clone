import dotenv from "dotenv";
dotenv.config();
export const JWT_SECRET = process.env.jwtSecret as string;

import express from "express";
import jwt from "jsonwebtoken";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/schema/types";
import { prismaClient } from "@repo/db/client";
import { JWT_SECRET } from "@repo/env/env";
import { authenticated } from "./middlewares/auth";

const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
  const ParsedData = CreateUserSchema.safeParse(req.body);
  if (!ParsedData.success) {
    return res.status(400).json({ error: ParsedData.error });
  } else {
    try {
      const user = await prismaClient.user.create({
        data: {
          name: ParsedData.data.name,
          email: ParsedData.data.email,
          password: ParsedData.data.password,
        },
      });
      res.json({
        message: "User created successfully",
      });
    } catch (e) {
      res.status(411).json({
        error: e,
      });
    }
  }
});
app.post("/api/v1/signin", async (req, res) => {
  const ParsedData = SigninSchema.safeParse(req.body);
  if (!ParsedData.success) {
    return res.status(400).json({ error: ParsedData.error });
  } else {
    const user = await prismaClient.user.findFirst({
      where: {
        email: ParsedData.data.email,
      },
    });
    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
    }
    if (
      user &&
      user.password == ParsedData.data.password &&
      typeof JWT_SECRET === "string"
    ) {
      const token = jwt.sign(
        {
          userId: user.id,
        },
        JWT_SECRET
      );
      res.status(200).json({
        message: "Signin successful",
        token: token,
      });
    }
  }
});
app.post("/api/v1/create-room", authenticated, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs",
    });
  }
  //@ts-ignore
  const userId = req.userId;
  try {
    if (parsedData.data) {
      const room = await prismaClient.room.create({
        data: {
          slug: parsedData.data.name,
          adminId: userId,
        },
      });

      res.json({
        roomId: room.id,
      });
    }
  } catch (e) {
    res.status(411).json({
      message: "Room already exists with this name",
    });
  }
});
app.listen(4000);

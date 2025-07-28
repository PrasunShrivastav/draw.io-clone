import { WebSocketServer } from "ws";
import { parse } from "url";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/env/env";

const wss = new WebSocketServer({ port: 8080 });
wss.on("connection", (socket, req) => {
  if (req.url) {
    const parsedUrl = parse(req.url, true);
    const token = parsedUrl.query.token;
    if (token) {
      if (typeof token === "string") {
        jwt.verify(token, JWT_SECRET);
      }
    } else {
      console.log("No token");
      socket.close();
    }
  }
});

import { WebSocketServer } from "ws";
import { parse } from "url";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/env/env";
import { measureMemory } from "vm";
interface User {
  rooms: string[];
  userId: string;
  ws: WebSocket;
}

const users: User[] = [];
const wss = new WebSocketServer({ port: 8080 });
function checkToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch (e) {
    return null;
  }
}

wss.on("connection", (ws, req) => {
  if (req.url) {
    const parsedUrl = parse(req.url, true);
    const token = parsedUrl.query.token;
    if (typeof token === "string") {
      const userId = checkToken(token);
      if (userId) {
        users.push({
          userId,
          ws,
          rooms: [],
        });
        ws.on("message", (message) => {
          const data = JSON.parse(message as unknown as string);
          if (data.type === "join_room") {
            const user = users.find((user) => user.userId === userId);
            user?.rooms.push(data.roomId);
          }
          if (data.type === "leave_room") {
            const user = users.find((user) => user.userId === userId);
            user?.rooms.filter((x) => {
              x !== data.roomId;
            });
          }
          if (data.type === "message") {
            const user = users.find((user) => user.userId === userId);
            const message = data.message;
            const roomId = data.roomId;
            users.forEach((user) => {
              if (user.rooms.includes(roomId)) {
                user.ws.send(
                  JSON.stringify({
                    type: "message",
                    message,
                    roomId,
                  })
                );
              }
            });
          }
        });
      } else {
        ws.close();
      }
    } else {
      ws.close();
    }
  }
});

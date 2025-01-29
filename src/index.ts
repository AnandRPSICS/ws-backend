import { WebSocketServer, WebSocket } from "ws";
import { createRoomId } from "./utils/createRoomId";
import { JOINING_STATUS, SocketMessagesType } from "./types";
import { MAX_ROOMS, MAX_MESSAGES } from "./config/roomConfig.js";
const wss = new WebSocketServer({ port: 8080 });

interface Room {
  roomId: string;
  clients: Set<WebSocket>;
  messages: { username: string; message: string }[];
}

let rooms = new Map<string, Room>();

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected");

  socket.on("message", async (message: string) => {
    try {
      const parsedMessage = JSON.parse(message.toString());

      if (parsedMessage.type === SocketMessagesType.CREATE) {
        if (rooms.size >= MAX_ROOMS) {
          const oldestRoomId = rooms.keys().next().value;
          if (oldestRoomId) {
            rooms.delete(oldestRoomId);
            console.log(
              `Room ${oldestRoomId} removed. Maximum numbers reached${MAX_ROOMS}`
            );
          }
        }
        const roomId = createRoomId();
        rooms.set(roomId, {
          roomId,
          clients: new Set([socket]),
          messages: [],
        });

        const successResponse = {
          type: SocketMessagesType.CREATE,
          roomId,
        };

        socket.send(JSON.stringify(successResponse));
      }

      if (parsedMessage.type === SocketMessagesType.JOIN) {
        const { roomId, username } = parsedMessage.payload;

        const existingRoom = rooms.get(roomId);

        if (!existingRoom) {
          const errorResponse = {
            type: SocketMessagesType.JOIN,
            message: `Inavlid room Id  ${roomId}`,
            joiningStatus: JOINING_STATUS.FAILED,
          };
          socket.send(JSON.stringify(errorResponse));
          console.log(
            `Failed join attempt: Invalid room ID ${roomId} for user ${username}`
          );

          return;
        }

        existingRoom.clients.add(socket);

        const successResponse = {
          type: SocketMessagesType.JOIN,
          message: `Successfully joined the room ${roomId}`,
          joiningStatus: JOINING_STATUS.SUCCESS,
          totalUsers: existingRoom.clients.size,
          previousMessages: existingRoom.messages,
        };
        socket.send(JSON.stringify(successResponse));
      }

      if (parsedMessage.type === SocketMessagesType.CHAT) {
        const { roomId, username, message } = parsedMessage.payload;
        const room = rooms.get(roomId);
        if (!room) return;
        // if users maximum messages exceeds, delete the first msg. 
        if (room.messages.length >= MAX_MESSAGES) {
          room.messages.shift()
        }
        const chatMessage = { username, message };
        room.messages.push(chatMessage);
        const res = {
          type: SocketMessagesType.CHAT,
          newMessage: {
            username,
            message,
          },
        };
        const convertedRes = JSON.stringify(res);
        room.clients.forEach((client) => {
          client.send(convertedRes);
        });
      }
    } catch (error) {
      console.error("Invalid json: ", message.toString(), error);
    }
  });
  socket.on("close", () => {
    console.log("Client disconnected");
    rooms.forEach((room, roomId) => {
      if (room.clients.has(socket)) {
        room.clients.delete(socket);
      }

      if (room.clients.size === 0) {
        rooms.delete(roomId);
      }
    });
  });
});

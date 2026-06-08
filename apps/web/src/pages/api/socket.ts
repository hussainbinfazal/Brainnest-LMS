import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';

let io: SocketIOServer | undefined;

interface CustomSocket extends Socket {
  userId?: string;
}

// Extend Next.js socket server type to store our Socket.IO instance
interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

interface SocketWithServer extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithServer;
}

// Message data type for clarity
interface MessageData {
  sender: { _id: string };
  receiver: { _id: string };
  message: string;
}
const connectedUsers: Map<string, string> = new Map();
export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Starting Socket.IO server...');
    io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
    });

    res.socket.server.io = io;

    io.use((socket: CustomSocket, next) => {
      const userId = socket.handshake.auth.userId;
      console.log("This is the user Id In this :", userId)
      if (!userId) {
        return next(new Error('invalid userId'));
      }
      socket.userId = userId;
      next();
    });
    io.on('connection', (socket: CustomSocket) => {
      // console.log('New client connected:', socket.id);

      connectedUsers.set(socket.userId, socket.id);
      // console.log('A user connected: ', socket.id);
      io.emit('userStatus', { userId: socket.userId, status: 'online' });
      socket.on('message', async (messageData: MessageData) => {
        // console.log("Message Event Emitted on the server from the user side")
        try {
          const { sender, receiver, message } = messageData;
          const receiverInData: string = receiver._id;
          // console.log("This is the receiverId in message Data in the message event", receiverInData)
          const senderInData: string = sender._id;
          // console.log("This is the message data in the console in socket server :", messageData);
          const receiverSocketId: string = connectedUsers.get(receiverInData);
          const senderSocketId: string = connectedUsers.get(senderInData);
          // Emit the new message to both the sender and receiver (real-time update)
          io.to(receiverSocketId).emit('message', messageData); // Send message to receiver
          io.to(senderSocketId).emit('message', messageData); // Send message to sender

        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.log("This is the error in the message event :", message);
          // console.error('Error while sending message:', error);
        }
      });

      socket.on('messageByAdmin', async (messageData: MessageData) => {
        // console.log("Admin Message Event Emitted on the server by the admin side")
        try {
          const { sender, receiver, message } = messageData;
          const senderInData: string = sender._id;
          const receiverInData: string = receiver._id;
          console.log("This is the reciever in the message Admin ", receiverInData)
          console.log("This is the sender in the message Admin ", senderInData)
          console.log("This is the message data in the console in socket server :", messageData);
          const receiverSocketId: string = connectedUsers.get(receiverInData);
          const senderSocketId: string = connectedUsers.get(senderInData);
          // Emit the new message to both the sender and receiver (real-time update)
          io.to(receiverSocketId).emit('messageByAdmin', messageData); // Send message to receiver
          io.to(senderSocketId).emit('messageByAdmin', messageData); // Send message to sender

        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.log("This is the error in the message event :", message);
          // console.error('Error while sending message:', error);
        }
      })





      // socket.onAny((event, data) => {
      //   console.log("📡 Received ANY event:", event, data);
      // });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        io.emit('userStatus', { userId: socket.userId, status: 'offline' })
        if (socket.userId) connectedUsers.delete(socket.userId);
      });
    });
  } else {
    console.log('⚡ Socket.IO server already running.');
  }

  res.end();
}
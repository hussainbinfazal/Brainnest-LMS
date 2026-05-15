import { ClientToServerEvents, ServerToClientEvents } from '@/types/client';
import { io, Socket } from 'socket.io-client';
import { logger } from "@/utils/logger/logger.node";




let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const connectSocket = (userId: string): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    socket = io({
      path: "/api/socket",
      auth: {
        userId, // ✅ This matches the server-side `handshake.auth.userId`
      },

      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    // Optional: listen to connection event
    socket.on('connect', () => {
      logger.info({ socketId: socket.id }, 'Connected to socket');
      socket?.emit("testEvent", { hello: "world" });


    });

    socket.on('connect_error', (err: any) => {
      logger.error('Socket connection error:', err.message);
    });
  }

  return socket;
};
export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> | null => socket;



export default socket;
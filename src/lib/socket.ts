import { io , Socket } from 'socket.io-client';

interface ClientToServerEvents {
  testEvent: (data: { hello: string }) => void;
}
interface ServerToClientEvents {
  someServerEvent: (data: any) => void;
}


let socket : Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const connectSocket = (userId : string): Socket<ServerToClientEvents, ClientToServerEvents> => {
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
      // console.log('Connected to socket:', socket.id);
      socket?.emit("testEvent", { hello: "world" });


    });

    socket.on('connect_error', (err) => {
      // console.log(err)
      console.error('Socket connection error:', err.message);
    });
  }

  return socket;
};
export const getSocket = (): Socket | null => socket;



export default socket;
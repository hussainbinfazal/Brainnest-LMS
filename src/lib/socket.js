import { io } from 'socket.io-client';

let socket;

export const connectSocket = (userId) => {
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
      socket.emit("testEvent", { hello: "world" });


    });

    socket.on('connect_error', (err) => {
      // console.log(err)
      console.error('Socket connection error:', err.message);
    });
  }

  return socket;
};
export const getSocket = () => socket;



export default socket;
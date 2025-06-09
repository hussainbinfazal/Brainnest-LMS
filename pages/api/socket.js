import { Server } from 'socket.io';

let io;
const connectedUsers = new Map();
export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Starting Socket.IO server...');
    io = new Server(res.socket.server, {
      path: "/api/socket",
    });

    res.socket.server.io = io;

    io.use((socket, next) => {
      const userId = socket.handshake.auth.userId;
      console.log("This is the user Id In this :", userId)
      if (!userId) {
        return next(new Error('invalid userId'));
      }
      socket.userId = userId;
      next();
    });
    io.on('connection', (socket) => {
      // console.log('New client connected:', socket.id);

      connectedUsers.set(socket.userId, socket.id);
      // console.log('A user connected: ', socket.id);
      io.emit('userStatus', { userId: socket.userId, status: 'online' });
      socket.on('message', async (messageData) => {
        // console.log("Message Event Emitted on the server from the user side")
        try {
          const { sender, receiver, message } = messageData;
          const receiverInData = receiver._id;
          // console.log("This is the receiverId in message Data in the message event", receiverInData)
          const senderInData = sender._id;
          // console.log("This is the message data in the console in socket server :", messageData);
          const receiverSocketId = connectedUsers.get(receiverInData);
          const senderSocketId = connectedUsers.get(senderInData);
          // Emit the new message to both the sender and receiver (real-time update)
          io.to(receiverSocketId).emit('message', messageData); // Send message to receiver
          io.to(senderSocketId).emit('message', messageData); // Send message to sender

        } catch (error) {
          // console.error('Error while sending message:', error);
        }
      });

      socket.on('messageByAdmin', async (messageData) => {
        // console.log("Admin Message Event Emitted on the server by the admin side")
        try {
          const { sender, receiver, message } = messageData;
          const senderInData = sender._id;
          const receiverInData = receiver._id;
          console.log("This is the reciever in the message Admin ", receiverInData)
          console.log("This is the sender in the message Admin ", senderInData)
          console.log("This is the message data in the console in socket server :", messageData);
          const receiverSocketId = connectedUsers.get(receiverInData);
          const senderSocketId = connectedUsers.get(senderInData);
          // Emit the new message to both the sender and receiver (real-time update)
          io.to(receiverSocketId).emit('messageByAdmin', messageData); // Send message to receiver
          io.to(senderSocketId).emit('messageByAdmin', messageData); // Send message to sender

        } catch (error) {
          // console.error('Error while sending message:', error);
        }
      })

      


      
      // socket.onAny((event, data) => {
      //   console.log("📡 Received ANY event:", event, data);
      // });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        io.emit('userStatus', { userId: socket.userId, status: 'offline' })
        connectedUsers.delete(socket.userId, socket.id);
      });
    });
  }

  res.end();
}
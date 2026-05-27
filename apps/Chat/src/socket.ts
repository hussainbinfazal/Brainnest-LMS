import {Server,Socket} from "socket.io";
import jwt from  "jsonwebtoken";
import {logger } from "@repo/shared";


interface JwtPayload {
    id: string,
    email: string,
    name: string,
    role: string,
    phoneNumber: string,
    profileImage: string
  
}


interface AuthenticatedSocket extends Socket {
    user?:JwtPayload;
};


let io :Server | null = null;


export const initSocket = (httpServer: any) => {
    io = new Server(httpServer, {
        cors:{
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });
    ///Auth Middleware
    io.use((socket:AuthenticatedSocket,next)=>{
        try{
            const token = socket.handshake.auth.token;
            if(!token){
                logger.error("Socket Authentication Error");
                return next(new Error("Authentication Token missing"));
            }
            const decoded = jwt.verify(token,process.env.JWT_SECRET!) as JwtPayload;
            socket.user = decoded;
            next();
        }catch(error:unknown){
            logger.error("Socket Authentication Error",{error});
            next(new Error("Authentication Error"));
        }
    })
    //Connection
    io.on("connection",(socket:AuthenticatedSocket)=>{
        logger.info("Socket Connected",{socketId:socket.id});
        //Personal Room
        socket.join(socket.user!.id);
        //Join Chat room
        socket.on("join-chat", (chatId: string) => {
          socket.join(chatId);
          logger.info("User joined chat room",
          {
          userId: socket.user!.id,
          chatId,
           });
        });
        const messageTimestamps = new Map();

        socket.on("send-message", async ({data}:{data:{chatId:string,content:string}}) => {
          const now = Date.now();

   const timestamps =
      messageTimestamps.get(socket.id) || [];

   const recent = timestamps.filter(
      (t:number) => now - t < 1000
   );

   if (recent.length >= 5) {
      return socket.emit("error", {
         message: "Rate limit exceeded",
      });
   }

   recent.push(now);

   messageTimestamps.set(socket.id, recent);
         try {
         const messagePayload = {
          senderId: socket.user?.id,
          chatId: data.chatId,
          content: data.content,
          createdAt: new Date(),
         };

        // TODO:
        // Save message in database

        io?.to(data.chatId).emit(
          "receive-message",
          messagePayload
        );

        logger.info("Message sent successfully",
          {
            userId: socket.user?.id,
            chatId: data.chatId,
          }
        );
      } catch (error: unknown) {
        logger.error("Send message failed",
          { error },
          
        );

        socket.emit("error", {
          message: "Failed to send message",
        });

        socket.on("typing", ({ chatId }) => {
      socket.to(chatId).emit("user-typing", {
        userId: socket.user?.id,
      });
    });

    // Stop Typing
    socket.on("stop-typing", ({ chatId }) => {
      socket.to(chatId).emit("user-stop-typing", {
        userId: socket.user?.id,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      logger.info(
        "Socket disconnected",{
          socketId: socket.id,
          userId: socket.user?.id,
        }
        
      );
    });
      }
    });

        
    })
}
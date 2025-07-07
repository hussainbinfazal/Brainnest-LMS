import mongoose from "mongoose";
let isConnected = false;
// let connection = {};
export const connectDB = async () => {
  try {
    console.log("cached connection :", isConnected);
    if (isConnected) {
      console.log("Already connected to DB");
      return
    }
    // if (connection.isConnected) {
    //   console.log("Already connected to DB");
    //   return
    // }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = conn.connections[0].readyState === 1;

    // connection.isConnected = conn.connections[0].readyState;
    // console.log("This is the conn state ::", connection);

    // console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`MongoDB Connected: ${conn.connections[0].host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};
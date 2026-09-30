import mongoose from "mongoose";
import dns from 'dns'


let connectionPromise;

const connectDB = async () => {
  // dns.setServers(["1.1.1.1" , "8.8.8.8"])
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    }).then(({ connection }) => {
      console.log("MongoDB connected successfully");
      return connection;
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
};

export default connectDB;

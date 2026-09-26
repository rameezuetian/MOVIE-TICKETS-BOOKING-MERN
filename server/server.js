import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())


// MongoDB
connectDB();

// Route
app.get("/", (req, res) => {
  res.send("Server is Live!");
});
app.use('/api/inngest' , serve({client:inngest , functions}))

// Start server
app.listen(port, () => {
  console.log(`Server is running on localhost: ${port}`);
});
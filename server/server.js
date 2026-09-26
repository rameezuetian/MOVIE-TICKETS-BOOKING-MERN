import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB
connectDB();

// Route
app.get("/", (req, res) => {
  res.send("Server is Live!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on localhost: ${port}`);
});
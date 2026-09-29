import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();

app.use(express.json());
app.use(cors());

// Inngest
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

// Clerk
app.use(clerkMiddleware());

connectDB();

app.get("/", (req, res) => {
  res.send("Server is Live!");
});

export default app;
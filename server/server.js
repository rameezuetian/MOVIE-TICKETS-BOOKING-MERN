import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import { handleStripeWebhook } from "./controllers/bookingController.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { seedDemoData } from "./services/seedDemoData.js";

const app = express();
let databaseReady;

const ensureDatabase = () => {
  if (!databaseReady) {
    databaseReady = connectDB()
      .then(seedDemoData)
      .catch((error) => {
        databaseReady = undefined;
        throw error;
      });
  }
  return databaseReady;
};

app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || true }));
app.post("/api/booking/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json());

// Inngest endpoint
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

// Clerk
app.use(clerkMiddleware());

app.get("/", (_req, res) => {
  res.send("Server is Live!");
});

app.use(async (_req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({ success: false, message: "Database unavailable. Check the MongoDB Atlas network access list and MONGODB_URI." });
  }
});

const port = process.env.PORT || 5000;
app.use('/api/show/' ,showRouter)
app.use('/api/booking' , bookingRouter)
app.use('/api/admin' , adminRouter)
app.use('/api/user' , userRouter)

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

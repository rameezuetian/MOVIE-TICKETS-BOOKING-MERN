import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || true }));

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

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Server is Live!");
});
app.use('/api/show/' ,showRouter)
app.use('/api/booking' , bookingRouter)
app.use('/api/admin' , adminRouter)
app.use('/api/user' , userRouter)

export default app;

const databaseReady = connectDB();
if (process.env.NODE_ENV !== "production") {
  databaseReady.then(() => app.listen(port, () => console.log(`Server listening on ${port}`)));
}

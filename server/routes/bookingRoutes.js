import express from "express";
import { confirmBookingPayment, createBooking, createBookingCheckout, getOccupiedSeats } from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/create"  , createBooking);
bookingRouter.post("/checkout/:bookingId", createBookingCheckout);
bookingRouter.post("/confirm", confirmBookingPayment);
bookingRouter.get('/seats/:showId' , getOccupiedSeats)


export default bookingRouter;

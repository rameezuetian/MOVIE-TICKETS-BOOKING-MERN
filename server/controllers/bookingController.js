import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Stripe from "stripe";
import { inngest } from "../inngest/index.js";

const enqueueBookingConfirmationEmail = (bookingId) => inngest.send({
  id: `booking-confirmation-email-${bookingId}`,
  name: "booking/paid",
  data: { bookingId: bookingId.toString() },
});

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getClientOrigin = (req) => {
  const configuredOrigins = (process.env.CLIENT_URL || "").split(",").map((value) => value.trim()).filter(Boolean);
  const requestOrigin = req.get("origin");
  if (configuredOrigins.length) {
    return configuredOrigins.includes(requestOrigin) ? requestOrigin : configuredOrigins[0];
  }
  return requestOrigin || "http://localhost:5173";
};

const makeCheckoutSession = async (booking, movieTitle, origin) => {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    success_url: `${origin}/my-bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/my-bookings?payment=cancelled`,
    line_items: [{
      price_data: {
        currency: (process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
        product_data: { name: movieTitle },
        unit_amount: Math.round(booking.amount * 100),
      },
      quantity: 1,
    }],
    mode: "payment",
    metadata: { bookingId: booking._id.toString() },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  booking.paymentLink = session.url;
  booking.stripeSessionId = session.id;
  await booking.save();
  return session;
};

export const createBooking = async (req, res) => {
  try {
    const userId = req.auth()?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Sign in to book seats" });
    if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ success: false, message: "Stripe is not configured on the server" });
    const { showId, selectedSeats } = req.body;
    if (!showId || !Array.isArray(selectedSeats) || !selectedSeats.length) {
      return res.status(400).json({ success: false, message: "Choose a show and at least one seat" });
    }
    if (selectedSeats.length > 5 || new Set(selectedSeats).size !== selectedSeats.length || selectedSeats.some((seat) => !/^[A-I][1-9]$/.test(seat))) {
      return res.status(400).json({ success: false, message: "Select up to five distinct valid seats" });
    }
    const show = await Show.findById(showId).populate("movie");
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });
    if (selectedSeats.some((seat) => show.occupiedSeats?.[seat])) {
      return res.status(409).json({ success: false, message: "One or more selected seats are no longer available" });
    }
    const booking = await Booking.create({ user: userId, show: showId, amount: show.showPrice * selectedSeats.length, bookedSeats: selectedSeats });
    const availableSeatConditions = Object.fromEntries(selectedSeats.map((seat) => [`occupiedSeats.${seat}`, { $exists: false }]));
    const seatAssignments = Object.fromEntries(selectedSeats.map((seat) => [`occupiedSeats.${seat}`, userId]));
    const reservation = await Show.updateOne({ _id: showId, ...availableSeatConditions }, { $set: seatAssignments });
    if (reservation.modifiedCount !== 1) {
      await Booking.findByIdAndDelete(booking._id);
      return res.status(409).json({ success: false, message: "One or more selected seats are no longer available" });
    }
    const origin = getClientOrigin(req);
    try {
      const session = await makeCheckoutSession(booking, show.movie?.title || "Movie ticket", origin);
      res.status(201).json({ success: true, url: session.url });
    } catch (error) {
      const ownedSeatConditions = Object.fromEntries(selectedSeats.map((seat) => [`occupiedSeats.${seat}`, userId]));
      const seatRemovals = Object.fromEntries(selectedSeats.map((seat) => [`occupiedSeats.${seat}`, ""]));
      await Show.updateOne({ _id: showId, ...ownedSeatConditions }, { $unset: seatRemovals });
      await Booking.findByIdAndDelete(booking._id);
      throw error;
    }
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createBookingCheckout = async (req, res) => {
  try {
    const userId = req.auth()?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Sign in to pay for this booking" });
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: userId }).populate({
      path: "show", populate: { path: "movie" },
    });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.isPaid) return res.status(400).json({ success: false, message: "This booking is already paid" });
    if (booking.stripeSessionId) {
      const stripe = getStripe();
      const previousSession = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
      if (previousSession.payment_status === "paid") {
        booking.isPaid = true;
        booking.paymentLink = "";
        await booking.save();
        return res.status(400).json({ success: false, message: "This booking is already paid" });
      }
      if (previousSession.status === "open") {
        await stripe.checkout.sessions.expire(previousSession.id);
      }
    }
    const origin = getClientOrigin(req);
    const session = await makeCheckoutSession(booking, booking.show?.movie?.title || "Movie ticket", origin);
    res.json({ success: true, url: session.url });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const confirmBookingPayment = async (req, res) => {
  try {
    const userId = req.auth()?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Sign in required" });
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: "Stripe session ID is required" });
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const bookingId = session.metadata?.bookingId;
    const booking = bookingId ? await Booking.findOne({ _id: bookingId, user: userId }) : null;
    if (!booking || booking.stripeSessionId !== session.id) {
      return res.status(404).json({ success: false, message: "Payment booking not found" });
    }
    if (session.payment_status !== "paid") {
      return res.status(409).json({ success: false, message: "Payment has not completed yet" });
    }
    booking.isPaid = true;
    booking.paymentLink = "";
    await booking.save();
    await enqueueBookingConfirmationEmail(booking._id);
    res.json({ success: true, message: "Payment confirmed" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const handleStripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send("STRIPE_WEBHOOK_SECRET is not configured");
  }
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).send(`Invalid Stripe webhook: ${error.message}`);
  }

  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const session = event.data.object;
    if (session.payment_status === "paid" && session.metadata?.bookingId) {
      const booking = await Booking.findOne({ _id: session.metadata.bookingId, stripeSessionId: session.id });
      if (booking) {
        booking.isPaid = true;
        booking.paymentLink = "";
        await booking.save();
        await enqueueBookingConfirmationEmail(booking._id);
      }
    }
  }
  return res.json({ received: true });
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const show = await Show.findById(req.params.showId);
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });
    res.json({ success: true, occupiedSeats: Object.keys(show.occupiedSeats || {}) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

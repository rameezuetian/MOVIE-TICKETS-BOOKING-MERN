import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

export const createBooking = async (req, res) => {
  try {
    const userId = req.auth()?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Sign in to book seats" });
    const { showId, selectedSeats } = req.body;
    if (!showId || !Array.isArray(selectedSeats) || !selectedSeats.length) {
      return res.status(400).json({ success: false, message: "Choose a show and at least one seat" });
    }
    const show = await Show.findById(showId).populate("movie");
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });
    if (selectedSeats.some((seat) => show.occupiedSeats?.[seat])) {
      return res.status(409).json({ success: false, message: "One or more selected seats are no longer available" });
    }
    const booking = await Booking.create({ user: userId, show: showId, amount: show.showPrice * selectedSeats.length, bookedSeats: selectedSeats });
    selectedSeats.forEach((seat) => { show.occupiedSeats[seat] = userId; });
    show.markModified("occupiedSeats");
    await show.save();
    res.status(201).json({ success: true, booking, message: "Booking created" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const show = await Show.findById(req.params.showId);
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });
    res.json({ success: true, occupiedSeats: Object.keys(show.occupiedSeats || {}) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";

export const isAdmin = (_req, res) => res.json({ success: true, isAdmin: true });

export const getDashboardData = async (_req, res) => {
  try {
    const [bookings, activeShows, totalUser] = await Promise.all([
      Booking.find({ isPaid: true }),
      Show.find({ showDateTime: { $gte: new Date() } }).populate("movie"),
      User.countDocuments(),
    ]);
    res.json({ success: true, dashboardData: {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, booking) => sum + booking.amount, 0),
      activeShows, totalUser,
    } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getAllShows = async (_req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate("movie").sort({ showDateTime: 1 });
    res.json({ success: true, shows });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getAllBookings = async (_req, res) => {
  try {
    const bookings = await Booking.find({}).populate("user").populate({ path: "show", populate: { path: "movie" } }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

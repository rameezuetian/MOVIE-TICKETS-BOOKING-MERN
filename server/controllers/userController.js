import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

const requireUser = (req, res) => {
  const userId = req.auth()?.userId;
  if (!userId) res.status(401).json({ success: false, message: "Sign in required" });
  return userId;
};

export const getUserBookings = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bookings = await Booking.find({ user: userId }).populate({ path: "show", populate: { path: "movie" } }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateFavorite = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ success: false, message: "movieId is required" });
    const user = await clerkClient.users.getUser(userId);
    const favorites = user.privateMetadata.favorites || [];
    const updated = favorites.includes(movieId) ? favorites.filter((id) => id !== movieId) : [...favorites, movieId];
    await clerkClient.users.updateUserMetadata(userId, { privateMetadata: { ...user.privateMetadata, favorites: updated } });
    res.json({ success: true, favorites: updated });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const user = await clerkClient.users.getUser(userId);
    const favorites = user.privateMetadata.favorites || [];
    const movies = await Movie.find({ _id: { $in: favorites } });
    res.json({ success: true, movies });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

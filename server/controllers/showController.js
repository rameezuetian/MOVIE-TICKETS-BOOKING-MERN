import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: { accept: "application/json", Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
});

export const getNowPlayingMovies = async (_req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      return res.status(503).json({ success: false, message: "TMDB_API_KEY is not configured on the server" });
    }
    const { data } = await tmdb.get("/movie/now_playing");
    const movies = data.results.map((movie) => ({
      ...movie,
      _id: String(movie.id),
      poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "",
      backdrop_path: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : "",
    }));
    res.json({ success: true, movies });
  } catch (error) {
    res.status(502).json({ success: false, message: error.message });
  }
};

export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body;
    let movie = await Movie.findById(movieId);
    if (!movie) {
      const [{ data: details }, { data: credits }] = await Promise.all([
        tmdb.get(`/movie/${movieId}`), tmdb.get(`/movie/${movieId}/credits`),
      ]);
      movie = await Movie.create({
        _id: String(movieId), title: details.title, overview: details.overview || "",
        poster_path: details.poster_path || "", backdrop_path: details.backdrop_path || "",
        release_date: details.release_date || "", original_language: details.original_language || "",
        tagline: details.tagline || "", genres: details.genres || [], casts: credits.cast || [],
        vote_average: details.vote_average || 0, runtime: details.runtime || 0,
      });
    }

    const shows = (showsInput || []).flatMap(({ date, time }) =>
      (time || []).map((value) => ({
        movie: String(movieId), showDateTime: new Date(`${date}T${value}`), showPrice,
      }))
    );
    if (!shows.length || shows.some((show) => Number.isNaN(show.showDateTime.getTime()))) {
      return res.status(400).json({ success: false, message: "Provide valid show dates and times" });
    }
    await Show.insertMany(shows);
    res.json({ success: true, message: "Show added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShows = async (_req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate("movie").sort({ showDateTime: 1 });
    const movies = [...new Map(shows.filter((show) => show.movie).map((show) => [show.movie._id, show.movie])).values()];
    res.json({ success: true, shows: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const [shows, movie] = await Promise.all([
      Show.find({ movie: movieId, showDateTime: { $gte: new Date() } }).sort({ showDateTime: 1 }),
      Movie.findById(movieId),
    ]);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      (dateTime[date] ||= []).push({ time: show.showDateTime, showId: show._id });
    });
    res.json({ success: true, movie, dateTime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

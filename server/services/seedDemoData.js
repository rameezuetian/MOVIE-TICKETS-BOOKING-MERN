import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { demoMovies } from "../data/demoMovies.js";

export async function seedDemoData() {
  await Movie.bulkWrite(demoMovies.map((movie) => ({
    updateOne: { filter: { _id: movie._id }, update: { $setOnInsert: movie }, upsert: true },
  })));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const shows = [];
  for (const [movieIndex, movie] of demoMovies.entries()) {
    const hasUpcomingShow = await Show.exists({ movie: movie._id, showDateTime: { $gte: new Date() } });
    if (hasUpcomingShow) continue;
    for (const dayOffset of [1, 2, 3]) {
      const showDateTime = new Date(today);
      showDateTime.setUTCDate(showDateTime.getUTCDate() + dayOffset);
      showDateTime.setUTCHours(13 + (movieIndex % 3) * 2, 0, 0, 0);
      shows.push({ movie: movie._id, showDateTime, showPrice: 15, occupiedSeats: {} });
    }
  }
  if (shows.length) {
    await Show.insertMany(shows);
    console.log(`Seeded ${demoMovies.length} demo movies and ${shows.length} upcoming shows`);
  }
}

import { useEffect, useState } from "react";
import { dummyShowsData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import { CalendarIcon, ClockIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "react-hot-toast";

const AddShow = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");

  const fetchNowPlayingMovies = async () => {
    setNowPlayingMovies(dummyShowsData);
  };

  useEffect(() => {
    fetchNowPlayingMovies();
  }, []);

  // Add selected date/time
  const handleDateTimeAdd = () => {
    if (!dateTimeInput) {
      return toast("Please select a date and time");
    }

    const [date, time] = dateTimeInput.split("T");

    setDateTimeSelection((prev) => ({
      ...prev,
      [date]: [...(prev[date] || []), time],
    }));

    setDateTimeInput("");
  };

  // Remove a specific time
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const updated = {
        ...prev,
        [date]: prev[date].filter((item) => item !== time),
      };

      if (updated[date].length === 0) {
        delete updated[date];
      }

      return updated;
    });
  };

  // Remove complete date
  const handleRemoveDate = (date) => {
    setDateTimeSelection((prev) => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
  };

  // Submit show
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedMovie) {
      return toast("Please select a movie");
    }

    if (Object.keys(dateTimeSelection).length === 0) {
      return toast("Please select at least one show time");
    }

    if (!showPrice || Number(showPrice) <= 0) {
      return toast("Please enter a valid ticket price");
    }

    const showData = {
      movie: selectedMovie,
      showPrice: Number(showPrice),
      dateTime: dateTimeSelection,
    };

    console.log("Show Data:", showData);

    toast.success("Show added successfully!");

    // Reset form
    setSelectedMovie(null);
    setDateTimeSelection({});
    setDateTimeInput("");
    setShowPrice("");
  };

  return nowPlayingMovies.length > 0 ? (
    <div className="relative min-h-full overflow-hidden">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle top="500px" right="-100px" />

      <Title text1="Add" text2="Shows" />

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-5xl"
      >
        {/* Movie Selection */}
        <div>
          <h2 className="text-lg font-medium mb-4">
            Select Movie
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {nowPlayingMovies.map((movie) => (
              <div
                key={movie._id}
                onClick={() => setSelectedMovie(movie)}
                className={`relative min-w-[140px] cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                  selectedMovie?._id === movie._id
                    ? "border-primary"
                    : "border-transparent"
                }`}
              >
                <img
                  src={movie.poster_path}
                  alt={movie.title}
                  className="w-full h-[200px] object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2">
                  <p className="text-sm font-medium truncate">
                    {movie.title}
                  </p>
                </div>

                {selectedMovie?._id === movie._id && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full w-6 h-6 flex items-center justify-center">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Movie */}
        {selectedMovie && (
          <div className="mt-6 flex items-center gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <img
              src={selectedMovie.poster_path}
              alt={selectedMovie.title}
              className="w-16 h-24 object-cover rounded"
            />

            <div>
              <h3 className="text-lg font-medium">
                {selectedMovie.title}
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                {selectedMovie.runtime} min •{" "}
                {selectedMovie.genres
                  .map((genre) => genre.name)
                  .join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Date and Time */}
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">
            Select Date & Time
          </h2>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

              <input
                type="datetime-local"
                value={dateTimeInput}
                onChange={(e) => setDateTimeInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md py-3 pl-11 pr-3 outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleDateTimeAdd}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-primary rounded-md hover:bg-primary-dull transition"
            >
              <PlusIcon className="w-5 h-5" />
              Add Time
            </button>
          </div>

          {/* Selected Date/Times */}
          {Object.keys(dateTimeSelection).length > 0 && (
            <div className="mt-5 space-y-4">
              {Object.entries(dateTimeSelection).map(
                ([date, times]) => (
                  <div
                    key={date}
                    className="rounded-lg border border-gray-700 bg-gray-900/50 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />

                        <p className="font-medium">
                          {new Date(`${date}T00:00`).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDate(date)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {times.map((time) => (
                        <div
                          key={time}
                          className="flex items-center gap-2 bg-primary/15 border border-primary/20 px-3 py-2 rounded-md"
                        >
                          <ClockIcon className="w-4 h-4 text-primary" />

                          <span className="text-sm">
                            {time}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveTime(date, time)
                            }
                            className="text-gray-400 hover:text-red-400"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Show Price */}
        <div className="mt-8 max-w-sm">
          <h2 className="text-lg font-medium mb-4">
            Ticket Price
          </h2>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {currency}
            </span>

            <input
              type="number"
              min="1"
              value={showPrice}
              onChange={(e) => setShowPrice(e.target.value)}
              placeholder="Enter ticket price"
              className="w-full bg-gray-900 border border-gray-700 rounded-md py-3 pl-12 pr-3 outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Summary */}
        {selectedMovie &&
          Object.keys(dateTimeSelection).length > 0 &&
          showPrice && (
            <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
              <h2 className="text-lg font-medium mb-4">
                Show Summary
              </h2>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-400">
                    Movie:
                  </span>{" "}
                  {selectedMovie.title}
                </p>

                <p>
                  <span className="text-gray-400">
                    Ticket Price:
                  </span>{" "}
                  {currency}
                  {showPrice}
                </p>

                <p>
                  <span className="text-gray-400">
                    Dates:
                  </span>{" "}
                  {Object.keys(dateTimeSelection).length}
                </p>

                <p>
                  <span className="text-gray-400">
                    Total Shows:
                  </span>{" "}
                  {Object.values(dateTimeSelection).reduce(
                    (total, times) => total + times.length,
                    0
                  )}
                </p>
              </div>
            </div>
          )}

        {/* Submit */}
        <button
          type="submit"
          className="mt-8 bg-primary px-8 py-3 rounded-md font-medium hover:bg-primary-dull transition"
        >
          Add Show
        </button>
      </form>
    </div>
  ) : (
    <Loading />
  );
};

export default AddShow;

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat.js";
import BlurCircle from "../components/BlurCircle.jsx";
import { toast } from "react-hot-toast";
import { apiRequest } from "../lib/api.js";
import { useAuth } from "@clerk/react";


export default function SeatLayout() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
  ];

  const { id, date } = useParams();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const getShow = useCallback(async () => {
    try { setShow(await apiRequest(`/show/${id}`)); }
    catch (error) { console.error(error); setShow({ error: true }); }
  }, [id]);

  const handleSeatClick = (seatId) => {
    // User must select a time first
    if (!selectedTime) {
      return toast("Please select time first");
    }

    // Maximum 5 seats
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast("You can select up to 5 seats");
    }

    // Remove seat if already selected
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats((prev) =>
        prev.filter((item) => item !== seatId)
      );
      return;
    }

    // Add seat
    setSelectedSeats((prev) => [...prev, seatId]);
  };

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex gap-2 mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;

          return (
            <button
              key={seatId}
              disabled={occupiedSeats.includes(seatId)}
              onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${occupiedSeats.includes(seatId) ? "opacity-40 cursor-not-allowed" : ""} ${
                selectedSeats.includes(seatId)
                  ? "bg-primary text-white"
                  : ""
              }`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    getShow();
  }, [getShow]);

  if (!show) {
    return <Loading />;
  }
  if (show.error) return <p className="pt-40 text-center">Unable to load this show.</p>;

  const availableTimes = show.dateTime[date] || [];

  return (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">

      {/* Available Timings */}
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">
          Available Timings
        </p>

        <div className="mt-5 space-y-1">
          {availableTimes.length > 0 ? (
            availableTimes.map((item) => (
              <div
                key={item.time}
                onClick={async () => {
                  setSelectedTime(item);
                  try { const result = await apiRequest(`/booking/seats/${item.showId}`); setOccupiedSeats(result.occupiedSeats || []); }
                  catch (error) { toast.error(error.message); }
                }}
                className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${
                  selectedTime?.time === item.time
                    ? "bg-primary text-white"
                    : "hover:bg-primary/20"
                }`}
              >
                <ClockIcon className="w-4 h-5" />

                <p className="text-sm">
                  {isoTimeFormat(item.time)}
                </p>
              </div>
            ))
          ) : (
            <p className="px-6 text-sm text-gray-400">
              No timings available
            </p>
          )}
        </div>
      </div>

      {/* Seat Layout */}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />

        <h1 className="text-2xl font-semibold mb-4">
          Select your Seat
        </h1>

        <img
          src={assets.screenImage}
          alt="screen"
        />

        <p className="text-gray-500 text-sm mb-6">
          SCREEN SIDE
        </p>

        <div className="flex flex-col items-center mt-10 text-xs text-gray-300">

          {/* First group */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
            {groupRows[0].map((row) => renderSeats(row))}
          </div>

          {/* Remaining groups */}
          <div className="grid grid-cols-2 gap-11">
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>
                {group.map((row) => renderSeats(row))}
              </div>
            ))}
          </div>

        </div>
        <button onClick={async ()=> {
          if (!selectedTime || !selectedSeats.length) return toast("Select a showtime and seats first");
          try {
            const token = await getToken();
            await apiRequest("/booking/create", { method: "POST", token, body: JSON.stringify({ showId: selectedTime.showId, selectedSeats }) });
            toast.success("Booking created"); navigate("/my-bookings");
          } catch (error) { toast.error(error.message); }
        }} className="flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95">
          Proceed to CheckOut
            <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}



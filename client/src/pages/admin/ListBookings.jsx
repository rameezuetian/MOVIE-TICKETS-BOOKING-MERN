import { useEffect, useState } from "react";
import { dummyBookingData } from "../../assets/assets";
import Title from "../../components/admin/Title";
import Loading from "../../components/Loading";
import dateFormat from "../../lib/dateFormat";

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllBookings = async () => {
    setBookings(dummyBookingData);
    setIsLoading(false);
  };

  useEffect(() => {
    getAllBookings();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <Title text1="List" text2="Bookings" />

      <div className="max-w-5xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">
                User Name
              </th>

              <th className="p-2 font-medium">
                Movie Name
              </th>

              <th className="p-2 font-medium">
                Show Time
              </th>

              <th className="p-2 font-medium">
                Seats
              </th>

              <th className="p-2 font-medium">
                Amount
              </th>
            </tr>
          </thead>

          <tbody className="text-sm font-light">
            {bookings.map((booking) => (
              <tr
                key={booking._id}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                {/* User Name */}
                <td className="p-2 pl-5">
                  {booking.user.name}
                </td>

                {/* Movie Name */}
                <td className="p-2">
                  {booking.show.movie.title}
                </td>

                {/* Show Time */}
                <td className="p-2">
                  {dateFormat(booking.show.showDateTime)}
                </td>

                {/* Seats */}
                <td className="p-2">
                  {booking.bookedSeats.join(", ")}
                </td>

                {/* Amount */}
                <td className="p-2">
                  {currency}
                  {booking.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListBookings;


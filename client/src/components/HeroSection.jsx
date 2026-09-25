import backgroundImage from "../assets/backgroundImage.png";
import { assets } from "../assets/assets";
import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

function HeroSection() {
    const navigate = useNavigate()
  return (
    <div
      className="relative flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <img
        src={assets.marvelLogo}
        alt="Marvel"
        className="max-h-11 lg:h-11 mt-20"
      />

      <h1 className="text-5xl md:text-[70px] md:leading-[1.1] font-semibold">
        Guardians <br /> of the Galaxy
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-gray-300">
        <span>Action | Adventure | Sci-Fi</span>

        <div className="flex items-center gap-1">
          <CalendarIcon className="w-5 h-5" />
          <span>2018</span>
        </div>

        <div className="flex items-center gap-1">
          <ClockIcon className="w-5 h-5" />
          <span>2h 8m</span>
        </div>
      </div>
      <p className="max-w-md text-gray-300">
        In a post-apocalyptic world where cities ride on wheels and consume each other to survive, two people meet in London and try to stop a conspiracy.</p>
        <button  onClick={()=> navigate('/movies')} className="flex items-center get-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium">
            Explore Movies
            <ArrowRight className="w-5 h-5" />
        </button>
    </div>
  );
}

export default HeroSection;
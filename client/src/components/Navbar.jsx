import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const {user} = useUser()
  const {openSignIn} = useClerk()

  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
      {/* Logo */}
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      {/* Navigation */}
      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:w-full max-md:h-screen max-md:flex max-md:flex-col max-md:items-center max-md:justify-center max-md:font-medium max-md:text-lg z-50 flex md:flex-row items-center gap-8 md:px-8 py-3 md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border md:border-gray-300/20 overflow-hidden transition-all duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'} `}>
        {/* Close Icon */}
        <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer" onClick={()=> setIsOpen(!isOpen)}/>

        <Link onClick={()=>{scroll(0,0); setIsOpen(false)}}   to="/">Home</Link>

        <Link onClick={()=>{scroll(0,0); setIsOpen(false)}} to="/movies">Movies</Link>

        <Link onClick={()=>{scroll(0,0); setIsOpen(false)}} to="/theaters">Theaters</Link>

        <Link onClick={()=>{scroll(0,0); setIsOpen(false)}}  to="/releases">Releases</Link>

        <Link onClick={()=>{scroll(0,0); setIsOpen(false)}} to="/favorite">Favorites</Link>
      </div>

      {/* Search + Login */}
      <div className="flex items-center gap-4">
        <SearchIcon className="max-md:hidden w-8 h-8 cursor-pointer" />
        {
            !user ? (
                 <button onClick={()=> openSignIn()}  className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer">
          Login
        </button>

            ) : (
                <UserButton>

                    <UserButton.MenuItems>
                        <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15}/>} onClick={()=>navigate('/my-bookings')} />
                    </UserButton.MenuItems>
                </UserButton>
            )
        }

       
      </div>

      {/* Mobile Menu Icon */}
      <MenuIcon className="ml-4 md:hidden w-8 h-8 cursor-pointer"  onClick={()=>setIsOpen(!isOpen)} />
    </div>
  );
}

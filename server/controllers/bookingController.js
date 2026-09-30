// function to check availability of selected seats 

import Show from "../models/Show"

const checkSeatsAvailability = async (showId , selectedSeats)=>{
    try{
        const showData =  await Show.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats;
        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat])

        return !isAnySeatTaken;
    }catch(error){
        console.log(error.message);
        return false;

    }
}


// api for booking 
export const createBooking = async (req , res)=>{
    try{
        const {userId} = req.auth();
        const {showId , selectedSeats} = req.body;

        const {origin}  = req.headers;

        const isAvailable = await checkSeatsAvailability(showId , selectedSeats)

        if(!isAvailable){
            return res.json({success:false , message:"Selected Seats are not available"})

        }

        const showData = await Show.findById(showId).populate('movie')

        const bookings = await Booking.create({
            user: userId,
            show:showId,
            amount:showDate.showPrice * selectedSeats.length ,
            bookedSeats: selectedSeats
        })

        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats')

        await showData.save();


        // Stripe GateWay
        res.json({success:true  , message:"booked successfully"})
    }catch(error){
        console.log(error.message);
        res.json({success:false , message:error.message})
    }
}


export const getOccupiedSeats = async (req, res)=>{
    try {
        
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success:true})


    } catch (error) {
        console.log(error);
        res.json({success:false , message:error.message})
    }
}
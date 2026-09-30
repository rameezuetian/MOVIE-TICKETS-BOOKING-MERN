import Show from "../models/Show";

export const getNowPlayingMovies = async (req, res)=>{
    try{

        await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
             headers: {accept: 'application/json', Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
        })

        const movie = data.results;
        res.json({success:true , movies:movies})
    }catch(error){

        console.log(error);
        res.json({success:false , message:error.message})

    }
}


// api to add a nwe shoe to the database

export const addShow = async (req , res) =>{
    try {
        const {movieId , showsInput , showPrice} = req.body;

        let movie = await Movie.findById(movieId)

        if(!movie){
            const [movieDetailsResponse , movieCreditsResponse] = await Promise.all(
                [
                    axios.get(`https://api.themoviedb.org/3/movie/{movieId}`,{
                         headers: {accept: 'application/json', Authorization: `Bearer ${process.env.TMDB_API_KEY}`}

                    }),
                    axios.get(`https://api.themoviedb.org/3/movie/{movieId}/credits`,{
                                     headers: {accept: 'application/json', Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
                    })

                ]
            )
            const movieApiData = movieCreditsResponse.data;
            const movieCreditsData =  movieCreditsResponse.data;

            const movieDetails = {
                _id :movieId,
                title:movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path:movieApiData.backdrop_path,
                genres:movieApiData.genres,
                casts:movieApiData.cast,
                release_date:movieApiData.release_date,
                original_language:movieApiData.original_language,
                tagline:movieApiData.tagline || " " ,
                vote_average: movieApiData.vote_average,
                runtime:movieApiData.runtime
            }

            movie =  await Movie.create(movieDetails)
        }

        const showsToCreate = [];

        showsInput.forEach(show=>{
            const showDate = show.date;
            show.time.forEach(()=>{
                const dateTimeString = `${showDate}T${time}`;
                showsToCreate.push({
                    movie:movieId,
                    showDateTime:new Date(dateTimeString),
                    showPrice , 
                    occupiedSeats:{}
                })
            })
        });

        if(showsToCreate.length > 0){
            await Show.insertMany(showsToCreate);
        }

        res.json({success:true , message:'Show Added successfully.'})

    } catch (error) {
        console.log(error);
        res.json({success:false , message:error.message})
    }
} 
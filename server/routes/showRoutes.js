import express from "express";
import { addShow, getNowPlayingMovies } from "../controllers/showController";
import { protectAdmin } from "../middleware/auth";

const showRouter = express.Router();


showRouter.get('/now-playing' , getNowPlayingMovies)
showRouter.post('/add' ,  protectAdmin  , addShow)



export default showRouter;
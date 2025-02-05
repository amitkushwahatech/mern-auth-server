import express from "express";
import cors from "cors";

import   'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js'
import userRouter from "./routes/userRoutes.js";


const app = express();
const port = process.env.PORT || 4000
connectDB();

const allowedOrigins = [
    "http://localhost:5173",
    "https://mern-auth-frontend-five.vercel.app"
  ];
  


app.use(express.json());
app.use(cookieParser());
// app.use(cors({origin: allowedOrigins,credentials: true}))
app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
  }));
app.use(express.urlencoded({ extended: true })); 


//debugger in using middleware 
// app.use((req, res, next) => {
//     console.log(`Incoming Request: ${req.method} ${req.url}`);
//     console.log("Request Body:", req.body);
//     next();
// });

// API EndPoint

app.get('/', (req,res)=> {res.send("API is Working successfully.")});
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.listen(port,()=>{
    console.log(`Server started on PORT:${port}`);
}) 


import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import authRouter from "./src/modules/auth/route/index.js";
import initializePassport from "./passport-config.js";
import cors from "cors";
import helmet from "helmet";
import indexRouter from "./src/common/routes/index.js";
import authenticationStatus from "./src/common/middleware/authentication/index.js";

dotenv.config();

const app = express();

mongoose.connect(process.env.DATABASE_URL || "");

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("connected");
});

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRouter);
app.use("/", authenticationStatus(true), indexRouter);

app.listen(3000, () => {
  console.log("server started");
  console.log("http://localhost:3000");
});

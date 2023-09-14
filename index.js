import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import parksRouter from "./routes/parks/index.js";
import matchesRouter from "./routes/matches/index.js";
import courtsRouter from "./routes/courts/index.js";
import picturesRouter from "./routes/pictures/index.js";
import usersRouter from "./routes/users/index.js";
import session from "express-session";
import passport from "passport";
import authRouter from "./routes/auth/index.js";
import initializePassport from "./passport-config.js";
import cors from "cors";
import helmet from "helmet";

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
    origin: "*",
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

// Secret value should be a process env value
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRouter);
app.use("/parks", parksRouter);
app.use("/matches", matchesRouter);
app.use("/courts", courtsRouter);
app.use("/pictures", picturesRouter);
app.use("/users", usersRouter);

app.listen(3000, () => {
  console.log("server started");
});

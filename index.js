import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import parksRouter from "./routes/parks/index.js";
import matchesRouter from "./routes/matches/index.js";

dotenv.config();

const app = express();

mongoose.connect(process.env.DATABASE_URL || "");

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("connected");
});
app.use(express.json());

app.use("/parks", parksRouter);
app.use("/matches", matchesRouter);

app.listen(3000, () => {
  console.log("server started");
});

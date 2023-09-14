// exports all routes
import express from "express";
import parksRouter from "./parks/index.js";
import matchesRouter from "./matches/index.js";
import courtsRouter from "./courts/index.js";
import picturesRouter from "./pictures/index.js";
import usersRouter from "./users/index.js";

const router = express.Router();

router.use("/parks", parksRouter);
router.use("/matches", matchesRouter);
router.use("/courts", courtsRouter);
router.use("/pictures", picturesRouter);
router.use("/users", usersRouter);

export default router;

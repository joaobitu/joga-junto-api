// exports all routes
import express from "express";
import parksRouter from "../../modules/parks/route/index.js";
import matchesRouter from "../../modules/matches/route/index.js";
import picturesRouter from "../../modules/pictures/route/index.js";
import usersRouter from "../../modules/users/route/index.js";

const router = express.Router();

router.use("/parks", parksRouter);
router.use("/matches", matchesRouter);
router.use("/pictures", picturesRouter);
router.use("/users", usersRouter);

export default router;

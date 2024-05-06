// exports all routes
import express from "express";
import parksRouter from "../../modules/parks/route/index.js";
import matchesRouter from "../../modules/matches/route/index.js";
import picturesRouter from "../../modules/pictures/route/index.js";
import usersRouter from "../../modules/users/route/index.js";
import paymentRouter from "../../modules/payment/route/index.js";
import authenticationStatus from "../middleware/authentication/index.js";

const router = express.Router();

router.use("/parks", authenticationStatus(true) ,parksRouter);
router.use("/matches", authenticationStatus(true) ,matchesRouter);
router.use("/pictures",authenticationStatus(true) , picturesRouter);
router.use("/users", usersRouter);
router.use("/payment",authenticationStatus(true) , paymentRouter);

export default router;

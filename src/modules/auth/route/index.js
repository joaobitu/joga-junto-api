import express from "express";
import passport from "passport";
import UserModel from "../../users/model/index.js";
import bcryptjs from "bcryptjs";
import authenticationStatus from "../../../common/middleware/authentication/index.js";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = "ACc19f45a5564e92880b8e4bd2d970c61c";
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = "VA5ac8056e53b50121175d2f6b6fdd24a9";
const client = twilio(accountSid, authToken);
const router = express.Router();

// register
router.post(
  "/register",
  [authenticationStatus(false), verifyOTP],
  async (req, res) => {
    try {
      const hashedPassword = await bcryptjs.hash(req.body.password, 10);
      const user = new UserModel({
        name: req?.body?.name,
        email: req?.body?.email,
        phoneNumber: req?.body?.phoneNumber,
        dateOfBirth: req?.body?.dateOfBirth,
        password: hashedPassword,
      });

      const newUser = await user.save();
      res.status(201).json(newUser);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

//send verification code
router.post("/verify-phone-number", async (req, res) => {
  try {
    const otpResponse = client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: `+55${req.body.phoneNumber}`,
        channel: "sms",
      })
      .then((verification) => verification.status);

    res.status(200).json({
      message: `OTP sent successfully! ${JSON.stringify(otpResponse)}`,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// login
router.post(
  //must add better error handling
  "/login",
  [
    authenticationStatus(false),
    passport.authenticate("local", {
      session: true,
    }),
  ],
  (req, res) => {
    res.send({ message: "logged in", user: req.user });
  }
);

//change password
router.patch(
  "/changePassword",
  authenticationStatus(true),
  async (req, res) => {
    try {
      const user = await UserModel.findById(req.user.id);
      if (user) {
        const isPasswordCorrect = await bcryptjs.compare(
          req.body.oldPassword,
          user.password
        );
        if (isPasswordCorrect) {
          const hashedPassword = await bcryptjs.hash(req.body.newPassword, 10);
          user.password = hashedPassword;
          await user.save();
          res.status(200).json({ message: "password changed" });
        } else {
          res.status(401).json({ message: "wrong password" });
        }
      } else {
        res.status(404).json({ message: "user not found" });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

//logout
router.delete("/logout", authenticationStatus(true), (req, res) => {
  req.logOut((err) =>
    err ? res.status(500).json({ message: err.message }) : null
  );
  res.send("logged out");
});

async function verifyOTP(req, res, next) {
  const { phoneNumber, verificationCode } = req.body;
  try {
    const verifiedResponse = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({
        to: `+55${phoneNumber}`,
        code: verificationCode,
      });
    if (verifiedResponse.status === "approved") {
      next();
    } else {
      res.status(401).json({ message: "wrong verification code" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
export default router;

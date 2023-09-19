import express from "express";
import passport from "passport";
import UserModel from "../../users/model/index.js";
import bcrypt from "bcrypt";
import authenticationStatus from "../../../common/middleware/authentication/index.js";

const router = express.Router();

// register
router.post("/register", authenticationStatus(false), async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new UserModel({
      name: req?.body?.name,
      email: req?.body?.email,
      dateOfBirth: req?.body?.dateOfBirth,
      password: hashedPassword,
    });
    const newUser = await user.save();
    res.status(201).json(newUser);
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
        const isPasswordCorrect = await bcrypt.compare(
          req.body.oldPassword,
          user.password
        );
        if (isPasswordCorrect) {
          const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
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

export default router;

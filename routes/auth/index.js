import express from "express";
import passport from "passport";
import UserModel from "../../models/user/index.js";
import bcrypt from "bcrypt";

const router = express.Router();

// register
router.post("/register", async (req, res) => {
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
  "/login",
  passport.authenticate("local", {
    session: true,
  }),
  (req, res) => {
    res.send("logged in");
  }
);

//logout
router.delete("/logout", (req, res) => {
  req.logOut();
  res.send("logged out");
});

export default router;

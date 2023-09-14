import express from "express";
import UserModel from "../../models/user/index.js";
import isUserAdmin from "../../middleware/role/index.js";
const router = express.Router();

// get user by id
router.get("/:id", getUser, (req, res) => {
  res.send(res.user);
});

// updating a user
router.patch("/:id", getUser, async (req, res) => {
  if (req.body.name != null) {
    res.user.name = req.body.name;
  }
  if (req.body.email != null) {
    res.user.email = req.body.email;
  }
  if (req.body.dateOfBirth != null) {
    res.user.dateOfBirth = req.body.dateOfBirth;
  }
  if (req.body.profilePicture != null) {
    res.user.profilePicture = req.body.profilePicture;
  }
  if (req.body.description != null) {
    res.user.description = req.body.description;
  }
  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// deleting a user
router.delete("/:id", getUser, async (req, res) => {
  if (req.user.id !== req.params.id) {
    if (!isUserAdmin(req, res, next())) {
      return res
        .status(401)
        .json({ message: "Unauthorized, You may only delete your account" });
    }
  }
  try {
    await res.user.deleteOne();
    res.json({
      message: `Deleted User
    ${res.user.name}, id: ${res.user.id}
    `,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// middleware
async function getUser(req, res, next) {
  let user;
  try {
    user = await UserModel.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: "Cannot find user" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.user = user;
  next();
}

export default router;

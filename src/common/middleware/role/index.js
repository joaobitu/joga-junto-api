function isUserAdmin(req, res, next) {
  if (req.user.role === "admin") {
    next();
  } else {
    res.status(403).send("Only admins can access this route");
  }
}

export default isUserAdmin;

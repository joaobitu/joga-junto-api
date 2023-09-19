function authenticationStatus(desiredStatus) {
  return function (req, res, next) {
    if (req.isAuthenticated() === desiredStatus) {
      return next();
    } else {
      return res.status(401).json({
        message: `${
          desiredStatus
            ? "Unauthorized, You are not logged in"
            : "You are already logged in"
        }`,
      });
    }
  };
}

export default authenticationStatus;

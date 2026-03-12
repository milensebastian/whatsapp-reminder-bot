const userService = require("../services/userService");

async function getUsers(req, res, next) {
  try {
    const users = await userService.listUsers({
      role: req.query.role,
      status: req.query.status,
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserByPhone(req, res, next) {
  try {
    const user = await userService.getUserByPhone(req.params.phone || req.query.phone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUserByPhone,
};

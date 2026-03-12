const User = require("../models/User");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

async function requireAuth(req, res, next) {
  try {
    const rawPhone = req.headers["x-user-phone"] || req.headers["x-auth-phone"];

    if (!rawPhone) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Provide x-user-phone header.",
      });
    }

    const phone = normalizePhone(rawPhone);
    const user = await User.findOne({
      phone,
      status: "active",
    }).lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or access denied.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function allowRoles(...roles) {
  const normalizedRoles = roles.map(normalizeRole).filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
        requiredRoles: normalizedRoles,
        currentRole: userRole || "unknown",
      });
    }

    return next();
  };
}

const allowAdmin = allowRoles("admin");
const allowTeacher = allowRoles("teacher");
const allowStudent = allowRoles("student");
const allowTeacherOrAdmin = allowRoles("teacher", "admin");

module.exports = {
  requireAuth,
  allowRoles,
  allowAdmin,
  allowTeacher,
  allowStudent,
  allowTeacherOrAdmin,
};

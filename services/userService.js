const User = require("../models/User");

const MENU_CONTEXT_MINUTES = 15;

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function sanitizeName(value, fallback = "") {
  return String(value || fallback || "").trim();
}

function sanitizeDepartment(value) {
  return String(value || "").trim();
}

function sanitizeYear(value) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(String(value).trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildMenuExpiry(minutes = MENU_CONTEXT_MINUTES) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

async function listUsers(filters = {}) {
  const query = {};

  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.department) query.department = filters.department;
  if (filters.year) query.year = Number(filters.year);
  if (filters.classId) query.classId = filters.classId;

  return User.find(query).sort({ createdAt: -1 }).lean();
}

async function getUserByPhone(phone) {
  return User.findOne({ phone: normalizePhone(phone) }).lean();
}

async function upsertUserFromWhatsapp({ phone, whatsappName }) {
  const normalizedPhone = normalizePhone(phone);
  const displayName = sanitizeName(whatsappName, normalizedPhone);

  return User.findOneAndUpdate(
    { phone: normalizedPhone },
    {
      $set: {
        phone: normalizedPhone,
        whatsappName: whatsappName || "",
        lastSeenAt: new Date(),
      },
      $setOnInsert: {
        name: displayName,
        department: "",
        year: null,
        classId: null,
        role: "student",
        status: "active",
        isRegistered: false,
        registration: {
          step: "none",
          completedAt: null,
        },
        botState: {
          menuExpiresAt: null,
        },
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
}

async function startRegistration({ phone, whatsappName }) {
  const normalizedPhone = normalizePhone(phone);
  const displayName = sanitizeName(whatsappName, normalizedPhone);

  const user = await User.findOneAndUpdate(
    { phone: normalizedPhone },
    {
      $set: {
        whatsappName: whatsappName || "",
        lastSeenAt: new Date(),
        isRegistered: false,
        registration: {
          step: "name",
          completedAt: null,
        },
      },
      $setOnInsert: {
        phone: normalizedPhone,
        name: displayName,
        department: "",
        year: null,
        classId: null,
        role: "student",
        status: "active",
        botState: {
          menuExpiresAt: null,
        },
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return {
    user,
    reply: "Enter your name",
    completed: false,
  };
}

function isRegistrationInProgress(user) {
  return Boolean(
    user &&
      user.registration &&
      ["name", "department", "year"].includes(String(user.registration.step || ""))
  );
}

function hasActiveMenuContext(user) {
  const expiresAt = user?.botState?.menuExpiresAt;
  return Boolean(expiresAt && new Date(expiresAt).getTime() > Date.now());
}

async function setMenuContext(phone) {
  const normalizedPhone = normalizePhone(phone);

  return User.findOneAndUpdate(
    { phone: normalizedPhone },
    {
      $set: {
        "botState.menuExpiresAt": buildMenuExpiry(),
      },
    },
    {
      new: true,
    }
  );
}

async function clearMenuContext(phone) {
  const normalizedPhone = normalizePhone(phone);

  return User.findOneAndUpdate(
    { phone: normalizedPhone },
    {
      $set: {
        "botState.menuExpiresAt": null,
      },
    },
    {
      new: true,
    }
  );
}

async function continueRegistration(user, input) {
  const message = String(input || "").trim();

  if (!user || !isRegistrationInProgress(user)) {
    return {
      handled: false,
      completed: false,
      reply: null,
      user,
    };
  }

  if (!message) {
    return {
      handled: true,
      completed: false,
      reply: `Enter your ${user.registration.step}`,
      user,
    };
  }

  const currentStep = String(user.registration.step);

  if (currentStep === "name") {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          name: sanitizeName(message, user.whatsappName || user.phone),
          registration: {
            step: "department",
            completedAt: null,
          },
          isRegistered: false,
        },
      },
      { new: true, runValidators: true }
    );

    return {
      handled: true,
      completed: false,
      reply: "Enter your department",
      user: updatedUser,
    };
  }

  if (currentStep === "department") {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          department: sanitizeDepartment(message),
          registration: {
            step: "year",
            completedAt: null,
          },
          isRegistered: false,
        },
      },
      { new: true, runValidators: true }
    );

    return {
      handled: true,
      completed: false,
      reply: "Enter your year",
      user: updatedUser,
    };
  }

  if (currentStep === "year") {
    const year = sanitizeYear(message);

    if (!year) {
      return {
        handled: true,
        completed: false,
        reply: "Enter your year as a number",
        user,
      };
    }

    const completedAt = new Date();
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          year,
          isRegistered: true,
          registration: {
            step: "completed",
            completedAt,
          },
          status: "active",
          role: user.role || "student",
        },
      },
      { new: true, runValidators: true }
    );

    return {
      handled: true,
      completed: true,
      reply: "Registration complete\n\nWelcome to Notify.",
      user: updatedUser,
    };
  }

  return {
    handled: false,
    completed: false,
    reply: null,
    user,
  };
}

module.exports = {
  listUsers,
  getUserByPhone,
  upsertUserFromWhatsapp,
  startRegistration,
  continueRegistration,
  isRegistrationInProgress,
  hasActiveMenuContext,
  setMenuContext,
  clearMenuContext,
};

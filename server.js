require("dotenv").config();

const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const connectDB = require("./config/database");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

const webhookRoutes = require("./routes/webhookRoutes");
const taskRoutes = require("./routes/taskRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const emergencyAlertRoutes = require("./routes/emergencyAlertRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const userRoutes = require("./routes/userRoutes");
const classRoutes = require("./routes/classRoutes");
const pollRoutes = require("./routes/pollRoutes");
const fileRoutes = require("./routes/fileRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOADS_DIR = path.join(__dirname, "uploads");

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : "*",
    credentials: true,
  })
);

app.use(compression());
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buffer) => {
      req.rawBody = buffer.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestLogger);

app.use("/css", express.static(path.join(PUBLIC_DIR, "css")));
app.use("/js", express.static(path.join(PUBLIC_DIR, "js")));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(PUBLIC_DIR));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "notify-platform",
    environment: NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    name: "Notify API",
    version: "1.0.0",
    routes: {
      webhook: "/webhook",
      tasks: "/api/tasks",
      announcements: "/api/announcements",
      emergencyAlerts: "/api/emergency-alerts",
      reminders: "/api/reminders",
      users: "/api/users",
      classes: "/api/classes",
      polls: "/api/polls",
      files: "/api/files",
      dashboard: "/api/dashboard",
    },
  });
});

app.get("/", (req, res) => {
  res.redirect("/dashboard/index.html");
});

app.use("/webhook", webhookRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/emergency-alerts", emergencyAlertRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  const isApiRequest = req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/webhook");

  if (isApiRequest) {
    return res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    });
  }

  return res.status(404).sendFile(path.join(PUBLIC_DIR, "dashboard", "index.html"));
});

app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();

    return await new Promise((resolve) => {
      server.listen(PORT, () => {
        console.log(`[startup] Notify server running on port ${PORT} in ${NODE_ENV} mode`);
        resolve(server);
      });
    });
  } catch (error) {
    console.error("[startup] Failed to start server", error);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`[shutdown] Received ${signal}`);

  server.close(() => {
    console.log("[shutdown] HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[shutdown] Forced exit after timeout");
    process.exit(1);
  }, 10000).unref();
}

if (require.main === module) {
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  startServer();
}

module.exports = { app, server, startServer, shutdown };

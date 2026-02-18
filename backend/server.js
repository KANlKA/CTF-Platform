require("dotenv").config();
const isTestEnv = process.env.NODE_ENV === "test";

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

// =======================
//  Allowed Origins
// =======================
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(o => o.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

// =======================
//  CORS (OAuth-safe)
// =======================
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-side requests, OAuth redirects, Postman, etc
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Allow all preflight
app.options("*", cors());

// =======================
//  Body parsing
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
//  Rate limiter
// =======================
const routes = require("./routes");
const { migrateChallenges } = require("./models");
const { limiter } = require("./middleware");

app.use("/api", limiter);

// =======================
//  Test endpoint
// =======================
app.get("/api/data", (req, res) => {
  res.json({ message: "Connected successfully!" });
});

// =======================
//  MongoDB
// =======================
if (!isTestEnv) {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      console.log("✅ MongoDB connected");
      await migrateChallenges();
    })
    .catch(err => console.error("❌ MongoDB error:", err));
}

// =======================
//  Static files
// =======================
app.use("/avatars", express.static(path.join(__dirname, "uploads/avatars")));
app.use("/challenge-files", express.static(path.join(__dirname, "uploads/challenges")));

// =======================
//  Routes
// =======================
app.use("/", routes);

// =======================
//  Health
// =======================
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    dbStatus: mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED",
    timestamp: new Date(),
  });
});

// =======================
//  Start server
// =======================
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;

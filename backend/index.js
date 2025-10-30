require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/userRoute");
const taskRoutes = require("./routes/taskRoute");

const app = express();

const allowedOrigins = [
  "https://to-do-list-three-chi-92.vercel.app",
  "http://127.0.0.1:5502",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.set({
      "Access-Control-Allow-Origin": req.headers.origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    });
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

mongoose.connect(`${process.env.MONGO_URI}/todoApp`)
  .then(() => console.log("✅ MongoDB connected..."))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
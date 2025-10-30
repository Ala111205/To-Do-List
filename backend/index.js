require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/userRoute");
const taskRoutes = require("./routes/taskRoute");

const app = express();

const allowedOrigins = [
  "https://to-do-list-three-chi-92.vercel.app",
  "http://127.0.0.1:5502"                      
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());

mongoose.connect(`${process.env.MONGO_URI}/todoApp`)
  .then(() => console.log("✅ MongoDB connected..."))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  text: String,
  priority: String,
  dueDate: String,
  completed: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Task", taskSchema);
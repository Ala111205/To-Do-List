const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/authChecker");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { text, priority, dueDate } = req.body;
  const task = new Task({ text, priority, dueDate, userId: req.userId});
  await task.save();
  res.json(task);
});

router.get("/", auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId });
  res.json(tasks);
});

router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, userId: req.userId },
    req.body,
    { new: true }
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(task);
});

router.delete("/:id", auth, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: "Task deleted" });
});

module.exports = router;
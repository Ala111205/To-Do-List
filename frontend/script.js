const API_URL = "https://to-do-list-cde0.onrender.com";

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const priority = document.getElementById("priority");
const dueDate = document.getElementById("dueDate");
const filters = document.querySelectorAll(".filters button");
const toggleTheme = document.getElementById("toggleTheme");
const summary = document.getElementById("taskSummary");
const loader = document.getElementById("loader");

let tasks = [];
let currentFilter = "all";
const token = localStorage.getItem("token");

// Signup
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      if (!username || !email || !password) return alert("Enter username, email & password");
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return alert("Please enter a valid email address");
      }

      if (password.length < 6) {
        return alert("Password must be at least 6 characters long");
      }

      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Signup successful! Please login.");
        window.location.href = "login.html";
      } else alert(data.message || "Signup failed");
    } catch (error) {
      console.log("Signup error: ", error)
    }
  });
}

// Login
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        alert("Login successful!");
        window.location.href = "index.html";
      } else alert(data.message || "Login failed");
    } catch (error) {
      console.log("Login error: ", error);
    }
  });
}

function showLoader() {
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

async function fetchTasks() {
  try {
    showLoader();

    if (!token) {
      // Load guest tasks from localStorage
      tasks = JSON.parse(localStorage.getItem("guestTasks")) || [];
      renderTasks();
      return;
    }

    const res = await fetch(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      summary.textContent = "🔒 Session expired. Please log in again.";
      return;
    }

    const data = await res.json();
    tasks = data;
    renderTasks();
  } catch (err) {
    console.error("Error fetching tasks:", err);
  } finally {
    hideLoader(); 
  }
}

function renderTasks() {
  taskList.innerHTML = "";

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === "completed") return task.completed;
    if (currentFilter === "pending") return !task.completed;
    return true;
  });

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.classList.add(task.priority);
    if (task.completed) li.classList.add("completed");

    const today = new Date().toISOString().split("T")[0];
    const overdue = task.dueDate && task.dueDate < today ? "⚠️" : "";

    li.innerHTML = `
      <div>
        <input type="checkbox" ${task.completed ? "checked" : ""}>
        <span>${task.text}</span>
        <small>${task.dueDate ? `(Due: ${task.dueDate}) ${overdue}` : ""}</small>
      </div>
      <div class="actions">
        <button>✏️</button>
        <button>🗑️</button>
      </div>
    `;

    // Event bindings
    li.querySelector("input").addEventListener("change", () => toggleComplete(task._id));
    li.querySelector(".actions button:first-child").addEventListener("click", () => editTask(task._id));
    li.querySelector(".actions button:last-child").addEventListener("click", () => deleteTask(task._id));

    taskList.appendChild(li);
  });

  if (filteredTasks.length === 0) {
    taskList.classList.add("empty");
  } else {
    taskList.classList.remove("empty");
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  if (currentFilter === "all") summary.textContent = `📋 Total Tasks: ${total}`;
  else if (currentFilter === "completed") summary.textContent = `✅ Completed: ${completed}`;
  else summary.textContent = `⏳ Pending: ${pending}`;
}

async function addTask() {
  const text = taskInput.value.trim();
  if (!text) return alert("Task cannot be empty!");

  // Guest user (no token) => add via localstorage
  if (!token) {
    const guestTasks = JSON.parse(localStorage.getItem("guestTasks")) || [];
    const newTask = {
      _id: Date.now(),
      text,
      priority: priority.value,
      dueDate: dueDate.value,
      completed: false,
    };
    guestTasks.push(newTask);
    localStorage.setItem("guestTasks", JSON.stringify(guestTasks));
    tasks = guestTasks;
    renderTasks();
    taskInput.value = "";
    dueDate.value = "";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, priority: priority.value, dueDate: dueDate.value }),
    });
    if (res.ok) {
      await fetchTasks();
      taskInput.value = "";
      dueDate.value = "";
    } else alert("Failed to add task!");
  } catch (err) {
    console.error("Add error:", err);
  }
}

async function toggleComplete(id) {
  // ✅ Guest user
  if (!token) {
    const guestTasks = JSON.parse(localStorage.getItem("guestTasks")) || [];
    const task = guestTasks.find(t => t._id === id);
    if (!task) return;

    task.completed = !task.completed;
    localStorage.setItem("guestTasks", JSON.stringify(guestTasks));
    tasks = guestTasks;
    renderTasks();
    return;
  }

  // ✅ Authenticated user
  const task = tasks.find(t => t._id === id);
  if (!task) return;

  await fetch(`${API_URL}/api/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ completed: !task.completed }),
  });

  fetchTasks();
}

async function editTask(id) {
  const task = tasks.find(t => t._id === id);
  const newText = prompt("Edit your task:", task.text);
  if (!newText) return;

  // Guest user (no token) => update via localStorage
  if (!token) {
    const guestTasks = JSON.parse(localStorage.getItem("guestTasks")) || [];
    const index = guestTasks.findIndex(t => t._id === id);
    if (index !== -1) {
      guestTasks[index].text = newText;
      localStorage.setItem("guestTasks", JSON.stringify(guestTasks));
      tasks = guestTasks;
      renderTasks();
    }
    return;
  }

  try {
    await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: newText }),
    });
    fetchTasks();
  } catch (err) {
    console.error("Edit error:", err);
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;

  // Guest user (no token) => delete from localStorage
  if (!token) {
    const guestTasks = JSON.parse(localStorage.getItem("guestTasks")) || [];
    const updatedTasks = guestTasks.filter(t => t._id !== id);
    localStorage.setItem("guestTasks", JSON.stringify(updatedTasks));
    tasks = updatedTasks;
    renderTasks();
    return;
  }

  try {
    await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks();
  } catch (err) {
    console.error("Delete error:", err);
  }
} 

addBtn.addEventListener("click", addTask);

filters.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".filters .active").classList.remove("active");
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

if (toggleTheme) {
  toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggleTheme.textContent = document.body.classList.contains("dark")
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
  });
}

// if (token) fetchTasks();

document.addEventListener("DOMContentLoaded", () => {
  fetchTasks();

  const logoutBtn = document.querySelector(".logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");

      taskList.innerHTML = "";

      alert("You have been logget out.")
    } catch (err) {
      console.error("Logout error:", err);
      logoutBtn.disabled = false;
      logoutBtn.classList.remove("logging-out");
      alert("Logout failed");
    }
  });
});

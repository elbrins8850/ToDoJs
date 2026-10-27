const STORAGE_KEY = "todohub_tasks";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const dateInput = document.getElementById("due-date");
const titleError = document.getElementById("title-error");
const searchInput = document.getElementById("search");
const filtersBox = document.getElementById("filters");
const listEl = document.getElementById("task-list");
const emptyMsg = document.getElementById("empty-msg");

let tasks = load();
let currentFilter = "all";
let searchTerm = "";

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore storage errors */
  }
}

function formatDate(value) {
  const [y, m, d] = value.split("-");
  return `${m}/${d}/${y}`;
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = task.dueDate.split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

function getVisibleTasks() {
  return tasks.filter((t) => {
    const matchFilter =
      currentFilter === "all" ||
      (currentFilter === "completed" && t.completed) ||
      (currentFilter === "pending" && !t.completed);
    const matchSearch = t.title.toLowerCase().includes(searchTerm);
    return matchFilter && matchSearch;
  });
}

function render() {
  listEl.innerHTML = "";
  const visible = getVisibleTasks();

  if (visible.length === 0) {
    emptyMsg.classList.remove("hidden");
    if (tasks.length === 0) {
      emptyMsg.textContent = "No tasks yet. Add your first task!";
    } else {
      emptyMsg.textContent = "No tasks match your search or filter.";
    }
  } else {
    emptyMsg.classList.add("hidden");
  }

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task" + (task.completed ? " done" : "");

    const check = document.createElement("button");
    check.type = "button";
    check.className = "task-check";
    check.textContent = "✓";
    check.setAttribute("aria-label", "Toggle task completed");
    check.addEventListener("click", () => toggleTask(task.id));

    const body = document.createElement("div");
    body.className = "task-body";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    body.appendChild(title);

    if (task.description) {
      const desc = document.createElement("div");
      desc.className = "task-desc";
      desc.textContent = task.description;
      body.appendChild(desc);
    }

    if (task.dueDate) {
      const date = document.createElement("span");
      date.className = "task-date" + (isOverdue(task) ? " overdue" : "");
      date.textContent = "Due: " + formatDate(task.dueDate);
      body.appendChild(date);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "task-delete";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteTask(task.id));

    li.append(check, body, del);
    listEl.appendChild(li);
  });
}

function addTask(title, description, dueDate) {
  tasks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    description,
    dueDate,
    completed: false,
  });
  save();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    save();
    render();
  }
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  save();
  render();
}

/* ===== Events ===== */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();

  if (!title) {
    titleInput.classList.add("invalid");
    titleError.textContent = "Please enter a task title.";
    titleInput.focus();
    return;
  }

  addTask(title, descInput.value.trim(), dateInput.value);
  form.reset();
  titleInput.classList.remove("invalid");
  titleError.textContent = "";
});

titleInput.addEventListener("input", () => {
  if (titleInput.value.trim()) {
    titleInput.classList.remove("invalid");
    titleError.textContent = "";
  }
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  render();
});

filtersBox.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  filtersBox.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  render();
});

render();


(function () {
  "use strict";

  var STORAGE_KEY = "taskflow.tasks";
  var PRIORITIES = ["high", "medium", "low"];
  var LABELS = { high: "High", medium: "Medium", low: "Low" };

  var DEFAULT_TASKS = [
    { id: "d1", text: "Review project brief",  done: true,  priority: "medium" },
    { id: "d2", text: "Reply to client emails", done: true,  priority: "medium" },
    { id: "d3", text: "Design landing page",   done: false, priority: "high" },
    { id: "d4", text: "Team standup at 3 PM",  done: false, priority: "medium" },
    { id: "d5", text: "Write weekly report",   done: false, priority: "medium" }
  ];

  var nav = document.getElementById("siteNav");
  var menuBtn = document.getElementById("menuBtn");
  var navMenu = document.getElementById("navMenu");

  var panel = document.getElementById("todoPanel");
  var list = document.getElementById("taskList");
  var emptyMsg = document.getElementById("emptyMsg");
  var counter = document.getElementById("counter");
  var bar = document.getElementById("bar");
  var barFill = document.getElementById("barFill");
  var form = document.getElementById("addForm");
  var input = document.getElementById("taskInput");
  var prioritySelect = document.getElementById("prioritySelect");
  var formError = document.getElementById("formError");
  var toast = document.getElementById("toast");

  /* ---------- Storage ---------- */
  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function cleanTasks(arr) {
    return arr
      .filter(function (t) { return t && typeof t.text === "string" && t.text.trim() !== ""; })
      .map(function (t) {
        return {
          id: String(t.id || makeId()),
          text: t.text.slice(0, 80),
          done: Boolean(t.done),
          priority: PRIORITIES.indexOf(t.priority) !== -1 ? t.priority : "medium"
        };
      });
  }

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return DEFAULT_TASKS.map(function (t) { return Object.assign({}, t); });
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? cleanTasks(parsed) : [];
    } catch (err) {
      return DEFAULT_TASKS.map(function (t) { return Object.assign({}, t); });
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      /* storage can be blocked (private mode); the list still works for this visit */
    }
  }

  var tasks = loadTasks();

  /* ---------- Rendering ---------- */
  function buildTask(task) {
    var li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");
    li.dataset.id = task.id;

    var check = document.createElement("button");
    check.type = "button";
    check.className = "chk";
    check.dataset.action = "toggle";
    check.setAttribute("role", "checkbox");
    check.setAttribute("aria-checked", String(task.done));
    check.setAttribute("aria-label", task.text);
    check.textContent = task.done ? "\u2713" : "";

    var text = document.createElement("span");
    text.className = "task-text";
    text.dataset.action = "toggle";
    text.textContent = task.text;               /* textContent keeps user text safe */

    var tag = document.createElement("button");
    tag.type = "button";
    tag.className = "tag " + task.priority;
    tag.dataset.action = "priority";
    tag.title = "Click to change priority";
    tag.textContent = LABELS[task.priority];

    var del = document.createElement("button");
    del.type = "button";
    del.className = "del";
    del.dataset.action = "delete";
    del.setAttribute("aria-label", "Delete task: " + task.text);
    del.textContent = "\u00d7";

    li.append(check, text, tag, del);
    return li;
  }

  function render() {
    list.textContent = "";
    tasks.forEach(function (task) { list.appendChild(buildTask(task)); });

    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.done; }).length;
    var percent = total ? Math.round((done / total) * 100) : 0;

    counter.textContent = done + " of " + total + " done";
    barFill.style.width = percent + "%";
    bar.setAttribute("aria-valuenow", String(percent));
    emptyMsg.hidden = total !== 0;
  }

  /* Keep keyboard focus on the same button after the list redraws */
  function refocus(id, action) {
    var items = Array.prototype.slice.call(list.children);
    var li = items.filter(function (el) { return el.dataset.id === id; })[0];
    var btn = li && li.querySelector("button[data-action='" + action + "']");
    if (btn) btn.focus();
  }

  /* ---------- Task list clicks (one listener for every task) ---------- */
  list.addEventListener("click", function (e) {
    var target = e.target.closest("[data-action]");
    if (!target) return;

    var li = target.closest(".task");
    var id = li.dataset.id;
    var action = target.dataset.action;
    var task = tasks.filter(function (t) { return t.id === id; })[0];
    if (!task) return;

    if (action === "toggle") {
      task.done = !task.done;
    } else if (action === "priority") {
      task.priority = PRIORITIES[(PRIORITIES.indexOf(task.priority) + 1) % PRIORITIES.length];
    } else if (action === "delete") {
      tasks = tasks.filter(function (t) { return t.id !== id; });
    }

    saveTasks();
    render();

    if (action === "toggle") refocus(id, "toggle");
    if (action === "priority") refocus(id, "priority");
  });

  /* ---------- Add a task ---------- */
  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
    input.setAttribute("aria-invalid", "true");
  }

  function clearError() {
    formError.hidden = true;
    input.removeAttribute("aria-invalid");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();

    if (!text) {
      showError("Enter a task first.");
      input.focus();
      return;
    }

    tasks.push({ id: makeId(), text: text, done: false, priority: prioritySelect.value });
    saveTasks();
    render();

    input.value = "";
    clearError();
    input.focus();
  });

  input.addEventListener("input", clearError);

  var toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2500);
  }

  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  menuBtn.addEventListener("click", function () {
    setMenu(!nav.classList.contains("open"));
  });

  navMenu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });


  window.matchMedia("(min-width: 769px)").addEventListener("change", function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Buttons that show a message ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-toast]"), function (btn) {
    btn.addEventListener("click", function () {
      setMenu(false);
      showToast(btn.dataset.toast);
    });
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scrollToEl(el, block) {
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: block });
  }

  document.getElementById("startBtn").addEventListener("click", function () {
    scrollToEl(panel, "center");
    input.focus({ preventScroll: true });
  });

  document.getElementById("howBtn").addEventListener("click", function () {
    scrollToEl(document.getElementById("features"), "start");
  });
  document.getElementById("year").textContent = new Date().getFullYear();

  render();
})();

/* ============================================
   ZenTask — script.js
   Vanilla JS, LocalStorage persistence
   No frameworks, no libraries
============================================ */

// ============ STATE ============
let tasks = [];
let currentView = 'all';      // all | active | completed | focus
let priorityFilter = 'all';   // all | high | medium | low
let sortOrder = 'newest';
let searchQuery = '';
let editingId = null;

// ============ ZEN QUOTES ============
const ZEN_QUOTES = [
  'The journey of a thousand miles begins with a single step. — Lao Tzu',
  'In the beginner\'s mind there are many possibilities. — Shunryu Suzuki',
  'Simplicity is the ultimate sophistication.',
  'Do the difficult things while they are easy. — Lao Tzu',
  'The present moment always will have been.',
  'Not all those who wander are lost. Begin where you are.',
  'Silence is a source of great strength. — Lao Tzu',
  'Everything has beauty, but not everyone sees it. — Confucius',
  'Act without expectation. — Lao Tzu',
  'The obstacle is the path. — Zen proverb',
  'If you are depressed you are living in the past. If you are anxious you are living in the future. If you are at peace you are living in the present.',
  'Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.',
  'To know what you know and what you do not know, that is true knowledge.',
  'Empty your mind, be formless, shapeless like water. — Bruce Lee',
];

// ============ HELPERS ============
const $ = id => document.getElementById(id);
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const uid = () => '_' + Math.random().toString(36).slice(2, 10);

function saveTasks() {
  localStorage.setItem('zentask_v1', JSON.stringify(tasks));
}
function loadTasks() {
  try { tasks = JSON.parse(localStorage.getItem('zentask_v1')) || []; }
  catch(e) { tasks = []; }
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(iso) {
  if (!iso) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(iso + 'T00:00:00');
  return due < today;
}

// ============ DATE & QUOTE ============
function setDateAndQuote() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  $('todayDate').textContent = dateStr;
  $('zenQuote').textContent = '"' + rand(ZEN_QUOTES) + '"';
}

function rotateQuote() {
  const el = $('zenQuote');
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = '"' + rand(ZEN_QUOTES) + '"';
    el.style.transition = 'opacity 0.6s ease';
    el.style.opacity = '1';
  }, 400);
}
// Rotate quote every 45 seconds
setInterval(rotateQuote, 45000);

// ============ PROGRESS ============
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const remaining = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  $('stat-total').textContent = total;
  $('stat-done').textContent = done;
  $('stat-remaining').textContent = remaining;
  $('progressPct').textContent = pct + '%';

  // Circle: circumference = 2π × 40 ≈ 251.2
  const circ = 251.2;
  const offset = circ - (pct / 100) * circ;
  $('ringFill').style.strokeDashoffset = offset;

  // Progress desc
  let desc = 'Begin with a single task. The path unfolds.';
  if (total > 0 && pct === 0) desc = 'Your journey awaits. Take the first step.';
  else if (pct > 0 && pct < 50) desc = 'Good start. Keep moving with intention.';
  else if (pct >= 50 && pct < 100) desc = 'Halfway through. The momentum is yours.';
  else if (pct === 100) desc = 'All tasks complete. Rest in accomplishment. 🌸';
  $('progressDesc').textContent = desc;
}

// ============ FOCUS BANNER ============
function updateFocusBanner() {
  const high = tasks.find(t => t.priority === 'high' && !t.completed);
  if (high) {
    $('focusTask').textContent = high.text;
  } else {
    $('focusTask').textContent = 'No focus task set. Add a high-priority task to pin it here.';
  }
}

// ============ FILTER & SORT ============
function getFilteredTasks() {
  let list = [...tasks];

  // View filter
  if (currentView === 'active')    list = list.filter(t => !t.completed);
  if (currentView === 'completed') list = list.filter(t => t.completed);
  if (currentView === 'focus')     list = list.filter(t => !t.completed && t.priority === 'high');

  // Priority chip filter
  if (priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter);

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(t => t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }

  // Sort
  if (sortOrder === 'newest')   list.sort((a,b) => b.createdAt - a.createdAt);
  if (sortOrder === 'oldest')   list.sort((a,b) => a.createdAt - b.createdAt);
  if (sortOrder === 'priority') {
    const pMap = { high: 0, medium: 1, low: 2 };
    list.sort((a,b) => pMap[a.priority] - pMap[b.priority]);
  }
  if (sortOrder === 'due') {
    list.sort((a,b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  return list;
}

// ============ RENDER TASKS ============
function renderTasks() {
  const list = getFilteredTasks();
  const container = $('taskList');
  const empty = $('emptyState');

  if (list.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    // Contextual empty state
    if (currentView === 'completed') {
      $('emptyState').querySelector('.empty-title').textContent = 'No completed tasks yet';
      $('emptyState').querySelector('.empty-sub').textContent = 'Complete a task to see it here.';
    } else if (currentView === 'focus') {
      $('emptyState').querySelector('.empty-title').textContent = 'No high-priority tasks';
      $('emptyState').querySelector('.empty-sub').textContent = 'Add a high-priority task to enter focus mode.';
    } else if (searchQuery) {
      $('emptyState').querySelector('.empty-title').textContent = 'No results found';
      $('emptyState').querySelector('.empty-sub').textContent = 'Try a different search term.';
    } else {
      $('emptyState').querySelector('.empty-title').textContent = 'Emptiness is potential';
      $('emptyState').querySelector('.empty-sub').textContent = 'Add your first task to begin the journey.';
    }
    return;
  }

  empty.style.display = 'none';

  container.innerHTML = list.map(task => {
    const overdue = isOverdue(task.dueDate) && !task.completed;
    const dueLabel = task.dueDate ? `<span class="task-due ${overdue ? 'overdue' : ''}">
      ${overdue ? '⚑' : '○'} ${formatDate(task.dueDate)}
    </span>` : '';

    return `
    <div class="task-card ${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-check ${task.completed ? 'checked' : ''}"
           onclick="toggleTask('${task.id}')"
           title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
        ${task.completed ? '✓' : ''}
      </div>
      <div class="task-body">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-meta-row">
          <span class="task-tag tag-${task.priority}">${task.priority}</span>
          ${task.category !== 'general' ? `<span class="task-cat">${task.category}</span>` : ''}
          ${dueLabel}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn" onclick="openEdit('${task.id}')" title="Edit task">✎</button>
        <button class="action-btn delete" onclick="deleteTask('${task.id}')" title="Delete task">✕</button>
      </div>
    </div>`;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============ FULL RENDER ============
function render() {
  renderTasks();
  updateProgress();
  updateFocusBanner();
}

// ============ ADD TASK ============
function addTask() {
  const text = $('taskInput').value.trim();
  if (!text) { $('taskInput').focus(); shakeInput(); return; }

  const task = {
    id: uid(),
    text,
    priority: $('prioritySelect').value,
    category: $('categorySelect').value,
    dueDate: $('dueDateInput').value || null,
    completed: false,
    createdAt: Date.now(),
  };

  tasks.unshift(task);
  saveTasks();
  render();

  $('taskInput').value = '';
  $('taskInput').focus();
}

function shakeInput() {
  const inp = $('taskInput');
  inp.style.borderBottomColor = 'var(--high-color)';
  inp.placeholder = 'Please enter a task first…';
  setTimeout(() => {
    inp.style.borderBottomColor = '';
    inp.placeholder = 'Add a new task…';
  }, 1800);
}

// ============ TOGGLE COMPLETE ============
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

// ============ DELETE ============
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

// ============ EDIT MODAL ============
function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;
  $('editInput').value = task.text;
  $('editPriority').value = task.priority;
  $('editCategory').value = task.category;
  $('editDue').value = task.dueDate || '';
  openModal();
}

function saveEdit() {
  const text = $('editInput').value.trim();
  if (!text) return;
  const task = tasks.find(t => t.id === editingId);
  if (!task) return;
  task.text = text;
  task.priority = $('editPriority').value;
  task.category = $('editCategory').value;
  task.dueDate = $('editDue').value || null;
  saveTasks();
  render();
  closeModal();
}

function openModal() {
  $('editModal').classList.add('open');
  $('modalOverlay').classList.add('open');
  $('editInput').focus();
}
function closeModal() {
  $('editModal').classList.remove('open');
  $('modalOverlay').classList.remove('open');
  editingId = null;
}

// ============ NAVIGATION ============
function setView(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  render();
}

// ============ SETTINGS PANEL ============
function openSettings() {
  $('settingsPanel').classList.add('open');
  $('settingsOverlay').classList.add('open');
}
function closeSettingsPanel() {
  $('settingsPanel').classList.remove('open');
  $('settingsOverlay').classList.remove('open');
}

// ============ DARK MODE ============
function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = newTheme;
  localStorage.setItem('zentask_theme', newTheme);
  $('themeIcon').textContent = newTheme === 'dark' ? '☀' : '☽';
  // Sync small toggle
  if ($('themeToggleSm')) $('themeToggleSm').textContent = newTheme === 'dark' ? '☀' : '☽';
}

function loadTheme() {
  const saved = localStorage.getItem('zentask_theme') || 'light';
  document.documentElement.dataset.theme = saved;
  $('themeIcon').textContent = saved === 'dark' ? '☀' : '☽';
}

// ============ EVENT LISTENERS ============
function bindEvents() {
  // Add task
  $('addBtn').addEventListener('click', addTask);
  $('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  // Nav items
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const view = el.dataset.view;
      if (view === 'settings') { openSettings(); return; }
      setView(view);
    });
  });

  // Priority chips
  document.querySelectorAll('.chip[data-priority]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      priorityFilter = btn.dataset.priority;
      render();
    });
  });

  // Sort
  $('sortSelect').addEventListener('change', e => { sortOrder = e.target.value; render(); });

  // Search
  $('searchInput').addEventListener('input', e => { searchQuery = e.target.value; render(); });

  // Theme toggles
  $('themeToggle').addEventListener('click', toggleTheme);
  if ($('themeToggleSm')) $('themeToggleSm').addEventListener('click', toggleTheme);

  // Modal
  $('closeModal').addEventListener('click', closeModal);
  $('cancelEdit').addEventListener('click', closeModal);
  $('saveEdit').addEventListener('click', saveEdit);
  $('modalOverlay').addEventListener('click', closeModal);
  $('editInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveEdit(); });

  // Settings
  $('closeSettings').addEventListener('click', closeSettingsPanel);
  $('settingsOverlay').addEventListener('click', closeSettingsPanel);
  $('clearCompleted').addEventListener('click', () => {
    if (confirm('Clear all completed tasks?')) {
      tasks = tasks.filter(t => !t.completed);
      saveTasks(); render(); closeSettingsPanel();
    }
  });
  $('resetAll').addEventListener('click', () => {
    if (confirm('Delete ALL tasks? This cannot be undone.')) {
      tasks = []; saveTasks(); render(); closeSettingsPanel();
    }
  });

  // Mobile menu
  if ($('menuBtn')) {
    $('menuBtn').addEventListener('click', () => {
      const sb = $('sidebar');
      sb.classList.toggle('mobile-open');
    });
    // Close sidebar when clicking outside
    document.addEventListener('click', e => {
      const sb = $('sidebar');
      const btn = $('menuBtn');
      if (!sb.contains(e.target) && !btn.contains(e.target)) {
        sb.classList.remove('mobile-open');
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Ctrl+F — focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      $('searchInput').focus();
    }
    // Ctrl+D — toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      toggleTheme();
    }
    // Escape — close panels
    if (e.key === 'Escape') {
      closeModal();
      closeSettingsPanel();
      if ($('sidebar').classList.contains('mobile-open')) {
        $('sidebar').classList.remove('mobile-open');
      }
    }
  });
}

// ============ SEED DEMO TASKS ============
function seedDemo() {
  if (tasks.length > 0) return; // Don't overwrite existing data
  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  tasks = [
    { id: uid(), text: 'Morning meditation — 10 minutes of silence', priority: 'high', category: 'health', dueDate: fmt(today), completed: false, createdAt: Date.now() - 5000 },
    { id: uid(), text: 'Review quarterly goals and adjust priorities', priority: 'high', category: 'work', dueDate: fmt(tomorrow), completed: false, createdAt: Date.now() - 4000 },
    { id: uid(), text: 'Read one chapter of Deep Work by Cal Newport', priority: 'medium', category: 'learning', dueDate: null, completed: false, createdAt: Date.now() - 3000 },
    { id: uid(), text: 'Write in journal — reflect on the week', priority: 'medium', category: 'personal', dueDate: fmt(today), completed: false, createdAt: Date.now() - 2000 },
    { id: uid(), text: 'Prepare agenda for Monday\'s team meeting', priority: 'medium', category: 'work', dueDate: fmt(yesterday), completed: true, createdAt: Date.now() - 1000 },
    { id: uid(), text: 'Evening walk in the garden — 20 minutes', priority: 'low', category: 'health', dueDate: null, completed: true, createdAt: Date.now() - 500 },
  ];
  saveTasks();
}

// ============ INIT ============
function init() {
  loadTasks();
  loadTheme();
  setDateAndQuote();
  seedDemo();
  bindEvents();
  render();
}

document.addEventListener('DOMContentLoaded', init);

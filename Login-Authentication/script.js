// --- Utilities ---
const $ = id => document.getElementById(id);
const getUsers = () => JSON.parse(localStorage.getItem('neo_users') || '[]');
const saveUsers = u => localStorage.setItem('neo_users', JSON.stringify(u));
const setSession = u => localStorage.setItem('neo_session', JSON.stringify(u));
const getSession = () => JSON.parse(localStorage.getItem('neo_session') || 'null');
const clearSession = () => localStorage.removeItem('neo_session');

function toast(msg, type = 'success') {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

function togglePwd(inputId) {
  const inp = $(inputId);
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// --- Password strength ---
function checkStrength(val) {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score;
}

function updateStrength(val) {
  const bar = $('strength');
  if (!bar) return;
  bar.className = 'strength-bar' + (val ? ` s${checkStrength(val)}` : '');
}

// --- Signup ---
function signup() {
  const name = $('name').value.trim();
  const username = $('username').value.trim();
  const email = $('email').value.trim();
  const pwd = $('pwd').value;
  const cpwd = $('cpwd').value;

  if (!name || !username || !email || !pwd || !cpwd)
    return toast('Please fill in all fields.', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return toast('Enter a valid email address.', 'error');
  if (pwd.length < 6)
    return toast('Password must be at least 6 characters.', 'error');
  if (pwd !== cpwd)
    return toast('Passwords do not match.', 'error');

  const users = getUsers();
  if (users.find(u => u.email === email || u.username === username))
    return toast('Email or username already exists.', 'error');

  users.push({ name, username, email, pwd });
  saveUsers(users);
  toast('Account created! Redirecting…');
  setTimeout(() => location.href = 'index.html', 1500);
}

// --- Login ---
function login() {
  const id = $('identifier').value.trim();
  const pwd = $('pwd').value;
  const remember = $('remember')?.checked;

  if (!id || !pwd) return toast('Please fill in all fields.', 'error');

  const users = getUsers();
  const user = users.find(u => (u.email === id || u.username === id) && u.pwd === pwd);
  if (!user) return toast('Invalid credentials.', 'error');

  const session = { ...user, loginTime: new Date().toISOString(), remember };
  setSession(session);
  toast('Welcome back! Redirecting…');
  setTimeout(() => location.href = 'dashboard.html', 1200);
}

// --- Dashboard ---
function initDashboard() {
  const session = getSession();
  if (!session) return location.href = 'index.html';

  $('user-name').textContent = session.name.split(' ')[0];
  $('d-name').textContent = session.name;
  $('d-email').textContent = session.email;
  $('d-username').textContent = '@' + session.username;
  $('d-avatar').textContent = session.name.charAt(0).toUpperCase();

  const loginTime = new Date(session.loginTime);
  $('d-login').textContent = loginTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  $('d-date').textContent = loginTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  // Live clock
  setInterval(() => {
    const now = new Date();
    $('d-clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);
}

function logout() {
  clearSession();
  toast('Logged out.');
  setTimeout(() => location.href = 'index.html', 800);
}

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if ($('identifier')) login();
  else if ($('name')) signup();
});

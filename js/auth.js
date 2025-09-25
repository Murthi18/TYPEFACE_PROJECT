// Store users in localStorage (only for demo)
const USERS_KEY = 'finance_users';
const SESSION_KEY = 'finance_session';

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY));
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ----------------------
   Signup logic
   ---------------------- */
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (document.getElementById('signupEmail').value || '').trim();
    const pwd = (document.getElementById('signupPassword').value || '').trim();
    const confirm = (document.getElementById('signupConfirmPassword').value || '').trim();
    const errorEl = document.getElementById('signupError');

    if (errorEl) errorEl.innerText = '';

    if (!email || !pwd || !confirm) {
      if (errorEl) errorEl.innerText = 'Please fill all fields';
      return;
    }

    if (pwd !== confirm) {
      if (errorEl) errorEl.innerText = 'Passwords do not match';
      return;
    }

    let users = getUsers();
    if (users.find(u => u.email === email)) {
      if (errorEl) errorEl.innerText = 'User already exists';
      return;
    }

    users.push({ email, pwd });
    saveUsers(users);

    // ✅ Instead of logging in immediately, send user to Login page
    alert('Signup successful! Please login with your new account.');
    window.location.href = 'index.html';
  });
}

/* ----------------------
   Login logic (unchanged)
   ---------------------- */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('loginEmail');
    const pwdEl = document.getElementById('loginPassword');
    const errorEl = document.getElementById('loginError');

    const email = (emailEl && emailEl.value || '').trim();
    const pwd = (pwdEl && pwdEl.value || '').trim();

    if (errorEl) errorEl.innerText = '';

    if (!email || !pwd) {
      if (errorEl) errorEl.innerText = 'Please enter both email and password';
      return;
    }

    let users = getUsers();
    const user = users.find(u => u.email === email && u.pwd === pwd);
    if (!user) {
      if (errorEl) errorEl.innerText = 'Invalid credentials';
      return;
    }

    setSession({ email });
    window.location.href = 'dashboard.html';
  });
}

/* ----------------------
   Dashboard protection & logout
   ---------------------- */
if (window.location.pathname.includes('dashboard.html')) {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
  } else {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearSession();
        window.location.href = 'index.html';
      });
    }
  }
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const msg = document.getElementById('loginMsg');
  
  if (!username || !password) {
    msg.innerText = 'Please enter username and password';
    return;
  }
  
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { msg.innerText = data.error || 'Login failed'; return; }
    localStorage.setItem('token', data.token);
    if (data.created) msg.innerText = 'Account created and logged in';
    else msg.innerText = 'Logged in — token saved';
  } catch (err) {
    msg.innerText = 'Network error: ' + err.message;
  }
});

async function refresh() {
  const token = localStorage.getItem('token');
  const el = document.getElementById('balance');
  if (!token) { el.innerText = 'Please log in first.'; return; }
  try {
    const res = await fetch('/me', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if (!res.ok) { el.innerText = data.error || 'Failed to load'; return; }
    el.innerText = `Username: ${data.username} — Zapz: ${data.zaps}`;
  } catch (err) {
    el.innerText = 'Network error: ' + err.message;
  }
}

document.getElementById('refresh').addEventListener('click', refresh);

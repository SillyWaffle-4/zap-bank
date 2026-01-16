document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const msg = document.getElementById('loginMsg');
  if (!res.ok) { msg.innerText = await res.text(); return; }
  const data = await res.json();
  localStorage.setItem('token', data.token);
  if (data.created) msg.innerText = 'Account created and logged in';
  else msg.innerText = 'Logged in — token saved';
});

async function refresh() {
  const token = localStorage.getItem('token');
  const el = document.getElementById('balance');
  if (!token) { el.innerText = 'Please log in first.'; return; }
  const res = await fetch('/me', { headers: { 'Authorization': 'Bearer ' + token } });
  if (!res.ok) { el.innerText = await res.text(); return; }
  const data = await res.json();
  el.innerText = `Username: ${data.username} — Zapz: ${data.zaps}`;
}

document.getElementById('refresh').addEventListener('click', refresh);

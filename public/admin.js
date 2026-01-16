document.getElementById('adminLogin').addEventListener('click', async () => {
  const adminKey = document.getElementById('adminKey').value;
  const res = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey })
  });
  const msg = document.getElementById('adminLoginMsg');
  if (!res.ok) { msg.innerText = await res.text(); return; }
  const data = await res.json();
  localStorage.setItem('adminToken', data.token);
  msg.innerText = 'Admin logged in — token stored';
  // load users after successful admin login
  loadUsers();
});

document.getElementById('donateBtn').addEventListener('click', async () => {
  const username = document.getElementById('targetUser').value;
  const amount = Number(document.getElementById('amount').value);
  const token = localStorage.getItem('adminToken');
  const msg = document.getElementById('donateMsg');
  if (!token) { msg.innerText = 'Please login as admin first.'; return; }
  const res = await fetch('/admin/donate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ username, amount })
  });
  msg.innerText = await res.text();
  // refresh users list after donation
  loadUsers();
});

async function loadUsers() {
  const token = localStorage.getItem('adminToken');
  const grid = document.getElementById('usersGrid');
  if (!token) { grid.innerHTML = '<em>Login as admin to see users.</em>'; return; }
  const res = await fetch('/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
  if (!res.ok) { grid.innerText = await res.text(); return; }
  const users = await res.json();
  grid.innerHTML = '';
  users.forEach(u => {
    const tile = document.createElement('div');
    tile.className = 'user-tile';
    tile.innerHTML = `<div class="user-name">${u.username}</div><div class="muted">Zapz: <span class=\"zap-count\">${u.zaps}</span></div><div class=\"quick-row\"><input class=\"quick-amount\" type=\"number\" placeholder=\"amt\"><button class=\"quick-donate\">Donate</button></div>`;
    // donate handler
    tile.querySelector('.quick-donate').addEventListener('click', async (e) => {
      e.stopPropagation();
      const amt = Number(tile.querySelector('.quick-amount').value);
      if (!amt) { alert('Enter an amount'); return; }
      const res = await fetch('/admin/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ username: u.username, amount: amt })
      });
      const text = await res.text();
      alert(text);
      loadUsers();
    });
    // clicking tile prompts for quick donate as well
    tile.addEventListener('click', async () => {
      const amtStr = prompt(`Donate how many Zapz to ${u.username}?`);
      const amt = Number(amtStr);
      if (!amt) return;
      const res = await fetch('/admin/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ username: u.username, amount: amt })
      });
      alert(await res.text());
      loadUsers();
    });
    grid.appendChild(tile);
  });
}

// If already logged in (token present) load users on page open
if (localStorage.getItem('adminToken')) loadUsers();

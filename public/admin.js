document.getElementById('adminLogin').addEventListener('click', async () => {
  const adminKey = document.getElementById('adminKey').value;
  const msg = document.getElementById('adminLoginMsg');
  
  if (!adminKey) {
    msg.innerText = 'Please enter admin key';
    return;
  }
  
  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey })
    });
    const data = await res.json();
    if (!res.ok) { msg.innerText = data.error || 'Admin login failed'; return; }
    localStorage.setItem('adminToken', data.token);
    msg.innerText = 'Admin logged in — token stored';
    // load users after successful admin login
    loadUsers();
  } catch (err) {
    msg.innerText = 'Network error: ' + err.message;
  }
});

document.getElementById('donateBtn').addEventListener('click', async () => {
  const username = document.getElementById('targetUser').value;
  const amount = Number(document.getElementById('amount').value);
  const token = localStorage.getItem('adminToken');
  const msg = document.getElementById('donateMsg');
  if (!token) { msg.innerText = 'Please login as admin first.'; return; }
  if (!username || !amount) { msg.innerText = 'Enter username and amount'; return; }
  try {
    const res = await fetch('/admin/donate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ username, amount })
    });
    const data = await res.json();
    msg.innerText = data.message || data.error || 'Donation processed';
    // refresh users list after donation
    loadUsers();
  } catch (err) {
    msg.innerText = 'Network error: ' + err.message;
  }
});

async function loadUsers() {
  const token = localStorage.getItem('adminToken');
  const grid = document.getElementById('usersGrid');
  if (!token) { grid.innerHTML = '<em>Login as admin to see users.</em>'; return; }
  try {
    const res = await fetch('/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) { const data = await res.json(); grid.innerText = data.error || 'Failed to load users'; return; }
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
        try {
          const res = await fetch('/admin/donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ username: u.username, amount: amt })
          });
          const data = await res.json();
          alert(data.message || data.error || 'Donation processed');
          loadUsers();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
      // clicking tile prompts for quick donate as well
      tile.addEventListener('click', async () => {
        const amtStr = prompt(`Donate how many Zapz to ${u.username}?`);
        const amt = Number(amtStr);
        if (!amt) return;
        try {
          const res = await fetch('/admin/donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ username: u.username, amount: amt })
          });
          const data = await res.json();
          alert(data.message || data.error || 'Donation processed');
          loadUsers();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
      grid.appendChild(tile);
    });
  } catch (err) {
    grid.innerText = 'Network error: ' + err.message;
  }
}

// If already logged in (token present) load users on page open
if (localStorage.getItem('adminToken')) loadUsers();

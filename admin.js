const $ = (id) => document.getElementById(id);
let token = localStorage.getItem('admin_token');
let pollTimer = null;

if (token) showDash();

$('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginErr').classList.add('hidden');
  try {
    const r = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('adminPw').value })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'login gagal');
    token = d.token;
    localStorage.setItem('admin_token', token);
    showDash();
  } catch (e) {
    $('loginErr').textContent = e.message;
    $('loginErr').classList.remove('hidden');
  }
});

$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  location.reload();
});

function showDash() {
  $('loginBox').classList.add('hidden');
  $('dashBox').classList.remove('hidden');
  loadOrders();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(loadOrders, 3000);
}

async function loadOrders() {
  try {
    const r = await fetch('/api/admin-orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (r.status === 401) {
      localStorage.removeItem('admin_token');
      location.reload();
      return;
    }
    const d = await r.json();
    renderOrders(d.orders || []);
  } catch (e) {
    console.error(e);
  }
}

function renderOrders(orders) {
  const list = $('orderList');
  let proses = 0, sukses = 0, batal = 0;
  orders.forEach(o => {
    if (o.status === 'proses') proses++;
    if (o.status === 'sukses') sukses++;
    if (o.status === 'batal') batal++;
  });
  $('cntProses').textContent = proses;
  $('cntSukses').textContent = sukses;
  $('cntBatal').textContent = batal;

  if (!orders.length) {
    list.innerHTML = '<div class="empty">Belum ada order masuk.</div>';
    return;
  }

  list.innerHTML = '';
  orders.forEach(o => {
    const el = document.createElement('div');
    el.className = `order-card ${o.status}`;
    const badgeClass = o.status;
    const badgeText = o.status.toUpperCase();
    const time = new Date(o.created_at).toLocaleString('id-ID');
    const amount = 'Rp' + Number(o.amount).toLocaleString('id-ID');

    let actions = '';
    if (o.status === 'proses') {
      actions = `
        <div class="action-row">
          <button class="btn-sukses" data-action="sukses" data-id="${o.id}">SUKSES</button>
          <button class="btn-tolak" data-action="tolak" data-id="${o.id}">TOLAK</button>
        </div>`;
    }

    el.innerHTML = `
      <div class="order-top">
        <h3>${escapeHtml(o.nama)}</h3>
        <span class="status-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="order-meta">
        <div>Order: <strong>${o.id}</strong></div>
        <div>Jumlah: <strong>${amount}</strong></div>
        <div>Ket: <strong>${escapeHtml(o.description)}</strong></div>
        <div>DANA Pengirim: <strong>${o.dana_number || '-'}</strong></div>
        <div>Waktu: <strong>${time}</strong></div>
      </div>
      ${actions}
    `;
    list.appendChild(el);
  });

  list.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => approve(btn.dataset.id, btn.dataset.action));
  });
}

async function approve(orderId, action) {
  const confirmMsg = action === 'sukses'
    ? 'Konfirmasi order ini sudah dibayar dan tandai SUKSES?'
    : 'Tolak order ini?';
  if (!confirm(confirmMsg)) return;
  try {
    const r = await fetch('/api/admin-approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ order_id: orderId, action })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'gagal update');
    loadOrders();
  } catch (e) {
    alert(e.message);
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const orderId = params.get('id');

let currentOrder = null;
let pollTimer = null;

const fmtRp = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

function showStep(id) {
  ['stepConfirm','stepTf','stepProses','stepSukses','stepBatal','stepError']
    .forEach(x => $(x).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

async function load() {
  if (!orderId) {
    $('errMsg').textContent = 'Order ID tidak ada di URL.';
    showStep('stepError');
    return;
  }
  try {
    const r = await fetch(`/api/order?id=${encodeURIComponent(orderId)}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'order tidak ditemukan');
    currentOrder = d.order;
    render();
  } catch (e) {
    $('errMsg').textContent = e.message;
    showStep('stepError');
  }
}

function render() {
  const o = currentOrder;
  if (!o) return;
  if (o.status === 'created') {
    $('orderIdText').textContent = o.id;
    $('sumNama').textContent = o.nama;
    $('sumAmount').textContent = fmtRp(o.amount);
    $('sumDesc').textContent = o.description;
    showStep('stepConfirm');
  } else if (o.status === 'proses') {
    $('pOrder').textContent = o.id;
    $('pNope').textContent = o.dana_number || '-';
    showStep('stepProses');
    startPolling();
  } else if (o.status === 'sukses') {
    $('sOrder').textContent = o.id;
    $('sAmount').textContent = fmtRp(o.amount);
    $('sNope').textContent = o.dana_number;
    $('sTime').textContent = new Date(o.sukses_at).toLocaleString('id-ID');
    $('proofLink').href = `/proof.html?id=${o.id}`;
    showStep('stepSukses');
    stopPolling();
  } else if (o.status === 'batal') {
    showStep('stepBatal');
    stopPolling();
  }
}

$('yesBtn').addEventListener('click', () => {
  $('danaNum').textContent = '085814327361';
  $('tfAmount').textContent = fmtRp(currentOrder.amount);
  showStep('stepTf');
});

$('noBtn').addEventListener('click', async () => {
  try {
    await fetch('/api/order-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId })
    });
  } catch {}
  location.href = '/';
});

$('copyDana').addEventListener('click', () => {
  navigator.clipboard.writeText('085814327361').then(() => {
    $('copyDana').textContent = 'Tersalin';
    setTimeout(() => $('copyDana').textContent = 'Copy', 1500);
  }).catch(() => {
    $('copyDana').textContent = 'Gagal';
    setTimeout(() => $('copyDana').textContent = 'Copy', 1500);
  });
});

$('submitNope').addEventListener('click', async () => {
  const nope = $('nope').value.trim();
  $('errTf').classList.add('hidden');
  if (!nope) {
    $('errTf').textContent = 'Nomor DANA wajib diisi.';
    $('errTf').classList.remove('hidden');
    return;
  }
  $('submitNope').disabled = true;
  $('submitNope').textContent = 'Memproses...';
  try {
    const r = await fetch('/api/order-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, dana_number: nope })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'gagal konfirmasi');
    currentOrder = d.order;
    render();
  } catch (e) {
    $('errTf').textContent = e.message;
    $('errTf').classList.remove('hidden');
    $('submitNope').disabled = false;
    $('submitNope').textContent = 'Saya Sudah Transfer';
  }
});

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    try {
      const r = await fetch(`/api/order?id=${encodeURIComponent(orderId)}`);
      const d = await r.json();
      if (r.ok && d.order && d.order.status !== currentOrder.status) {
        currentOrder = d.order;
        render();
      }
    } catch {}
  }, 3000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

load();
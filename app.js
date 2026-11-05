const form = document.getElementById('orderForm');
const btn = document.getElementById('orderBtn');
const errorBox = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  const payload = {
    nama: document.getElementById('nama').value.trim(),
    amount: Number(document.getElementById('amount').value),
    description: document.getElementById('description').value.trim()
  };

  try {
    const r = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'gagal buat order');
    location.href = `/pay.html?id=${d.order.id}`;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Lanjutkan';
  }
});
// ===== PAYMENT MODULE =====
let payMethod = 'CASH';
let currentTotal = 0;

/**
 * Buka modal pembayaran
 */
function openPayment() {
  if (!cart.length) return;
  
  const modal = document.getElementById('paymentModal');
  const payTotal = document.getElementById('payTotal');
  const payItemCount = document.getElementById('payItemCount');
  const payTime = document.getElementById('payTime');
  
  currentTotal = getTotal();
  
  if (modal) modal.classList.remove('hidden');
  if (payTotal) payTotal.textContent = 'Rp ' + currentTotal.toLocaleString('id-ID');
  
  // Update item count
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (payItemCount) payItemCount.textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
  
  // Update time
  if (payTime) {
    payTime.textContent = new Date().toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Generate quick amount buttons
  generateQuickAmounts();
  
  // Reset form
  const cashInput = document.getElementById('cashInput');
  if (cashInput) cashInput.value = '';
  
  setPayMethod('CASH');
  calcChange();
  
  // Re-init Lucide icons
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 50);
  }
  
  // Focus input setelah modal terbuka
  setTimeout(() => {
    if (cashInput) cashInput.focus();
  }, 300);
}

/**
 * Generate quick amount buttons berdasarkan total
 */
function generateQuickAmounts() {
  const grid = document.getElementById('quickAmountGrid');
  if (!grid) return;
  
  const total = currentTotal;
  
  // Hitung nominal yang masuk akal
  const suggestions = [];
  
  // Uang pas
  suggestions.push({ amount: total, label: 'Uang Pas', isExact: true });
  
  // Pembulatan ke atas
  const roundUps = [
    Math.ceil(total / 10000) * 10000,      // Kelipatan 10rb terdekat
    Math.ceil(total / 50000) * 50000,      // Kelipatan 50rb terdekat
    Math.ceil(total / 100000) * 100000,    // Kelipatan 100rb terdekat
  ].filter(v => v > total && !suggestions.some(s => s.amount === v));
  
  // Ambil 3 nominal terkecil yang berbeda
  const unique = [...new Set(roundUps)].slice(0, 3);
  unique.forEach(amount => {
    suggestions.push({ amount, label: formatShortAmount(amount), isExact: false });
  });
  
  // Render buttons
  grid.innerHTML = suggestions.map(s => `
    <button type="button" 
            onclick="setQuickAmount(${s.amount}, this)" 
            class="quick-amount-btn ${s.isExact ? 'exact' : ''}"
            title="Rp ${s.amount.toLocaleString('id-ID')}">
      ${s.label}
    </button>
  `).join('');
}

/**
 * Format nominal ke bentuk singkat (50rb, 100rb, dll)
 */
function formatShortAmount(amount) {
  if (amount >= 1000000) return (amount / 1000000) + 'jt';
  if (amount >= 1000) return (amount / 1000) + 'rb';
  return amount.toString();
}

/**
 * Set quick amount ke input
 */
function setQuickAmount(amount, btn) {
  const cashInput = document.getElementById('cashInput');
  if (!cashInput) return;
  
  cashInput.value = amount.toLocaleString('id-ID');
  
  // Update active state
  document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  calcChange();
}

/**
 * Handle input cash dengan format otomatis
 */
function handleCashInput(input) {
  // Hapus semua karakter non-digit
  let value = input.value.replace(/\D/g, '');
  
  // Format dengan separator ribuan
  if (value) {
    input.value = parseInt(value).toLocaleString('id-ID');
  }
  
  // Remove active state dari quick buttons
  document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));
  
  calcChange();
}

/**
 * Tutup modal pembayaran
 */
function closePayment() {
  const modal = document.getElementById('paymentModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Set metode pembayaran
 */
function setPayMethod(method) {
  payMethod = method;
  
  const btnCash = document.getElementById('btnCash');
  const btnQris = document.getElementById('btnQris');
  const cashSection = document.getElementById('cashSection');
  const qrisSection = document.getElementById('qrisSection');
  const confirmPayBtn = document.getElementById('confirmPayBtn');
  const confirmPayText = document.getElementById('confirmPayText');
  
  // Update button states
  if (btnCash) btnCash.classList.toggle('active', method === 'CASH');
  if (btnQris) btnQris.classList.toggle('active', method === 'QRIS');
  
  // Toggle sections dengan animasi
  if (cashSection) {
    cashSection.classList.toggle('hidden', method !== 'CASH');
  }
  if (qrisSection) {
    qrisSection.classList.toggle('hidden', method !== 'QRIS');
  }
  
  // Update button text
  if (confirmPayText) {
    confirmPayText.textContent = method === 'CASH' ? 'Complete Payment' : 'Confirm QRIS';
  }
  
  // Re-init icons
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

/**
 * Hitung kembalian
 */
function calcChange() {
  const cashInput = document.getElementById('cashInput');
  const changeDisplay = document.getElementById('changeDisplay');
  const changeBox = document.getElementById('changeBox');
  const warning = document.getElementById('insufficientWarning');
  
  if (!cashInput || !changeDisplay) return;
  
  const tendered = parseInt(cashInput.value.replace(/\D/g, '')) || 0;
  const change = tendered - currentTotal;
  const isInsufficient = tendered > 0 && change < 0;
  
  // Update change display
  if (change >= 0) {
    changeDisplay.textContent = 'Rp ' + change.toLocaleString('id-ID');
    changeDisplay.classList.remove('text-red-600');
    changeDisplay.classList.add('text-green-700');
    
    if (changeBox) {
      changeBox.classList.remove('from-red-50', 'to-red-50', 'border-red-200');
      changeBox.classList.add('from-green-50', 'to-emerald-50', 'border-green-200');
    }
  } else {
    changeDisplay.textContent = '- Rp ' + Math.abs(change).toLocaleString('id-ID');
    changeDisplay.classList.remove('text-green-700');
    changeDisplay.classList.add('text-red-600');
    
    if (changeBox) {
      changeBox.classList.remove('from-green-50', 'to-emerald-50', 'border-green-200');
      changeBox.classList.add('from-red-50', 'to-red-50', 'border-red-200');
    }
  }
  
  // Show/hide warning
  if (warning) {
    warning.classList.toggle('hidden', !isInsufficient);
  }
  
  // Pulse animation on change
  if (changeBox && tendered > 0) {
    changeBox.classList.remove('change-pulse');
    void changeBox.offsetWidth; // Trigger reflow
    changeBox.classList.add('change-pulse');
  }
  
  // Update confirm button state
  const confirmPayBtn = document.getElementById('confirmPayBtn');
  if (confirmPayBtn && payMethod === 'CASH') {
    confirmPayBtn.disabled = tendered < currentTotal;
  }
}

/**
 * Konfirmasi pembayaran
 */
/**
 * Konfirmasi pembayaran
 */
async function confirmPayment() {
  const total = getTotal();
  
  if (payMethod === 'CASH') {
    const cashInput = document.getElementById('cashInput');
    const tendered = parseInt(cashInput?.value.replace(/\D/g, '')) || 0;
    if (tendered < total) {
      if (cashInput) {
        cashInput.classList.add('error');
        cashInput.style.animation = 'shake 0.4s';
        setTimeout(() => {
          cashInput.classList.remove('error');
          cashInput.style.animation = '';
        }, 400);
      }
      return;
    }
  }
  
  const btn = document.getElementById('confirmPayBtn');
  const btnText = document.getElementById('confirmPayText');
  
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Processing...';
  
  // Deduct stock
  cart.forEach(c => {
    const m = typeof getMenuItemById === 'function' ? getMenuItemById(c.id) : null;
    if (m) m.stock -= c.qty;
  });
  
  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
  const tendered = payMethod === 'CASH' 
    ? (parseInt(document.getElementById('cashInput')?.value.replace(/\D/g, '')) || total) 
    : total;
  const change = payMethod === 'CASH' ? Math.max(0, tendered - total) : 0;
  
  // ✅ SIMPAN TRANSAKSI ke global array + localStorage
  addTransaction({
    order_id: orderId,
    date: new Date().toISOString(),
    items: [...cart], // Copy array agar tidak berubah
    total: total,
    payment_method: payMethod,
    amount_tendered: tendered,
    change_due: change
  });
  
  // Simulasi delay processing
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (btn) btn.disabled = false;
  if (btnText) btnText.textContent = 'Complete Payment';
  
  closePayment();
  
  // Tampilkan receipt
  showReceipt(orderId, cart, total, payMethod, tendered, change);
  
  // Reset cart
  cart = [];
  renderCart();
  if (typeof renderMenu === 'function') renderMenu();
}

// Keyboard shortcut: Enter untuk confirm
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('paymentModal');
  if (!modal || modal.classList.contains('hidden')) return;
  
  if (e.key === 'Enter' && payMethod === 'QRIS') {
    confirmPayment();
  }
  if (e.key === 'Escape') {
    closePayment();
  }
});
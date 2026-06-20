// ===== PAYMENT PAGE =====

let paymentMethod = "QRIS";

function renderPaymentPage(container) {
  const reservationData = JSON.parse(
    sessionStorage.getItem("pendingReservation") || "null",
  );
  const menuCart = JSON.parse(sessionStorage.getItem("menuCart") || "[]");

  if (!reservationData) {
    Modal.error({
      title: "Data Tidak Ditemukan",
      message: "Data reservasi tidak ditemukan. Silakan mulai dari awal.",
      icon: "alert-circle",
      confirmText: "Kembali ke Beranda",
      onConfirm: () => {
        Router.navigate("/home");
      },
    });
    return;
  }

  container.innerHTML = `
    <main class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="font-display text-3xl text-forest mb-2">Pembayaran</h1>
      <p class="text-gray-600 mb-8">Selesaikan pembayaran untuk konfirmasi reservasi</p>

      <!-- Order Summary -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4">Ringkasan Pesanan</h2>
        <div id="orderSummary" class="space-y-3 mb-4"></div>
        <div class="border-t pt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal</span>
            <span id="subtotal">Rp 0</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Tax (10%)</span>
            <span id="tax">Rp 0</span>
          </div>
          <div class="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span id="total" class="text-forest">Rp 0</span>
          </div>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4">Metode Pembayaran</h2>
        <div class="space-y-3">
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="QRIS" checked>
            <div class="payment-icon">
              <i data-lucide="qr-code" class="w-6 h-6"></i>
            </div>
            <div class="flex-1">
              <p class="font-semibold">QRIS</p>
              <p class="text-sm text-gray-600">Scan QR code untuk bayar</p>
            </div>
          </label>
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="TRANSFER">
            <div class="payment-icon">
              <i data-lucide="building-2" class="w-6 h-6"></i>
            </div>
            <div class="flex-1">
              <p class="font-semibold">Transfer Bank</p>
              <p class="text-sm text-gray-600">Transfer ke rekening kami</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Payment Details -->
      <div id="paymentDetails" class="card mb-6"></div>

      <!-- Confirm Button -->
      <button onclick="confirmPayment()" class="btn btn-terra btn-full">
        Konfirmasi Pembayaran ✓
      </button>
    </main>
  `;

  renderOrderSummary(reservationData, menuCart);
  renderPaymentDetails(menuCart);

  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      paymentMethod = e.target.value;
      renderPaymentDetails(menuCart);
    });
  });
}

function renderOrderSummary(reservationData, menuCart) {
  const summaryEl = document.getElementById("orderSummary");

  let html = `
    <div class="pb-3 border-b">
      <p class="text-sm text-gray-600">Reservasi</p>
      <p class="font-semibold">Meja ${reservationData.tableNumber} • ${reservationData.guestCount} orang</p>
      <p class="text-sm text-gray-600">
        ${formatDate(reservationData.date)} • ${reservationData.time} - ${reservationData.endTime}
      </p>
    </div>
  `;

  if (menuCart.length > 0) {
    html += '<div class="pt-3">';
    html += '<p class="text-sm text-gray-600 mb-2">Pre-order Menu</p>';
    menuCart.forEach((item) => {
      html += `
        <div class="flex justify-between text-sm py-1">
          <span>${item.name} x${item.qty}</span>
          <span>${formatCurrency(item.price * item.qty)}</span>
        </div>
      `;
    });
    html += "</div>";
  } else {
    html +=
      '<p class="text-sm text-gray-500 italic pt-3">Tidak ada pre-order menu</p>';
  }

  summaryEl.innerHTML = html;

  const subtotal = menuCart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("tax").textContent = formatCurrency(tax);
  document.getElementById("total").textContent = formatCurrency(total);
}

function renderPaymentDetails(menuCart) {
  const detailsEl = document.getElementById("paymentDetails");
  const subtotal = menuCart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  if (paymentMethod === "QRIS") {
    detailsEl.innerHTML = `
      <h2 class="font-semibold text-lg mb-4">Scan QR Code</h2>
      <div class="text-center">
        <div class="barcode-container inline-block mb-4">
          <div id="qrcode" class="w-64 h-64 flex items-center justify-center">
            <i data-lucide="qr-code" class="w-48 h-48 text-forest"></i>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-2">Scan dengan aplikasi e-wallet atau mobile banking</p>
        <p class="text-xs text-gray-500">
          Total: <span class="font-bold text-forest">${formatCurrency(total)}</span>
        </p>
      </div>
    `;
  } else {
    detailsEl.innerHTML = `
      <h2 class="font-semibold text-lg mb-4">Transfer Bank</h2>
      <div class="space-y-3">
        <div class="bg-cream rounded-xl p-4">
          <p class="text-sm text-gray-600 mb-1">Bank BCA</p>
          <p class="font-mono font-bold text-lg">1234567890</p>
          <p class="text-sm text-gray-600 mt-1">a.n. Sban's Corner</p>
        </div>
        <div class="bg-cream rounded-xl p-4">
          <p class="text-sm text-gray-600 mb-1">Jumlah Transfer</p>
          <p class="font-bold text-2xl text-forest">${formatCurrency(total)}</p>
        </div>
        <p class="text-xs text-gray-500">Setelah transfer, klik tombol konfirmasi di bawah</p>
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function confirmPayment() {
  const reservationData = JSON.parse(sessionStorage.getItem('pendingReservation') || 'null');
  const menuCart = JSON.parse(sessionStorage.getItem('menuCart') || '[]');
  
  if (!reservationData) {
    Modal.error({
      title: 'Error',
      message: 'Data reservasi tidak ditemukan',
      icon: 'x-circle'
    });
    return;
  }
  
  const subtotal = menuCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  
  // ✅ KONFIRMASI PEMBAYARAN
  Modal.confirm({
    title: 'Konfirmasi Pembayaran',
    message: 'Anda akan melakukan pembayaran untuk reservasi ini.',
    html: `
      <div class="space-y-3">
        <div class="bg-cream rounded-lg p-4">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Subtotal:</span>
            <span class="font-semibold">Rp ${subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Tax (10%):</span>
            <span class="font-semibold">Rp ${tax.toLocaleString('id-ID')}</span>
          </div>
          <div class="border-t border-gray-200 pt-2 flex justify-between">
            <span class="font-bold text-forest">Total:</span>
            <span class="font-bold text-terra text-lg">Rp ${total.toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <i data-lucide="${paymentMethod === 'QRIS' ? 'qr-code' : 'building-2'}" class="w-5 h-5 text-blue-600"></i>
          <div>
            <p class="font-semibold text-blue-900 text-sm">Metode: ${paymentMethod}</p>
            <p class="text-xs text-blue-700">
              ${paymentMethod === 'QRIS' ? 'Scan QR code setelah konfirmasi' : 'Transfer ke rekening BCA'}
            </p>
          </div>
        </div>
        
        <p class="text-xs text-gray-500 text-center">
          ⚠️ Pembayaran tidak dapat dibatalkan setelah dikonfirmasi
        </p>
      </div>
    `,
    confirmText: 'Bayar Sekarang',
    cancelText: 'Periksa Lagi',
    size: 'md',
    onConfirm: () => {
      processPayment(reservationData, menuCart, subtotal, tax, total);
    }
  });
}

function processPayment(reservationData, menuCart, subtotal, tax, total) {
  const reservationId = generateId('RES');
  
  const reservation = {
    id: reservationId,
    date: reservationData.date,
    time: reservationData.time,
    endTime: reservationData.endTime,
    tableNumber: reservationData.tableNumber,
    tableName: reservationData.tableName,
    tableCategory: reservationData.tableCategory,
    guestCount: reservationData.guestCount,
    customerName: reservationData.customerName,
    customerPhone: reservationData.customerPhone,
    menuOrders: menuCart,
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentMethod: paymentMethod,
    paymentStatus: 'paid',
    status: 'confirmed',
    statusHistory: [{
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      note: 'Reservasi dibuat dan pembayaran dikonfirmasi'
    }],
    createdAt: new Date().toISOString(),
    source: 'customer-app'
  };
  
  StorageBridge.saveReservation(reservation);
  sessionStorage.setItem('confirmedReservation', JSON.stringify(reservation));
  sessionStorage.removeItem('pendingReservation');
  sessionStorage.removeItem('menuCart');
  
  Router.navigate('/confirmation');
}
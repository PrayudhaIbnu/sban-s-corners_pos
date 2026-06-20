// ===== CONFIRMATION PAGE WITH BARCODE =====

function renderConfirmationPage(container) {
  const reservation = JSON.parse(sessionStorage.getItem('confirmedReservation') || 'null');
  
  if (!reservation) {
    showToast('Data reservasi tidak ditemukan', 'error');
    Router.navigate('/home');
    return;
  }
  
  container.innerHTML = `
    <!-- Success Header -->
    <div class="confirmation-header">
      <div class="max-w-2xl mx-auto relative z-10">
        <div class="confirmation-icon">
          <i data-lucide="check" class="w-12 h-12 text-white"></i>
        </div>
        <h1 class="font-display text-3xl md:text-4xl mb-2">Reservasi Berhasil!</h1>
        <p class="text-white/80">Silakan tunjukkan barcode ini saat datang</p>
      </div>
    </div>

    <main class="max-w-2xl mx-auto px-4 py-8">
      
      <!-- Barcode Card -->
      <div class="card mb-6 text-center">
        <p class="text-sm text-gray-600 mb-2">Barcode Reservasi</p>
        <div class="barcode-container inline-block mb-4">
          <canvas id="barcodeCanvas"></canvas>
        </div>
        <p class="font-mono text-sm text-gray-600">${reservation.id}</p>
      </div>

      <!-- Details -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4">Detail Reservasi</h2>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Nama</span>
            <span class="font-semibold">${reservation.customerName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Meja</span>
            <span class="font-semibold">Meja ${reservation.tableNumber}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Tanggal</span>
            <span class="font-semibold">${formatDate(reservation.date)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Waktu</span>
            <span class="font-semibold">${reservation.time} - ${reservation.endTime}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Jumlah Tamu</span>
            <span class="font-semibold">${reservation.guestCount} orang</span>
          </div>
          ${reservation.menuOrders && reservation.menuOrders.length > 0 ? `
            <div class="border-t pt-3 mt-3">
              <p class="text-gray-600 mb-2">Pre-order Menu:</p>
              <div class="space-y-1">
                ${reservation.menuOrders.map(item => `
                  <div class="flex justify-between text-sm">
                    <span>${item.name} x${item.qty}</span>
                    <span>${formatCurrency(item.price * item.qty)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <button onclick="downloadBarcode()" class="btn btn-primary btn-full">
          <i data-lucide="download" class="w-5 h-5"></i>
          Download Barcode
        </button>
        <button onclick="shareWhatsApp()" class="btn btn-secondary btn-full">
          <i data-lucide="message-circle" class="w-5 h-5"></i>
          Share via WhatsApp
        </button>
        <a href="#/home" class="btn btn-secondary btn-full block text-center">
          Kembali ke Beranda
        </a>
      </div>

    </main>
  `;
  
  // Generate QR code
  setTimeout(() => {
    const canvas = document.getElementById('barcodeCanvas');
    if (canvas && window.QRCode) {
      QRCode.toCanvas(canvas, reservation.id, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0F4D21',
          light: '#FFFFFF'
        }
      });
    }
  }, 100);
  
  // Store reservation for download/share
  window.currentReservation = reservation;
}

function downloadBarcode() {
  const canvas = document.getElementById('barcodeCanvas');
  if (!canvas) return;
  
  const reservation = window.currentReservation;
  const link = document.createElement('a');
  link.download = `barcode-${reservation.id}.png`;
  link.href = canvas.toDataURL();
  link.click();
  
  showToast('Barcode berhasil didownload', 'success');
}

function shareWhatsApp() {
  const reservation = window.currentReservation;
  if (!reservation) return;
  
  const message = `
*Reservasi Sban's Corner* 🍽️

📋 ID: ${reservation.id}
👤 Nama: ${reservation.customerName}
🪑 Meja: ${reservation.tableNumber}
📅 Tanggal: ${formatDate(reservation.date)}
🕐 Waktu: ${reservation.time} - ${reservation.endTime}
👥 Tamu: ${reservation.guestCount} orang

Silakan tunjukkan pesan ini atau barcode saat datang.

Terima kasih! 🙏
  `.trim();
  
  const url = `https://wa.me/${reservation.customerPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
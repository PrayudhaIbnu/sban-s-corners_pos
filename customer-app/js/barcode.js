// ===== CONFIRMATION PAGE WITH BARCODE =====

function renderConfirmationPage(container) {
  const reservation = JSON.parse(sessionStorage.getItem('confirmedReservation') || 'null');
  
  if (!reservation) {
    Modal.error({
      title: 'Data Tidak Ditemukan',
      message: 'Data reservasi tidak ditemukan. Silakan buat reservasi baru.',
      icon: 'alert-circle',
      confirmText: 'Kembali ke Beranda',
      onConfirm: () => {
        Router.navigate('/home');
      }
    });
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
        <p class="text-sm text-gray-600 mb-4">Barcode Reservasi</p>
        
        <!-- QR Code Container -->
        <div class="barcode-container inline-block mb-4 p-6 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <div id="qrcode-container" class="flex items-center justify-center min-h-[200px]">
            <!-- Loading state -->
            <div id="qrcode-loading" class="flex flex-col items-center gap-2">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
              <p class="text-sm text-gray-500">Generating QR Code...</p>
            </div>
            <!-- QR Code akan di-generate di sini oleh qrcodejs -->
            <div id="qrcode" class="hidden"></div>
          </div>
        </div>
        
        <p class="font-mono text-sm text-gray-600 font-semibold">${reservation.id}</p>
        <p class="text-xs text-gray-400 mt-1">Simpan atau screenshot barcode ini</p>
      </div>

      <!-- Details -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4">Detail Reservasi</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Nama</span>
            <span class="font-semibold">${reservation.customerName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Meja</span>
            <span class="font-semibold">Meja ${reservation.tableNumber} ${reservation.tableName ? `(${reservation.tableName})` : ''}</span>
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
              <p class="font-semibold text-gray-700 mb-2">Pre-order Menu:</p>
              <div class="space-y-1.5">
                ${reservation.menuOrders.map(item => `
                  <div class="flex justify-between text-sm">
                    <span>${item.name} ×${item.qty}</span>
                    <span class="font-semibold">${formatCurrency(item.price * item.qty)}</span>
                  </div>
                `).join('')}
              </div>
              <div class="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span class="text-forest">${formatCurrency(reservation.total)}</span>
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
  
  // Store reservation for download/share
  window.currentReservation = reservation;
  
  // Generate QR code setelah DOM ready
  setTimeout(() => {
    generateQRCode(reservation.id);
  }, 100);
}

/**
 * Generate QR Code menggunakan qrcodejs library
 */
function generateQRCode(text) {
  const loadingEl = document.getElementById('qrcode-loading');
  const qrcodeEl = document.getElementById('qrcode');
  
  if (!loadingEl || !qrcodeEl) {
    console.error('QR code elements not found');
    showError('Gagal membuat QR code');
    return;
  }
  
  // Cek apakah QRCode library sudah di-load
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded');
    showError('Library QR code tidak ter-load. Silakan refresh halaman.');
    return;
  }
  
  try {
    // Clear container dulu
    qrcodeEl.innerHTML = '';
    qrcodeEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
    
    // Generate QR code menggunakan qrcodejs API
    new QRCode(qrcodeEl, {
      text: text,
      width: 200,
      height: 200,
      colorDark: '#0F4D21',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
    
    // Tambahkan animasi
    qrcodeEl.classList.add('animate-scale-in');
    
  } catch (err) {
    console.error('QR Code generation error:', err);
    showError('Terjadi kesalahan: ' + err.message);
  }
}

/**
 * Show error message
 */
function showError(message) {
  const loadingEl = document.getElementById('qrcode-loading');
  if (loadingEl) {
    loadingEl.innerHTML = `
      <div class="flex flex-col items-center gap-2 text-red-600">
        <i data-lucide="x-circle" class="w-12 h-12"></i>
        <p class="text-sm font-medium">${message}</p>
        <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-forest text-white rounded-lg text-sm">
          Refresh Halaman
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

/**
 * Download barcode sebagai PNG
 */
function downloadBarcode() {
  const qrcodeEl = document.getElementById('qrcode');
  const reservation = window.currentReservation;
  
  if (!qrcodeEl || qrcodeEl.classList.contains('hidden')) {
    Modal.error({
      title: 'Barcode Belum Siap',
      message: 'QR code belum berhasil di-generate. Silakan tunggu beberapa saat atau refresh halaman.',
      icon: 'alert-circle'
    });
    return;
  }
  
  if (!reservation) {
    Modal.error({
      title: 'Data Tidak Ditemukan',
      message: 'Data reservasi tidak ditemukan',
      icon: 'alert-circle'
    });
    return;
  }
  
  try {
    // Cari canvas atau img yang di-generate oleh qrcodejs
    const canvas = qrcodeEl.querySelector('canvas');
    const img = qrcodeEl.querySelector('img');
    
    if (canvas) {
      // Convert canvas ke blob
      canvas.toBlob(function(blob) {
        if (!blob) {
          Modal.error({
            title: 'Download Gagal',
            message: 'Gagal membuat file gambar',
            icon: 'x-circle'
          });
          return;
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `barcode-${reservation.id}.png`;
        link.href = url;
        link.click();
        
        // Cleanup
        URL.revokeObjectURL(url);
        
        // Show success
        Modal.success({
          title: 'Download Berhasil',
          message: `Barcode ${reservation.id} berhasil di-download`,
          icon: 'check-circle'
        });
        
      }, 'image/png');
      
    } else if (img) {
      // Jika qrcodejs generate img (bukan canvas)
      const link = document.createElement('a');
      link.download = `barcode-${reservation.id}.png`;
      link.href = img.src;
      link.click();
      
      Modal.success({
        title: 'Download Berhasil',
        message: `Barcode ${reservation.id} berhasil di-download`,
        icon: 'check-circle'
      });
      
    } else {
      Modal.error({
        title: 'Download Gagal',
        message: 'Tidak ada gambar QR code yang ditemukan',
        icon: 'x-circle'
      });
    }
    
  } catch (err) {
    console.error('Download error:', err);
    Modal.error({
      title: 'Download Gagal',
      message: err.message,
      icon: 'x-circle'
    });
  }
}

/**
 * Share via WhatsApp
 */
function shareWhatsApp() {
  const reservation = window.currentReservation;
  if (!reservation) {
    Modal.error({
      title: 'Data Tidak Ditemukan',
      message: 'Data reservasi tidak ditemukan',
      icon: 'alert-circle'
    });
    return;
  }
  
  const menuText = reservation.menuOrders && reservation.menuOrders.length > 0
    ? `\n\nPre-order Menu:\n${reservation.menuOrders.map(item => `• ${item.name} ×${item.qty}`).join('\n')}\nTotal: ${formatCurrency(reservation.total)}`
    : '';
  
  const message = `
*RESERVASI SBAN'S CORNER* ️

ID: ${reservation.id}
Nama: ${reservation.customerName}
Meja: ${reservation.tableName || 'Meja ' + reservation.tableNumber}
Tanggal: ${formatDate(reservation.date)}
Waktu: ${reservation.time} - ${reservation.endTime}
Tamu: ${reservation.guestCount} orang
${menuText}

Silakan tunjukkan barcode ini saat datang.

Terima kasih! 🙏
  `.trim();
  
  const phone = reservation.customerPhone.replace(/^0/, '62');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  
  window.open(url, '_blank');
}

/**
 * Format date untuk display
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return 'Rp ' + amount.toLocaleString('id-ID');
}
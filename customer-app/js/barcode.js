// ===== CONFIRMATION PAGE WITH BARCODE =====

function renderConfirmationPage(container) {
  console.log('🎯 Rendering confirmation page...');
  
  // ✅ CARA 1: Ambil dari sessionStorage
  let order = JSON.parse(sessionStorage.getItem('confirmedOrder') || 'null');
  
  // ✅ CARA 2: Jika tidak ada, cari di StorageBridge
  if (!order) {
    console.log('⚠️ Order not in sessionStorage, checking StorageBridge...');
    const allOrders = StorageBridge.getOrders();
    if (allOrders.length > 0) {
      order = allOrders[allOrders.length - 1]; // Ambil order terakhir
    }
  }
  
  console.log('📦 Order data:', order);
  
  if (!order) {
    console.error('❌ No order found');
    container.innerHTML = `
      <main class="max-w-2xl mx-auto px-4 py-8">
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <i data-lucide="alert-circle" class="w-8 h-8 text-red-600"></i>
          </div>
          <h2 class="font-display text-2xl text-forest mb-2">Data Tidak Ditemukan</h2>
          <p class="text-gray-600 mb-6">Tidak ada data reservasi yang ditemukan</p>
          <a href="#/home" class="btn btn-primary inline-block">Kembali ke Beranda</a>
        </div>
      </main>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  // ✅ Normalize order data
  const normalizedOrder = {
    order_id: order.order_id || order.id,
    id: order.id || order.order_id,
    date: order.date || order.createdAt,
    items: order.items || order.menuOrders || [],
    payment_method: order.payment_method || order.paymentMethod || 'CASH',
    status: order.status || 'pending',
    status_history: order.status_history || order.statusHistory || [],
    total: order.total || 0,
    orderType: order.orderType || 'reservation',
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    tableNumber: order.tableNumber || null,
    tableName: order.tableName || '',
    guestCount: order.guestCount || 0
  };
  
  console.log('✅ Normalized order:', normalizedOrder);
  
  container.innerHTML = `
    <!-- Header -->
    <div class="bg-forest text-white py-8 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="check-circle" class="w-10 h-10"></i>
        </div>
        <h1 class="font-display text-3xl mb-2">Reservasi Berhasil!</h1>
        <p class="text-white/80">ID Reservasi: ${normalizedOrder.order_id}</p>
      </div>
    </div>

    <main class="max-w-2xl mx-auto px-4 py-8">
      <!-- Reservation Details -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
          <i data-lucide="calendar-check" class="w-5 h-5 text-forest"></i>
          Detail Reservasi
        </h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Nama</span>
            <span class="font-semibold">${normalizedOrder.customerName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">WhatsApp</span>
            <span class="font-semibold">${normalizedOrder.customerPhone}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Meja</span>
            <span class="font-semibold">${normalizedOrder.tableName || 'Meja ' + normalizedOrder.tableNumber}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Tanggal</span>
            <span class="font-semibold">${formatDate(normalizedOrder.date)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Waktu</span>
            <span class="font-semibold">${new Date(normalizedOrder.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Jumlah Tamu</span>
            <span class="font-semibold">${normalizedOrder.guestCount} orang</span>
          </div>
        </div>
      </div>

      <!-- Menu Items -->
      ${normalizedOrder.items.length > 0 ? `
        <div class="card mb-6">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="shopping-bag" class="w-5 h-5 text-forest"></i>
            Pre-order Menu
          </h2>
          <div class="space-y-2">
            ${normalizedOrder.items.map(item => {
              const variantText = formatVariants(item.variants);
              return `
                <div class="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                  <div class="flex-1">
                    <p class="font-medium text-sm">${item.name} ×${item.qty}</p>
                    ${variantText ? `<p class="text-xs text-forest mt-0.5">${variantText}</p>` : ''}
                    <p class="text-xs text-gray-500">Rp ${item.price.toLocaleString('id-ID')} × ${item.qty}</p>
                  </div>
                  <span class="font-semibold text-sm">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span class="text-forest">Rp ${normalizedOrder.total.toLocaleString('id-ID')}</span>
          </div>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="space-y-3">
        <a href="#/tracking?id=${normalizedOrder.order_id}" class="btn btn-primary btn-full block text-center">
          <i data-lucide="search" class="w-5 h-5 mr-2"></i>
          Lacak Status Reservasi
        </a>
        <button onclick="contactRestaurant('${normalizedOrder.order_id}')" class="btn btn-secondary btn-full">
          <i data-lucide="message-circle" class="w-5 h-5 mr-2"></i>
          Hubungi Restoran
        </button>
        <a href="#/home" class="btn btn-secondary btn-full block text-center">
          Kembali ke Beranda
        </a>
      </div>

    </main>
  `;
  
  if (window.lucide) lucide.createIcons();
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

function contactRestaurant(orderId) {
  const message = `
Halo Sban's Corner,

Saya ingin menanyakan tentang reservasi saya:

ID Reservasi: ${orderId}

Terima kasih!
  `.trim();
  
  const restaurantPhone = '6281313549719';
  const url = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
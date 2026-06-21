// ===== PAYMENT VERIFICATION MODULE =====

let paymentVerificationFilter = {
  search: '',
  status: 'all',
  type: 'all'
};

/**
 * Initialize payment verification page
 */
function initPaymentVerification() {
  renderPaymentVerification();
}

/**
 * Render payment verification page
 */
function renderPaymentVerification() {
  console.log('📋 Rendering payment verification...');
  
  updatePaymentStats();
  renderPaymentVerificationList();
  
  if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
}

/**
 * Update statistics
 */
function updatePaymentStats() {
  const orders = StorageBridge.getOrders();
  const today = new Date().toDateString();
  
  const pendingCount = orders.filter(o => o.paymentStatus === 'pending_verification').length;
  
  const todayOrders = orders.filter(o => {
    const createdAt = new Date(o.createdAt || o.date).toDateString();
    return createdAt === today;
  });
  
  const verifiedToday = todayOrders.filter(o => o.paymentStatus === 'verified').length;
  const rejectedToday = todayOrders.filter(o => o.paymentStatus === 'rejected').length;
  
  const totalVerifiedAmount = todayOrders
    .filter(o => o.paymentStatus === 'verified')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  
  const elPending = document.getElementById('pendingCount');
  const elVerifiedToday = document.getElementById('verifiedTodayCount');
  const elRejectedToday = document.getElementById('rejectedTodayCount');
  const elTotalAmount = document.getElementById('totalVerifiedAmount');
  
  if (elPending) elPending.textContent = pendingCount;
  if (elVerifiedToday) elVerifiedToday.textContent = verifiedToday;
  if (elRejectedToday) elRejectedToday.textContent = rejectedToday;
  if (elTotalAmount) elTotalAmount.textContent = 'Rp ' + totalVerifiedAmount.toLocaleString('id-ID');
}

/**
 * Filter payment verification list
 */
function filterPaymentVerification() {
  paymentVerificationFilter = {
    search: (document.getElementById('paymentSearch')?.value || '').toLowerCase(),
    status: document.getElementById('paymentStatusFilter')?.value || 'all',
    type: document.getElementById('paymentTypeFilter')?.value || 'all'
  };
  renderPaymentVerificationList();
}

/**
 * Render payment verification list
 */
function renderPaymentVerificationList() {
  const container = document.getElementById('paymentVerificationList');
  if (!container) return;
  
  let orders = StorageBridge.getOrders();
  
  // Filter by search
  if (paymentVerificationFilter.search) {
    orders = orders.filter(o => 
      (o.order_id || o.id).toLowerCase().includes(paymentVerificationFilter.search) ||
      (o.customerName || '').toLowerCase().includes(paymentVerificationFilter.search)
    );
  }
  
  // Filter by payment status
  if (paymentVerificationFilter.status !== 'all') {
    orders = orders.filter(o => o.paymentStatus === paymentVerificationFilter.status);
  }
  
  // Filter by order type
  if (paymentVerificationFilter.type !== 'all') {
    orders = orders.filter(o => o.orderType === paymentVerificationFilter.type);
  }
  
  // Sort: pending first, then by date
  orders.sort((a, b) => {
    if (a.paymentStatus === 'pending_verification' && b.paymentStatus !== 'pending_verification') return -1;
    if (a.paymentStatus !== 'pending_verification' && b.paymentStatus === 'pending_verification') return 1;
    return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
  });
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cream to-[#F9F6F2] flex items-center justify-center mb-4 border border-[#EFE7DE]">
          <i data-lucide="receipt" class="w-9 h-9 text-forest/40"></i>
        </div>
        <h3 class="font-brand text-lg font-bold text-forest mb-1">Tidak ada pembayaran</h3>
        <p class="text-sm text-gray-500">
          ${paymentVerificationFilter.search || paymentVerificationFilter.status !== 'all'
            ? 'Coba ubah filter untuk melihat pembayaran lain' 
            : 'Belum ada pembayaran yang perlu diverifikasi'}
        </p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = orders.map(order => renderPaymentVerificationCard(order)).join('');
  if (window.lucide) lucide.createIcons();
}

/**
 * Render single payment verification card
 */
function renderPaymentVerificationCard(order) {
  const statusConfig = {
    pending_verification: { label: 'Menunggu Verifikasi', color: 'amber', icon: 'clock' },
    verified: { label: 'Terverifikasi', color: 'green', icon: 'check-circle' },
    rejected: { label: 'Ditolak', color: 'red', icon: 'x-circle' }
  };
  
  const status = statusConfig[order.paymentStatus] || statusConfig.pending_verification;
  const date = new Date(order.createdAt || order.date).toLocaleString('id-ID');
  
  const itemCount = Array.isArray(order.items || order.menuOrders)
    ? (order.items || order.menuOrders).reduce((sum, i) => sum + i.qty, 0)
    : 0;
  
  const typeBadge = order.orderType === 'delivery'
    ? `<span class="bg-terra/10 text-terra text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
         <i data-lucide="truck" class="w-3 h-3"></i>
         DELIVERY
       </span>`
    : `<span class="bg-forest/10 text-forest text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
         <i data-lucide="calendar" class="w-3 h-3"></i>
         RESERVASI
       </span>`;
  
  const proofPreview = order.paymentProof
    ? `<img src="${order.paymentProof.data}" class="w-20 h-20 object-cover rounded-lg border border-gray-200" alt="Bukti" onclick="viewPaymentProof('${order.order_id || order.id}')">`
    : `<div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
         <i data-lucide="image-off" class="w-6 h-6 text-gray-400"></i>
       </div>`;
  
  return `
    <div class="bg-white rounded-xl border ${order.paymentStatus === 'pending_verification' ? 'border-amber-200 shadow-md' : 'border-gray-100'} overflow-hidden">
      <div class="p-4">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="font-mono font-bold text-forest text-sm">${order.order_id || order.id}</span>
              <span class="status-badge status-${status.color} px-2 py-0.5 text-[11px] inline-flex items-center gap-1">
                <i data-lucide="${status.icon}" class="w-3 h-3"></i>
                ${status.label}
              </span>
              ${typeBadge}
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span class="flex items-center gap-1">
                <i data-lucide="user" class="w-3 h-3"></i>
                ${order.customerName || '-'}
              </span>
              <span class="flex items-center gap-1">
                <i data-lucide="phone" class="w-3 h-3"></i>
                ${order.customerPhone || '-'}
              </span>
              <span class="flex items-center gap-1">
                <i data-lucide="calendar" class="w-3 h-3"></i>
                ${date}
              </span>
            </div>
          </div>
          
          <div class="text-right">
            <p class="font-brand text-lg font-bold text-forest">Rp ${(order.total || 0).toLocaleString('id-ID')}</p>
            <p class="text-[10px] text-gray-400">${itemCount} items</p>
          </div>
        </div>
        
        <!-- Payment Proof Preview -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
          <div class="flex-shrink-0">
            ${proofPreview}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-gray-700 mb-1">Bukti Pembayaran</p>
            ${order.paymentProof ? `
              <p class="text-xs text-gray-500 truncate">${order.paymentProof.name}</p>
              <p class="text-[10px] text-gray-400">Diupload: ${new Date(order.paymentProof.uploadedAt).toLocaleString('id-ID')}</p>
            ` : `
              <p class="text-xs text-gray-400">Tidak ada bukti</p>
            `}
          </div>
        </div>
        
        <!-- Action Buttons -->
        ${order.paymentStatus === 'pending_verification' ? `
          <div class="flex gap-2">
            <button onclick="viewPaymentDetail('${order.order_id || order.id}')" class="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              <i data-lucide="eye" class="w-4 h-4 inline mr-1"></i>
              Lihat Detail
            </button>
            <button onclick="verifyPaymentAction('${order.order_id || order.id}', true)" class="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
              <i data-lucide="check-circle" class="w-4 h-4 inline mr-1"></i>
              Terima
            </button>
            <button onclick="verifyPaymentAction('${order.order_id || order.id}', false)" class="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
              <i data-lucide="x-circle" class="w-4 h-4 inline mr-1"></i>
              Tolak
            </button>
          </div>
        ` : `
          <div class="flex gap-2">
            <button onclick="viewPaymentDetail('${order.order_id || order.id}')" class="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              <i data-lucide="eye" class="w-4 h-4 inline mr-1"></i>
              Lihat Detail
            </button>
            ${order.paymentStatus === 'verified' ? `
              <button onclick="sendWhatsAppConfirmation('${order.order_id || order.id}', true)" class="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                <i data-lucide="message-circle" class="w-4 h-4 inline mr-1"></i>
                Kirim Konfirmasi WA
              </button>
            ` : `
              <button onclick="sendWhatsAppConfirmation('${order.order_id || order.id}', false)" class="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
                <i data-lucide="message-circle" class="w-4 h-4 inline mr-1"></i>
                Kirim Info Penolakan
              </button>
            `}
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * View payment proof in modal
 */
function viewPaymentProof(orderId) {
  const order = StorageBridge.getOrderById(orderId);
  if (!order || !order.paymentProof) {
    Modal.error({
      title: 'Bukti Tidak Ditemukan',
      message: 'Pesanan ini tidak memiliki bukti pembayaran',
      icon: 'image-off'
    });
    return;
  }
  
  Modal.show({
    title: 'Bukti Pembayaran',
    message: `${order.order_id || order.id} - ${order.customerName}`,
    html: `
      <div class="text-center">
        <img src="${order.paymentProof.data}" alt="Bukti Pembayaran" class="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg">
        <div class="mt-4 text-left bg-gray-50 rounded-lg p-3 text-sm">
          <p class="mb-1"><strong>File:</strong> ${order.paymentProof.name}</p>
          <p class="mb-1"><strong>Ukuran:</strong> ${(order.paymentProof.size / 1024).toFixed(1)} KB</p>
          <p class="mb-1"><strong>Upload:</strong> ${new Date(order.paymentProof.uploadedAt).toLocaleString('id-ID')}</p>
          <p><strong>Metode:</strong> ${order.payment_method || order.paymentMethod}</p>
          <p><strong>Total:</strong> Rp ${(order.total || 0).toLocaleString('id-ID')}</p>
        </div>
      </div>
    `,
    size: 'lg',
    confirmText: 'Tutup'
  });
}

/**
 * View full payment detail
 */
function viewPaymentDetail(orderId) {
  const order = StorageBridge.getOrderById(orderId);
  if (!order) return;
  
  // Reuse existing order detail function if available
  if (typeof openOrderDetail === 'function') {
    openOrderDetail(orderId);
  } else {
    Modal.alert({
      title: 'Detail Pesanan',
      message: `Order ID: ${orderId}`,
      html: '<p>Fitur detail sedang dikembangkan</p>'
    });
  }
}

/**
 * Verify or reject payment
 */
function verifyPaymentAction(orderId, isVerified) {
  const order = StorageBridge.getOrderById(orderId);
  if (!order) return;
  
  const action = isVerified ? 'menerima' : 'menolak';
  const actionColor = isVerified ? 'success' : 'warning';
  
  Modal.confirm({
    title: isVerified ? 'Terima Pembayaran' : 'Tolak Pembayaran',
    message: `Apakah Anda yakin ingin ${action} pembayaran untuk pesanan ${order.order_id || order.id}?`,
    type: actionColor,
    html: `
      <div class="bg-cream rounded-lg p-3 text-sm">
        <p class="text-gray-700 mb-2"><strong>${order.customerName}</strong></p>
        <p class="text-gray-600">Total: <strong>Rp ${(order.total || 0).toLocaleString('id-ID')}</strong></p>
        ${isVerified 
          ? '<p class="text-green-700 mt-2 text-xs">Pesanan akan diproses dan customer akan mendapat notifikasi.</p>'
          : '<p class="text-red-700 mt-2 text-xs">Pesanan akan dibatalkan dan customer akan diberitahu.</p>'
        }
      </div>
    `,
    confirmText: isVerified ? 'Ya, Terima' : 'Ya, Tolak',
    cancelText: 'Batal',
    onConfirm: () => {
      // Update payment status
      order.paymentStatus = isVerified ? 'verified' : 'rejected';
      order.paymentVerifiedAt = new Date().toISOString();
      order.paymentVerifiedBy = 'admin'; // Could be actual admin name
      
      // Update order status
      if (isVerified) {
        order.status = order.orderType === 'delivery' ? 'preparing' : 'confirmed';
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status: order.status,
          timestamp: new Date().toISOString(),
          note: 'Pembayaran diverifikasi oleh admin'
        });
      } else {
        order.status = 'cancelled';
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          note: 'Pembayaran ditolak oleh admin'
        });
      }
      
      StorageBridge.saveOrder(order);
      
      Modal.success({
        title: isVerified ? 'Pembayaran Diterima' : 'Pembayaran Ditolak',
        message: isVerified 
          ? 'Pesanan akan segera diproses. Anda bisa kirim konfirmasi via WhatsApp.'
          : 'Pesanan telah dibatalkan.',
        icon: isVerified ? 'check-circle' : 'x-circle',
        onConfirm: () => {
          renderPaymentVerification();
          // Auto suggest to send WhatsApp
          if (isVerified) {
            setTimeout(() => {
              if (confirm('Kirim konfirmasi pembayaran ke customer via WhatsApp?')) {
                sendWhatsAppConfirmation(orderId, true);
              }
            }, 300);
          }
        }
      });
    }
  });
}

/**
 * Send WhatsApp confirmation to customer
 */
function sendWhatsAppConfirmation(orderId, isVerified) {
  const order = StorageBridge.getOrderById(orderId);
  if (!order) return;
  
  if (!order.customerPhone) {
    Modal.error({
      title: 'Nomor WhatsApp Tidak Ditemukan',
      message: 'Customer tidak memiliki nomor WhatsApp',
      icon: 'phone-off'
    });
    return;
  }
  
  // Format phone number (remove 0, add 62)
  let phone = order.customerPhone.replace(/^0/, '62');
  
  // Build message
  const restaurantName = "Sban's Corner";
  const orderIdDisplay = order.order_id || order.id;
  
  let message = '';
  
  if (isVerified) {
    // Verified message
    message = `
*PEMBAYARAN DIVERIFIKASI ✅*

Halo ${order.customerName},

Pembayaran untuk pesanan Anda di ${restaurantName} telah kami verifikasi.

📋 *Detail Pesanan:*
ID: ${orderIdDisplay}
Status: ${order.orderType === 'delivery' ? 'Sedang Diproses 🚚' : 'Dikonfirmasi 📅'}
Total: Rp ${(order.total || 0).toLocaleString('id-ID')}

${order.orderType === 'delivery' 
  ? `Pesanan Anda sedang disiapkan dan akan segera dikirim ke alamat Anda.`
  : `Silakan tunjukkan barcode/ID reservasi saat datang ke restoran.`
}

Terima kasih telah memesan! 🙏
    `.trim();
  } else {
    // Rejected message
    message = `
*PEMBAYARAN DITOLAK ❌*

Halo ${order.customerName},

Mohon maaf, pembayaran untuk pesanan Anda di ${restaurantName} tidak dapat kami verifikasi.

📋 *Detail Pesanan:*
ID: ${orderIdDisplay}
Total: Rp ${(order.total || 0).toLocaleString('id-ID')}

Alasan: Bukti pembayaran tidak valid/tidak sesuai.

Silakan hubungi kami untuk informasi lebih lanjut atau lakukan pemesanan ulang.

Hubungi: 0812-3456-7890

Terima kasih. 🙏
    `.trim();
  }
  
  // Open WhatsApp
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  
  // Log that WhatsApp was sent
  order.whatsappSentAt = new Date().toISOString();
  order.whatsappSentBy = 'admin';
  StorageBridge.saveOrder(order);
  
  showToast(`WhatsApp konfirmasi dibuka untuk ${order.customerName}`, 'success');
}

/**
 * Refresh payment verification
 */
function refreshPaymentVerification() {
  renderPaymentVerification();
  showToast('Data pembayaran diperbarui', 'info');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const colors = {
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500',
    error: 'bg-red-500'
  };
  
  toast.className = `fixed bottom-6 right-6 ${colors[type] || colors.info} text-white px-5 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2.5 animate-[slide-up_0.3s_ease-out]`;
  toast.innerHTML = `
    <span class="text-sm font-medium">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
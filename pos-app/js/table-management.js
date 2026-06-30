// ===== TABLE MANAGEMENT MODULE =====

let tableManagementFilter = {
  search: '',
  status: 'all',
  category: 'all'
};

/**
 * Initialize table management page
 * ✅ FIXED: Menggunakan setTimeout untuk memastikan DOM ready
 */
function initTableManagement() {
  console.log('🪑 Initializing table management...');
  
  // ✅ FIX: Gunakan setTimeout untuk memastikan DOM sudah siap
  setTimeout(() => {
    // Cek apakah TABLES_DATA sudah tersedia
    if (typeof TABLES_DATA === 'undefined' || TABLES_DATA.length === 0) {
      console.error('❌ TABLES_DATA not loaded!');
      return;
    }
    
    // Cek apakah container ada
    const grid = document.getElementById('tableGrid');
    if (!grid) {
      console.error('❌ tableGrid container not found!');
      return;
    }
    
    console.log('✅ Rendering table management...');
    renderTableManagement();
  }, 100); // 100ms untuk memastikan DOM ready
  
  // Listen untuk update real-time
  StorageBridge.on('order:new', () => {
    console.log('🔄 New order, refreshing table management');
    renderTableManagement();
  });
  
  StorageBridge.on('order:update', () => {
    console.log('🔄 Order updated, refreshing table management');
    renderTableManagement();
  });
}

/**
 * Render table management page
 */
function renderTableManagement() {
  updateTableStats();
  renderTableGrid();
  updateTableAvailableBadge();
  
  if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
}

/**
 * Update statistics
 */
function updateTableStats() {
  const tables = getTableStatuses();
  
  const available = tables.filter(t => t.status === 'available').length;
  const reserved = tables.filter(t => t.status === 'reserved').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;
  const total = TABLES_DATA.length;
  const occupancyRate = Math.round(((reserved + occupied) / total) * 100);
  
  const elAvailable = document.getElementById('tableAvailableCount');
  const elReserved = document.getElementById('tableReservedCount');
  const elOccupied = document.getElementById('tableOccupiedCount');
  const elRate = document.getElementById('tableOccupancyRate');
  
  if (elAvailable) elAvailable.textContent = available;
  if (elReserved) elReserved.textContent = reserved;
  if (elOccupied) elOccupied.textContent = occupied;
  if (elRate) elRate.textContent = occupancyRate + '%';
}

/**
 * Update badge di sidebar
 */
function updateTableAvailableBadge() {
  const badge = document.getElementById('tableAvailableBadge');
  if (!badge) return;
  
  const tables = getTableStatuses();
  const available = tables.filter(t => t.status === 'available').length;
  
  if (available > 0) {
    badge.textContent = available;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/**
 * ✅ Get status semua meja (FIXED VERSION)
 * - Support reservasi untuk masa depan
 * - Menggunakan tanggal lokal (bukan UTC)
 * - Logika status yang lebih akurat
 */
function getTableStatuses() {
  const now = new Date();
  
  // ✅ FIX 1: Gunakan tanggal LOKAL, bukan UTC
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().substr(0, 5); // "14:30"
  
  const orders = StorageBridge.getOrders();
  
  return TABLES_DATA.map(table => {
    // ✅ FIX 2: Ambil SEMUA reservasi aktif (bukan hanya hari ini)
    const allReservations = orders.filter(o => {
      if (o.orderType !== 'reservation') return false;
      if (o.tableNumber !== table.id) return false;
      if (o.status === 'cancelled' || o.status === 'checked-out') return false;
      return true;
    });
    
    // Prioritas 1: Cek apakah ada yang sedang checked-in
    const checkedIn = allReservations.find(o => o.status === 'checked-in');
    
    // Prioritas 2: Cari reservasi terdekat (hari ini + masa depan)
    const upcomingReservations = allReservations
      .filter(o => {
        const orderDate = (o.date || '').split('T')[0];
        return orderDate >= localToday; // Hari ini atau masa depan
      })
      .sort((a, b) => {
        // Sort by date & time ascending (terdekat dulu)
        const dateA = `${a.date}T${a.time || '00:00'}`;
        const dateB = `${b.date}T${b.time || '00:00'}`;
        return dateA.localeCompare(dateB);
      });
    
    const nextReservation = upcomingReservations[0];
    
    let status = 'available';
    let activeReservation = null;
    
    if (checkedIn) {
      // 🟢 DITEMPATI: Customer sudah check-in
      status = 'occupied';
      activeReservation = checkedIn;
    } else if (nextReservation) {
      const resDate = (nextReservation.date || '').split('T')[0];
      const resTime = nextReservation.time;
      const resEndTime = nextReservation.endTime;
      
      if (resDate === localToday) {
        // Reservasi untuk HARI INI
        if (resEndTime && currentTime > resEndTime) {
          // ✅ Waktu selesai sudah lewat → anggap available
          // (harusnya sudah auto checked-out, tapi jaga-jaga)
          status = 'available';
        } else if (resTime && currentTime >= resTime) {
          // 🟢 Waktu mulai sudah lewat tapi belum selesai → occupied
          status = 'occupied';
          activeReservation = nextReservation;
        } else {
          // 🔵 Belum waktunya → reserved
          status = 'reserved';
          activeReservation = nextReservation;
        }
      } else {
        // 🔵 Reservasi untuk MASA DEPAN → reserved
        status = 'reserved';
        activeReservation = nextReservation;
      }
    }
    
    return {
      ...table,
      status,
      activeReservation,
      isFutureReservation: activeReservation && (activeReservation.date || '').split('T')[0] > localToday
    };
  });
}

/**
 * Filter tables
 */
function filterTables() {
  tableManagementFilter = {
    search: (document.getElementById('tableSearch')?.value || '').toLowerCase(),
    status: document.getElementById('tableStatusFilter')?.value || 'all',
    category: document.getElementById('tableCategoryFilter')?.value || 'all'
  };
  renderTableGrid();
}

/**
 * Render table grid
 */
function renderTableGrid() {
  const container = document.getElementById('tableGrid');
  if (!container) return;
  
  let tables = getTableStatuses();
  
  // Apply filters
  if (tableManagementFilter.search) {
    tables = tables.filter(t => {
      if (t.activeReservation) {
        const customerName = (t.activeReservation.customerName || '').toLowerCase();
        return customerName.includes(tableManagementFilter.search);
      }
      return false;
    });
  }
  
  if (tableManagementFilter.status !== 'all') {
    tables = tables.filter(t => t.status === tableManagementFilter.status);
  }
  
  if (tableManagementFilter.category !== 'all') {
    tables = tables.filter(t => t.category === tableManagementFilter.category);
  }
  
  if (tables.length === 0) {
    container.innerHTML = `
      <div class="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cream to-[#F9F6F2] flex items-center justify-center mb-4 border border-[#EFE7DE]">
          <i data-lucide="armchair" class="w-9 h-9 text-forest/40"></i>
        </div>
        <h3 class="font-brand text-lg font-bold text-forest mb-1">Tidak ada meja</h3>
        <p class="text-sm text-gray-500">
          ${tableManagementFilter.search || tableManagementFilter.status !== 'all' || tableManagementFilter.category !== 'all'
            ? 'Coba ubah filter untuk melihat meja lain' 
            : 'Semua meja tersedia'}
        </p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = tables.map(table => renderTableCard(table)).join('');
  if (window.lucide) lucide.createIcons();
}

/**
 * Render single table card
 */
function renderTableCard(table) {
  const statusConfig = {
    available: { label: 'Tersedia', color: 'green', icon: 'check-circle', bg: 'bg-green-50' },
    reserved: { label: 'Direservasi', color: 'blue', icon: 'calendar', bg: 'bg-blue-50' },
    occupied: { label: 'Ditempati', color: 'forest', icon: 'users', bg: 'bg-forest/10' }
  };
  
  const status = statusConfig[table.status] || statusConfig.available;
  const categoryConfig = TABLE_CATEGORIES[table.category] || { label: table.category, icon: 'armchair' };
  
  // Info reservasi
  let reservationInfo = '';
  if (table.activeReservation) {
    const res = table.activeReservation;
    const customerName = res.customerName || 'Unknown';
    const time = res.time || '-';
    const endTime = res.endTime || '-';
    const guestCount = res.guestCount || 0;
    
    // ✅ BARU: Format tanggal untuk reservasi masa depan
    const resDate = (res.date || '').split('T')[0];
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    let dateLabel = '';
    if (resDate > localToday) {
      // Reservasi untuk masa depan → tampilkan tanggal
      const dateObj = new Date(res.date);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
      dateLabel = `
        <div class="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1">
          <i data-lucide="calendar-clock" class="w-3 h-3"></i>
          <span>${formattedDate}</span>
        </div>
      `;
    }
    
    reservationInfo = `
      <div class="mt-3 pt-3 border-t border-gray-200/50">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-full ${status.bg} flex items-center justify-center flex-shrink-0">
            <i data-lucide="user" class="w-4 h-4 text-${status.color}-600"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-gray-800 truncate">${customerName}</p>
            <p class="text-xs text-gray-500">${guestCount} orang</p>
          </div>
        </div>
        <div class="flex items-center gap-1 text-xs text-gray-600">
          <i data-lucide="clock" class="w-3 h-3"></i>
          <span>${time} - ${endTime}</span>
        </div>
        ${dateLabel}
        ${table.status === 'occupied' ? `
          <div class="mt-2 flex items-center gap-1 text-xs text-forest font-semibold">
            <i data-lucide="check-circle" class="w-3 h-3"></i>
            <span>Check-in</span>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    reservationInfo = `
      <div class="mt-3 pt-3 border-t border-gray-200/50 text-center">
        <p class="text-xs text-gray-500 italic">Belum ada reservasi</p>
      </div>
    `;
  }
  
  return `
    <div class="table-card-management status-${table.status} rounded-xl p-4" onclick="viewTableDetail(${table.id})">
      <div class="flex items-start justify-between mb-3">
        <div class="w-12 h-12 rounded-lg ${status.bg} flex items-center justify-center">
          <i data-lucide="${status.icon}" class="w-6 h-6 text-${status.color}-600"></i>
        </div>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-${status.color}-100 text-${status.color}-700">
          ${status.label}
        </span>
      </div>
      
      <h3 class="font-brand text-lg font-bold text-gray-800 mb-1">${table.name}</h3>
      <p class="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <i data-lucide="${categoryConfig.icon}" class="w-3 h-3"></i>
        ${categoryConfig.label} • ${table.minCapacity}-${table.maxCapacity} orang
      </p>
      <p class="text-xs text-gray-500 flex items-center gap-1">
        <i data-lucide="${table.location === 'outdoor' ? 'sun' : 'home'}" class="w-3 h-3"></i>
        ${table.location === 'outdoor' ? 'Outdoor' : 'Indoor'} • ${table.position}
      </p>
      
      ${reservationInfo}
    </div>
  `;
}

/**
 * View table detail
 */
function viewTableDetail(tableId) {
  const table = getTableById(tableId);
  if (!table) return;
  
  const tables = getTableStatuses();
  const tableStatus = tables.find(t => t.id === tableId);
  
  let html = `
    <div class="space-y-4">
      <div class="bg-cream rounded-lg p-4">
        <h3 class="font-brand text-xl font-bold text-forest mb-2">${table.name}</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p class="text-gray-500 text-xs">Kategori</p>
            <p class="font-semibold">${TABLE_CATEGORIES[table.category]?.label || table.category}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs">Kapasitas</p>
            <p class="font-semibold">${table.minCapacity}-${table.maxCapacity} orang</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs">Lokasi</p>
            <p class="font-semibold">${table.location === 'outdoor' ? 'Outdoor' : 'Indoor'}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs">Posisi</p>
            <p class="font-semibold capitalize">${table.position}</p>
          </div>
        </div>
      </div>
  `;
  
  if (tableStatus?.activeReservation) {
    const res = tableStatus.activeReservation;
    html += `
      <div class="bg-${tableStatus.status === 'occupied' ? 'forest' : 'blue'}/5 border border-${tableStatus.status === 'occupied' ? 'forest' : 'blue'}-200 rounded-lg p-4">
        <h4 class="font-semibold text-sm mb-3 flex items-center gap-2">
          <i data-lucide="${tableStatus.status === 'occupied' ? 'users' : 'calendar'}" class="w-4 h-4"></i>
          ${tableStatus.status === 'occupied' ? 'Sedang Ditempati' : 'Reservasi Aktif'}
        </h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Nama:</span>
            <span class="font-semibold">${res.customerName || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">WhatsApp:</span>
            <span class="font-semibold">${res.customerPhone || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Waktu:</span>
            <span class="font-semibold">${res.time || '-'} - ${res.endTime || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Tamu:</span>
            <span class="font-semibold">${res.guestCount || 0} orang</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Status:</span>
            <span class="font-semibold capitalize">${res.status}</span>
          </div>
        </div>
        
        ${tableStatus.status === 'reserved' ? `
          <button onclick="checkInFromTable(${res.id || res.order_id})" class="w-full mt-4 py-2 bg-forest text-white rounded-lg text-sm font-semibold hover:bg-forestLight transition flex items-center justify-center gap-2">
            <i data-lucide="log-in" class="w-4 h-4"></i>
            Check-in Pelanggan
          </button>
        ` : ''}
      </div>
    `;
  } else {
    html += `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <i data-lucide="check-circle" class="w-12 h-12 text-green-600 mx-auto mb-2"></i>
        <p class="font-semibold text-green-900">Meja Tersedia</p>
        <p class="text-sm text-green-700 mt-1">Meja ini siap untuk reservasi atau walk-in customer</p>
      </div>
    `;
  }
  
  html += `</div>`;
  
  Modal.show({
    title: `Detail ${table.name}`,
    message: `Kapasitas: ${table.minCapacity}-${table.maxCapacity} orang`,
    html: html,
    size: 'md',
    confirmText: 'Tutup'
  });
}

/**
 * Check-in dari table management
 */
function checkInFromTable(orderId) {
  const order = StorageBridge.getOrderById(orderId);
  if (!order) return;
  
  Modal.confirm({
    title: 'Check-in Pelanggan',
    message: `Konfirmasi check-in untuk ${order.customerName}?`,
    html: `
      <div class="bg-cream rounded-lg p-3 text-sm">
        <p><strong>Meja:</strong> ${order.tableName || 'Meja ' + order.tableNumber}</p>
        <p><strong>Waktu:</strong> ${order.time} - ${order.endTime}</p>
        <p><strong>Tamu:</strong> ${order.guestCount} orang</p>
      </div>
    `,
    confirmText: 'Check-in Sekarang',
    cancelText: 'Batal',
    onConfirm: () => {
      StorageBridge.updateOrderStatus(orderId, 'checked-in', 'Check-in dari manajemen meja');
      Modal.success({
        title: 'Check-in Berhasil',
        message: 'Status meja telah diperbarui menjadi ditempati',
        icon: 'check-circle'
      });
      renderTableManagement();
    }
  });
}

/**
 * Refresh table management
 */
function refreshTableManagement() {
  renderTableManagement();
  showToast('Data meja diperbarui', 'info');
}

/**
 * Toast notification
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
  toast.innerHTML = `<span class="text-sm font-medium">${message}</span>`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
// ===== TRANSACTIONS DATA STORE =====
// Unified storage untuk Reservasi & Delivery orders

let transactions = [];

// Status metadata (support reservation & delivery flow)
const STATUS_META = {
  // Reservation statuses
  pending:      { label: 'Menunggu',      icon: 'clock',          color: 'orange', next: 'confirmed' },
  confirmed:    { label: 'Dikonfirmasi',  icon: 'check-circle',   color: 'blue',   next: 'checked-in' },
  'checked-in': { label: 'Check-in',      icon: 'log-in',         color: 'green',  next: 'checked-out' },
  'checked-out':{ label: 'Selesai',       icon: 'log-out',        color: 'forest', next: null },
  
  // Delivery statuses
  preparing:    { label: 'Disiapkan',     icon: 'chef-hat',       color: 'blue',   next: 'ready' },
  ready:        { label: 'Siap Dikirim',  icon: 'package-check',  color: 'green',  next: 'shipping' },
  shipping:     { label: 'Dikirim',       icon: 'truck',          color: 'purple', next: 'completed' },
  completed:    { label: 'Selesai',       icon: 'badge-check',    color: 'forest', next: null },
  
  // Common
  cancelled:    { label: 'Dibatalkan',    icon: 'ban',            color: 'red',    next: null }
};

// Payment method metadata (cashless only)
const PAYMENT_META = {
  QRIS:     { label: 'QRIS',          icon: 'qr-code',    color: 'blue' },
  TRANSFER: { label: 'Transfer Bank', icon: 'building-2', color: 'purple' }
};

// Order type constants
const ORDER_TYPE = {
  RESERVATION: 'reservation',
  DELIVERY: 'delivery'
};

/**
 * Load transaksi dari localStorage
 */
function loadTransactions() {
  try {
    const saved = localStorage.getItem('sbans_orders');
    if (saved) {
      transactions = JSON.parse(saved);
      
      // Migrasi data lama (backward compatibility)
      transactions = transactions.map(t => {
        // Normalisasi field baru
        if (!t.orderType) {
          t.orderType = t.tableNumber ? ORDER_TYPE.RESERVATION : ORDER_TYPE.DELIVERY;
        }
        if (!t.paymentStatus) {
          t.paymentStatus = 'verified';
        }
        if (!t.paymentMethod && t.payment_method) {
          t.paymentMethod = t.payment_method;
        }
        if (!t.statusHistory && t.status_history) {
          t.statusHistory = t.status_history;
        }
        if (!t.items && t.menuOrders) {
          t.items = t.menuOrders;
        }
        return t;
      });
      
      saveTransactions();
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    transactions = [];
  }
  return transactions;
}

/**
 * Simpan transaksi ke localStorage
 */
function saveTransactions() {
  try {
    localStorage.setItem('sbans_orders', JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
}

/**
 * Tambah transaksi baru
 */
function addTransaction(transaction) {
  const now = new Date().toISOString();
  const newTransaction = {
    ...transaction,
    id: transaction.id || generateOrderId(transaction.orderType),
    order_id: transaction.order_id || transaction.id,
    date: transaction.date || now,
    createdAt: transaction.createdAt || now,
    items: transaction.items || transaction.menuOrders || [],
    status: transaction.status || 'pending',
    paymentStatus: transaction.paymentStatus || 'verified',
    statusHistory: transaction.statusHistory || [{
      status: transaction.status || 'pending',
      timestamp: now,
      note: 'Pesanan dibuat'
    }]
  };
  
  transactions.push(newTransaction);
  saveTransactions();
  
  refreshAllViews();
  return newTransaction;
}

/**
 * Update status pesanan
 */
function updateOrderStatus(orderId, newStatus, note = '') {
  const order = transactions.find(t => t.order_id === orderId || t.id === orderId);
  if (!order) return false;
  
  const currentStatus = order.status || 'pending';
  
  // Validasi transisi status
  const validTransitions = {
    pending:      ['confirmed', 'preparing', 'cancelled'],
    confirmed:    ['checked-in', 'cancelled'],
    'checked-in': ['checked-out', 'cancelled'],
    'checked-out':[],
    preparing:    ['ready', 'cancelled'],
    ready:        ['shipping', 'completed', 'cancelled'],
    shipping:     ['completed', 'cancelled'],
    completed:    [],
    cancelled:    []
  };
  
  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    console.warn(`Invalid status transition: ${currentStatus} → ${newStatus}`);
    return false;
  }
  
  order.status = newStatus;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status diubah ke ${STATUS_META[newStatus]?.label || newStatus}`
  });
  
  // Timestamp khusus
  if (newStatus === 'checked-in') order.checkedInAt = new Date().toISOString();
  if (newStatus === 'checked-out') order.checkedOutAt = new Date().toISOString();
  if (newStatus === 'shipping') order.shippedAt = new Date().toISOString();
  if (newStatus === 'completed') order.completedAt = new Date().toISOString();
  
  saveTransactions();
  refreshAllViews();
  
  return true;
}

/**
 * Get order by ID
 */
function getOrderById(orderId) {
  return transactions.find(t => t.order_id === orderId || t.id === orderId);
}

/**
 * Update badge di sidebar
 */
function updateOrdersBadge() {
  const badge = document.getElementById('ordersBadge');
  if (!badge) return;
  
  const pendingCount = transactions.filter(t => 
    ['pending', 'preparing', 'ready', 'confirmed'].includes(t.status)
  ).length;
  
  if (pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/**
 * Refresh semua view
 */
function refreshAllViews() {
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderReports === 'function') renderReports();
  if (typeof renderOrders === 'function') renderOrders();
  if (typeof renderReservations === 'function') renderReservations();
  if (typeof renderTableManagement === 'function') renderTableManagement();
  updateOrdersBadge();
}

/**
 * Generate unique order ID
 */
function generateOrderId(type = 'delivery') {
  const prefix = type === 'reservation' ? 'RES' : 'ORD';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

/**
 * Get dashboard stats
 */
function getDashboardStats() {
  const today = new Date().toDateString();
  const todayTx = transactions.filter(t => 
    new Date(t.createdAt || t.date).toDateString() === today && 
    t.status !== 'cancelled'
  );
  
  const totalSales = todayTx.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalOrders = todayTx.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  
  const itemCount = {};
  transactions.forEach(t => {
    if (t.status === 'cancelled') return;
    const items = t.items || t.menuOrders || [];
    if (Array.isArray(items)) {
      items.forEach(item => {
        itemCount[item.name] = (itemCount[item.name] || 0) + item.qty;
      });
    }
  });
  
  const topItem = Object.entries(itemCount).sort((a,b) => b[1] - a[1])[0];
  
  return {
    todaySales: totalSales,
    todayOrders: totalOrders,
    avgOrder: avgOrder,
    topItem: topItem ? topItem[0] : '-',
    topItemQty: topItem ? topItem[1] : 0,
    totalTransactions: transactions.length,
    allTimeSales: transactions.reduce((sum, t) => sum + (t.total || 0), 0)
  };
}

// ============================================================
// 🎭 DUMMY DATA GENERATOR - ALUR BARU (RESERVASI + DELIVERY)
// ============================================================

/**
 * Generate data dummy dengan struktur baru
 */
function generateDummyTransactions() {
  const now = new Date();
  const dummyData = [];
  
  // Produk dari menuItems
  const products = typeof menuItems !== 'undefined' && menuItems.length > 0
    ? menuItems
    : [
        { id: 1, name: "Nasi cokot", price: 7000, cat: "Food" },
        { id: 2, name: "Paket nasi cokot", price: 10000, cat: "Food" },
        { id: 3, name: "Banana vla", price: 15000, cat: "Snack" },
        { id: 4, name: "Teh pucuk", price: 5000, cat: "Beverage" },
        { id: 5, name: "Air mineral", price: 5000, cat: "Beverage" },
      ];
  
  // Data meja dari TABLES_DATA
  const tables = typeof TABLES_DATA !== 'undefined' ? TABLES_DATA : [];
  
  // Nama pelanggan dummy
  const customerNames = [
    'Budi Santoso', 'Siti Nurhaliza', 'Andi Wijaya', 'Dewi Lestari',
    'Rizky Pratama', 'Maya Sari', 'Dimas Aditya', 'Putri Ayu',
    'Fajar Hidayat', 'Rina Marlina', 'Agus Setiawan', 'Lina Kusuma',
    'Hendra Gunawan', 'Nadia Putri', 'Yoga Pratama', 'Fitri Handayani'
  ];
  
  // Alamat dummy untuk delivery
  const addresses = [
    'Jl. Merdeka No. 45, RT 02/RW 05, Kel. Sukajadi, Kec. Bandung Wetan, Bandung 40113',
    'Jl. Asia Afrika No. 120, Apt. Graha Famili Blok C-12, Bandung 40212',
    'Jl. Dago No. 88, Perumahan Dago Asri Blok A-5, Bandung 40135',
    'Jl. Gatot Subroto No. 200, Bandung 40272',
    'Jl. Riau No. 15, Bandung 40114',
    'Jl. Setiabudhi No. 235, Bandung 40141',
    'Jl. Cihampelas No. 160, Bandung 40131',
    'Jl. Pasteur No. 38, Bandung 40161'
  ];
  
  // Helper: buat tanggal X hari yang lalu
  function daysAgo(days, hour = 12, minute = 0) {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }
  
  // Helper: hitung end time (+2 jam)
  function calculateEndTime(startTime) {
    const [h, m] = startTime.split(':').map(Number);
    let endH = h + 2;
    if (endH >= 24) endH -= 24;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  
  // Helper: buat status history
  function makeStatusHistory(status, baseDate, orderType) {
    const history = [];
    const base = new Date(baseDate);
    
    const flows = {
      reservation: ['pending', 'confirmed', 'checked-in', 'checked-out'],
      delivery: ['pending', 'preparing', 'ready', 'shipping', 'completed']
    };
    
    const notes = {
      pending: 'Pesanan dibuat, menunggu pembayaran',
      confirmed: 'Pembayaran terverifikasi',
      'checked-in': 'Pelanggan check-in di meja',
      'checked-out': 'Pelanggan check-out, meja dibebaskan',
      preparing: 'Pesanan sedang disiapkan di dapur',
      ready: 'Pesanan siap dikirim',
      shipping: 'Pesanan dijemput kurir Gojek/Grab',
      completed: 'Pesanan diterima pelanggan',
      cancelled: 'Pesanan dibatalkan'
    };
    
    const flow = flows[orderType] || flows.delivery;
    
    if (status === 'cancelled') {
      const cancelFrom = flow[Math.floor(Math.random() * (flow.length - 1))];
      const cancelIdx = flow.indexOf(cancelFrom);
      
      for (let i = 0; i <= cancelIdx; i++) {
        const t = new Date(base);
        t.setMinutes(t.getMinutes() + (i * 10));
        history.push({ 
          status: flow[i], 
          timestamp: t.toISOString(), 
          note: notes[flow[i]] 
        });
      }
      
      const cancelTime = new Date(base);
      cancelTime.setMinutes(cancelTime.getMinutes() + ((cancelIdx + 1) * 10));
      history.push({ 
        status: 'cancelled', 
        timestamp: cancelTime.toISOString(), 
        note: notes.cancelled 
      });
    } else {
      const endIdx = flow.indexOf(status);
      for (let i = 0; i <= endIdx; i++) {
        const t = new Date(base);
        t.setMinutes(t.getMinutes() + (i * 10));
        history.push({ 
          status: flow[i], 
          timestamp: t.toISOString(), 
          note: notes[flow[i]] 
        });
      }
    }
    
    return history;
  }
  
  // Helper: pilih items random
  function pickItems(count) {
    const items = [];
    const used = new Set();
    
    for (let i = 0; i < count; i++) {
      let product, attempts = 0;
      do {
        product = products[Math.floor(Math.random() * products.length)];
        attempts++;
      } while (used.has(product.id) && attempts < 10);
      
      used.add(product.id);
      const qty = Math.floor(Math.random() * 3) + 1;
      
      // Tambah variant untuk Nasi Cokot
      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: qty
      };
      
      if (product.variants && product.variants.length > 0) {
        const variantGroup = product.variants[0];
        const randomOption = variantGroup.options[Math.floor(Math.random() * variantGroup.options.length)];
        item.variants = { [variantGroup.title]: randomOption };
      }
      
      items.push(item);
    }
    
    return items;
  }
  
  // Helper: buat order RESERVASI
  function makeReservation(date, time, status, customerName, guestCount) {
    const table = tables.length > 0 
      ? tables[Math.floor(Math.random() * tables.length)]
      : { id: Math.floor(Math.random() * 16) + 1, name: 'Meja ' + (Math.floor(Math.random() * 16) + 1) };
    
    const items = pickItems(Math.floor(Math.random() * 3) + 1);
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    
    const orderId = `RES-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    return {
      id: orderId,
      order_id: orderId,
      orderType: ORDER_TYPE.RESERVATION,
      date: date,
      time: time,
      endTime: calculateEndTime(time),
      createdAt: date,
      tableNumber: table.id,
      tableName: table.name,
      tableCategory: table.category || 'couple',
      guestCount: guestCount,
      customerName: customerName,
      customerPhone: '08' + Math.floor(Math.random() * 9000000000 + 1000000000),
      items: items,
      menuOrders: items,
      subtotal: subtotal,
      tax: tax,
      total: total,
      paymentMethod: Math.random() > 0.5 ? 'QRIS' : 'TRANSFER',
      payment_method: Math.random() > 0.5 ? 'QRIS' : 'TRANSFER',
      paymentStatus: 'verified',
      paymentProof: null, // Dummy tidak pakai bukti asli
      status: status,
      statusHistory: makeStatusHistory(status, date, ORDER_TYPE.RESERVATION),
      source: 'customer-app'
    };
  }
  
  // Helper: buat order DELIVERY
  function makeDelivery(date, status, customerName) {
    const items = pickItems(Math.floor(Math.random() * 3) + 1);
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    return {
      id: orderId,
      order_id: orderId,
      orderType: ORDER_TYPE.DELIVERY,
      date: date,
      createdAt: date,
      customerName: customerName,
      customerPhone: '08' + Math.floor(Math.random() * 9000000000 + 1000000000),
      deliveryAddress: addresses[Math.floor(Math.random() * addresses.length)],
      deliveryNotes: Math.random() > 0.7 ? 'Tolong ketuk pintu 2x' : '',
      items: items,
      subtotal: subtotal,
      tax: tax,
      total: total,
      paymentMethod: Math.random() > 0.5 ? 'QRIS' : 'TRANSFER',
      payment_method: Math.random() > 0.5 ? 'QRIS' : 'TRANSFER',
      paymentStatus: 'verified',
      paymentProof: null,
      status: status,
      statusHistory: makeStatusHistory(status, date, ORDER_TYPE.DELIVERY),
      source: 'customer-app'
    };
  }
  
  // ========================================
  // 📅 HARI INI - 8 pesanan (mix reservasi & delivery)
  // ========================================
  
  // Reservasi hari ini
  dummyData.push(makeReservation(daysAgo(0, 10, 0), '10:00', 'checked-in', 'Budi Santoso', 2));
  dummyData.push(makeReservation(daysAgo(0, 11, 30), '11:30', 'confirmed', 'Siti Nurhaliza', 4));
  dummyData.push(makeReservation(daysAgo(0, 13, 0), '13:00', 'pending', 'Andi Wijaya', 3));
  
  // Delivery hari ini
  dummyData.push(makeDelivery(daysAgo(0, 8, 15), 'completed', 'Dewi Lestari'));
  dummyData.push(makeDelivery(daysAgo(0, 9, 30), 'completed', 'Rizky Pratama'));
  dummyData.push(makeDelivery(daysAgo(0, 11, 0), 'shipping', 'Maya Sari'));
  dummyData.push(makeDelivery(daysAgo(0, 12, 45), 'ready', 'Dimas Aditya'));
  dummyData.push(makeDelivery(daysAgo(0, 14, 0), 'preparing', 'Putri Ayu'));
  
  // ========================================
  // 📅 KEMARIN - 10 pesanan
  // ========================================
  
  dummyData.push(makeReservation(daysAgo(1, 10, 0), '10:00', 'checked-out', 'Fajar Hidayat', 2));
  dummyData.push(makeReservation(daysAgo(1, 12, 0), '12:00', 'checked-out', 'Rina Marlina', 5));
  dummyData.push(makeReservation(daysAgo(1, 19, 0), '19:00', 'checked-out', 'Agus Setiawan', 4));
  dummyData.push(makeReservation(daysAgo(1, 20, 30), '20:30', 'cancelled', 'Lina Kusuma', 2));
  
  dummyData.push(makeDelivery(daysAgo(1, 11, 0), 'completed', 'Hendra Gunawan'));
  dummyData.push(makeDelivery(daysAgo(1, 12, 30), 'completed', 'Nadia Putri'));
  dummyData.push(makeDelivery(daysAgo(1, 13, 0), 'completed', 'Yoga Pratama'));
  dummyData.push(makeDelivery(daysAgo(1, 14, 15), 'completed', 'Fitri Handayani'));
  dummyData.push(makeDelivery(daysAgo(1, 18, 0), 'cancelled', 'Budi Santoso'));
  dummyData.push(makeDelivery(daysAgo(1, 19, 30), 'completed', 'Siti Nurhaliza'));
  
  // ========================================
  // 📅 2 HARI LALU - 8 pesanan
  // ========================================
  
  dummyData.push(makeReservation(daysAgo(2, 11, 0), '11:00', 'checked-out', 'Andi Wijaya', 3));
  dummyData.push(makeReservation(daysAgo(2, 13, 0), '13:00', 'checked-out', 'Dewi Lestari', 6));
  dummyData.push(makeReservation(daysAgo(2, 18, 0), '18:00', 'checked-out', 'Rizky Pratama', 2));
  
  dummyData.push(makeDelivery(daysAgo(2, 10, 0), 'completed', 'Maya Sari'));
  dummyData.push(makeDelivery(daysAgo(2, 11, 30), 'completed', 'Dimas Aditya'));
  dummyData.push(makeDelivery(daysAgo(2, 13, 45), 'completed', 'Putri Ayu'));
  dummyData.push(makeDelivery(daysAgo(2, 15, 0), 'completed', 'Fajar Hidayat'));
  dummyData.push(makeDelivery(daysAgo(2, 20, 0), 'completed', 'Rina Marlina'));
  
  // ========================================
  // 📅 3 HARI LALU - 6 pesanan
  // ========================================
  
  dummyData.push(makeReservation(daysAgo(3, 12, 0), '12:00', 'checked-out', 'Agus Setiawan', 4));
  dummyData.push(makeReservation(daysAgo(3, 19, 0), '19:00', 'checked-out', 'Lina Kusuma', 2));
  
  dummyData.push(makeDelivery(daysAgo(3, 11, 0), 'completed', 'Hendra Gunawan'));
  dummyData.push(makeDelivery(daysAgo(3, 12, 30), 'completed', 'Nadia Putri'));
  dummyData.push(makeDelivery(daysAgo(3, 14, 0), 'completed', 'Yoga Pratama'));
  dummyData.push(makeDelivery(daysAgo(3, 18, 0), 'cancelled', 'Fitri Handayani'));
  
  // ========================================
  // 📅 4-7 HARI LALU - 10 pesanan
  // ========================================
  
  dummyData.push(makeReservation(daysAgo(4, 12, 0), '12:00', 'checked-out', 'Budi Santoso', 3));
  dummyData.push(makeReservation(daysAgo(5, 13, 0), '13:00', 'checked-out', 'Siti Nurhaliza', 5));
  dummyData.push(makeReservation(daysAgo(6, 19, 0), '19:00', 'checked-out', 'Andi Wijaya', 2));
  dummyData.push(makeReservation(daysAgo(7, 11, 0), '11:00', 'checked-out', 'Dewi Lestari', 4));
  
  dummyData.push(makeDelivery(daysAgo(4, 10, 0), 'completed', 'Rizky Pratama'));
  dummyData.push(makeDelivery(daysAgo(4, 14, 0), 'completed', 'Maya Sari'));
  dummyData.push(makeDelivery(daysAgo(5, 11, 30), 'completed', 'Dimas Aditya'));
  dummyData.push(makeDelivery(daysAgo(5, 16, 0), 'completed', 'Putri Ayu'));
  dummyData.push(makeDelivery(daysAgo(6, 12, 0), 'completed', 'Fajar Hidayat'));
  dummyData.push(makeDelivery(daysAgo(7, 13, 0), 'cancelled', 'Rina Marlina'));
  
  // ========================================
  // 📅 8-14 HARI LALU - 8 pesanan
  // ========================================
  
  dummyData.push(makeReservation(daysAgo(8, 12, 0), '12:00', 'checked-out', 'Agus Setiawan', 4));
  dummyData.push(makeReservation(daysAgo(10, 19, 0), '19:00', 'checked-out', 'Lina Kusuma', 2));
  dummyData.push(makeReservation(daysAgo(12, 13, 0), '13:00', 'checked-out', 'Hendra Gunawan', 6));
  dummyData.push(makeReservation(daysAgo(14, 11, 0), '11:00', 'checked-out', 'Nadia Putri', 3));
  
  dummyData.push(makeDelivery(daysAgo(8, 11, 0), 'completed', 'Yoga Pratama'));
  dummyData.push(makeDelivery(daysAgo(9, 12, 30), 'completed', 'Fitri Handayani'));
  dummyData.push(makeDelivery(daysAgo(11, 14, 0), 'completed', 'Budi Santoso'));
  dummyData.push(makeDelivery(daysAgo(13, 15, 0), 'completed', 'Siti Nurhaliza'));
  
  // ========================================
  // 📅 15-30 HARI LALU - 6 pesanan
  // ========================================
  
  dummyData.push(makeReservation(daysAgo(15, 12, 0), '12:00', 'checked-out', 'Andi Wijaya', 4));
  dummyData.push(makeReservation(daysAgo(20, 19, 0), '19:00', 'checked-out', 'Dewi Lestari', 5));
  dummyData.push(makeReservation(daysAgo(25, 13, 0), '13:00', 'checked-out', 'Rizky Pratama', 2));
  
  dummyData.push(makeDelivery(daysAgo(18, 11, 0), 'completed', 'Maya Sari'));
  dummyData.push(makeDelivery(daysAgo(22, 14, 0), 'completed', 'Dimas Aditya'));
  dummyData.push(makeDelivery(daysAgo(28, 12, 0), 'completed', 'Putri Ayu'));
  
  return dummyData;
}

/**
 * Load data dummy ke aplikasi
 */
function loadDummyTransactions(replaceExisting = false) {
  if (replaceExisting) {
    if (!confirm('⚠️ Ini akan MENGHAPUS semua data transaksi yang ada dan menggantinya dengan data dummy. Lanjutkan?')) {
      return;
    }
    transactions = [];
  } else if (transactions.length > 0) {
    if (!confirm(`📊 Sudah ada ${transactions.length} transaksi. Tambahkan data dummy? (Data existing akan tetap ada)`)) {
      return;
    }
  }
  
  const dummyData = generateDummyTransactions();
  transactions = [...transactions, ...dummyData];
  saveTransactions();
  
  refreshAllViews();
  
  console.log(`✅ ${dummyData.length} data dummy berhasil ditambahkan!`);
  console.log(`   - Reservasi: ${dummyData.filter(d => d.orderType === 'reservation').length}`);
  console.log(`   - Delivery: ${dummyData.filter(d => d.orderType === 'delivery').length}`);
  
  if (typeof showOrderToast === 'function') {
    showOrderToast(`${dummyData.length} data dummy berhasil dimuat`, 'success');
  }
}

/**
 * Hapus semua data transaksi
 */
function clearAllTransactions() {
  if (!confirm('⚠️ Hapus SEMUA data transaksi? Tindakan ini tidak bisa dibatalkan.')) return;
  
  transactions = [];
  saveTransactions();
  
  refreshAllViews();
  
  console.log('🗑️ Semua data transaksi telah dihapus');
  
  if (typeof showOrderToast === 'function') {
    showOrderToast('Semua data transaksi telah dihapus', 'warning');
  }
}

// Load data saat script dimuat
loadTransactions();
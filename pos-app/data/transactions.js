// ===== TRANSACTIONS DATA STORE =====

let transactions = [];

// Status constants
const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Status metadata
const STATUS_META = {
  pending: { label: 'Pending', icon: 'clock', color: 'orange', next: 'preparing' },
  preparing: { label: 'Preparing', icon: 'chef-hat', color: 'blue', next: 'ready' },
  ready: { label: 'Ready', icon: 'package-check', color: 'green', next: 'completed' },
  completed: { label: 'Completed', icon: 'badge-check', color: 'forest', next: null },
  cancelled: { label: 'Cancelled', icon: 'ban', color: 'red', next: null }
};

// Payment method metadata
const PAYMENT_META = {
  CASH: { label: 'Cash', icon: 'banknote', color: 'green' },
  QRIS: { label: 'QRIS', icon: 'qr-code', color: 'blue' }
};

/**
 * Load transaksi dari localStorage
 */
function loadTransactions() {
  try {
    const saved = localStorage.getItem('sban_transactions');
    if (saved) {
      transactions = JSON.parse(saved);
      transactions = transactions.map(t => {
        const status = t.status || ORDER_STATUS.COMPLETED;
        const status_history = t.status_history && t.status_history.length > 0
          ? t.status_history
          : [{ status, timestamp: t.date, note: 'Order created (migrated)' }];
        return { ...t, status, status_history };
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
    localStorage.setItem('sban_transactions', JSON.stringify(transactions));
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
    id: transaction.id || Date.now(),
    date: transaction.date || now,
    items: transaction.items || [],
    status: ORDER_STATUS.PENDING,
    status_history: [{
      status: ORDER_STATUS.PENDING,
      timestamp: now,
      note: 'Pesanan diterima'
    }]
  };
  
  transactions.push(newTransaction);
  saveTransactions();
  
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderReports === 'function') renderReports();
  if (typeof renderOrders === 'function') renderOrders();
  updateOrdersBadge();
  
  return newTransaction;
}

/**
 * Update status pesanan
 */
function updateOrderStatus(orderId, newStatus, note = '') {
  const order = transactions.find(t => t.order_id === orderId);
  if (!order) return false;
  
  if (!order.status) order.status = ORDER_STATUS.COMPLETED;
  
  const validTransitions = {
    pending: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  
  const currentStatus = order.status;
  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    console.warn(`Invalid status transition: ${currentStatus} → ${newStatus}`);
    return false;
  }
  
  order.status = newStatus;
  order.status_history = order.status_history || [];
  order.status_history.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status changed to ${STATUS_META[newStatus].label}`
  });
  
  // Kembalikan stock jika dibatalkan
  if (newStatus === ORDER_STATUS.CANCELLED) {
    if (Array.isArray(order.items)) {
      order.items.forEach(item => {
        const menuItem = typeof getMenuItemById === 'function' ? getMenuItemById(item.id) : null;
        if (menuItem) menuItem.stock += item.qty;
      });
    }
  }
  
  saveTransactions();
  
  if (typeof renderOrders === 'function') renderOrders();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderReports === 'function') renderReports();
  updateOrdersBadge();
  
  return true;
}

function getOrderById(orderId) {
  const order = transactions.find(t => t.order_id === orderId);
  if (order && !order.status) {
    order.status = ORDER_STATUS.COMPLETED;
    order.status_history = order.status_history || [{
      status: ORDER_STATUS.COMPLETED,
      timestamp: order.date,
      note: 'Order created (migrated)'
    }];
  }
  return order;
}

function updateOrdersBadge() {
  const badge = document.getElementById('ordersBadge');
  if (!badge) return;
  
  const pendingCount = transactions.filter(t => 
    t.status === ORDER_STATUS.PENDING || t.status === ORDER_STATUS.PREPARING
  ).length;
  
  if (pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function getDashboardStats() {
  const today = new Date().toDateString();
  const todayTx = transactions.filter(t => 
    new Date(t.date).toDateString() === today && t.status !== ORDER_STATUS.CANCELLED
  );
  
  const totalSales = todayTx.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalOrders = todayTx.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  
  const itemCount = {};
  transactions.forEach(t => {
    if (t.status === ORDER_STATUS.CANCELLED) return;
    if (Array.isArray(t.items)) {
      t.items.forEach(item => {
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
// 🎭 DUMMY DATA GENERATOR - VERSI PRODUK SBAN'S CORNER
// ============================================================

/**
 * Generate data dummy transaksi menggunakan produk Sban's Corner
 */
function generateDummyTransactions() {
  const now = new Date();
  const dummyData = [];
  
  // ⚠️ Gunakan data produk dari menuItems (jika sudah di-load)
  // Jika belum, gunakan data hardcoded
  const products = typeof menuItems !== 'undefined' && menuItems.length > 0
    ? menuItems
    : [
        { id: 1, name: "Nasi cokot", price: 7000, cat: "Food" },
        { id: 2, name: "Paket nasi cokot", price: 10000, cat: "Food" },
        { id: 3, name: "Banana vla", price: 15000, cat: "Snack" },
        { id: 4, name: "Teh pucuk", price: 5000, cat: "Beverage" },
        { id: 5, name: "Air mineral", price: 5000, cat: "Beverage" },
      ];
  
  // Helper: buat tanggal X hari yang lalu pada jam tertentu
  function daysAgo(days, hour = 12, minute = 0) {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }
  
  // Helper: buat order ID unik
  let orderCounter = 1;
  function makeOrderId(dateStr) {
    const d = new Date(dateStr);
    const dateCode = d.getDate().toString().padStart(2, '0') + 
                     (d.getMonth() + 1).toString().padStart(2, '0');
    const seq = (orderCounter++).toString().padStart(3, '0');
    return `ORD-${dateCode}${seq}`;
  }
  
  // Helper: buat status history
  function makeStatusHistory(status, baseDate, hoursBefore = 0) {
    const history = [];
    const base = new Date(baseDate);
    const flow = ['pending', 'preparing', 'ready', 'completed'];
    const notes = {
      pending: 'Pesanan diterima',
      preparing: 'Pesanan sedang disiapkan',
      ready: 'Pesanan siap diambil',
      completed: 'Pesanan selesai',
      cancelled: 'Pesanan dibatalkan'
    };
    
    if (status === 'cancelled') {
      const cancelFrom = ['pending', 'preparing', 'ready'][Math.floor(Math.random() * 3)];
      const cancelIdx = flow.indexOf(cancelFrom);
      
      for (let i = 0; i <= cancelIdx; i++) {
        const t = new Date(base);
        t.setMinutes(t.getMinutes() - (hoursBefore * 60) + (i * 5));
        history.push({ status: flow[i], timestamp: t.toISOString(), note: notes[flow[i]] });
      }
      
      const cancelTime = new Date(base);
      cancelTime.setMinutes(cancelTime.getMinutes() - (hoursBefore * 60) + ((cancelIdx + 1) * 5));
      history.push({ status: 'cancelled', timestamp: cancelTime.toISOString(), note: notes.cancelled });
    } else {
      const endIdx = flow.indexOf(status);
      for (let i = 0; i <= endIdx; i++) {
        const t = new Date(base);
        t.setMinutes(t.getMinutes() - (hoursBefore * 60) + (i * 5));
        history.push({ status: flow[i], timestamp: t.toISOString(), note: notes[flow[i]] });
      }
    }
    
    return history;
  }
  
  // Helper: buat transaksi
  function makeTransaction(date, items, payment, status) {
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const tendered = payment === 'CASH' 
      ? Math.ceil(total / 5000) * 5000  // pembulatan ke 5rb (karena harga kecil)
      : total;
    const change = payment === 'CASH' ? tendered - total : 0;
    
    return {
      id: Date.now() + Math.random() * 10000 + orderCounter,
      order_id: makeOrderId(date),
      date: date,
      items: items,
      subtotal: subtotal,
      tax: tax,
      total: total,
      payment_method: payment,
      amount_tendered: tendered,
      change_due: change,
      status: status,
      status_history: makeStatusHistory(status, date, status === 'completed' ? 0 : 1)
    };
  }
  
  // Helper: pilih item random dari produk
  function pickItems(count) {
    const items = [];
    const used = new Set();
    
    for (let i = 0; i < count; i++) {
      let product;
      let attempts = 0;
      do {
        product = products[Math.floor(Math.random() * products.length)];
        attempts++;
      } while (used.has(product.id) && attempts < 10);
      
      used.add(product.id);
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: Math.floor(Math.random() * 3) + 1  // 1-3 qty
      });
    }
    
    return items;
  }
  
  // ===== DATA DUMMY - SBAN'S CORNER =====
  // Menggunakan kombinasi produk yang realistis
  
  // 📅 HARI INI - 6 transaksi (mix status)
  // Pelanggan pagi - Nasi cokot + Teh pucuk
  dummyData.push(makeTransaction(
    daysAgo(0, 8, 15),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 2 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 2 }
    ],
    'CASH', 'completed'
  ));
  
  // Pelanggan sarapan - Paket nasi cokot
  dummyData.push(makeTransaction(
    daysAgo(0, 9, 30),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 1 },
      { id: 5, name: "Air mineral", price: 5000, qty: 1 }
    ],
    'QRIS', 'completed'
  ));
  
  // Pelanggan siang - Banana vla + Teh pucuk (sedang disiapkan)
  dummyData.push(makeTransaction(
    daysAgo(0, 12, 0),
    [
      { id: 3, name: "Banana vla", price: 15000, qty: 2 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 2 }
    ],
    'CASH', 'preparing'
  ));
  
  // Pelanggan siang - Nasi cokot banyak (baru masuk)
  dummyData.push(makeTransaction(
    daysAgo(0, 12, 45),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 3 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 3 }
    ],
    'QRIS', 'pending'
  ));
  
  // Pelanggan sore - Paket + Banana vla (siap diambil)
  dummyData.push(makeTransaction(
    daysAgo(0, 15, 20),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 2 },
      { id: 3, name: "Banana vla", price: 15000, qty: 1 }
    ],
    'CASH', 'ready'
  ));
  
  // Pelanggan sore - Air mineral + Nasi cokot
  dummyData.push(makeTransaction(
    daysAgo(0, 16, 30),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 1 },
      { id: 5, name: "Air mineral", price: 5000, qty: 2 }
    ],
    'QRIS', 'completed'
  ));
  
  // 📅 KEMARIN - 5 transaksi
  dummyData.push(makeTransaction(
    daysAgo(1, 8, 0),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 3 },
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 2 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 5 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(1, 11, 30),
    [
      { id: 3, name: "Banana vla", price: 15000, qty: 2 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 2 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(1, 13, 15),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 3 },
      { id: 5, name: "Air mineral", price: 5000, qty: 3 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(1, 15, 45),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 2 },
      { id: 3, name: "Banana vla", price: 15000, qty: 1 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(1, 18, 0),
    [
      { id: 4, name: "Teh pucuk", price: 5000, qty: 4 },
      { id: 5, name: "Air mineral", price: 5000, qty: 2 }
    ],
    'CASH', 'cancelled'  // ❌ dibatalkan
  ));
  
  // 📅 2 HARI LALU - 4 transaksi
  dummyData.push(makeTransaction(
    daysAgo(2, 9, 30),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 4 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 4 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(2, 12, 0),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 2 },
      { id: 3, name: "Banana vla", price: 15000, qty: 2 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(2, 14, 30),
    [
      { id: 3, name: "Banana vla", price: 15000, qty: 3 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 3 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(2, 17, 0),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 2 },
      { id: 5, name: "Air mineral", price: 5000, qty: 2 }
    ],
    'QRIS', 'completed'
  ));
  
  // 📅 3 HARI LALU - 3 transaksi
  dummyData.push(makeTransaction(
    daysAgo(3, 10, 0),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 5 },
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 3 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 8 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(3, 13, 30),
    [
      { id: 3, name: "Banana vla", price: 15000, qty: 4 },
      { id: 5, name: "Air mineral", price: 5000, qty: 4 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(3, 16, 45),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 2 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 2 }
    ],
    'CASH', 'completed'
  ));
  
  // 📅 4-7 HARI LALU - 6 transaksi
  dummyData.push(makeTransaction(
    daysAgo(4, 9, 0),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 3 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 3 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(4, 12, 30),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 4 },
      { id: 3, name: "Banana vla", price: 15000, qty: 2 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(5, 10, 15),
    [
      { id: 3, name: "Banana vla", price: 15000, qty: 3 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 3 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(5, 14, 0),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 2 },
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 2 },
      { id: 5, name: "Air mineral", price: 5000, qty: 4 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(6, 11, 30),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 6 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 6 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(6, 17, 0),
    [
      { id: 3, name: "Banana vla", price: 15000, qty: 2 },
      { id: 5, name: "Air mineral", price: 5000, qty: 2 }
    ],
    'QRIS', 'cancelled'  // ❌ dibatalkan
  ));
  
  // 📅 8-14 HARI LALU - 5 transaksi
  dummyData.push(makeTransaction(
    daysAgo(8, 10, 30),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 3 },
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 2 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 5 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(10, 12, 0),
    [
      { id: 3, name: "Banana vla", price: 15000, qty: 3 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 3 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(11, 13, 30),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 4 },
      { id: 5, name: "Air mineral", price: 5000, qty: 4 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(12, 15, 0),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 3 },
      { id: 3, name: "Banana vla", price: 15000, qty: 2 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(13, 11, 0),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 5 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 5 }
    ],
    'CASH', 'completed'
  ));
  
  // 📅 15-30 HARI LALU - 5 transaksi
  dummyData.push(makeTransaction(
    daysAgo(15, 10, 0),
    [
      { id: 4, name: "Teh pucuk", price: 5000, qty: 10 },
      { id: 5, name: "Air mineral", price: 5000, qty: 10 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(18, 12, 30),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 3 },
      { id: 3, name: "Banana vla", price: 15000, qty: 2 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(20, 14, 0),
    [
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 4 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 4 }
    ],
    'QRIS', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(25, 11, 30),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 4 },
      { id: 3, name: "Banana vla", price: 15000, qty: 3 },
      { id: 5, name: "Air mineral", price: 5000, qty: 7 }
    ],
    'CASH', 'completed'
  ));
  
  dummyData.push(makeTransaction(
    daysAgo(28, 13, 0),
    [
      { id: 1, name: "Nasi cokot", price: 7000, qty: 8 },
      { id: 2, name: "Paket nasi cokot", price: 10000, qty: 5 },
      { id: 4, name: "Teh pucuk", price: 5000, qty: 13 }
    ],
    'QRIS', 'completed'
  ));
  
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
  
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderOrders === 'function') renderOrders();
  if (typeof renderReports === 'function') renderReports();
  updateOrdersBadge();
  
  console.log(`✅ ${dummyData.length} data dummy berhasil ditambahkan!`);
  
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
  
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderOrders === 'function') renderOrders();
  if (typeof renderReports === 'function') renderReports();
  updateOrdersBadge();
  
  console.log('🗑️ Semua data transaksi telah dihapus');
  
  if (typeof showOrderToast === 'function') {
    showOrderToast('Semua data transaksi telah dihapus', 'warning');
  }
}

// Load data saat script dimuat
loadTransactions();
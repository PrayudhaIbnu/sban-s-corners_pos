// ===== REPORTS MODULE (PROFESSIONAL VERSION) =====

let currentReportPeriod = 'week'; // Default 7 hari
let currentOrderTypeFilter = 'all'; 
let customDateFrom = null;
let customDateTo = null;

/**
 * ✅ Helper: Ambil semua orders yang sudah dinormalisasi
 */
function getReportOrders() {
  const orders = StorageBridge.getOrders();
  return orders.map(normalizeOrder);
}

/**
 * Hitung rentang tanggal dengan presisi
 */
function getDateRange(period) {
  const now = new Date();
  // Set waktu ke 00:00:00 untuk perhitungan tanggal yang akurat
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from, to;

  switch (period) {
    case 'today':
      from = new Date(today);
      to = new Date(today);
      to.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      from = new Date(today);
      from.setDate(from.getDate() - 1);
      to = new Date(from);
      to.setHours(23, 59, 59, 999);
      break;
    case 'week':
      from = new Date(today);
      from.setDate(from.getDate() - 6);
      to = new Date(today);
      to.setHours(23, 59, 59, 999);
      break;
    case 'month':
      from = new Date(today);
      from.setDate(from.getDate() - 29);
      to = new Date(today);
      to.setHours(23, 59, 59, 999);
      break;
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(today);
      to.setHours(23, 59, 59, 999);
      break;
    case 'all':
      from = new Date(2000, 0, 1);
      to = new Date(2100, 0, 1);
      break;
    case 'custom':
      from = customDateFrom ? new Date(customDateFrom) : new Date(today);
      to = customDateTo ? new Date(customDateTo) : new Date(today);
      to.setHours(23, 59, 59, 999);
      break;
    default:
      from = new Date(today);
      to = new Date(today);
      to.setHours(23, 59, 59, 999);
  }

  return { from, to };
}

/**
 * ✅ Filter transaksi utama
 */
function getFilteredTransactions() {
  const { from, to } = getDateRange(currentReportPeriod);
  const orders = getReportOrders();
  
  return orders.filter(t => {
    if (t.status === 'cancelled') return false;
    
    // Gunakan createdAt atau date untuk filter
    const tDate = new Date(t.createdAt || t.date);
    
    // Filter by date range
    if (tDate < from || tDate > to) return false;
    
    // Filter by order type
    if (currentOrderTypeFilter !== 'all' && t.orderType !== currentOrderTypeFilter) {
      return false;
    }
    
    return true;
  });
}

function setReportPeriod(period) {
  currentReportPeriod = period;
  
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
  
  const customRange = document.getElementById('customDateRange');
  if (customRange) {
    customRange.classList.toggle('hidden', period !== 'custom');
  }
  
  if (period === 'custom') {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const fromInput = document.getElementById('reportDateFrom');
    const toInput = document.getElementById('reportDateTo');
    
    if (fromInput && !fromInput.value) fromInput.value = weekAgo;
    if (toInput && !toInput.value) toInput.value = today;
    
    customDateFrom = fromInput?.value || weekAgo;
    customDateTo = toInput?.value || today;
  }
  
  updatePeriodDisplay();
  renderReports();
}

function setOrderTypeFilter(type) {
  currentOrderTypeFilter = type;
  
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  
  renderReports();
}

function applyCustomDateRange() {
  const fromInput = document.getElementById('reportDateFrom');
  const toInput = document.getElementById('reportDateTo');
  
  if (!fromInput?.value || !toInput?.value) {
    Modal.warning({ title: 'Tanggal Belum Lengkap', message: 'Silakan pilih tanggal mulai dan selesai', icon: 'calendar' });
    return;
  }
  
  if (new Date(fromInput.value) > new Date(toInput.value)) {
    Modal.error({ title: 'Tanggal Tidak Valid', message: 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai', icon: 'alert-circle' });
    return;
  }
  
  customDateFrom = fromInput.value;
  customDateTo = toInput.value;
  currentReportPeriod = 'custom';
  
  updatePeriodDisplay();
  renderReports();
}

function resetCustomDateRange() {
  const fromInput = document.getElementById('reportDateFrom');
  const toInput = document.getElementById('reportDateTo');
  if (fromInput) fromInput.value = '';
  if (toInput) toInput.value = '';
  customDateFrom = null;
  customDateTo = null;
  setReportPeriod('today');
}

function updatePeriodDisplay() {
  const display = document.getElementById('activePeriodText');
  if (!display) return;
  
  const { from, to } = getDateRange(currentReportPeriod);
  
  const periodLabels = {
    today: 'Menampilkan data hari ini',
    yesterday: 'Menampilkan data kemarin',
    week: 'Menampilkan data 7 hari terakhir',
    month: 'Menampilkan data 30 hari terakhir',
    year: `Menampilkan data tahun ${new Date().getFullYear()}`,
    all: 'Menampilkan semua data',
    custom: `Rentang: ${formatDateShort(from)} - ${formatDateShort(to)}`
  };
  
  display.textContent = periodLabels[currentReportPeriod] || '';
}

function formatDateShort(date) {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/**
 * ✅ RENDER UTAMA
 */
function renderReports() {
  const filtered = getFilteredTransactions();
  console.log('📊 Rendering reports, filtered:', filtered.length);
  
  renderReportStats(filtered);
  renderPaymentBreakdown(filtered);
  renderSalesChart(filtered);
  renderTopProducts(filtered);
  renderReportsTable(filtered);
  
  if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
}

/**
 * ✅ STATS CARDS DENGAN ANIMASI ANGKA
 */
function renderReportStats(filtered) {
  const totalRevenue = filtered.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalTx = filtered.length;
  const avgOrder = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;
  
  // Hitung max transaction value
  const maxTx = filtered.length > 0 ? Math.max(...filtered.map(t => t.total || 0)) : 0;
  
  // Hitung per tipe
  const reservationCount = filtered.filter(t => t.orderType === 'reservation').length;
  const deliveryCount = filtered.filter(t => t.orderType === 'delivery').length;
  
  const trend = calculateTrend();
  
  // Animate numbers
  animateNumber('reportTotalRevenue', totalRevenue, 'Rp');
  animateNumber('reportTotalTx', totalTx);
  animateNumber('reportAvgOrder', avgOrder, 'Rp');
  animateNumber('reportMaxTx', maxTx, 'Rp');
  
  // Update badges
  const elReservation = document.getElementById('reportReservationCount');
  const elDelivery = document.getElementById('reportDeliveryCount');
  if (elReservation) elReservation.textContent = reservationCount;
  if (elDelivery) elDelivery.textContent = deliveryCount;
  
  // Trend indicator
  const elTrend = document.getElementById('revenueTrend');
  if (elTrend) {
    if (trend === null) {
      elTrend.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="minus" class="w-3 h-3"></i>-</span>`;
      elTrend.className = 'text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full';
    } else if (trend > 0) {
      elTrend.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="trending-up" class="w-3 h-3"></i>${trend}%</span>`;
      elTrend.className = 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold';
    } else if (trend < 0) {
      elTrend.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="trending-down" class="w-3 h-3"></i>${Math.abs(trend)}%</span>`;
      elTrend.className = 'text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold';
    } else {
      elTrend.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="minus" class="w-3 h-3"></i>0%</span>`;
      elTrend.className = 'text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full';
    }
  }
  
  if (window.lucide) lucide.createIcons();
}

/**
 * Helper: Animasi counting number
 */
function animateNumber(elementId, targetValue, prefix = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const duration = 600;
  const steps = 20;
  const stepDuration = duration / steps;
  let currentStep = 0;
  
  const interval = setInterval(() => {
    currentStep++;
    const progress = currentStep / steps;
    // Easing function untuk animasi smooth
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.round(targetValue * easeOutQuart);
    
    if (prefix === 'Rp') {
      element.textContent = 'Rp ' + currentValue.toLocaleString('id-ID');
    } else {
      element.textContent = currentValue.toLocaleString('id-ID');
    }
    
    if (currentStep >= steps) clearInterval(interval);
  }, stepDuration);
}

function calculateTrend() {
  const { from, to } = getDateRange(currentReportPeriod);
  const duration = to - from;
  
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  
  const currentRevenue = getFilteredTransactions().reduce((sum, t) => sum + (t.total || 0), 0);
  
  const allOrders = getReportOrders();
  const prevTransactions = allOrders.filter(t => {
    if (t.status === 'cancelled') return false;
    const tDate = new Date(t.createdAt || t.date);
    return tDate >= prevFrom && tDate <= prevTo;
  });
  
  const prevRevenue = prevTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  
  if (prevRevenue === 0) return currentRevenue > 0 ? 100 : null;
  return Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);
}

/**
 * ✅ PAYMENT BREAKDOWN & DONUT CHART YANG RAPIH
 */
function renderPaymentBreakdown(filtered) {
  const container = document.getElementById('paymentBreakdown');
  const chartContainer = document.getElementById('paymentChart');
  
  if (!container || !chartContainer) return;
  
  if (!filtered.length) {
    container.innerHTML = `<div class="text-center py-8"><i data-lucide="credit-card" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i><p class="text-sm text-gray-400">Belum ada data pembayaran</p></div>`;
    chartContainer.innerHTML = '';
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  const paymentStats = {
    QRIS: { count: 0, total: 0, icon: 'qr-code', color: 'blue', hex: '#3B82F6' },
    TRANSFER: { count: 0, total: 0, icon: 'building-2', color: 'purple', hex: '#8B5CF6' }
  };
  
  filtered.forEach(t => {
    const method = t.payment_method || t.paymentMethod || 'QRIS';
    if (paymentStats[method]) {
      paymentStats[method].count++;
      paymentStats[method].total += t.total || 0;
    }
  });
  
  const totalAll = Object.values(paymentStats).reduce((sum, s) => sum + s.total, 0);
  
  // Render list
  container.innerHTML = Object.entries(paymentStats).map(([method, stats]) => {
    if (stats.count === 0) return '';
    const percentage = totalAll > 0 ? Math.round((stats.total / totalAll) * 100) : 0;
    
    return `
      <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
        <div class="w-10 h-10 rounded-xl bg-${stats.color}-50 text-${stats.color}-600 flex items-center justify-center flex-shrink-0">
          <i data-lucide="${stats.icon}" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1.5">
            <p class="font-bold text-sm text-gray-800">${method}</p>
            <p class="text-xs font-medium text-gray-500">${stats.count}x • ${percentage}%</p>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-${stats.color}-400 to-${stats.color}-600 rounded-full transition-all duration-700 ease-out" style="width: ${percentage}%"></div>
          </div>
          <p class="text-xs text-gray-500 mt-1.5 font-medium">Rp ${stats.total.toLocaleString('id-ID')}</p>
        </div>
      </div>
    `;
  }).join('');
  
  if (window.lucide) lucide.createIcons();
  
  // Render donut chart yang presisi
  const qrisPct = totalAll > 0 ? (paymentStats.QRIS.total / totalAll) * 100 : 0;
  const transferPct = totalAll > 0 ? (paymentStats.TRANSFER.total / totalAll) * 100 : 0;
  
  const circumference = 2 * Math.PI * 40; // r=40
  
  chartContainer.innerHTML = `
    <div class="relative w-40 h-40 mx-auto">
      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" stroke-width="12"/>
        
        <!-- QRIS Segment -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" stroke-width="12"
                stroke-dasharray="${(qrisPct / 100) * circumference} ${circumference}"
                stroke-linecap="round"
                class="transition-all duration-1000 ease-out"/>
                
        <!-- Transfer Segment -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" stroke-width="12"
                stroke-dasharray="${(transferPct / 100) * circumference} ${circumference}"
                stroke-dashoffset="${-(qrisPct / 100) * circumference}"
                stroke-linecap="round"
                class="transition-all duration-1000 ease-out"/>
      </svg>
      
      <!-- Center Text -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <p class="text-xs text-gray-500 font-medium">Total Transaksi</p>
        <p class="font-brand font-bold text-forest text-2xl mt-1">${filtered.length}</p>
      </div>
    </div>
  `;
}

/**
 * ✅ SALES CHART YANG PROPORSIONAL & SMOOTH
 */
function renderSalesChart(filtered) {
  const chart = document.getElementById('salesChart');
  const subtitle = document.getElementById('chartSubtitle');
  if (!chart) return;
  
  if (!filtered.length) {
    chart.innerHTML = `<div class="w-full flex items-center justify-center text-gray-400 text-sm py-16"><div class="text-center"><i data-lucide="bar-chart-3" class="w-16 h-16 mx-auto mb-3 opacity-30"></i><p class="font-medium">Belum ada data untuk ditampilkan</p></div></div>`;
    if (subtitle) subtitle.textContent = 'Tidak ada data';
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  const { from, to } = getDateRange(currentReportPeriod);
  const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
  
  // Generate daily buckets
  const dailyData = {};
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dailyData[key] = { total: 0, count: 0, date: d };
  }
  
  // Aggregate data
  filtered.forEach(t => {
    const key = new Date(t.createdAt || t.date).toISOString().split('T')[0];
    if (dailyData[key]) {
      dailyData[key].total += t.total || 0;
      dailyData[key].count++;
    }
  });
  
  const days = Object.values(dailyData);
  const max = Math.max(...days.map(d => d.total), 1);
  const totalRevenue = days.reduce((sum, d) => sum + d.total, 0);
  
  if (subtitle) {
    if (diffDays === 1) subtitle.textContent = `Penjualan hari ini • Total: Rp ${totalRevenue.toLocaleString('id-ID')}`;
    else if (diffDays <= 7) subtitle.textContent = `Penjualan ${diffDays} hari terakhir • Total: Rp ${totalRevenue.toLocaleString('id-ID')}`;
    else subtitle.textContent = `Penjualan ${diffDays} hari • Total: Rp ${totalRevenue.toLocaleString('id-ID')}`;
  }
  
  chart.innerHTML = `
    <div class="flex items-end gap-1.5 h-56 px-2 pt-8 pb-2">
      ${days.map((d, idx) => {
        const height = Math.max(4, (d.total / max) * 100);
        const isToday = d.date.toDateString() === new Date().toDateString();
        const hasData = d.total > 0;
        
        // Label format based on range
        let label = d.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (diffDays <= 7) label = d.date.toLocaleDateString('id-ID', { weekday: 'short' });
        
        const formattedValue = d.total >= 1000000 ? (d.total/1000000).toFixed(1) + 'jt' : d.total >= 1000 ? Math.round(d.total/1000) + 'rb' : d.total;
        
        return `
          <div class="flex-1 flex flex-col justify-end items-center group relative min-w-0 h-full">
            <!-- Tooltip -->
            <div class="hidden group-hover:block absolute bottom-full mb-4 bg-forest text-white text-xs rounded-xl px-4 py-3 whitespace-nowrap z-20 shadow-xl pointer-events-none animate-fade-in border border-white/10">
              <p class="font-bold mb-2 text-sm">${d.date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div class="space-y-1">
                <p class="flex items-center gap-2"><i data-lucide="banknote" class="w-3.5 h-3.5"></i>Rp ${d.total.toLocaleString('id-ID')}</p>
                <p class="flex items-center gap-2 text-white/70"><i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>${d.count} transaksi</p>
              </div>
              <div class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-forest"></div>
            </div>
            
            <!-- Value label above bar -->
            ${hasData ? `<p class="text-[10px] font-bold text-forest mb-2 truncate max-w-full transition-opacity duration-300 group-hover:opacity-0">${formattedValue}</p>` : '<div class="mb-2"></div>'}
            
            <!-- Bar -->
            <div class="w-full rounded-t-lg transition-all duration-700 ease-out relative overflow-hidden ${isToday ? 'bg-gradient-to-t from-terra via-terraLight to-terra shadow-lg shadow-terra/20' : hasData ? 'bg-gradient-to-t from-forest/90 via-forestLight/90 to-forestLight shadow-sm' : 'bg-gray-100'}" style="height: ${height}%;">
              ${hasData && !isToday ? `<div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>` : ''}
            </div>
            
            <!-- X-axis label -->
            <span class="text-[10px] mt-3 font-medium text-center ${isToday ? 'text-terra font-bold' : 'text-gray-500'} truncate max-w-full leading-tight">
              ${diffDays > 14 && !isToday ? '' : (isToday ? 'Hari Ini' : label)}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  if (window.lucide) lucide.createIcons();
}

/**
 * ✅ TOP PRODUCTS DENGAN VISUAL MENARIK
 */
function renderTopProducts(filtered) {
  const container = document.getElementById('topProducts');
  if (!container) return;
  
  if (!filtered.length) {
    container.innerHTML = `<div class="text-center py-8"><i data-lucide="package" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i><p class="text-sm text-gray-400">Belum ada data produk</p></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  const itemCount = {};
  const itemRevenue = {};
  
  filtered.forEach(t => {
    if (Array.isArray(t.items)) {
      t.items.forEach(item => {
        itemCount[item.name] = (itemCount[item.name] || 0) + item.qty;
        itemRevenue[item.name] = (itemRevenue[item.name] || 0) + (item.price * item.qty);
      });
    }
  });
  
  const items = Object.entries(itemCount)
    .map(([name, qty]) => ({ name, qty, revenue: itemRevenue[name] || 0 }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  
  const maxQty = items[0]?.qty || 1;
  const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0);
  
  const medals = ['🥇', '🥈', '🥉'];
  const bgColors = [
    'from-yellow-400 to-orange-500',
    'from-gray-300 to-gray-400',
    'from-orange-400 to-orange-600',
    'from-gray-200 to-gray-300',
    'from-gray-200 to-gray-300'
  ];
  
  container.innerHTML = items.map((item, index) => {
    const menuItem = typeof getMenuItemById === 'function' ? menuItems.find(m => m.name === item.name) : null;
    const image = menuItem?.images || menuItem?.image || '';
    const percentage = Math.round((item.qty / maxQty) * 100);
    
    return `
      <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-cream/50 transition group border border-transparent hover:border-gray-100">
        <!-- Rank Badge -->
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${bgColors[index]} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
          ${index < 3 ? medals[index] : index + 1}
        </div>
        
        <!-- Product Image -->
        <div class="w-12 h-12 rounded-xl bg-cream flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
          ${image ? `<img src="${image}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="hidden w-full h-full items-center justify-center text-2xl">🍽️</div>` : `<span class="text-2xl">🍽️</span>`}
        </div>
        
        <!-- Info & Progress -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1.5">
            <p class="font-bold text-sm text-gray-800 truncate pr-2">${item.name}</p>
            <span class="text-xs font-bold text-forest ml-2 bg-forest/10 px-2.5 py-1 rounded-full">${item.qty}x</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
            <div class="h-full bg-gradient-to-r from-forest via-forestLight to-forestLight rounded-full transition-all duration-700 ease-out" style="width: ${percentage}%"></div>
          </div>
          <div class="flex items-center justify-between">
            <p class="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Revenue</p>
            <p class="text-xs font-bold text-forest">Rp ${item.revenue.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Footer Total
  container.innerHTML += `
    <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm bg-gray-50/50 p-3 rounded-xl">
      <span class="text-gray-600 font-medium">Total Revenue (Top 5 Produk)</span>
      <span class="font-bold text-forest text-base">Rp ${totalRevenue.toLocaleString('id-ID')}</span>
    </div>
  `;
}

/**
 * ✅ REPORTS TABLE YANG RAPIH
 */
function renderReportsTable(filtered) {
  const reportsTable = document.getElementById('reportsTable');
  const txCount = document.getElementById('txCount');
  
  if (txCount) {
    const totalRevenue = filtered.reduce((sum, t) => sum + (t.total || 0), 0);
    txCount.innerHTML = `<span class="font-medium text-gray-700">${filtered.length} transaksi</span><span class="text-gray-300 mx-2">•</span><span class="font-bold text-forest">Rp ${totalRevenue.toLocaleString('id-ID')}</span>`;
  }
  
  if (!reportsTable) return;
  
  if (!filtered.length) {
    reportsTable.innerHTML = `<tr><td colspan="6" class="px-4 py-16 text-center"><div class="flex flex-col items-center"><div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3"><i data-lucide="file-x" class="w-8 h-8 text-gray-400"></i></div><p class="text-gray-500 font-medium">Tidak ada transaksi</p><p class="text-xs text-gray-400 mt-1">Tidak ada data pada periode ini</p></div></td></tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  reportsTable.innerHTML = [...filtered].reverse().map(t => {
    const itemCount = Array.isArray(t.items) ? t.items.reduce((sum, i) => sum + i.qty, 0) : 0;
    const paymentIcon = t.payment_method === 'QRIS' ? 'qr-code' : t.payment_method === 'TRANSFER' ? 'building-2' : 'banknote';
    const paymentColor = t.payment_method === 'QRIS' ? 'blue' : t.payment_method === 'TRANSFER' ? 'purple' : 'green';
    const statusMeta = STATUS_META[t.status] || STATUS_META.completed;
    
    const orderTypeBadge = t.orderType === 'delivery' 
      ? `<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-terra/10 text-terra font-semibold border border-terra/20"><i data-lucide="truck" class="w-3 h-3"></i>Delivery</span>`
      : `<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-forest/10 text-forest font-semibold border border-forest/20"><i data-lucide="calendar" class="w-3 h-3"></i>Reservasi</span>`;
    
    return `
      <tr class="border-t border-gray-100 hover:bg-cream/40 transition cursor-pointer group" onclick="openOrderDetail('${t.order_id}')">
        <td class="px-4 py-3.5">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs font-bold text-forest group-hover:text-forestLight transition">${t.order_id}</span>
            ${orderTypeBadge}
          </div>
        </td>
        <td class="px-4 py-3.5">
          <div class="text-sm text-gray-700 font-medium">${new Date(t.createdAt || t.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </td>
        <td class="px-4 py-3.5">
          <span class="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2.5 py-1 rounded-full font-medium text-gray-700"><i data-lucide="shopping-bag" class="w-3 h-3"></i>${itemCount} item${itemCount > 1 ? 's' : ''}</span>
        </td>
        <td class="px-4 py-3.5">
          <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-${paymentColor}-50 text-${paymentColor}-700 border border-${paymentColor}-100 font-medium"><i data-lucide="${paymentIcon}" class="w-3 h-3"></i>${t.payment_method || 'QRIS'}</span>
        </td>
        <td class="px-4 py-3.5">
          <span class="status-badge status-${statusMeta.color} px-2.5 py-1 text-[11px] inline-flex items-center gap-1.5 font-medium"><i data-lucide="${statusMeta.icon}" class="w-3 h-3"></i>${statusMeta.label}</span>
        </td>
        <td class="px-4 py-3.5 text-right">
          <span class="font-bold text-terra group-hover:text-terraLight transition text-sm">Rp ${(t.total || 0).toLocaleString('id-ID')}</span>
        </td>
      </tr>
    `;
  }).join('');
  
  if (window.lucide) lucide.createIcons();
}

function exportReportCSV() {
  const filtered = getFilteredTransactions();
  if (!filtered.length) {
    Modal.warning({ title: 'Tidak Ada Data', message: 'Tidak ada data untuk di-export', icon: 'file-x' });
    return;
  }
  
  const headers = ['Order ID', 'Tanggal', 'Tipe', 'Customer', 'Items', 'Total', 'Pembayaran', 'Status'];
  const rows = filtered.map(t => {
    const itemCount = Array.isArray(t.items) ? t.items.reduce((sum, i) => sum + i.qty, 0) : 0;
    return [
      t.order_id,
      new Date(t.createdAt || t.date).toLocaleString('id-ID'),
      t.orderType || 'reservation',
      t.customerName || '-',
      itemCount,
      t.total || 0,
      t.payment_method || 'QRIS',
      t.status || 'completed'
    ];
  });
  
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const { from, to } = getDateRange(currentReportPeriod);
  a.download = `laporan-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  Modal.success({ title: 'Export Berhasil', message: `${filtered.length} transaksi berhasil di-export ke CSV`, icon: 'check-circle' });
}
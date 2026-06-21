// ===== REPORTS MODULE =====

let currentReportPeriod = 'today';
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
 * Hitung rentang tanggal
 */
function getDateRange(period) {
  const now = new Date();
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
 * ✅ Filter transaksi - PAKAI getReportOrders
 */
function getFilteredTransactions() {
  const { from, to } = getDateRange(currentReportPeriod);
  const orders = getReportOrders();
  
  return orders.filter(t => {
    if (t.status === 'cancelled') return false;
    const tDate = new Date(t.date);
    return tDate >= from && tDate <= to;
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

function applyCustomDateRange() {
  const fromInput = document.getElementById('reportDateFrom');
  const toInput = document.getElementById('reportDateTo');
  
  if (!fromInput?.value || !toInput?.value) {
    alert('Silakan pilih tanggal mulai dan selesai');
    return;
  }
  
  if (new Date(fromInput.value) > new Date(toInput.value)) {
    alert('Tanggal mulai tidak boleh lebih besar dari tanggal selesai');
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
 * ✅ Render reports - PAKAI getFilteredTransactions
 */
function renderReports() {
  const filtered = getFilteredTransactions();
  
  console.log('📊 Rendering reports, filtered:', filtered.length);
  
  renderReportStats(filtered);
  renderPaymentBreakdown(filtered);
  renderSalesChart(filtered);
  renderTopProducts(filtered);
  renderReportsTable(filtered);
  
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

function renderReportStats(filtered) {
  const totalRevenue = filtered.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalTx = filtered.length;
  const avgOrder = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;
  const maxTx = filtered.length > 0 
    ? Math.max(...filtered.map(t => t.total || 0)) 
    : 0;
  
  const trend = calculateTrend();
  
  const elRevenue = document.getElementById('reportTotalRevenue');
  const elTx = document.getElementById('reportTotalTx');
  const elAvg = document.getElementById('reportAvgOrder');
  const elMax = document.getElementById('reportMaxTx');
  const elTrend = document.getElementById('revenueTrend');
  
  if (elRevenue) elRevenue.textContent = 'Rp ' + totalRevenue.toLocaleString('id-ID');
  if (elTx) elTx.textContent = totalTx;
  if (elAvg) elAvg.textContent = 'Rp ' + avgOrder.toLocaleString('id-ID');
  if (elMax) elMax.textContent = 'Rp ' + maxTx.toLocaleString('id-ID');
  
  if (elTrend) {
    if (trend === null) {
      elTrend.textContent = '-';
    } else if (trend > 0) {
      elTrend.innerHTML = `<span class="flex items-center gap-0.5">↑ ${trend}%</span>`;
      elTrend.className = 'text-xs bg-green-400/30 text-white px-2 py-0.5 rounded-full';
    } else if (trend < 0) {
      elTrend.innerHTML = `<span class="flex items-center gap-0.5">↓ ${Math.abs(trend)}%</span>`;
      elTrend.className = 'text-xs bg-red-400/30 text-white px-2 py-0.5 rounded-full';
    } else {
      elTrend.textContent = '→ 0%';
    }
  }
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
    const tDate = new Date(t.date);
    return tDate >= prevFrom && tDate <= prevTo;
  });
  
  const prevRevenue = prevTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  
  if (prevRevenue === 0) {
    return currentRevenue > 0 ? 100 : null;
  }
  
  return Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);
}

function renderPaymentBreakdown(filtered) {
  const container = document.getElementById('paymentBreakdown');
  const chartContainer = document.getElementById('paymentChart');
  
  if (!container || !chartContainer) return;
  
  if (!filtered.length) {
    container.innerHTML = `<div class="text-center py-6"><p class="text-sm text-gray-400">Belum ada data</p></div>`;
    chartContainer.innerHTML = `<p class="text-sm text-gray-400">-</p>`;
    return;
  }
  
  const paymentStats = {
    CASH: { count: 0, total: 0, icon: 'banknote', color: 'green' },
    QRIS: { count: 0, total: 0, icon: 'qr-code', color: 'blue' },
    TRANSFER: { count: 0, total: 0, icon: 'building-2', color: 'purple' }
  };
  
  filtered.forEach(t => {
    const method = t.payment_method || 'CASH';
    if (paymentStats[method]) {
      paymentStats[method].count++;
      paymentStats[method].total += t.total || 0;
    }
  });
  
  const totalAll = Object.values(paymentStats).reduce((sum, s) => sum + s.total, 0);
  
  container.innerHTML = Object.entries(paymentStats).map(([method, stats]) => {
    if (stats.count === 0) return '';
    const percentage = totalAll > 0 ? Math.round((stats.total / totalAll) * 100) : 0;
    
    return `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-${stats.color}-50 text-${stats.color}-600 flex items-center justify-center flex-shrink-0">
          <i data-lucide="${stats.icon}" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <p class="font-semibold text-sm">${method}</p>
            <p class="text-xs text-gray-500">${stats.count}x • ${percentage}%</p>
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-${stats.color}-500 rounded-full transition-all duration-500" 
                 style="width: ${percentage}%"></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">Rp ${stats.total.toLocaleString('id-ID')}</p>
        </div>
      </div>
    `;
  }).join('');
  
  if (window.lucide) lucide.createIcons();
  
  const cashPct = totalAll > 0 ? (paymentStats.CASH.total / totalAll) * 100 : 0;
  const qrisPct = totalAll > 0 ? (paymentStats.QRIS.total / totalAll) * 100 : 0;
  
  chartContainer.innerHTML = `
    <div class="relative w-32 h-32">
      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" stroke-width="12"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" stroke-width="12"
                stroke-dasharray="${cashPct * 2.51} ${251 - cashPct * 2.51}"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" stroke-width="12"
                stroke-dasharray="${qrisPct * 2.51} ${251 - qrisPct * 2.51}"
                stroke-dashoffset="${-cashPct * 2.51}"/>
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <p class="text-xs text-gray-500">Total</p>
        <p class="font-brand font-bold text-forest text-sm">${filtered.length}</p>
        <p class="text-[10px] text-gray-400">transaksi</p>
      </div>
    </div>
  `;
}

function renderSalesChart(filtered) {
  const chart = document.getElementById('salesChart');
  const subtitle = document.getElementById('chartSubtitle');
  if (!chart) return;
  
  if (!filtered.length) {
    chart.innerHTML = `
      <div class="w-full flex items-center justify-center text-gray-400 text-sm">
        <div class="text-center">
          <i data-lucide="bar-chart" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
          <p>Belum ada data untuk ditampilkan</p>
        </div>
      </div>
    `;
    if (subtitle) subtitle.textContent = 'Tidak ada data';
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  const { from, to } = getDateRange(currentReportPeriod);
  const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
  
  const dailyData = {};
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dailyData[key] = { total: 0, count: 0, date: d };
  }
  
  filtered.forEach(t => {
    const key = new Date(t.date).toISOString().split('T')[0];
    if (dailyData[key]) {
      dailyData[key].total += t.total || 0;
      dailyData[key].count++;
    }
  });
  
  const days = Object.values(dailyData);
  const max = Math.max(...days.map(d => d.total), 1);
  
  if (subtitle) {
    if (diffDays === 1) subtitle.textContent = `Penjualan hari ini`;
    else if (diffDays <= 7) subtitle.textContent = `Penjualan ${diffDays} hari terakhir`;
    else subtitle.textContent = `Penjualan ${diffDays} hari`;
  }
  
  chart.innerHTML = days.map((d) => {
    const height = Math.max(4, (d.total / max) * 100);
    const isToday = d.date.toDateString() === new Date().toDateString();
    const hasData = d.total > 0;
    const label = diffDays <= 7 
      ? d.date.toLocaleDateString('id-ID', { weekday: 'short' })
      : d.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    
    return `
      <div class="flex-1 flex flex-col justify-end items-center group relative min-w-0">
        <div class="hidden group-hover:block absolute bottom-full mb-2 bg-forest text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg pointer-events-none">
          <p class="font-semibold">${d.date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p>Rp ${d.total.toLocaleString('id-ID')}</p>
          <p class="text-white/70">${d.count} transaksi</p>
        </div>
        
        ${hasData ? `
          <p class="text-[9px] font-semibold text-forest mb-1 truncate max-w-full">
            ${d.total >= 1000000 ? (d.total/1000000).toFixed(1) + 'jt' : 
              d.total >= 1000 ? Math.round(d.total/1000) + 'rb' : d.total}
          </p>
        ` : ''}
        
        <div class="w-full rounded-t-md transition-all duration-500 ${
          isToday ? 'bg-gradient-to-t from-terra to-terraLight' : 
          hasData ? 'bg-gradient-to-t from-forest/70 to-forestLight/70' : 'bg-gray-100'
        }" style="height: ${height}%"></div>
        
        <span class="text-[10px] mt-1.5 font-medium text-center ${
          isToday ? 'text-terra font-bold' : 'text-gray-500'
        } truncate max-w-full">
          ${diffDays > 14 && !isToday ? '' : (isToday ? 'Now' : label)}
        </span>
      </div>
    `;
  }).join('');
}

function renderTopProducts(filtered) {
  const container = document.getElementById('topProducts');
  if (!container) return;
  
  if (!filtered.length) {
    container.innerHTML = `
      <div class="text-center py-8">
        <i data-lucide="package" class="w-10 h-10 mx-auto mb-2 text-gray-300"></i>
        <p class="text-sm text-gray-400">Belum ada data produk</p>
      </div>
    `;
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
  
  container.innerHTML = items.map((item, index) => {
    const menuItem = typeof getMenuItemById === 'function' 
      ? menuItems.find(m => m.name === item.name) 
      : null;
    const emoji = menuItem?.emoji || '🍽️';
    const image = menuItem?.images || menuItem?.image || '';
    const percentage = Math.round((item.qty / maxQty) * 100);
    
    const medals = ['🥇', '🥈', '🥉'];
    
    return `
      <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-cream/50 transition">
        <div class="w-8 h-8 rounded-lg ${
          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
          'bg-gray-100 text-gray-600'
        } flex items-center justify-center font-bold text-sm flex-shrink-0">
          ${index < 3 ? medals[index] : index + 1}
        </div>
        
        <div class="w-11 h-11 rounded-lg bg-cream flex-shrink-0 overflow-hidden flex items-center justify-center">
          ${image ? `
            <img src="${image}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="hidden w-full h-full items-center justify-center text-xl">${emoji}</div>
          ` : `<span class="text-xl">${emoji}</span>`}
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <p class="font-semibold text-sm truncate">${item.name}</p>
            <span class="text-xs font-bold text-forest ml-2">${item.qty}x</span>
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-forest to-forestLight rounded-full transition-all duration-500" 
                 style="width: ${percentage}%"></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">Rp ${item.revenue.toLocaleString('id-ID')}</p>
        </div>
      </div>
    `;
  }).join('');
}

function renderReportsTable(filtered) {
  const reportsTable = document.getElementById('reportsTable');
  const txCount = document.getElementById('txCount');
  
  if (txCount) txCount.textContent = `${filtered.length} transaksi`;
  
  if (!reportsTable) return;
  
  if (!filtered.length) {
    reportsTable.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-12 text-center">
          <div class="flex flex-col items-center">
            <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <i data-lucide="file-x" class="w-6 h-6 text-gray-400"></i>
            </div>
            <p class="text-gray-500 font-medium">Tidak ada transaksi</p>
            <p class="text-xs text-gray-400 mt-1">Tidak ada data pada periode ini</p>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  reportsTable.innerHTML = [...filtered].reverse().map(t => {
    const itemCount = Array.isArray(t.items) 
      ? t.items.reduce((sum, i) => sum + i.qty, 0) 
      : 0;
    const paymentIcon = t.payment_method === 'QRIS' ? 'qr-code' : 
                       t.payment_method === 'TRANSFER' ? 'building-2' : 'banknote';
    const paymentColor = t.payment_method === 'QRIS' ? 'blue' : 
                        t.payment_method === 'TRANSFER' ? 'purple' : 'green';
    const statusMeta = STATUS_META[t.status] || STATUS_META.completed;
    
    // Badge tipe order
    const orderTypeBadge = t.orderType === 'delivery' 
      ? `<span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-terra/10 text-terra">
           <i data-lucide="truck" class="w-3 h-3"></i>Delivery
         </span>`
      : `<span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-forest/10 text-forest">
           <i data-lucide="calendar" class="w-3 h-3"></i>Reservasi
         </span>`;
    
    return `
      <tr class="border-t border-gray-100 hover:bg-cream/30 transition cursor-pointer" 
          onclick="openOrderDetail('${t.order_id}')">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-semibold text-forest">${t.order_id}</span>
            ${orderTypeBadge}
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm">${new Date(t.date).toLocaleString('id-ID')}</div>
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
            <i data-lucide="shopping-bag" class="w-3 h-3"></i>
            ${itemCount} item${itemCount > 1 ? 's' : ''}
          </span>
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-${paymentColor}-50 text-${paymentColor}-700 border border-${paymentColor}-100">
            <i data-lucide="${paymentIcon}" class="w-3 h-3"></i>
            ${t.payment_method}
          </span>
        </td>
        <td class="px-4 py-3">
          <span class="status-badge status-${statusMeta.color} px-2 py-0.5 text-[11px] inline-flex items-center gap-1">
            <i data-lucide="${statusMeta.icon}" class="w-3 h-3"></i>
            ${statusMeta.label}
          </span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="font-bold text-terra">Rp ${(t.total || 0).toLocaleString('id-ID')}</span>
        </td>
      </tr>
    `;
  }).join('');
  
  if (window.lucide) lucide.createIcons();
}

function exportReportCSV() {
  const filtered = getFilteredTransactions();
  
  if (!filtered.length) {
    alert('Tidak ada data untuk di-export');
    return;
  }
  
  const headers = ['Order ID', 'Tanggal', 'Tipe', 'Items', 'Total', 'Pembayaran', 'Status'];
  const rows = filtered.map(t => {
    const itemCount = Array.isArray(t.items) 
      ? t.items.reduce((sum, i) => sum + i.qty, 0) 
      : 0;
    return [
      t.order_id,
      new Date(t.date).toLocaleString('id-ID'),
      t.orderType || 'reservation',
      itemCount,
      t.total || 0,
      t.payment_method || 'CASH',
      t.status || 'completed'
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const { from, to } = getDateRange(currentReportPeriod);
  const filename = `laporan-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv`;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  if (typeof showOrderToast === 'function') {
    showOrderToast(`Laporan berhasil di-export (${filtered.length} transaksi)`, 'success');
  }
}
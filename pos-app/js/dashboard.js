// ===== DASHBOARD =====

function renderDashboard() {
  console.log("📊 Dashboard render, Transactions:", transactions.length);

  // Update tanggal di header
  const dashDate = document.getElementById("dashDate");
  if (dashDate) {
    dashDate.textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Hitung statistik
  const stats = getDashboardStats();

  // Update stats cards
  const dashSales = document.getElementById("dashSales");
  const dashOrders = document.getElementById("dashOrders");
  const dashAvg = document.getElementById("dashAvg");
  const dashTop = document.getElementById("dashTop");

  if (dashSales)
    dashSales.textContent = "Rp " + stats.todaySales.toLocaleString("id-ID");
  if (dashOrders) dashOrders.textContent = stats.todayOrders;
  if (dashAvg)
    dashAvg.textContent = "Rp " + stats.avgOrder.toLocaleString("id-ID");
  if (dashTop) dashTop.textContent = stats.topItem;

  // Render charts & lists
  renderWeeklyChart();
  renderPopularItems();
  renderRecentTransactions();

  // Re-init icons
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

/**
 * Render daftar item populer
 */
function renderPopularItems() {
  const container = document.getElementById("popularItems");
  if (!container) return;

  // Hitung qty per item
  const itemCount = {};
  transactions.forEach((t) => {
    if (Array.isArray(t.items)) {
      t.items.forEach((item) => {
        itemCount[item.name] = (itemCount[item.name] || 0) + item.qty;
      });
    }
  });

  const items = Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!items.length) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-2">
          <i data-lucide="package" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-sm text-gray-400">Belum ada data penjualan</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const maxQty = items[0][1];

  container.innerHTML = items
    .map((item, index) => {
      const percentage = Math.round((item[1] / maxQty) * 100);
      const menuItem =
        typeof getMenuItemById === "function"
          ? menuItems.find((m) => m.name === item[0])
          : null;
      return `
      <div class="flex items-center gap-3 py-2.5 group">
        <!-- Rank -->
        <div class="w-6 h-6 rounded-full ${index === 0 ? "bg-terra text-white" : "bg-gray-100 text-gray-500"} flex items-center justify-center text-xs font-bold flex-shrink-0">
          ${index + 1}
        </div>
        
        <!-- images -->
        <div class="w-9 h-9 rounded-lg bg-cream flex items-center justify-center text-lg flex-shrink-0">
          <i data-lucide="utensils" class="text-gray-400"></i>
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <p class="font-medium text-sm text-gray-800 truncate">${item[0]}</p>
            <span class="text-xs font-bold text-forest ml-2">${item[1]}x</span>
          </div>
          <!-- Progress bar -->
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-forest to-forestLight rounded-full transition-all duration-500" 
                 style="width: ${percentage}%"></div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * Render daftar transaksi terbaru
 */
function renderRecentTransactions() {
  const container = document.getElementById("recentTransactions");
  if (!container) return;

  const recent = [...transactions].reverse().slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-2">
          <i data-lucide="receipt" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-sm text-gray-400">Belum ada transaksi</p>
        <p class="text-xs text-gray-400 mt-1">Transaksi akan muncul di sini</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="pb-2 font-medium">Order ID</th>
            <th class="pb-2 font-medium">Time</th>
            <th class="pb-2 font-medium">Items</th>
            <th class="pb-2 font-medium">Payment</th>
            <th class="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          ${recent
            .map((t) => {
              const itemCount = Array.isArray(t.items)
                ? t.items.reduce((sum, i) => sum + i.qty, 0)
                : 0;
              const time = new Date(t.date).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return `
              <tr class="border-b border-gray-50 hover:bg-cream/30 transition">
                <td class="py-3">
                  <span class="font-mono font-semibold text-forest text-xs">${t.order_id}</span>
                </td>
                <td class="py-3 text-gray-500 text-xs">${time}</td>
                <td class="py-3">
                  <span class="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    <i data-lucide="shopping-bag" class="w-3 h-3"></i>
                    ${itemCount} item${itemCount > 1 ? "s" : ""}
                  </span>
                </td>
                <td class="py-3">
                  <span class="inline-flex items-center gap-1 text-xs">
                    <span class="text-gray-600">${t.payment_method || "CASH"}</span>
                  </span>
                </td>
                <td class="py-3 text-right">
                  <span class="font-bold text-terra">Rp ${(t.total || 0).toLocaleString("id-ID")}</span>
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/**
 * Render grafik penjualan mingguan
 */
function renderWeeklyChart() {
  const chart = document.getElementById("weeklyChart");
  if (!chart) return;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysFull = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const weekly = Array(7).fill(0);
  const weeklyCount = Array(7).fill(0);

  // Hitung penjualan per hari (7 hari terakhir)
  const now = new Date();
  transactions.forEach((t) => {
    const tDate = new Date(t.date);
    const diffDays = Math.floor((now - tDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      const day = tDate.getDay();
      weekly[day] += t.total || 0;
      weeklyCount[day]++;
    }
  });

  const max = Math.max(...weekly, 1);
  const today = now.getDay();

  chart.innerHTML = weekly
    .map((value, index) => {
      const height = Math.max(8, (value / max) * 100);
      const isToday = index === today;
      const hasData = value > 0;

      return `
      <div class="flex-1 flex flex-col justify-end items-center group relative">
        <!-- Tooltip -->
        <div class="hidden group-hover:block absolute bottom-full mb-2 bg-forest text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
          <p class="font-semibold">${daysFull[index]}</p>
          <p>Rp ${value.toLocaleString("id-ID")}</p>
          <p class="text-white/70">${weeklyCount[index]} orders</p>
          <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-forest"></div>
        </div>
        
        <!-- Value label -->
        ${
          hasData
            ? `
          <p class="text-[10px] font-semibold text-forest mb-1">
            ${
              value >= 1000000
                ? (value / 1000000).toFixed(1) + "jt"
                : value >= 1000
                  ? Math.round(value / 1000) + "rb"
                  : value
            }
          </p>
        `
            : ""
        }
        
        <!-- Bar -->
        <div class="w-full rounded-t-lg transition-all duration-500 ${
          isToday
            ? "bg-gradient-to-t from-terra to-terraLight"
            : hasData
              ? "bg-gradient-to-t from-forest/70 to-forestLight/70"
              : "bg-gray-100"
        }" style="height: ${height}%"></div>
        
        <!-- Day label -->
        <span class="text-xs mt-2 font-medium ${
          isToday ? "text-terra font-bold" : "text-gray-500"
        }">
          ${isToday ? "Today" : days[index]}
        </span>
      </div>
    `;
    })
    .join("");
}

// ===== ORDERS MODULE =====

let currentOrderFilter = {
  search: "",
  status: "all",
  payment: "all",
  date: "all",
};

/**
 * Helper: Render Lucide icon dengan ukuran & class custom
 */
function icon(name, className = "w-4 h-4") {
  return `<i data-lucide="${name}" class="${className}"></i>`;
}

/**
 * Helper: Render status badge dengan Lucide icon
 */
function renderStatusBadge(status, size = "sm") {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const sizeClass =
    size === "lg" ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[11px]";
  const iconSize = size === "lg" ? "w-3.5 h-3.5" : "w-3 h-3";

  return `
    <span class="status-badge status-${meta.color} ${sizeClass} inline-flex items-center gap-1">
      ${icon(meta.icon, iconSize)}
      <span>${meta.label}</span>
    </span>
  `;
}

/**
 * Helper: Render payment badge dengan Lucide icon
 */
function renderPaymentBadge(method) {
  const meta = PAYMENT_META[method] || PAYMENT_META.CASH;
  return `
    <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${meta.color}-50 text-${meta.color}-700 border border-${meta.color}-100">
      ${icon(meta.icon, "w-3 h-3")}
      <span>${meta.label}</span>
    </span>
  `;
}

/**
 * Render halaman orders
 */
function renderOrders() {
  console.log("📋 Rendering orders, total:", transactions.length);

  updateOrdersStats();
  updateOrdersBadge();
  renderOrdersList();

  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

/**
 * Update statistik di header - dengan Lucide icons
 */
function updateOrdersStats() {
  const today = new Date().toDateString();
  const todayOrders = transactions.filter(
    (t) => new Date(t.date).toDateString() === today,
  );
  const activeOrders = todayOrders.filter(
    (t) =>
      t.status !== ORDER_STATUS.CANCELLED &&
      t.status !== ORDER_STATUS.COMPLETED,
  );
  const completedOrders = todayOrders.filter(
    (t) => t.status === ORDER_STATUS.COMPLETED,
  );
  const revenue = completedOrders.reduce((sum, t) => sum + (t.total || 0), 0);

  const elTotal = document.getElementById("ordersTotalCount");
  const elPending = document.getElementById("ordersPendingCount");
  const elCompleted = document.getElementById("ordersCompletedCount");
  const elRevenue = document.getElementById("ordersRevenue");

  if (elTotal) elTotal.textContent = todayOrders.length;
  if (elPending) elPending.textContent = activeOrders.length;
  if (elCompleted) elCompleted.textContent = completedOrders.length;
  if (elRevenue)
    elRevenue.textContent = "Rp " + revenue.toLocaleString("id-ID");
}

/**
 * Filter orders berdasarkan kriteria
 */
function filterOrders() {
  currentOrderFilter = {
    search: (document.getElementById("orderSearch")?.value || "").toLowerCase(),
    status: document.getElementById("orderStatusFilter")?.value || "all",
    payment: document.getElementById("orderPaymentFilter")?.value || "all",
    date: document.getElementById("orderDateFilter")?.value || "all",
  };
  renderOrdersList();
}

/**
 * Render list orders dengan filter
 */
function renderOrdersList() {
  const container = document.getElementById("ordersList");
  if (!container) return;

  let filtered = [...transactions].reverse();

  // Apply filters
  if (currentOrderFilter.search) {
    filtered = filtered.filter((t) =>
      t.order_id.toLowerCase().includes(currentOrderFilter.search),
    );
  }

  if (currentOrderFilter.status !== "all") {
    filtered = filtered.filter((t) => t.status === currentOrderFilter.status);
  }

  if (currentOrderFilter.payment !== "all") {
    filtered = filtered.filter(
      (t) => t.payment_method === currentOrderFilter.payment,
    );
  }

  if (currentOrderFilter.date !== "all") {
    const now = new Date();
    filtered = filtered.filter((t) => {
      const tDate = new Date(t.date);
      const diffDays = Math.floor((now - tDate) / (1000 * 60 * 60 * 24));

      if (currentOrderFilter.date === "today") return diffDays < 1;
      if (currentOrderFilter.date === "week") return diffDays < 7;
      if (currentOrderFilter.date === "month") return diffDays < 30;
      return true;
    });
  }

  // Empty state - full Lucide icons
  if (!filtered.length) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cream to-[#F9F6F2] flex items-center justify-center mb-4 border border-[#EFE7DE]">
          ${icon("package-open", "w-9 h-9 text-forest/40")}
        </div>
        <h3 class="font-brand text-lg font-bold text-forest mb-1">Tidak ada pesanan</h3>
        <p class="text-sm text-gray-500">
          ${
            currentOrderFilter.search || currentOrderFilter.status !== "all"
              ? "Coba ubah filter untuk melihat pesanan lain"
              : "Pesanan baru akan muncul di sini"
          }
        </p>
        ${
          currentOrderFilter.search || currentOrderFilter.status !== "all"
            ? `
          <button onclick="resetOrderFilters()" class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg text-sm font-medium hover:bg-forestLight transition">
            ${icon("rotate-ccw", "w-3.5 h-3.5")}
            Reset Filter
          </button>
        `
            : ""
        }
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Render cards
  container.innerHTML = filtered
    .map((order) => renderOrderCard(order))
    .join("");

  if (window.lucide) lucide.createIcons();
}

/**
 * Reset semua filter
 */
function resetOrderFilters() {
  const search = document.getElementById("orderSearch");
  const status = document.getElementById("orderStatusFilter");
  const payment = document.getElementById("orderPaymentFilter");
  const date = document.getElementById("orderDateFilter");

  if (search) search.value = "";
  if (status) status.value = "all";
  if (payment) payment.value = "all";
  if (date) date.value = "all";

  filterOrders();
}

/**
 * Render satu card order - full Lucide icons
 */
function renderOrderCard(order) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum, i) => sum + i.qty, 0)
    : 0;
  const time = new Date(order.date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(order.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  // Ambil 3 item pertama untuk preview
  const previewItems = Array.isArray(order.items)
    ? order.items.slice(0, 3)
    : [];

  return `
    <div class="order-card bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-forest/20 transition overflow-hidden cursor-pointer group" 
         onclick="openOrderDetail('${order.order_id}')">
      <div class="p-4">
        <div class="flex items-start justify-between gap-3 mb-3">
          <!-- Order Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="font-mono font-bold text-forest text-sm">${order.order_id}</span>
              ${renderStatusBadge(order.status)}
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span class="flex items-center gap-1">
                ${icon("calendar", "w-3 h-3")}
                ${date}
              </span>
              <span class="flex items-center gap-1">
                ${icon("clock", "w-3 h-3")}
                ${time}
              </span>
              ${renderPaymentBadge(order.payment_method)}
            </div>
          </div>
          
          <!-- Total -->
          <div class="text-right flex-shrink-0">
            <p class="font-brand text-lg font-bold text-terra">Rp ${(order.total || 0).toLocaleString("id-ID")}</p>
            <p class="text-[10px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
              ${icon("shopping-bag", "w-3 h-3")}
              ${itemCount} item${itemCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        
        <!-- Items Preview -->
        <div class="flex items-center gap-2 pt-3 border-t border-dashed border-gray-100">
          <div class="flex -space-x-2">
            ${previewItems
              .map((item) => {
                const menuItem =
                  typeof getMenuItemById === "function"
                    ? getMenuItemById(item.id)
                    : null;
              })
              .join("")}
            ${
              itemCount > 3
                ? `
              <div class="w-8 h-8 rounded-full bg-forest/10 border-2 border-white flex items-center justify-center text-xs font-bold text-forest">
                +${itemCount - 3}
              </div>
            `
                : ""
            }
          </div>
          <p class="text-xs text-gray-500 truncate flex-1">
            ${previewItems.map((i) => i.name).join(", ")}${itemCount > 3 ? "..." : ""}
          </p>
          <div class="w-7 h-7 rounded-full bg-cream flex items-center justify-center group-hover:bg-forest group-hover:text-white transition">
            ${icon("arrow-right", "w-3.5 h-3.5")}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Buka detail order di side panel
 */
function openOrderDetail(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;

  const panel = document.getElementById("orderDetailPanel");
  const overlay = document.getElementById("orderDetailOverlay");
  const content = document.getElementById("orderDetailContent");
  const footer = document.getElementById("orderDetailFooter");
  const headerId = document.getElementById("detailOrderId");

  if (!panel || !content || !footer) return;

  if (headerId) headerId.textContent = order.order_id;

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const subtotal = Array.isArray(order.items)
    ? order.items.reduce((sum, i) => sum + i.price * i.qty, 0)
    : 0;
  const tax = Math.round(subtotal * 0.1);

  // Render content - full Lucide icons
  content.innerHTML = `
    <!-- Status Timeline -->
    <div class="bg-cream rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-sm text-forest flex items-center gap-2">
          ${icon("activity", "w-4 h-4")}
          Status Pesanan
        </h4>
        ${renderStatusBadge(order.status, "lg")}
      </div>
      
      <!-- Status Timeline Visual -->
      <div class="flex items-start justify-between mb-4 relative pt-2">
        ${["pending", "preparing", "ready", "completed"]
          .map((s, i, arr) => {
            const sMeta = STATUS_META[s];
            const isActive = order.status === s;
            const isPast =
              arr.indexOf(order.status) > i || order.status === "completed";
            const isCancelled = order.status === "cancelled";

            return `
            <div class="flex flex-col items-center flex-1 relative z-10">
              <div class="w-11 h-11 rounded-full flex items-center justify-center transition-all
                ${
                  isActive
                    ? "bg-forest text-white ring-4 ring-forest/20 scale-110"
                    : isPast && !isCancelled
                      ? "bg-forest text-white"
                      : "bg-white text-gray-400 border-2 border-gray-200"
                }">
                ${icon(sMeta.icon, "w-5 h-5")}
              </div>
              <span class="text-[10px] mt-2 font-medium text-center ${isActive ? "text-forest font-bold" : "text-gray-500"}">
                ${sMeta.label}
              </span>
            </div>
            ${
              i < arr.length - 1
                ? `
              <div class="flex-1 h-0.5 mx-1 mt-5 ${isPast && !isCancelled ? "bg-forest" : "bg-gray-200"}"></div>
            `
                : ""
            }
          `;
          })
          .join("")}
      </div>
      
      ${
        order.status === "cancelled"
          ? `
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
          ${icon("ban", "w-4 h-4")}
          <p class="text-sm font-semibold">Pesanan Dibatalkan</p>
        </div>
      `
          : ""
      }
    </div>
    
    <!-- Order Items -->
    <div>
      <h4 class="font-semibold text-sm text-forest mb-3 flex items-center gap-2">
        ${icon("shopping-bag", "w-4 h-4")}
        Item Pesanan
        <span class="ml-auto text-xs text-gray-400 font-normal">
          ${Array.isArray(order.items) ? order.items.length : 0} jenis
        </span>
      </h4>
      <div class="space-y-2">
        ${(order.items || [])
          .map((item) => {
            const menuItem =
              typeof getMenuItemById === "function"
                ? getMenuItemById(item.id)
                : null;
            const itemImage = menuItem?.image || "";
            const itemTotal = item.price * item.qty;

            return `
            <div class="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-gray-100 hover:border-forest/20 transition">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate">${item.name}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs text-gray-500">Rp ${item.price.toLocaleString("id-ID")}</span>
                  <span class="text-gray-300">×</span>
                  <span class="text-xs font-semibold text-forest bg-forest/10 px-1.5 py-0.5 rounded">${item.qty}</span>
                </div>
              </div>
              <p class="font-bold text-sm text-forest">Rp ${itemTotal.toLocaleString("id-ID")}</p>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
    
    <!-- Payment Summary -->
    <div class="bg-gradient-to-br from-[#F9F6F2] to-[#FDFBF7] rounded-xl p-4 border border-[#EFE7DE] space-y-2">
      <h4 class="font-semibold text-sm text-forest mb-2 flex items-center gap-2">
        ${icon("receipt", "w-4 h-4")}
        Ringkasan Pembayaran
      </h4>
      <div class="flex justify-between text-sm">
        <span class="text-gray-500">Subtotal</span>
        <span class="font-medium">Rp ${subtotal.toLocaleString("id-ID")}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-500">Tax (10%)</span>
        <span class="font-medium">Rp ${tax.toLocaleString("id-ID")}</span>
      </div>
      <div class="border-t border-dashed border-[#E5DDD3] my-2"></div>
      <div class="flex justify-between items-center">
        <span class="font-bold text-forest">Total</span>
        <span class="font-brand text-xl font-bold text-terra">Rp ${(order.total || 0).toLocaleString("id-ID")}</span>
      </div>
      <div class="border-t border-dashed border-[#E5DDD3] my-2"></div>
      <div class="flex justify-between text-sm items-center">
        <span class="text-gray-500 flex items-center gap-1.5">
          ${renderPaymentBadge(order.payment_method)}
        </span>
        <span class="font-medium">Rp ${(order.amount_tendered || order.total || 0).toLocaleString("id-ID")}</span>
      </div>
      ${
        order.payment_method === "CASH"
          ? `
        <div class="flex justify-between text-sm bg-green-50 -mx-2 px-2 py-1.5 rounded-lg items-center">
          <span class="text-green-700 font-medium flex items-center gap-1.5">
            ${icon("coins", "w-3.5 h-3.5")}
            Kembalian
          </span>
          <span class="font-bold text-green-700">Rp ${(order.change_due || 0).toLocaleString("id-ID")}</span>
        </div>
      `
          : ""
      }
    </div>
    
    <!-- Status History -->
    <div>
      <h4 class="font-semibold text-sm text-forest mb-3 flex items-center gap-2">
        ${icon("history", "w-4 h-4")}
        Riwayat Status
      </h4>
      <div class="space-y-0">
        ${(order.status_history || [])
          .slice()
          .reverse()
          .map((h, i, arr) => {
            const hMeta = STATUS_META[h.status] || STATUS_META.pending;
            const hTime = new Date(h.timestamp).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            const isFirst = i === 0;

            return `
            <div class="flex gap-3 ${!isFirst ? "opacity-70" : ""}">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-${hMeta.color}-100 text-${hMeta.color}-700 flex items-center justify-center border-2 border-white shadow-sm">
                  ${icon(hMeta.icon, "w-4 h-4")}
                </div>
                ${i < arr.length - 1 ? '<div class="w-0.5 flex-1 bg-gray-200 my-1 min-h-[16px]"></div>' : ""}
              </div>
              <div class="flex-1 pb-3">
                <p class="font-medium text-sm">${hMeta.label}</p>
                <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  ${icon("clock", "w-3 h-3")}
                  ${hTime}
                </p>
                ${h.note ? `<p class="text-xs text-gray-400 mt-0.5 italic">${h.note}</p>` : ""}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;

  renderOrderActions(order, footer);

  panel.classList.remove("translate-x-full");
  if (overlay) overlay.classList.remove("hidden");

  if (window.lucide) lucide.createIcons();
}

/**
 * Render action buttons di footer detail panel - full Lucide icons
 */
function renderOrderActions(order, footer) {
  const meta = STATUS_META[order.status];
  const nextStatus = meta?.next;

  let buttons = "";

  if (
    order.status === ORDER_STATUS.CANCELLED ||
    order.status === ORDER_STATUS.COMPLETED
  ) {
    buttons = `
    <div class="flex justify-between items-center gap-2">
      <button onclick="printOrderReceipt()" class="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-cream transition">
        ${icon("printer", "w-4 h-4")}
        Cetak Struk
      </button>
      <button onclick="closeOrderDetail()" class="py-3 px-4 bg-forest border-2 text-white rounded-xl font-medium text-sm hover:bg-white hover:text-forest transition flex items-center justify-center gap-2">
        ${icon("x", "w-4 h-4")}
        Tutup
      </button>
    </div>
    `;
  } else {
    buttons = `
      ${
        order.status !== ORDER_STATUS.PENDING
          ? `
      <div class="flex justify-between items-center gap-2">
        <button onclick="cancelOrder('${order.order_id}')" class="py-3 px-4 bg-white border-2 border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition flex items-center justify-center gap-2" title="Batalkan pesanan">
          ${icon("x-circle", "w-4 h-4")}
          Batalkan
        </button>
      `
          : ""
      }
      ${
        nextStatus
          ? `
        <button onclick="advanceOrderStatus('${order.order_id}')" class="flex-1 py-3 px-4 bg-gradient-to-r from-forest to-forestLight text-white rounded-xl font-semibold text-sm shadow-lg shadow-forest/30 hover:shadow-xl transition flex items-center justify-center gap-2">
          ${icon(STATUS_META[nextStatus].icon, "w-4 h-4")}
          ${getActionButtonLabel(order.status)}
        </button>
      `
          : ""
      }
      </div>
    `;
  }

  footer.innerHTML = buttons;
  if (window.lucide) lucide.createIcons();
}

/**
 * Label untuk tombol aksi berdasarkan status
 */
function getActionButtonLabel(currentStatus) {
  const labels = {
    pending: "Mulai Siapkan",
    preparing: "Tandai Siap",
    ready: "Selesaikan Pesanan",
  };
  return labels[currentStatus] || "Update Status";
}

/**
 * Advance order ke status berikutnya
 */
function advanceOrderStatus(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;

  const nextStatus = STATUS_META[order.status]?.next;
  if (!nextStatus) return;

  const notes = {
    preparing: "Pesanan sedang disiapkan",
    ready: "Pesanan siap diambil",
    completed: "Pesanan selesai",
  };

  const success = updateOrderStatus(orderId, nextStatus, notes[nextStatus]);
  if (success) {
    openOrderDetail(orderId);
    showOrderToast(
      `Status diubah ke ${STATUS_META[nextStatus].label}`,
      "success",
    );
  }
}

/**
 * Cancel order
 */
function cancelOrder(orderId) {
  Modal.confirm({
    title: "Batalkan Pesanan",
    message: "Yakin ingin membatalkan pesanan ini?",
    type: "warning",
    html: `
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
        <p class="text-red-800">Stock produk akan dikembalikan otomatis.</p>
        <p class="text-xs text-red-600 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
      </div>
    `,
    confirmText: "Ya, Batalkan",
    cancelText: "Tidak",
    onConfirm: () => {
      const success = updateOrderStatus(
        orderId,
        ORDER_STATUS.CANCELLED,
        "Pesanan dibatalkan oleh kasir",
      );
      if (success) {
        closeOrderDetail();
        Modal.success({
          title: "Pesanan Dibatalkan",
          message: "Stock produk telah dikembalikan",
          icon: "x-circle",
        });
      }
    },
  });
}

/**
 * Tutup detail panel
 */
function closeOrderDetail() {
  const panel = document.getElementById("orderDetailPanel");
  const overlay = document.getElementById("orderDetailOverlay");

  if (panel) panel.classList.add("translate-x-full");
  if (overlay) overlay.classList.add("hidden");
}

/**
 * Print receipt untuk order tertentu
 */
function printOrderReceipt() {
  const orderId = document.getElementById("detailOrderId")?.textContent;
  if (!orderId) return;

  const order = getOrderById(orderId);
  if (!order) return;

  showReceipt(
    order.order_id,
    order.items,
    order.total,
    order.payment_method,
    order.amount_tendered || order.total,
    order.change_due || 0,
  );
}

/**
 * Refresh orders
 */
function refreshOrders() {
  renderOrders();
  showOrderToast("Data pesanan diperbarui", "info");
}

/**
 * Toast notification - full Lucide icons
 */
function showOrderToast(message, type = "info") {
  const config = {
    success: {
      color: "bg-green-500",
      icon: "check-circle-2",
    },
    warning: {
      color: "bg-orange-500",
      icon: "alert-triangle",
    },
    info: {
      color: "bg-blue-500",
      icon: "info",
    },
    error: {
      color: "bg-red-500",
      icon: "x-circle",
    },
  };

  const { color, icon: iconName } = config[type] || config.info;

  const toast = document.createElement("div");
  toast.className = `fixed bottom-6 right-6 ${color} text-white px-5 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2.5 animate-[slide-up_0.3s_ease-out]`;
  toast.innerHTML = `
    ${icon(iconName, "w-5 h-5")}
    <span class="text-sm font-medium">${message}</span>
  `;

  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

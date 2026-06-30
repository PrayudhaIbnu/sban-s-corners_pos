// ===== ORDERS MODULE (Unified) =====

let currentOrderFilter = {
  search: "",
  status: "all",
  payment: "all",
  date: "all",
  orderType: "all",
};

// ===== HELPER FUNCTIONS =====

function icon(name, className = "w-4 h-4") {
  return `<i data-lucide="${name}" class="${className}"></i>`;
}

function renderStatusBadge(status, size = "sm") {
  const safeStatus = status || "completed";

  const STATUS_META_LOCAL = {
    pending: { label: "Pending", icon: "clock", color: "orange" },
    preparing: { label: "Preparing", icon: "chef-hat", color: "blue" },
    ready: { label: "Ready", icon: "package-check", color: "green" },
    completed: { label: "Completed", icon: "badge-check", color: "forest" },
    cancelled: { label: "Cancelled", icon: "ban", color: "red" },
    shipping: { label: "Shipping", icon: "truck", color: "purple" },
  };

  const meta = STATUS_META_LOCAL[safeStatus] || STATUS_META_LOCAL.completed;

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

function renderPaymentBadge(method) {
  const safeMethod = method || "CASH";

  const PAYMENT_META_LOCAL = {
    CASH: { label: "Cash", icon: "banknote", color: "green" },
    QRIS: { label: "QRIS", icon: "qr-code", color: "blue" },
    TRANSFER: { label: "Transfer", icon: "building-2", color: "purple" },
  };

  const meta = PAYMENT_META_LOCAL[safeMethod] || PAYMENT_META_LOCAL.CASH;

  return `
    <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${meta.color}-50 text-${meta.color}-700 border border-${meta.color}-100">
      ${icon(meta.icon, "w-3 h-3")}
      <span>${meta.label}</span>
    </span>
  `;
}

/**
 * ✅ Helper: Normalisasi order dari berbagai sumber
 */
function normalizeOrder(order) {
  return {
    order_id: order.order_id || order.id,
    id: order.id || order.order_id,
    date: order.date || order.createdAt || new Date().toISOString(),
    items: order.items || order.menuOrders || [],
    payment_method: order.payment_method || order.paymentMethod || "CASH",
    status: order.status || "completed",
    status_history: order.status_history || order.statusHistory || [],
    total: order.total || 0,
    amount_tendered: order.amount_tendered || order.total || 0,
    change_due: order.change_due || 0,
    orderType: order.orderType || "reservation",
    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    deliveryAddress: order.deliveryAddress || "",
    deliveryNotes: order.deliveryNotes || "",
    tableNumber: order.tableNumber || null,
    tableName: order.tableName || "",
    guestCount: order.guestCount || 0,
    source: order.source || "pos",
  };
}

function getAllNormalizedOrders() {
  const orders = StorageBridge.getOrders();
  return orders.map(normalizeOrder);
}

// ===== MAIN FUNCTIONS =====

function initOrders() {
  StorageBridge.on("order:new", (order) => {
    console.log("🔔 New order received:", order.id);
    renderOrders();

    const normalized = normalizeOrder(order);
    if (normalized.orderType === "delivery") {
      showOrderToast(
        `Pesanan delivery baru: ${normalized.order_id}`,
        "success",
      );
    } else {
      showOrderToast(`Reservasi baru: ${normalized.order_id}`, "info");
    }
  });

  StorageBridge.on("order:update", (order) => {
    console.log("🔄 Order updated:", order.id);
    renderOrders();
  });

  renderOrders();
}

function renderOrders() {
  console.log("📋 Rendering orders...");
  updateOrdersStats();
  renderOrdersList();
  if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
}

/**
 * ✅ Render action buttons dengan konfirmasi pembayaran
 */
function renderOrderActions(order, footer) {
  const meta = STATUS_META[order.status] || STATUS_META.completed;
  const nextStatus = meta?.next;

  let buttons = "";

  // ✅ Tombol Konfirmasi Pembayaran (jika ada bukti dan belum diverifikasi)
  if (order.paymentProof && order.paymentStatus === "pending_verification") {
    buttons = `
      <div class="space-y-2">
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-xs text-amber-800 font-semibold mb-2 flex items-center gap-1">
            ${icon("shield-alert", "w-3.5 h-3.5")}
            Konfirmasi Pembayaran
          </p>
          <p class="text-xs text-gray-600 mb-2">Verifikasi bukti pembayaran dan kirim notifikasi ke customer?</p>
          
          <div class="flex gap-2">
            <button onclick="confirmOrderPayment('${order.order_id}', true)" 
                    class="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
              ${icon("check-circle", "w-4 h-4")}
              Verifikasi & Kirim WA
            </button>
            <button onclick="confirmOrderPayment('${order.order_id}', false)" 
                    class="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2">
              ${icon("x-circle", "w-4 h-4")}
              Tolak & Kirim WA
            </button>
          </div>
        </div>
        
        ${
          order.status !== "cancelled" && order.status !== "completed"
            ? `
          <div class="flex gap-2">
            <button onclick="closeOrderDetail()" class="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              ${icon("x", "w-4 h-4")}
              Tutup
            </button>
          </div>
        `
            : ""
        }
      </div>
    `;
  }
  // Tombol untuk order yang sudah diverifikasi atau tanpa bukti
  else if (order.status === "cancelled" || order.status === "completed") {
    buttons = `
      <div class="flex justify-between items-center gap-2">
        <button onclick="printOrderReceipt()" class="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-cream transition flex items-center justify-center gap-2">
          ${icon("printer", "w-4 h-4")}
          Cetak Struk
        </button>
        <button onclick="closeOrderDetail()" class="py-2.5 px-4 bg-forest border-2 text-white rounded-lg text-sm font-medium hover:bg-white hover:text-forest transition flex items-center justify-center gap-2">
          ${icon("x", "w-4 h-4")}
          Tutup
        </button>
      </div>
    `;
  } else {
    // Tombol update status biasa
    buttons = `
      <div class="flex justify-between items-center gap-2">
        ${
          order.status !== "pending" &&
          order.paymentStatus !== "pending_verification"
            ? `
          <button onclick="cancelOrder('${order.order_id}')" 
                  class="py-2.5 px-4 bg-white border-2 border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center justify-center gap-2">
            ${icon("x-circle", "w-4 h-4")}
            Batalkan
          </button>
        `
            : ""
        }
        ${
          nextStatus
            ? `
          <button onclick="advanceOrderStatus('${order.order_id}')" 
                  class="flex-1 py-2.5 bg-gradient-to-r from-forest to-forestLight text-white rounded-lg text-sm font-semibold shadow-lg shadow-forest/30 hover:shadow-xl transition flex items-center justify-center gap-2">
            ${icon(STATUS_META[nextStatus]?.icon || "check", "w-4 h-4")}
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
 * ✅ Konfirmasi pembayaran dengan notifikasi WhatsApp
 */
function confirmOrderPayment(orderId, isVerified) {
  const order = getAllNormalizedOrders().find((o) => o.order_id === orderId);
  if (!order) {
    Modal.error({
      title: "Error",
      message: "Pesanan tidak ditemukan",
      icon: "x-circle",
    });
    return;
  }

  // Modal untuk input catatan admin
  Modal.show({
    type: "confirm",
    title: isVerified ? "Verifikasi Pembayaran" : "Tolak Pembayaran",
    message: isVerified
      ? `Konfirmasi pembayaran untuk pesanan ${orderId}?`
      : `Tolak pembayaran untuk pesanan ${orderId}?`,
    html: `
      <div class="space-y-3">
        <div class="bg-cream rounded-lg p-3 text-sm">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Customer:</span>
            <span class="font-semibold">${order.customerName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">WhatsApp:</span>
            <span class="font-semibold">${order.customerPhone}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Total:</span>
            <span class="font-bold text-forest">Rp ${(order.total || 0).toLocaleString("id-ID")}</span>
          </div>
        </div>
        
        <div>
          <label class="input-label">Catatan untuk Customer (opsional)</label>
          <textarea 
            id="adminNote" 
            rows="3" 
            placeholder="${isVerified ? "Contoh: Reservasi Anda dikonfirmasi. Kami tunggu kedatangannya!" : "Contoh: Mohon maaf, bukti pembayaran tidak jelas. Silakan upload ulang."}"
            class="input resize-none"
          ></textarea>
        </div>
        
        <div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <i data-lucide="message-circle" class="w-5 h-5 text-green-600 flex-shrink-0"></i>
          <p class="text-sm text-green-800">
            Notifikasi WhatsApp akan dikirim otomatis ke ${order.customerPhone}
          </p>
        </div>
      </div>
    `,
    confirmText: isVerified ? "✅ Verifikasi & Kirim" : "❌ Tolak & Kirim",
    cancelText: "Batal",
    size: "md",
    onConfirm: () => {
      const adminNote =
        document.getElementById("adminNote")?.value?.trim() || "";

      // Update status pembayaran di StorageBridge
      const updatedOrder = StorageBridge.confirmPayment(
        orderId,
        isVerified,
        adminNote,
      );

      if (updatedOrder) {
        // Kirim notifikasi WhatsApp
        StorageBridge.sendWhatsAppNotification(
          order.customerPhone,
          order,
          isVerified,
          adminNote,
        );

        // Tampilkan success message
        Modal.success({
          title: isVerified
            ? "Pembayaran Terverifikasi!"
            : "Pembayaran Ditolak",
          message: isVerified
            ? `Status pesanan telah diupdate dan notifikasi WhatsApp telah dikirim ke ${order.customerPhone}`
            : `Pesanan dibatalkan dan notifikasi telah dikirim ke ${order.customerPhone}`,
          icon: isVerified ? "check-circle" : "x-circle",
          confirmText: "Tutup",
        });

        // Refresh detail panel
        setTimeout(() => {
          openOrderDetail(orderId);
        }, 1000);
      } else {
        Modal.error({
          title: "Gagal",
          message: "Terjadi kesalahan saat memproses pembayaran",
          icon: "x-circle",
        });
      }
    },
  });

  // Re-init icons setelah modal muncul
  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 100);
}

function updateOrdersStats() {
  const today = new Date().toDateString();
  const orders = getAllNormalizedOrders();

  const todayOrders = orders.filter(
    (t) => new Date(t.date).toDateString() === today,
  );

  const activeOrders = todayOrders.filter(
    (t) => t.status !== "cancelled" && t.status !== "completed",
  );

  const completedOrders = todayOrders.filter((t) => t.status === "completed");

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

function filterOrders() {
  currentOrderFilter = {
    search: (document.getElementById("orderSearch")?.value || "").toLowerCase(),
    status: document.getElementById("orderStatusFilter")?.value || "all",
    payment: document.getElementById("orderPaymentFilter")?.value || "all",
    date: document.getElementById("orderDateFilter")?.value || "all",
    orderType: document.getElementById("orderTypeFilter")?.value || "all",
  };
  renderOrdersList();
}

function renderOrdersList() {
  const container = document.getElementById("ordersList");
  if (!container) return;

  let filtered = getAllNormalizedOrders().reverse();

  console.log("📦 Total orders loaded:", filtered.length);

  if (currentOrderFilter.search) {
    filtered = filtered.filter(
      (t) =>
        t.order_id.toLowerCase().includes(currentOrderFilter.search) ||
        (t.customerName &&
          t.customerName.toLowerCase().includes(currentOrderFilter.search)),
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

  if (currentOrderFilter.orderType !== "all") {
    filtered = filtered.filter(
      (t) => t.orderType === currentOrderFilter.orderType,
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

  if (!filtered.length) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cream to-[#F9F6F2] flex items-center justify-center mb-4 border border-[#EFE7DE]">
          <i data-lucide="package-open" class="w-9 h-9 text-forest/40"></i>
        </div>
        <h3 class="font-brand text-lg font-bold text-forest mb-1">Tidak ada pesanan</h3>
        <p class="text-sm text-gray-500">
          ${
            currentOrderFilter.search ||
            currentOrderFilter.status !== "all" ||
            currentOrderFilter.orderType !== "all"
              ? "Coba ubah filter untuk melihat pesanan lain"
              : "Pesanan baru akan muncul di sini"
          }
        </p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered
    .map((order) => renderOrderCard(order))
    .join("");
  if (window.lucide) lucide.createIcons();
}

/**
 * Update renderOrderCard untuk menampilkan status pembayaran
 */
function renderOrderCard(order) {
  const status = order.status || "pending";
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum, i) => sum + i.qty, 0)
    : 0;
  const time = new Date(order.date || order.createdAt).toLocaleTimeString(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const date = new Date(order.date || order.createdAt).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
    },
  );

  const previewItems = Array.isArray(order.items)
    ? order.items.slice(0, 3)
    : [];

  // ✅ Badge status pembayaran (PRIORITAS TINGGI)
  // ✅ TAMBAHKAN: Badge status pembayaran
  let paymentBadge = "";
  if (order.paymentProof) {
    if (order.paymentStatus === "pending_verification") {
      paymentBadge = `
      <span class="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <i data-lucide="clock" class="w-3 h-3"></i>
        Menunggu Verifikasi
      </span>
    `;
    } else if (order.paymentStatus === "verified") {
      paymentBadge = `
      <span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <i data-lucide="check-circle" class="w-3 h-3"></i>
        Terverifikasi
      </span>
    `;
    } else if (order.paymentStatus === "rejected") {
      paymentBadge = `
      <span class="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <i data-lucide="x-circle" class="w-3 h-3"></i>
        Ditolak
      </span>
    `;
    }
  }

  // Badge tipe order
  const orderTypeBadge =
    order.orderType === "delivery"
      ? `<span class="bg-terra/10 text-terra text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
         <i data-lucide="truck" class="w-3 h-3"></i>
         DELIVERY
       </span>`
      : `<span class="bg-forest/10 text-forest text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
         <i data-lucide="calendar" class="w-3 h-3"></i>
         RESERVASI
       </span>`;

  const customerInfo =
    order.orderType === "delivery" && order.customerName
      ? `<p class="text-xs text-gray-500 mt-1 truncate">${order.customerName}</p>`
      : order.orderType === "reservation" && order.tableName
        ? `<p class="text-xs text-gray-500 mt-1">🪑 ${order.tableName} • ${order.guestCount || 0} org</p>`
        : "";

  return `
    <div class="order-card bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-forest/20 transition overflow-hidden cursor-pointer group" 
         onclick="openOrderDetail('${order.order_id}')">
      <div class="p-4">
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-2 flex-wrap">
              <span class="font-mono font-bold text-forest text-xs">${order.order_id}</span>
              ${renderStatusBadge(status)}
              ${orderTypeBadge}
              ${paymentBadge}
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span class="flex items-center gap-1">
                <i data-lucide="calendar" class="w-3 h-3"></i>
                ${date}
              </span>
              <span class="flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3"></i>
                ${time}
              </span>
              ${renderPaymentBadge(order.payment_method)}
            </div>
            ${customerInfo}
          </div>
          
          <div class="text-right flex-shrink-0">
            <p class="font-brand text-base font-bold text-terra">Rp ${(order.total || 0).toLocaleString("id-ID")}</p>
            <p class="text-[10px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
              <i data-lucide="shopping-bag" class="w-3 h-3"></i>
              ${itemCount} item${itemCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        
        ${
          order.paymentProof && order.paymentStatus === "pending_verification"
            ? `
          <div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
            <i data-lucide="shield-alert" class="w-4 h-4 flex-shrink-0"></i>
            <span class="font-semibold">Perlu verifikasi pembayaran</span>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function openOrderDetail(orderId) {
  const order = getAllNormalizedOrders().find((o) => o.order_id === orderId);
  if (!order) {
    console.error("Order not found:", orderId);
    return;
  }

  const panel = document.getElementById("orderDetailPanel");
  const overlay = document.getElementById("orderDetailOverlay");
  const content = document.getElementById("orderDetailContent");
  const footer = document.getElementById("orderDetailFooter");
  const headerId = document.getElementById("detailOrderId");

  if (!panel || !content || !footer) return;

  if (headerId) headerId.textContent = order.order_id;

  const subtotal = Array.isArray(order.items)
    ? order.items.reduce((sum, i) => sum + i.price * i.qty, 0)
    : 0;
  const tax = Math.round(subtotal * 0.1);

  const deliveryInfo =
    order.orderType === "delivery"
      ? `
    <div class="bg-terra/5 border border-terra/20 rounded-lg p-3 mb-4">
      <h4 class="font-semibold text-sm text-terra mb-2 flex items-center gap-2">
        ${icon("truck", "w-4 h-4")}
        Info Pengiriman
      </h4>
      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-600">Nama:</span>
          <span class="font-semibold">${order.customerName || "-"}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">WhatsApp:</span>
          <span class="font-semibold">${order.customerPhone || "-"}</span>
        </div>
        <div>
          <span class="text-gray-600">Alamat:</span>
          <p class="font-semibold mt-1">${order.deliveryAddress || "-"}</p>
          ${order.deliveryNotes ? `<p class="text-gray-500 italic mt-1">Catatan: ${order.deliveryNotes}</p>` : ""}
        </div>
      </div>
    </div>
  `
      : "";

  const reservationInfo =
    order.orderType === "reservation" && order.tableNumber
      ? `
    <div class="bg-forest/5 border border-forest/20 rounded-lg p-3 mb-4">
      <h4 class="font-semibold text-sm text-forest mb-2 flex items-center gap-2">
        ${icon("calendar", "w-4 h-4")}
        Info Reservasi
      </h4>
      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-600">Meja:</span>
          <span class="font-semibold">${order.tableName || "Meja " + order.tableNumber}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Tamu:</span>
          <span class="font-semibold">${order.guestCount || 0} orang</span>
        </div>
      </div>
    </div>
  `
      : "";

  content.innerHTML = `
    <div class="bg-cream rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-sm text-forest flex items-center gap-2">
          ${icon("activity", "w-4 h-4")}
          Status Pesanan
        </h4>
        ${renderStatusBadge(order.status, "lg")}
      </div>
      
      <div class="flex items-start justify-between mb-4 relative pt-2">
        ${["pending", "preparing", "ready", "completed"]
          .map((s, i, arr) => {
            const STATUS_META_LOCAL = {
              pending: { label: "Pending", icon: "clock" },
              preparing: { label: "Preparing", icon: "chef-hat" },
              ready: { label: "Ready", icon: "package-check" },
              completed: { label: "Completed", icon: "badge-check" },
              cancelled: { label: "Cancelled", icon: "ban" },
            };
            const sMeta = STATUS_META_LOCAL[s];
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
    
    ${deliveryInfo}
    ${reservationInfo}
    
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
            const itemTotal = item.price * item.qty;
            return `
            <div class="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-gray-100">
              <div class="w-12 h-12 rounded-lg bg-cream flex-shrink-0 flex items-center justify-center">
                ${icon("utensils", "w-5 h-5 text-gray-400")}
              </div>
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
        <span class="text-gray-500">Metode</span>
        <span class="font-medium">${order.payment_method}</span>
      </div>
    </div>
  `;

  renderOrderActions(order, footer);

  panel.classList.remove("translate-x-full");
  if (overlay) overlay.classList.remove("hidden");

  if (window.lucide) lucide.createIcons();
}

function renderOrderActions(order, footer) {
  const STATUS_META_LOCAL = {
    pending: { next: "preparing" },
    preparing: { next: "ready" },
    ready: { next: "completed" },
    completed: { next: null },
    cancelled: { next: null },
  };

  const meta = STATUS_META_LOCAL[order.status] || { next: null };
  const nextStatus = meta.next;

  let buttons = "";

  if (order.status === "cancelled" || order.status === "completed") {
    buttons = `
    <div class="flex justify-between items-center gap-2">
      <button onclick="printOrderReceipt()" class="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-cream transition">
        ${icon("printer", "w-4 h-4")}
        Cetak Struk
      </button>
      <button onclick="closeOrderDetail()" class="py-3 px-4 bg-forest text-white rounded-xl font-medium text-sm hover:bg-forestLight transition flex items-center justify-center gap-2">
        ${icon("x", "w-4 h-4")}
        Tutup
      </button>
    </div>
    `;
  } else {
    buttons = `
      <div class="flex justify-between items-center gap-2">
        ${
          order.status !== "pending"
            ? `
          <button onclick="cancelOrder('${order.order_id}')" class="py-3 px-4 bg-white border-2 border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition flex items-center justify-center gap-2">
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
            ${icon(STATUS_META_LOCAL[nextStatus]?.icon || "check", "w-4 h-4")}
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

function getActionButtonLabel(currentStatus) {
  const labels = {
    pending: "Mulai Siapkan",
    preparing: "Tandai Siap",
    ready: "Selesaikan Pesanan",
  };
  return labels[currentStatus] || "Update Status";
}

function advanceOrderStatus(orderId) {
  const order = getAllNormalizedOrders().find((o) => o.order_id === orderId);
  if (!order) return;

  const STATUS_NEXT = {
    pending: "preparing",
    preparing: "ready",
    ready: "completed",
  };

  const nextStatus = STATUS_NEXT[order.status];
  if (!nextStatus) return;

  const notes = {
    preparing: "Pesanan sedang disiapkan",
    ready: "Pesanan siap diambil",
    completed: "Pesanan selesai",
  };

  const success = StorageBridge.updateOrderStatus(
    order.id,
    nextStatus,
    notes[nextStatus],
  );
  if (success) {
    openOrderDetail(orderId);
    showOrderToast(`Status diubah ke ${nextStatus}`, "success");
  }
}

function cancelOrder(orderId) {
  Modal.confirm({
    title: "Batalkan Pesanan",
    message: "Yakin ingin membatalkan pesanan ini?",
    type: "warning",
    html: `
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
        <p class="text-red-800">Tindakan ini tidak dapat dibatalkan.</p>
      </div>
    `,
    confirmText: "Ya, Batalkan",
    cancelText: "Tidak",
    onConfirm: () => {
      const order = getAllNormalizedOrders().find(
        (o) => o.order_id === orderId,
      );
      if (!order) return;

      const success = StorageBridge.updateOrderStatus(
        order.id,
        "cancelled",
        "Pesanan dibatalkan oleh kasir",
      );
      if (success) {
        closeOrderDetail();
        Modal.success({
          title: "Pesanan Dibatalkan",
          message: "Status telah diperbarui",
          icon: "x-circle",
        });
      }
    },
  });
}

function closeOrderDetail() {
  const panel = document.getElementById("orderDetailPanel");
  const overlay = document.getElementById("orderDetailOverlay");
  if (panel) panel.classList.add("translate-x-full");
  if (overlay) overlay.classList.add("hidden");
}

function printOrderReceipt() {
  const orderId = document.getElementById("detailOrderId")?.textContent;
  if (!orderId) return;
  const order = getAllNormalizedOrders().find((o) => o.order_id === orderId);
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

function refreshOrders() {
  renderOrders();
  showOrderToast("Data pesanan diperbarui", "info");
}

function showOrderToast(message, type = "info") {
  const config = {
    success: { color: "bg-green-500", icon: "check-circle-2" },
    warning: { color: "bg-orange-500", icon: "alert-triangle" },
    info: { color: "bg-blue-500", icon: "info" },
    error: { color: "bg-red-500", icon: "x-circle" },
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

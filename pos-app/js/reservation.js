// ===== RESERVATION MANAGEMENT (POS) =====

let currentReservationFilter = "today";

/**
 * Initialize reservation page
 */
function initReservations() {
  StorageBridge.on("reservation:new", (reservation) => {
    console.log("🔔 Reservasi baru diterima:", reservation.id);
    renderReservations();
    showReservationNotification(reservation);
    updateReservationBadge();
  });

  StorageBridge.on("reservation:update", (reservation) => {
    console.log("🔄 Reservasi diupdate:", reservation.id);
    renderReservations();
  });

  renderReservations();
  updateReservationBadge();
}

/**
 * Render halaman reservasi
 */
function renderReservations() {
  const container = document.getElementById("reservationsList");
  if (!container) return;

  const reservations = getFilteredReservations();

  // Update stats
  updateReservationStats();

  if (reservations.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cream to-[#F9F6F2] flex items-center justify-center mb-4 border border-[#EFE7DE]">
          <i data-lucide="calendar-x" class="w-9 h-9 text-forest/40"></i>
        </div>
        <h3 class="font-brand text-lg font-bold text-forest mb-1">Tidak ada reservasi</h3>
        <p class="text-sm text-gray-500">Reservasi dari customer akan muncul di sini</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = reservations.map(renderReservationCard).join("");
  if (window.lucide) lucide.createIcons();
}

/**
 * ✅ Konfirmasi reservasi dengan WhatsApp (untuk halaman Reservations)
 */
function confirmReservationPayment(reservationId, isVerified) {
  const reservation = StorageBridge.getReservationById(reservationId);
  if (!reservation) {
    Modal.error({
      title: "Error",
      message: "Reservasi tidak ditemukan",
      icon: "x-circle",
    });
    return;
  }

  Modal.show({
    type: "confirm",
    title: isVerified ? "Konfirmasi Reservasi" : "Tolak Reservasi",
    message: isVerified
      ? `Konfirmasi reservasi untuk ${reservation.customerName}?`
      : `Tolak reservasi untuk ${reservation.customerName}?`,
    html: `
      <div class="space-y-3">
        <div class="bg-cream rounded-lg p-3 text-sm">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Nama:</span>
            <span class="font-semibold">${reservation.customerName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">WhatsApp:</span>
            <span class="font-semibold">${reservation.customerPhone}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Meja:</span>
            <span class="font-semibold">${reservation.tableName || "Meja " + reservation.tableNumber}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Tanggal:</span>
            <span class="font-semibold">${new Date(reservation.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>
        </div>
        
        <div>
          <label class="input-label">Catatan (opsional)</label>
          <textarea 
            id="reservationAdminNote" 
            rows="3" 
            placeholder="${isVerified ? "Contoh: Reservasi dikonfirmasi. Kami tunggu kedatangannya!" : "Alasan penolakan..."}"
            class="input resize-none"
          ></textarea>
        </div>
        
        <div class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <i data-lucide="message-circle" class="w-5 h-5 text-blue-600 flex-shrink-0"></i>
          <p class="text-sm text-blue-800">
            Notifikasi WhatsApp akan dikirim ke ${reservation.customerPhone}
          </p>
        </div>
      </div>
    `,
    confirmText: isVerified ? "✅ Konfirmasi & Kirim" : "❌ Tolak & Kirim",
    cancelText: "Batal",
    size: "md",
    onConfirm: () => {
      const adminNote =
        document.getElementById("reservationAdminNote")?.value?.trim() || "";

      // Update status
      const updatedReservation = StorageBridge.confirmPayment(
        reservationId,
        isVerified,
        adminNote,
      );

      if (updatedReservation) {
        // Kirim WhatsApp
        StorageBridge.sendWhatsAppNotification(
          reservation.customerPhone,
          reservation,
          isVerified,
          adminNote,
        );

        Modal.success({
          title: isVerified ? "Reservasi Dikonfirmasi!" : "Reservasi Ditolak",
          message: `Notifikasi WhatsApp telah dikirim ke ${reservation.customerPhone}`,
          icon: isVerified ? "check-circle" : "x-circle",
        });

        // Refresh
        setTimeout(() => {
          if (typeof renderReservations === "function") {
            renderReservations();
          }
        }, 1000);
      }
    },
  });

  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 100);
}

/**
 * Render satu card reservasi
 */
function renderReservationCard(reservation) {
  const statusConfig = {
    confirmed: { label: "Dikonfirmasi", color: "blue", icon: "check-circle" },
    "checked-in": { label: "Check-in", color: "green", icon: "log-in" },
    "checked-out": { label: "Selesai", color: "gray", icon: "log-out" },
    cancelled: { label: "Dibatalkan", color: "red", icon: "x-circle" },
  };

  const status = statusConfig[reservation.status] || statusConfig.confirmed;
  const isNew = isReservationNew(reservation);

  return `
    <div class="bg-white rounded-xl border ${isNew ? "border-forest ring-2 ring-forest/20" : "border-gray-100"} shadow-sm hover:shadow-md transition overflow-hidden">
      <div class="p-4">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-mono font-bold text-forest text-sm">${reservation.id}</span>
              <span class="status-badge status-${status.color} px-2 py-0.5 text-[11px] inline-flex items-center gap-1">
                <i data-lucide="${status.icon}" class="w-3 h-3"></i>
                ${status.label}
              </span>
              ${isNew ? '<span class="bg-terra text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">BARU</span>' : ""}
              ${reservation.source === "customer-app" ? '<span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">ONLINE</span>' : ""}
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span class="flex items-center gap-1">
                <i data-lucide="user" class="w-3 h-3"></i>
                ${reservation.customerName}
              </span>
              <span class="flex items-center gap-1">
                <i data-lucide="phone" class="w-3 h-3"></i>
                ${reservation.customerPhone}
              </span>
            </div>
          </div>
          
          <div class="text-right flex-shrink-0">
            <p class="font-brand text-lg font-bold text-forest">Meja ${reservation.tableNumber}</p>
            <p class="text-xs text-gray-500">${reservation.guestCount} orang</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-dashed border-gray-100">
          <span class="flex items-center gap-1">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            ${formatReservationDate(reservation.date)}
          </span>
          <span class="flex items-center gap-1">
            <i data-lucide="clock" class="w-4 h-4"></i>
            ${reservation.time} - ${reservation.endTime}
          </span>
          ${
            reservation.total > 0
              ? `
            <span class="flex items-center gap-1 ml-auto font-semibold text-forest">
              <i data-lucide="banknote" class="w-4 h-4"></i>
              Rp ${reservation.total.toLocaleString("id-ID")}
            </span>
          `
              : ""
          }
        </div>
        
        ${
          reservation.menuOrders && reservation.menuOrders.length > 0
            ? `
          <div class="mt-3 pt-3 border-t border-dashed border-gray-100">
            <p class="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <i data-lucide="utensils" class="w-3 h-3"></i>
              Pre-order Menu:
            </p>
            <div class="flex flex-wrap gap-1">
              ${reservation.menuOrders
                .map(
                  (item) => `
                <span class="text-xs bg-cream px-2 py-1 rounded-full">
                  ${item.name} ×${item.qty}
                </span>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        
        <!-- Action Buttons -->
        <div class="flex gap-2 mt-4">
          ${
            reservation.status === "confirmed"
              ? `
            <button onclick="checkInReservation('${reservation.id}')" class="flex-1 py-2 bg-forest text-white rounded-lg text-sm font-medium hover:bg-forestLight transition flex items-center justify-center gap-2">
              <i data-lucide="log-in" class="w-4 h-4"></i>
              Check-in
            </button>
            <button onclick="cancelReservation('${reservation.id}')" class="py-2 px-4 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          `
              : ""
          }
          ${
            reservation.status === "checked-in"
              ? `
            <button onclick="checkOutReservation('${reservation.id}')" class="flex-1 py-2 bg-forest text-white rounded-lg text-sm font-medium hover:bg-forestLight transition flex items-center justify-center gap-2">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              Check-out
            </button>
          `
              : ""
          }
          <button onclick="showReservationDetail('${reservation.id}')" class="py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-cream transition">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get filtered reservations
 */
function getFilteredReservations() {
  const reservations = StorageBridge.getReservations();
  const today = new Date().toISOString().split("T")[0];

  switch (currentReservationFilter) {
    case "today":
      return reservations.filter((r) => r.date === today);
    case "upcoming":
      return reservations.filter(
        (r) =>
          r.date >= today &&
          r.status !== "cancelled" &&
          r.status !== "checked-out",
      );
    case "all":
      return reservations;
    default:
      return reservations.filter((r) => r.date === today);
  }
}

/**
 * Filter reservations
 */
function filterReservations(filter) {
  currentReservationFilter = filter;

  document.querySelectorAll(".reservation-filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  renderReservations();
}

/**
 * Update stats
 */
function updateReservationStats() {
  const reservations = StorageBridge.getReservations();
  const today = new Date().toISOString().split("T")[0];
  const todayReservations = reservations.filter((r) => r.date === today);

  const confirmed = todayReservations.filter(
    (r) => r.status === "confirmed",
  ).length;
  const checkedIn = todayReservations.filter(
    (r) => r.status === "checked-in",
  ).length;
  const total = todayReservations.length;
  const revenue = todayReservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + (r.total || 0), 0);

  const elTotal = document.getElementById("resTotalCount");
  const elConfirmed = document.getElementById("resConfirmedCount");
  const elCheckedIn = document.getElementById("resCheckedInCount");
  const elRevenue = document.getElementById("resRevenue");

  if (elTotal) elTotal.textContent = total;
  if (elConfirmed) elConfirmed.textContent = confirmed;
  if (elCheckedIn) elCheckedIn.textContent = checkedIn;
  if (elRevenue)
    elRevenue.textContent = "Rp " + revenue.toLocaleString("id-ID");
}

/**
 * Update badge di sidebar
 */
function updateReservationBadge() {
  const badge = document.getElementById("reservationsBadge");
  if (!badge) return;

  const today = new Date().toISOString().split("T")[0];
  const reservations = StorageBridge.getReservations();
  const pendingCount = reservations.filter(
    (r) => r.date === today && r.status === "confirmed",
  ).length;

  if (pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/**
 * ✅ GANTI: Check-in dengan modal konfirmasi
 */
function checkInReservation(reservationId) {
  const reservation = StorageBridge.getReservationById(reservationId);
  if (!reservation) return;

  Modal.confirm({
    title: "Check-in Pelanggan",
    message: `Konfirmasi check-in untuk ${reservation.customerName}?`,
    html: `
      <div class="bg-cream rounded-lg p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Nama:</span>
          <span class="font-semibold">${reservation.customerName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Meja:</span>
          <span class="font-semibold">Meja ${reservation.tableNumber}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Waktu:</span>
          <span class="font-semibold">${reservation.time} - ${reservation.endTime}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Tamu:</span>
          <span class="font-semibold">${reservation.guestCount} orang</span>
        </div>
        ${
          reservation.menuOrders && reservation.menuOrders.length > 0
            ? `
          <div class="border-t pt-2 mt-2">
            <p class="text-xs text-gray-500 mb-1">Pre-order Menu:</p>
            ${reservation.menuOrders
              .map(
                (item) => `
              <p class="text-xs">• ${item.name} ×${item.qty}</p>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `,
    confirmText: "Check-in Sekarang",
    cancelText: "Batal",
    size: "md",
    onConfirm: () => {
      StorageBridge.updateReservationStatus(
        reservationId,
        "checked-in",
        "Pelanggan check-in oleh kasir",
      );
      Modal.success({
        title: "Check-in Berhasil!",
        message: `${reservation.customerName} telah check-in di Meja ${reservation.tableNumber}`,
        icon: "log-in",
        confirmText: "OK",
      });
    },
  });
}

/**
 * ✅ GANTI: Check-out dengan modal konfirmasi
 */
function checkOutReservation(reservationId) {
  const reservation = StorageBridge.getReservationById(reservationId);
  if (!reservation) return;

  Modal.confirm({
    title: "Check-out Pelanggan",
    message: `Konfirmasi check-out untuk ${reservation.customerName}?`,
    html: `
      <div class="bg-cream rounded-lg p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Nama:</span>
          <span class="font-semibold">${reservation.customerName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Meja:</span>
          <span class="font-semibold">Meja ${reservation.tableNumber}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Check-in:</span>
          <span class="font-semibold">${new Date(reservation.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
      <p class="text-xs text-orange-600 mt-3 text-center">
        ⚠️ Meja akan dibebaskan setelah check-out
      </p>
    `,
    confirmText: "Check-out Sekarang",
    cancelText: "Batal",
    size: "md",
    onConfirm: () => {
      StorageBridge.updateReservationStatus(
        reservationId,
        "checked-out",
        "Pelanggan check-out",
      );
      Modal.success({
        title: "Check-out Berhasil!",
        message: `Meja ${reservation.tableNumber} telah dibebaskan`,
        icon: "log-out",
        confirmText: "OK",
      });
    },
  });
}

/**
 * ✅ GANTI: Cancel dengan modal konfirmasi
 */
function cancelReservation(reservationId) {
  const reservation = StorageBridge.getReservationById(reservationId);
  if (!reservation) return;

  Modal.confirm({
    title: "Batalkan Reservasi",
    message: "Apakah Anda yakin ingin membatalkan reservasi ini?",
    type: "warning",
    html: `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 text-sm">
        <div class="flex items-center gap-2 mb-2">
          <i data-lucide="alert-triangle" class="w-5 h-5 text-red-600"></i>
          <span class="font-semibold text-red-900">Perhatian!</span>
        </div>
        <p class="text-red-800">
          Reservasi <strong>${reservation.customerName}</strong> untuk Meja ${reservation.tableNumber} akan dibatalkan.
        </p>
        <p class="text-xs text-red-700">
          Tindakan ini tidak dapat dibatalkan dan meja akan tersedia untuk pelanggan lain.
        </p>
      </div>
    `,
    confirmText: "Ya, Batalkan",
    cancelText: "Tidak, Kembali",
    size: "md",
    onConfirm: () => {
      StorageBridge.cancelReservation(reservationId, "Dibatalkan oleh kasir");
      Modal.success({
        title: "Reservasi Dibatalkan",
        message: `Reservasi ${reservation.customerName} telah dibatalkan`,
        icon: "x-circle",
        confirmText: "OK",
      });
    },
  });
}

/**
 * ✅ GANTI: Detail reservasi dengan modal (pengganti alert)
 */
function showReservationDetail(reservationId) {
  const reservation = StorageBridge.getReservationById(reservationId);
  if (!reservation) return;

  const statusConfig = {
    confirmed: { label: "Dikonfirmasi", color: "blue", icon: "check-circle" },
    "checked-in": { label: "Check-in", color: "green", icon: "log-in" },
    "checked-out": { label: "Selesai", color: "gray", icon: "log-out" },
    cancelled: { label: "Dibatalkan", color: "red", icon: "x-circle" },
  };
  const status = statusConfig[reservation.status] || statusConfig.confirmed;

  Modal.alert({
    title: "Detail Reservasi",
    message: `ID: ${reservation.id}`,
    html: `
      <div class="space-y-4">
        <!-- Status Badge -->
        <div class="flex justify-center">
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${status.color}-100 text-${status.color}-700 font-semibold text-sm">
            <i data-lucide="${status.icon}" class="w-4 h-4"></i>
            ${status.label}
          </span>
        </div>
        
        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="bg-cream rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">👤 Nama</p>
            <p class="font-semibold">${reservation.customerName}</p>
          </div>
          <div class="bg-cream rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">📱 WhatsApp</p>
            <p class="font-semibold">${reservation.customerPhone}</p>
          </div>
          <div class="bg-cream rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">🪑 Meja</p>
            <p class="font-semibold">Meja ${reservation.tableNumber}</p>
          </div>
          <div class="bg-cream rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1"> Tamu</p>
            <p class="font-semibold">${reservation.guestCount} orang</p>
          </div>
          <div class="bg-cream rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">📅 Tanggal</p>
            <p class="font-semibold">${formatReservationDate(reservation.date)}</p>
          </div>
          <div class="bg-cream rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">🕐 Waktu</p>
            <p class="font-semibold">${reservation.time} - ${reservation.endTime}</p>
          </div>
        </div>
        
        <!-- Payment Info -->
        <div class="bg-forest/5 rounded-lg p-3 border border-forest/20">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">Metode Pembayaran:</span>
            <span class="font-semibold">${reservation.paymentMethod}</span>
          </div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">Total:</span>
            <span class="font-bold text-forest">Rp ${(reservation.total || 0).toLocaleString("id-ID")}</span>
          </div>
          <div class="flex justify-between text-xs text-gray-500">
            <span>Dibuat:</span>
            <span>${new Date(reservation.createdAt).toLocaleString("id-ID")}</span>
          </div>
        </div>
        
        <!-- Pre-order Menu -->
        ${
          reservation.menuOrders && reservation.menuOrders.length > 0
            ? `
          <div>
            <p class="text-sm font-semibold text-forest mb-2 flex items-center gap-2">
              <i data-lucide="utensils" class="w-4 h-4"></i>
              Pre-order Menu
            </p>
            <div class="space-y-1">
              ${reservation.menuOrders
                .map(
                  (item) => `
                <div class="flex justify-between text-sm bg-cream rounded-lg px-3 py-2">
                  <span>${item.name} ×${item.qty}</span>
                  <span class="font-semibold">Rp ${(item.price * item.qty).toLocaleString("id-ID")}</span>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        
        <!-- Status History -->
        ${
          reservation.statusHistory && reservation.statusHistory.length > 0
            ? `
          <div>
            <p class="text-sm font-semibold text-forest mb-2 flex items-center gap-2">
              <i data-lucide="history" class="w-4 h-4"></i>
              Riwayat Status
            </p>
            <div class="space-y-2">
              ${reservation.statusHistory
                .slice()
                .reverse()
                .map(
                  (h) => `
                <div class="flex items-start gap-2 text-xs">
                  <div class="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 flex-shrink-0"></div>
                  <div class="flex-1">
                    <p class="font-semibold capitalize">${h.status}</p>
                    <p class="text-gray-500">${new Date(h.timestamp).toLocaleString("id-ID")}</p>
                    ${h.note ? `<p class="text-gray-400 italic">${h.note}</p>` : ""}
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `,
    confirmText: "Tutup",
    size: "lg",
  });
}

/**
 * Show notification untuk reservasi baru
 */
function showReservationNotification(reservation) {
  // Play sound
  playNotificationSound();

  // Show toast
  const toast = document.createElement("div");
  toast.className =
    "fixed top-20 right-4 bg-white border-2 border-forest rounded-2xl shadow-2xl p-4 z-50 max-w-sm animate-slide-in-right";
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
        <i data-lucide="calendar-check" class="w-5 h-5 text-forest"></i>
      </div>
      <div class="flex-1">
        <p class="font-semibold text-forest text-sm">Reservasi Baru!</p>
        <p class="text-xs text-gray-600 mt-1">
          <strong>${reservation.customerName}</strong> • Meja ${reservation.tableNumber}
        </p>
        <p class="text-xs text-gray-500 mt-0.5">
          ${formatReservationDate(reservation.date)} • ${reservation.time}
        </p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>
  `;

  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  // Auto remove after 5s
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  // Create beep sound using Web Audio API
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.5,
    );

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.log("Audio not supported");
  }
}

/**
 * Check if reservation is new (less than 1 minute)
 */
function isReservationNew(reservation) {
  const createdAt = new Date(reservation.createdAt).getTime();
  const now = Date.now();
  return now - createdAt < 60000; // 1 minute
}

/**
 * Format date untuk display
 */
function formatReservationDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Validate barcode
 */
function validateBarcode() {
  const barcode = document.getElementById("barcodeInput")?.value.trim();
  if (!barcode) {
    Modal.warning({
      title: "Barcode Kosong",
      message: "Silakan scan atau masukkan barcode reservasi",
      icon: "scan-line",
      confirmText: "OK",
    });
    return;
  }

  const reservation = StorageBridge.getReservationById(barcode);

  if (!reservation) {
    Modal.error({
      title: "Barcode Tidak Valid",
      message:
        "Reservasi dengan barcode tersebut tidak ditemukan dalam sistem.",
      icon: "scan-x",
      confirmText: "Coba Lagi",
    });
    return;
  }

  if (reservation.status === "checked-in") {
    Modal.warning({
      title: "Sudah Check-in",
      message: `Pelanggan ${reservation.customerName} sudah melakukan check-in di Meja ${reservation.tableNumber}`,
      icon: "check-circle",
      confirmText: "OK",
    });
    return;
  }

  if (reservation.status === "cancelled") {
    Modal.error({
      title: "Reservasi Dibatalkan",
      message: `Reservasi ini sudah dibatalkan`,
      icon: "x-circle",
      confirmText: "OK",
    });
    return;
  }

  if (reservation.status === "checked-out") {
    Modal.warning({
      title: "Sudah Check-out",
      message: `Reservasi ini sudah selesai (check-out)`,
      icon: "log-out",
      confirmText: "OK",
    });
    return;
  }

  // Tampilkan detail & konfirmasi check-in
  Modal.confirm({
    title: "Reservasi Ditemukan!",
    message: "Konfirmasi check-in untuk pelanggan ini?",
    html: `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm">
        <div class="flex items-center gap-2 mb-3">
          <i data-lucide="check-circle" class="w-6 h-6 text-green-600"></i>
          <span class="font-bold text-green-900 text-lg">${reservation.customerName}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <p class="text-xs text-gray-600">Meja</p>
            <p class="font-bold text-green-900">Meja ${reservation.tableNumber}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Waktu</p>
            <p class="font-bold text-green-900">${reservation.time} - ${reservation.endTime}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Tamu</p>
            <p class="font-bold text-green-900">${reservation.guestCount} orang</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Status</p>
            <p class="font-bold text-green-900 capitalize">${reservation.status}</p>
          </div>
        </div>
        ${
          reservation.menuOrders && reservation.menuOrders.length > 0
            ? `
          <div class="border-t border-green-200 pt-2 mt-2">
            <p class="text-xs text-gray-600 mb-1">Pre-order Menu:</p>
            ${reservation.menuOrders
              .map(
                (item) => `
              <p class="text-xs text-green-800">• ${item.name} ×${item.qty}</p>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `,
    confirmText: "Check-in Sekarang",
    cancelText: "Batal",
    size: "md",
    onConfirm: () => {
      checkInReservation(reservation.id);
      document.getElementById("barcodeInput").value = "";
    },
  });
}

// ===== ORDER TRACKING PAGE =====

function renderOrderTrackingPage(container) {
  // ✅ CARA 1: Ambil ID dari URL params (?id=XXX)
  const urlParams = new URLSearchParams(
    window.location.hash.split("?")[1] || "",
  );
  const orderIdFromUrl = urlParams.get("id");

  // ✅ CARA 2: Ambil dari sessionStorage (setelah pembayaran)
  const confirmedOrder = JSON.parse(
    sessionStorage.getItem("confirmedOrder") || "null",
  );

  // ✅ CARA 3: Cari di StorageBridge
  let order = null;

  if (orderIdFromUrl) {
    order = StorageBridge.getOrders().find(
      (o) => o.id === orderIdFromUrl || o.order_id === orderIdFromUrl,
    );
  }

  if (!order && confirmedOrder) {
    order = StorageBridge.getOrders().find(
      (o) => o.id === confirmedOrder.id || o.order_id === confirmedOrder.id,
    );
  }

  // Jika masih tidak ada, tampilkan halaman error
  if (!order) {
    container.innerHTML = `
      <main class="max-w-2xl mx-auto px-4 py-8">
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <i data-lucide="alert-circle" class="w-8 h-8 text-red-600"></i>
          </div>
          <h2 class="font-display text-2xl text-forest mb-2">Order ID Tidak Ditemukan</h2>
          <p class="text-gray-600 mb-6">Silakan masukkan ID pesanan Anda untuk melacak statusnya</p>
          <a href="#/search-order" class="btn btn-primary inline-block">
            <i data-lucide="search" class="w-4 h-4 mr-2"></i>
            Cari Pesanan
          </a>
        </div>
      </main>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // ✅ Normalize order
  const normalizedOrder = {
    order_id: order.order_id || order.id,
    id: order.id || order.order_id,
    date: order.date || order.createdAt,
    items: order.items || order.menuOrders || [],
    payment_method: order.payment_method || order.paymentMethod || "CASH",
    status: order.status || "pending",
    status_history: order.status_history || order.statusHistory || [],
    total: order.total || 0,
    orderType: order.orderType || "reservation",
    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    deliveryAddress: order.deliveryAddress || "",
    deliveryNotes: order.deliveryNotes || "",
    tableNumber: order.tableNumber || null,
    tableName: order.tableName || "",
    guestCount: order.guestCount || 0,
  };

  // ✅ Simpan ke sessionStorage untuk referensi selanjutnya
  sessionStorage.setItem("confirmedOrder", JSON.stringify(order));

  // ✅ Listen untuk update status real-time
  StorageBridge.on("order:update", (updatedOrder) => {
    if (
      updatedOrder.id === normalizedOrder.id ||
      updatedOrder.order_id === normalizedOrder.order_id
    ) {
      console.log("🔄 Order status updated:", updatedOrder);
      renderOrderTrackingPage(container);
    }
  });

  // Status steps
  const statusSteps =
    normalizedOrder.orderType === "delivery"
      ? [
          {
            key: "pending",
            label: "Pesanan Diterima",
            icon: "check-circle",
            color: "green",
          },
          {
            key: "preparing",
            label: "Sedang Diproses",
            icon: "chef-hat",
            color: "blue",
          },
          {
            key: "ready",
            label: "Siap Dikirim",
            icon: "package-check",
            color: "purple",
          },
          {
            key: "shipping",
            label: "Sedang Dikirim",
            icon: "truck",
            color: "orange",
          },
          {
            key: "completed",
            label: "Selesai",
            icon: "badge-check",
            color: "forest",
          },
        ]
      : [
          {
            key: "confirmed",
            label: "Dikonfirmasi",
            icon: "check-circle",
            color: "green",
          },
          {
            key: "checked-in",
            label: "Check-in",
            icon: "log-in",
            color: "blue",
          },
          {
            key: "checked-out",
            label: "Selesai",
            icon: "log-out",
            color: "forest",
          },
        ];

  const currentStatusIndex = statusSteps.findIndex(
    (s) => s.key === normalizedOrder.status,
  );
  const isCancelled = normalizedOrder.status === "cancelled";

  container.innerHTML = `
    <!-- Header -->
    <div class="${isCancelled ? "bg-red-600" : normalizedOrder.orderType === "delivery" ? "bg-terra" : "bg-forest"} text-white py-8 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="${isCancelled ? "x-circle" : normalizedOrder.orderType === "delivery" ? "shopping-bag" : "calendar-check"}" class="w-10 h-10"></i>
        </div>
        <h1 class="font-display text-3xl mb-2">
          ${isCancelled ? "Pesanan Dibatalkan" : normalizedOrder.orderType === "delivery" ? "Pesanan Berhasil!" : "Reservasi Berhasil!"}
        </h1>
        <p class="text-white/80">ID Pesanan: ${normalizedOrder.order_id}</p>
      </div>
    </div>
<!-- Status Pembayaran -->
${
  normalizedOrder.paymentProof
    ? `
  <div class="card mb-6">
    <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
      <i data-lucide="shield-check" class="w-5 h-5 text-forest"></i>
      Status Pembayaran
    </h2>
    
    <div class="flex items-start gap-3 p-3 rounded-lg ${
      normalizedOrder.paymentStatus === "verified"
        ? "bg-green-50 border border-green-200"
        : normalizedOrder.paymentStatus === "rejected"
          ? "bg-red-50 border border-red-200"
          : "bg-amber-50 border border-amber-200"
    }">
      <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        normalizedOrder.paymentStatus === "verified"
          ? "bg-green-500 text-white"
          : normalizedOrder.paymentStatus === "rejected"
            ? "bg-red-500 text-white"
            : "bg-amber-500 text-white"
      }">
        <i data-lucide="${
          normalizedOrder.paymentStatus === "verified"
            ? "check-circle"
            : normalizedOrder.paymentStatus === "rejected"
              ? "x-circle"
              : "clock"
        }" class="w-5 h-5"></i>
      </div>
      <div class="flex-1">
        <p class="font-semibold ${
          normalizedOrder.paymentStatus === "verified"
            ? "text-green-900"
            : normalizedOrder.paymentStatus === "rejected"
              ? "text-red-900"
              : "text-amber-900"
        }">
          ${
            normalizedOrder.paymentStatus === "verified"
              ? "Pembayaran Terverifikasi"
              : normalizedOrder.paymentStatus === "rejected"
                ? "Pembayaran Ditolak"
                : "Menunggu Verifikasi"
          }
        </p>
        <p class="text-xs mt-1 ${
          normalizedOrder.paymentStatus === "verified"
            ? "text-green-700"
            : normalizedOrder.paymentStatus === "rejected"
              ? "text-red-700"
              : "text-amber-700"
        }">
          ${
            normalizedOrder.paymentStatus === "verified"
              ? "Pesanan Anda sedang diproses"
              : normalizedOrder.paymentStatus === "rejected"
                ? "Silakan hubungi kami untuk informasi lebih lanjut"
                : "Admin sedang memverifikasi bukti pembayaran Anda"
          }
        </p>
      </div>
    </div>
    
    <!-- Preview bukti pembayaran -->
    <div class="mt-4">
      <p class="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <i data-lucide="image" class="w-3 h-3"></i>
        Bukti Pembayaran Anda:
      </p>
      <div class="bg-cream rounded-lg p-2 border border-gray-200">
        <img src="${normalizedOrder.paymentProof.data}" 
             alt="Bukti Pembayaran" 
             class="max-h-48 w-full object-contain rounded">
        <p class="text-xs text-gray-500 mt-2 text-center">${normalizedOrder.paymentProof.name}</p>
      </div>
    </div>
  </div>
`
    : ""
}

    <main class="max-w-2xl mx-auto px-4 py-8">
      
      <!-- Status Tracking -->
      ${
        !isCancelled
          ? `
        <div class="card mb-6">
          <h2 class="font-semibold text-lg mb-6 flex items-center gap-2">
            <i data-lucide="route" class="w-5 h-5 text-forest"></i>
            Status Pesanan
          </h2>
          
          <div class="space-y-0">
            ${statusSteps
              .map((step, index) => {
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return `
                <div class="flex gap-4 ${index < statusSteps.length - 1 ? "pb-6" : ""}">
                  <div class="flex flex-col items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                            ? "bg-forest text-white animate-pulse"
                            : "bg-gray-200 text-gray-400"
                      }">
                      <i data-lucide="${isCompleted ? "check" : step.icon}" class="w-5 h-5"></i>
                    </div>
                    ${
                      index < statusSteps.length - 1
                        ? `
                      <div class="w-0.5 flex-1 mt-2 ${isCompleted ? "bg-green-500" : "bg-gray-200"}"></div>
                    `
                        : ""
                    }
                  </div>
                  <div class="flex-1 pt-1">
                    <p class="font-semibold ${isCurrent ? "text-forest" : isCompleted ? "text-green-600" : "text-gray-400"}">
                      ${step.label}
                    </p>
                    ${
                      isCurrent && normalizedOrder.status_history?.length > 0
                        ? `
                      <p class="text-xs text-gray-500 mt-1">
                        ${new Date(normalizedOrder.status_history[normalizedOrder.status_history.length - 1].timestamp).toLocaleString("id-ID")}
                      </p>
                      ${
                        normalizedOrder.status_history[
                          normalizedOrder.status_history.length - 1
                        ].note
                          ? `
                        <p class="text-xs text-gray-600 mt-1 italic">${normalizedOrder.status_history[normalizedOrder.status_history.length - 1].note}</p>
                      `
                          : ""
                      }
                    `
                        : ""
                    }
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
          
          <div class="mt-4 p-3 bg-forest/5 border border-forest/20 rounded-lg text-xs text-gray-600 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4 flex-shrink-0"></i>
            <span>Status akan diupdate secara real-time oleh restoran</span>
          </div>
        </div>
      `
          : ""
      }

      <!-- Order Details -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4">Detail Pesanan</h2>
        <div class="space-y-3 text-sm">
          ${
            normalizedOrder.orderType === "delivery"
              ? `
            <div class="bg-terra/5 border border-terra/20 rounded-lg p-3">
              <h3 class="font-semibold text-terra mb-2 flex items-center gap-2">
                <i data-lucide="truck" class="w-4 h-4"></i>
                Info Pengiriman
              </h3>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600">Nama</span>
                  <span class="font-semibold">${normalizedOrder.customerName}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">WhatsApp</span>
                  <span class="font-semibold">${normalizedOrder.customerPhone}</span>
                </div>
                <div>
                  <span class="text-gray-600">Alamat</span>
                  <p class="font-semibold mt-1">${normalizedOrder.deliveryAddress}</p>
                  ${normalizedOrder.deliveryNotes ? `<p class="text-xs text-gray-500 mt-1 italic">Catatan: ${normalizedOrder.deliveryNotes}</p>` : ""}
                </div>
              </div>
            </div>
          `
              : `
            <div class="bg-forest/5 border border-forest/20 rounded-lg p-3">
              <h3 class="font-semibold text-forest mb-2 flex items-center gap-2">
                <i data-lucide="calendar" class="w-4 h-4"></i>
                Info Reservasi
              </h3>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600">Meja</span>
                  <span class="font-semibold">${normalizedOrder.tableName || "Meja " + normalizedOrder.tableNumber}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tanggal</span>
                  <span class="font-semibold">${new Date(normalizedOrder.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Waktu</span>
                  <span class="font-semibold">${new Date(normalizedOrder.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Jumlah Tamu</span>
                  <span class="font-semibold">${normalizedOrder.guestCount} orang</span>
                </div>
              </div>
            </div>
          `
          }
          
          <div class="border-t pt-3">
            <p class="font-semibold mb-2">Menu Pesanan:</p>
            <div class="space-y-2">
              ${normalizedOrder.items
                .map((item) => {
                  const variantText = formatVariants(item.variants);
                  return `
                  <div class="py-1.5">
                    <div class="flex justify-between text-sm">
                      <span>${item.name} ×${item.qty}</span>
                      <span class="font-semibold">Rp ${(item.price * item.qty).toLocaleString("id-ID")}</span>
                    </div>
                    ${
                      variantText
                        ? `
                      <p class="text-xs text-forest mt-0.5 flex items-center gap-1">
                        <i data-lucide="tag" class="w-3 h-3"></i>
                        ${variantText}
                      </p>
                    `
                        : ""
                    }
                  </div>
                `;
                })
                .join("")}
            </div>
            <div class="border-t mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span class="text-forest">Rp ${normalizedOrder.total.toLocaleString("id-ID")}</span>
            </div>
          </div>

      <!-- Actions -->
      <div class="space-y-3">
        <button onclick="contactRestaurant('${normalizedOrder.order_id}')" class="btn btn-primary btn-full">
          <i data-lucide="message-circle" class="w-5 h-5 mr-2"></i>
          Hubungi Restoran
        </button>
        <a href="#/search-order" class="btn btn-secondary btn-full block text-center">
          <i data-lucide="search" class="w-5 h-5 mr-2"></i>
          Cari Pesanan Lain
        </a>
        <a href="#/home" class="btn btn-secondary btn-full block text-center">
          Kembali ke Beranda
        </a>
      </div>

    </main>
  `;

  if (window.lucide) lucide.createIcons();
}

function contactRestaurant(orderId) {
  const order = StorageBridge.getOrders().find(
    (o) => o.id === orderId || o.order_id === orderId,
  );
  if (!order) return;

  const message = `
Halo Sban's Corner,

Saya ingin menanyakan tentang pesanan saya:

ID Pesanan: ${orderId}
Status: ${order.status}

Terima kasih!
  `.trim();

  // Ganti dengan nomor WhatsApp restoran yang asli
  const restaurantPhone = "6281313549719";
  const url = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

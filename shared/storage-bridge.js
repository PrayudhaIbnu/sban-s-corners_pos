// ===== STORAGE BRIDGE =====
// Utility untuk sinkronisasi data antar aplikasi

const ORDER_TYPES = {
  RESERVATION: "reservation",
  DELIVERY: "delivery",
};

const ORDER_STATUS = {
  // Status untuk Reservasi
  RESERVATION_CONFIRMED: "confirmed",
  RESERVATION_CHECKED_IN: "checked-in",
  RESERVATION_CHECKED_OUT: "checked-out",
  RESERVATION_CANCELLED: "cancelled",

  // Status untuk Delivery
  DELIVERY_PENDING: "pending",
  DELIVERY_PREPARING: "preparing",
  DELIVERY_READY: "ready",
  DELIVERY_SHIPPING: "shipping",
  DELIVERY_COMPLETED: "completed",
  DELIVERY_CANCELLED: "cancelled",
};

const StorageBridge = {
  channel: null,
  listeners: {},

  init() {
    if ("BroadcastChannel" in window) {
      this.channel = new BroadcastChannel("sbans_sync");
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      console.log("🔗 StorageBridge initialized with BroadcastChannel");
    }

    window.addEventListener("storage", (e) => {
      if (e.key === "sbans_orders" && this.listeners["order:new"]) {
        const newOrders = JSON.parse(e.newValue || "[]");
        this.listeners["order:new"].forEach((fn) =>
          fn(newOrders[newOrders.length - 1]),
        );
      }
    });

    this.syncOrders();
  },

  broadcast(type, data) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      source: window.location.pathname,
    };

    if (this.channel) {
      this.channel.postMessage(message);
    }
    this.handleMessage(message);
  },

  handleMessage(message) {
    const { type, data } = message;
    if (this.listeners[type]) {
      this.listeners[type].forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error("Error in listener:", err);
        }
      });
    }
  },

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (fn) => fn !== callback,
    );
  },

  // Tambahkan di dalam StorageBridge object:

  /**
   * ✅ Konfirmasi pembayaran dan update status
   * @param {string} orderId - ID pesanan
   * @param {boolean} isVerified - true = verifikasi, false = tolak
   * @param {string} adminNote - Catatan dari admin (opsional)
   */
  confirmPayment(orderId, isVerified, adminNote = "") {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(
      (o) => o.id === orderId || o.order_id === orderId,
    );

    if (orderIndex === -1) return false;

    const order = orders[orderIndex];
    const timestamp = new Date().toISOString();

    order.paymentStatus = isVerified ? "verified" : "rejected";
    order.paymentVerifiedAt = timestamp;
    order.paymentVerifiedBy = "admin";

    if (isVerified) {
      order.status = order.orderType === "delivery" ? "preparing" : "confirmed";
      order.statusHistory.push({
        status: order.status,
        timestamp: timestamp,
        note: adminNote || "Pembayaran diverifikasi oleh admin",
      });
    } else {
      order.status = "cancelled";
      order.statusHistory.push({
        status: "cancelled",
        timestamp: timestamp,
        note: adminNote || "Pembayaran ditolak oleh admin",
      });
    }

    orders[orderIndex] = order;
    localStorage.setItem("sbans_orders", JSON.stringify(orders));
    this.broadcast("order:payment_confirmed", { order, isVerified, adminNote });

    return order;
  },

  /**
   * ✅ Kirim notifikasi WhatsApp ke customer
   * @param {string} phone - Nomor WhatsApp customer
   * @param {object} order - Data pesanan
   * @param {boolean} isVerified - Status verifikasi
   * @param {string} adminNote - Catatan admin
   */
  sendWhatsAppNotification(phone, order, isVerified, adminNote = "") {
    // Format nomor WhatsApp (hapus 0 di depan, tambah 62)
    const formattedPhone = phone.replace(/^0/, "62");

    // Pesan untuk verifikasi
    const verifiedMessage = `
*RESERVASI DIKONFIRMASI!*

Halo ${order.customerName},

Terima kasih telah melakukan reservasi di Sban's Corner!

*Detail Reservasi:*
- ID: ${order.order_id}
- Meja: ${order.tableName || "Meja " + order.tableNumber}
- Tanggal: ${new Date(order.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
- Waktu: ${order.time} - ${order.endTime}
- Jumlah Tamu: ${order.guestCount} orang

*Status Pembayaran:* _Terverifikasi_
${
  order.menuOrders && order.menuOrders.length > 0
    ? `
*Pre-order Menu:*
${order.menuOrders.map((item) => `• ${item.name} ×${item.qty}`).join("\n")}
Total: Rp ${(order.total || 0).toLocaleString("id-ID")}
`
    : ""
}
${
  adminNote
    ? `
*Catatan dari Admin:*
${adminNote}
`
    : ""
}
Harap tunjukkan bukti reservasi ini saat datang ke restoran.

Kami tunggu kedatangan Anda! 😊

*SBAN'S CORNER*
Alamat Restoran
0812-3456-7890
  `.trim();

    // Pesan untuk penolakan
    const rejectedMessage = `
*RESERVASI DITOLAK!*

Halo ${order.customerName},

Mohon maaf, reservasi Anda tidak dapat diproses.

*Detail:*
- ID: ${order.order_id}
- Tanggal: ${new Date(order.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}

*Alasan:*
${adminNote || "Bukti pembayaran tidak valid atau tidak sesuai"}

Silakan hubungi kami untuk informasi lebih lanjut atau melakukan reservasi ulang.

*SBAN'S CORNER*
0812-3456-7890
  `.trim();

    const message = isVerified ? verifiedMessage : rejectedMessage;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    // Buka WhatsApp di tab baru
    window.open(whatsappUrl, "_blank");

    console.log("📱 WhatsApp notification sent to:", phone);

    return whatsappUrl;
  },

  // ========================================
  // ORDERS (Unified: Reservation + Delivery)
  // ========================================

  getOrders() {
    const data = localStorage.getItem("sbans_orders");
    return data ? JSON.parse(data) : [];
  },

  saveOrder(order) {
    const orders = this.getOrders();
    const existingIndex = orders.findIndex((o) => o.id === order.id);

    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...order };
    } else {
      orders.push(order);
    }

    localStorage.setItem("sbans_orders", JSON.stringify(orders));
    this.broadcast("order:new", order);

    console.log("💾 Order saved:", order.id, "Total orders:", orders.length);

    return order;
  },

  updateOrderStatus(orderId, newStatus, note = "") {
    const orders = this.getOrders();
    const order = orders.find(
      (o) => o.id === orderId || o.order_id === orderId,
    );

    if (!order) return false;

    order.status = newStatus;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note,
    });

    if (newStatus === ORDER_STATUS.DELIVERY_SHIPPING) {
      order.shippedAt = new Date().toISOString();
    } else if (newStatus === ORDER_STATUS.DELIVERY_COMPLETED) {
      order.completedAt = new Date().toISOString();
    }

    localStorage.setItem("sbans_orders", JSON.stringify(orders));
    this.broadcast("order:update", order);

    console.log("🔄 Order status updated:", orderId, "to", newStatus);

    return order;
  },

  // ✅ BARU: Get order by ID (support both id dan order_id)
  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find((o) => o.id === id || o.order_id === id);
  },

  getReservationById(id) {
    return this.getOrderById(id);
  },

  getOrdersByType(type) {
    return this.getOrders().filter((o) => o.orderType === type);
  },

  getActiveOrders() {
    return this.getOrders().filter((o) => {
      if (o.orderType === ORDER_TYPES.RESERVATION) {
        return (
          o.status !== ORDER_STATUS.RESERVATION_CANCELLED &&
          o.status !== ORDER_STATUS.RESERVATION_CHECKED_OUT
        );
      } else {
        return (
          o.status !== ORDER_STATUS.DELIVERY_CANCELLED &&
          o.status !== ORDER_STATUS.DELIVERY_COMPLETED
        );
      }
    });
  },

  // Backward compatibility untuk reservations
  getReservations() {
    return this.getOrdersByType(ORDER_TYPES.RESERVATION);
  },

  saveReservation(reservation) {
    return this.saveOrder({
      ...reservation,
      orderType: ORDER_TYPES.RESERVATION,
      // status: reservation.status || ORDER_STATUS.RESERVATION_CONFIRMED,
    });
  },

  saveDeliveryOrder(order) {
    return this.saveOrder({
      ...order,
      orderType: ORDER_TYPES.DELIVERY,
      // status: order.status || ORDER_STATUS.DELIVERY_PENDING,
      statusHistory: [
        {
          status: ORDER_STATUS.DELIVERY_PENDING,
          timestamp: new Date().toISOString(),
          note: "Pesanan online dibuat",
        },
      ],
    });
  },

  // Sync orders dari localStorage lain
  syncOrders() {
    console.log("🔄 Syncing orders...");

    const oldTransactions = localStorage.getItem("sbans_transactions");
    const oldReservations = localStorage.getItem("sbans_reservations");

    let orders = this.getOrders();
    let synced = 0;

    if (oldTransactions) {
      const transactions = JSON.parse(oldTransactions);
      transactions.forEach((t) => {
        if (!orders.find((o) => o.id === t.id || o.id === t.order_id)) {
          orders.push({
            ...t,
            id: t.id || t.order_id,
            orderType: t.orderType || "reservation",
            order_id: t.order_id || t.id,
            createdAt: t.createdAt || t.date,
            date: t.date || t.createdAt,
          });
          synced++;
        }
      });
    }

    if (oldReservations) {
      const reservations = JSON.parse(oldReservations);
      reservations.forEach((r) => {
        if (!orders.find((o) => o.id === r.id)) {
          orders.push({
            ...r,
            orderType: "reservation",
            createdAt: r.createdAt || r.date,
          });
          synced++;
        }
      });
    }

    if (synced > 0) {
      localStorage.setItem("sbans_orders", JSON.stringify(orders));
      console.log(`✅ Synced ${synced} orders from old storage`);
    }

    return orders;
  },
};

// Auto-init saat script di-load
StorageBridge.init();

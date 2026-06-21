// ===== ORDER ONLINE (DELIVERY) =====
// Khusus untuk flow Pesan Online

let orderCart = [];
let orderCurrentCategory = "all";

function renderOrderPage(container) {
  orderCart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");
  orderCurrentCategory = "all";

  container.innerHTML = `
    <main class="max-w-6xl mx-auto px-4 py-8 pb-32">
      <div class="mb-6">
        <h1 class="font-display text-3xl text-terra mb-2">Pesan Online</h1>
        <p class="text-gray-600">Pilih menu favorit Anda untuk diantar ke rumah</p>
      </div>

      <!-- Info Banner -->
      <div class="bg-terra/5 border border-terra/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <i data-lucide="info" class="w-5 h-5 text-terra flex-shrink-0 mt-0.5"></i>
        <div class="text-sm">
          <p class="font-semibold text-terra mb-1">Informasi Pengiriman</p>
          <p class="text-gray-600">Pesanan akan diantar menggunakan Gojek/Grab Instan. Pembayaran wajib di awal (QRIS/Transfer).</p>
        </div>
      </div>

      <!-- Categories -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onclick="filterOrderMenu('all', this)" class="cat-btn ${orderCurrentCategory === "all" ? "active-cat" : ""}">
          Semua
        </button>
        <button onclick="filterOrderMenu('Food', this)" class="cat-btn ${orderCurrentCategory === "Food" ? "active-cat" : ""}">
          Food
        </button>
        <button onclick="filterOrderMenu('Snack', this)" class="cat-btn ${orderCurrentCategory === "Snack" ? "active-cat" : ""}">
          Snack
        </button>
        <button onclick="filterOrderMenu('Beverage', this)" class="cat-btn ${orderCurrentCategory === "Beverage" ? "active-cat" : ""}">
          Beverage
        </button>
      </div>

      <!-- Menu Grid -->
      <div id="orderMenuGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      </div>
    </main>

    <!-- Sticky Cart Summary -->
    <div id="orderCartSummary" class="cart-summary">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-gray-600">Total Pesanan</p>
          <p class="text-xl font-bold text-terra" id="orderCartTotal">Rp 0</p>
          <p class="text-xs text-gray-500" id="orderCartCount">0 item</p>
        </div>
        <button onclick="proceedToOrderCheckout()" class="btn btn-terra">
          Checkout →
        </button>
      </div>
    </div>
  `;

  renderOrderMenu();
}

function renderOrderMenu() {
  const grid = document.getElementById("orderMenuGrid");
  if (!grid) return;

  const items = typeof menuItems !== "undefined" ? menuItems : [];
  const filtered =
    orderCurrentCategory === "all"
      ? items
      : items.filter((item) => item.cat === orderCurrentCategory);

  orderCart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="package" class="w-12 h-12 mx-auto mb-2 opacity-30"></i>
        <p>Belum ada menu di kategori ini</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered
    .map((item) => {
      const totalQty = orderCart
        .filter((c) => c.id === item.id)
        .reduce((sum, c) => sum + c.qty, 0);

      const hasVariant = hasVariants(item);

      return `
      <div class="menu-card stagger-item">
        <div class="menu-card-image" style="position: relative;">
          <img src="${item.images || ""}" alt="${item.name}" onerror="this.style.display='none'">
          ${
            hasVariant
              ? `
            <div class="absolute top-2 right-2 bg-terra text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i data-lucide="layers" class="w-3 h-3"></i>
              Ada Variasi
            </div>
          `
              : ""
          }
        </div>
        <div class="menu-card-body">
          <h3 class="menu-card-title">${item.name}</h3>
          <p class="menu-card-category">${item.cat}</p>
          <p class="menu-card-description">${item.details || ""}</p>
          
          ${
            hasVariant
              ? `
            <div class="mb-3">
              <p class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <i data-lucide="layers" class="w-3 h-3"></i>
                ${item.variants.map((v) => v.title).join(", ")}
              </p>
            </div>
          `
              : ""
          }
          
          <div class="menu-card-footer">
            <span class="menu-card-price">${formatCurrency(item.price)}</span>
            ${
              totalQty > 0
                ? `
              <div class="qty-control">
                <button onclick="updateOrderCartQty(${item.id}, -1)" class="qty-btn">−</button>
                <span class="qty-value">${totalQty}</span>
                <button onclick="addToOrderCart(${item.id})" class="qty-btn">+</button>
              </div>
            `
                : `
              <button onclick="addToOrderCart(${item.id})" class="btn btn-terra" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                <i data-lucide="${hasVariant ? "layers" : "plus"}" class="w-4 h-4"></i>
                ${hasVariant ? "Pilih Variasi" : "Tambah"}
              </button>
            `
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
  updateOrderCartSummary();
}

function filterOrderMenu(category, btn) {
  orderCurrentCategory = category;
  document
    .querySelectorAll("#orderMenuGrid")
    .closest("main")
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.remove("active-cat"));
  btn.classList.add("active-cat");
  renderOrderMenu();
}

function openOrderDetail(orderId) {
  const order = getAllNormalizedOrders().find(o => o.order_id === orderId);
  if (!order) {
    console.error('Order not found:', orderId);
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

  // ✅ Info pembayaran dengan status verifikasi
  const paymentVerificationHTML = `
    <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div class="flex items-start justify-between mb-3">
        <h4 class="font-semibold text-amber-900 flex items-center gap-2">
          ${icon("shield-check", "w-4 h-4")}
          Status Pembayaran
        </h4>
        ${order.paymentStatus === 'pending_verification' ? `
          <span class="text-xs font-bold px-2 py-1 rounded-full bg-amber-500 text-white flex items-center gap-1">
            ${icon("clock", "w-3 h-3")}
            Menunggu Verifikasi
          </span>
        ` : order.paymentStatus === 'verified' ? `
          <span class="text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white flex items-center gap-1">
            ${icon("check-circle", "w-3 h-3")}
            Terverifikasi
          </span>
        ` : `
          <span class="text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white flex items-center gap-1">
            ${icon("x-circle", "w-3 h-3")}
            Ditolak
          </span>
        `}
      </div>
      
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Metode:</span>
          <span class="font-semibold">${order.payment_method}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Total:</span>
          <span class="font-bold text-forest">Rp ${(order.total || 0).toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      ${order.paymentProof ? `
        <div class="mt-3 pt-3 border-t border-amber-200">
          <p class="text-xs text-gray-600 mb-2 flex items-center gap-1">
            ${icon("image", "w-3 h-3")}
            Bukti Pembayaran:
          </p>
          <div class="bg-white rounded-lg p-2 border border-gray-200">
            <img src="${order.paymentProof.data}" 
                 alt="Bukti Pembayaran" 
                 class="max-h-48 w-full object-contain rounded cursor-pointer hover:scale-105 transition"
                 onclick="viewFullImage('${order.order_id}')">
            <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span class="truncate">${order.paymentProof.name}</span>
              <span>${new Date(order.paymentProof.uploadedAt).toLocaleString('id-ID', {hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'})}</span>
            </div>
          </div>
          
          <!-- ✅ Tombol verifikasi untuk admin -->
          ${order.paymentStatus === 'pending_verification' ? `
            <div class="flex gap-2 mt-3">
              <button onclick="verifyPayment('${order.order_id}', true)" class="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1">
                ${icon("check-circle", "w-4 h-4")}
                Verifikasi
              </button>
              <button onclick="verifyPayment('${order.order_id}', false)" class="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1">
                ${icon("x-circle", "w-4 h-4")}
                Tolak
              </button>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="mt-3 pt-3 border-t border-amber-200 text-center py-4 text-gray-500 text-sm">
          ${icon("image-off", "w-8 h-8 mx-auto mb-2 opacity-50")}
          <p>Tidak ada bukti pembayaran</p>
        </div>
      `}
    </div>
  `;

  // Info delivery/reservation (sama seperti sebelumnya)
  const deliveryInfo = order.orderType === 'delivery' ? `
    <div class="bg-terra/5 border border-terra/20 rounded-lg p-3 mb-4">
      <h4 class="font-semibold text-sm text-terra mb-2 flex items-center gap-2">
        ${icon("truck", "w-4 h-4")}
        Info Pengiriman
      </h4>
      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-600">Nama:</span>
          <span class="font-semibold">${order.customerName || '-'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">WhatsApp:</span>
          <span class="font-semibold">${order.customerPhone || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">Alamat:</span>
          <p class="font-semibold mt-1">${order.deliveryAddress || '-'}</p>
          ${order.deliveryNotes ? `<p class="text-gray-500 italic mt-1">Catatan: ${order.deliveryNotes}</p>` : ''}
        </div>
      </div>
    </div>
  ` : '';

  const reservationInfo = order.orderType === 'reservation' && order.tableNumber ? `
    <div class="bg-forest/5 border border-forest/20 rounded-lg p-3 mb-4">
      <h4 class="font-semibold text-sm text-forest mb-2 flex items-center gap-2">
        ${icon("calendar", "w-4 h-4")}
        Info Reservasi
      </h4>
      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-600">Meja:</span>
          <span class="font-semibold">${order.tableName || 'Meja ' + order.tableNumber}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Tamu:</span>
          <span class="font-semibold">${order.guestCount || 0} orang</span>
        </div>
      </div>
    </div>
  ` : '';

  // Render content
  content.innerHTML = `
    ${paymentVerificationHTML}
    ${deliveryInfo}
    ${reservationInfo}
    
    <!-- Order Items -->
    <div class="mb-4">
      <h4 class="font-semibold text-sm text-forest mb-3 flex items-center gap-2">
        ${icon("shopping-bag", "w-4 h-4")}
        Item Pesanan
      </h4>
      <div class="space-y-2">
        ${(order.items || []).map((item) => {
          const itemTotal = item.price * item.qty;
          const variantText = formatVariants(item.variants);
          return `
            <div class="flex items-start gap-3 bg-white rounded-lg p-2.5 border border-gray-100">
              <div class="w-12 h-12 rounded-lg bg-cream flex-shrink-0 flex items-center justify-center">
                ${icon("utensils", "w-5 h-5 text-gray-400")}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate">${item.name}</p>
                ${variantText ? `
                  <p class="text-xs text-forest mt-0.5 flex items-center gap-1">
                    ${icon("tag", "w-3 h-3")}
                    ${variantText}
                  </p>
                ` : ''}
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs text-gray-500">Rp ${item.price.toLocaleString("id-ID")}</span>
                  <span class="text-gray-300">×</span>
                  <span class="text-xs font-semibold text-forest bg-forest/10 px-1.5 py-0.5 rounded">${item.qty}</span>
                </div>
              </div>
              <p class="font-bold text-sm text-forest">Rp ${itemTotal.toLocaleString("id-ID")}</p>
            </div>
          `;
        }).join("")}
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
    </div>
  `;

  renderOrderActions(order, footer);

  panel.classList.remove("translate-x-full");
  if (overlay) overlay.classList.remove("hidden");

  if (window.lucide) lucide.createIcons();
}

/**
 * ✅ Helper: Format variants untuk display
 */
function formatVariants(variants) {
  if (!variants || typeof variants !== 'object' || Object.keys(variants).length === 0) return '';
  return Object.entries(variants)
    .map(([title, option]) => `${option}`)
    .join(' • ');
}

/**
 * ✅ View full image di modal
 */
function viewFullImage(orderId) {
  const order = getAllNormalizedOrders().find(o => o.order_id === orderId);
  if (!order || !order.paymentProof) return;
  
  Modal.show({
    title: 'Bukti Pembayaran',
    message: order.order_id,
    html: `
      <div class="text-center">
        <img src="${order.paymentProof.data}" alt="Bukti" class="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg">
        <p class="text-xs text-gray-500 mt-3">${order.paymentProof.name}</p>
        <p class="text-xs text-gray-400">Diupload: ${new Date(order.paymentProof.uploadedAt).toLocaleString('id-ID')}</p>
      </div>
    `,
    size: 'lg',
    confirmText: 'Tutup'
  });
}

/**
 * ✅ Verifikasi/Tolak pembayaran
 */
function verifyPayment(orderId, isVerified) {
  const action = isVerified ? 'memverifikasi' : 'menolak';
  const actionColor = isVerified ? 'success' : 'warning';
  
  Modal.confirm({
    title: isVerified ? 'Verifikasi Pembayaran' : 'Tolak Pembayaran',
    message: `Apakah Anda yakin ingin ${action} pembayaran untuk pesanan ini?`,
    type: actionColor,
    html: `
      <div class="bg-cream rounded-lg p-3 text-sm">
        <p class="text-gray-700">
          ${isVerified 
            ? 'Pesanan akan diproses setelah verifikasi.' 
            : 'Pesanan akan dibatalkan dan customer akan diberitahu.'}
        </p>
      </div>
    `,
    confirmText: isVerified ? 'Ya, Verifikasi' : 'Ya, Tolak',
    cancelText: 'Batal',
    onConfirm: () => {
      const newStatus = isVerified ? 'preparing' : 'cancelled';
      const paymentStatus = isVerified ? 'verified' : 'rejected';
      const note = isVerified 
        ? 'Pembayaran diverifikasi oleh admin' 
        : 'Pembayaran ditolak oleh admin';
      
      // Update status pembayaran
      const orders = StorageBridge.getOrders();
      const order = orders.find(o => o.id === orderId || o.order_id === orderId);
      
      if (order) {
        order.paymentStatus = paymentStatus;
        StorageBridge.saveOrder(order);
        
        // Update status order
        StorageBridge.updateOrderStatus(orderId, newStatus, note);
        
        Modal.success({
          title: isVerified ? 'Pembayaran Terverifikasi' : 'Pembayaran Ditolak',
          message: isVerified 
            ? 'Pesanan akan segera diproses' 
            : 'Pesanan telah dibatalkan',
          icon: isVerified ? 'check-circle' : 'x-circle'
        });
        
        // Refresh detail
        setTimeout(() => openOrderDetail(orderId), 500);
      }
    }
  });
}

function addToOrderCart(itemId) {
  const item = menuItems.find((m) => m.id === itemId);
  if (!item) return;

  if (hasVariants(item)) {
    openVariantModal(item, (selectedVariants) => {
      addToCartWithVariant(item, selectedVariants, "delivery");
      renderOrderMenu();
    });
  } else {
    addToCartWithVariant(item, {}, "delivery");
    renderOrderMenu();
  }
}

function updateOrderCartQty(itemId, delta) {
  let cart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");
  const itemsWithId = cart.filter((c) => c.id === itemId);

  if (itemsWithId.length === 0) return;

  if (delta > 0) {
    const item = menuItems.find((m) => m.id === itemId);
    if (hasVariants(item)) {
      openVariantModal(item, (selectedVariants) => {
        addToCartWithVariant(item, selectedVariants, "delivery");
        renderOrderMenu();
      });
      return;
    }
  }

  const targetItem = itemsWithId[itemsWithId.length - 1];
  targetItem.qty += delta;

  if (targetItem.qty <= 0) {
    cart = cart.filter((c) => c.variantKey !== targetItem.variantKey);
  }

  sessionStorage.setItem("orderCart", JSON.stringify(cart));
  renderOrderMenu();
}

function updateOrderCartSummary() {
  const summary = document.getElementById("orderCartSummary");
  const totalEl = document.getElementById("orderCartTotal");
  const countEl = document.getElementById("orderCartCount");

  if (!summary || !totalEl) return;

  orderCart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");

  if (orderCart.length === 0) {
    summary.classList.remove("visible");
    return;
  }

  const total = orderCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = orderCart.reduce((sum, item) => sum + item.qty, 0);

  totalEl.textContent = formatCurrency(total);
  countEl.textContent = `${count} item${count > 1 ? "s" : ""}`;
  summary.classList.add("visible");
}

function proceedToOrderCheckout() {
  orderCart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");
  if (orderCart.length === 0) {
    Modal.warning({
      title: "Keranjang Kosong",
      message: "Silakan pilih minimal 1 menu terlebih dahulu",
      icon: "shopping-cart",
    });
    return;
  }
  Router.navigate("/order-checkout");
}

// ===== CHECKOUT PAGE (Input Data Pengiriman) =====

function renderOrderCheckoutPage(container) {
  orderCart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");

  if (orderCart.length === 0) {
    Modal.error({
      title: "Keranjang Kosong",
      message: "Silakan pilih menu terlebih dahulu",
      confirmText: "Pilih Menu",
      onConfirm: () => Router.navigate("/order"),
    });
    return;
  }

  const existingData = JSON.parse(
    sessionStorage.getItem("orderDeliveryData") || "{}",
  );

  container.innerHTML = `
    <main class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="font-display text-3xl text-terra mb-2">Data Pengiriman</h1>
      <p class="text-gray-600 mb-6">Lengkapi data untuk pengiriman pesanan Anda</p>

      <!-- Order Summary -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
          <i data-lucide="shopping-bag" class="w-5 h-5 text-terra"></i>
          Ringkasan Pesanan (${orderCart.length} item)
        </h2>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          ${orderCart
            .map(
              (item) => `
            <div class="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
              <span>${item.name} ×${item.qty}</span>
              <span class="font-semibold">${formatCurrency(item.price * item.qty)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span class="text-terra">${formatCurrency(getOrderTotal())}</span>
        </div>
      </div>

      <!-- Delivery Info Form -->
      <form id="deliveryForm" class="space-y-6">
        <div class="card">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="user" class="w-5 h-5 text-terra"></i>
            Data Penerima
          </h2>
          <div class="space-y-4">
            <div>
              <label class="input-label">Nama Lengkap *</label>
              <input 
                type="text" 
                id="deliveryName" 
                required
                value="${existingData.name || ""}"
                placeholder="Masukkan nama penerima"
                class="input" />
            </div>
            <div>
              <label class="input-label">Nomor WhatsApp *</label>
              <input 
                type="tel" 
                id="deliveryPhone" 
                required
                value="${existingData.phone || ""}"
                placeholder="08xxxxxxxxxx"
                class="input" />
              <p class="text-xs text-gray-500 mt-1">Untuk konfirmasi dan update status pesanan</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="map-pin" class="w-5 h-5 text-terra"></i>
            Alamat Pengiriman
          </h2>
          <div class="space-y-4">
            <div>
              <label class="input-label">Alamat Lengkap *</label>
              <textarea 
                id="deliveryAddress" 
                required
                rows="4"
                placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos"
                class="input resize-none">${existingData.address || ""}</textarea>
              <p class="text-xs text-gray-500 mt-1">Alamat akan digunakan untuk pengiriman via Gojek/Grab</p>
            </div>
            <div>
              <label class="input-label">Catatan untuk Kurir (Opsional)</label>
              <input 
                type="text" 
                id="deliveryNotes" 
                value="${existingData.notes || ""}"
                placeholder="Contoh: Patokan warna pagar, lantai 2, dll"
                class="input" />
            </div>
          </div>
        </div>

        <!-- Info Pembayaran -->
        <div class="bg-terra/5 border border-terra/20 rounded-2xl p-4 flex items-start gap-3">
          <i data-lucide="credit-card" class="w-5 h-5 text-terra flex-shrink-0 mt-0.5"></i>
          <div class="text-sm">
            <p class="font-semibold text-terra mb-1">Pembayaran di Awal</p>
            <p class="text-gray-600">Pesanan ini wajib dibayar di awal melalui QRIS atau Transfer Bank. Tidak ada COD/Cash.</p>
          </div>
        </div>

        <button type="submit" class="btn btn-terra btn-full">
          Lanjut ke Pembayaran →
        </button>
      </form>
    </main>
  `;

  document.getElementById("deliveryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    submitDeliveryData();
  });
}

function submitDeliveryData() {
  const name = document.getElementById("deliveryName").value.trim();
  const phone = document.getElementById("deliveryPhone").value.trim();
  const address = document.getElementById("deliveryAddress").value.trim();
  const notes = document.getElementById("deliveryNotes").value.trim();

  if (!name || !phone || !address) {
    Modal.warning({
      title: "Data Belum Lengkap",
      message: "Silakan lengkapi nama, nomor WhatsApp, dan alamat",
      icon: "alert-circle",
    });
    return;
  }

  if (!/^08\d{8,12}$/.test(phone)) {
    Modal.error({
      title: "Nomor WhatsApp Tidak Valid",
      message: "Nomor harus dimulai dengan 08 dan 10-13 digit",
      icon: "phone",
    });
    return;
  }

  const deliveryData = {
    name,
    phone,
    address,
    notes,
  };

  sessionStorage.setItem("orderDeliveryData", JSON.stringify(deliveryData));

  Modal.confirm({
    title: "Konfirmasi Pesanan",
    message: "Periksa kembali pesanan Anda:",
    html: `
      <div class="space-y-3">
        <div class="bg-cream rounded-lg p-4">
          <p class="text-xs text-gray-500 mb-2">Pesanan (${orderCart.length} item):</p>
          ${orderCart
            .map(
              (item) => `
            <div class="flex justify-between text-sm py-1">
              <span>${item.name} ×${item.qty}</span>
              <span class="font-semibold">${formatCurrency(item.price * item.qty)}</span>
            </div>
          `,
            )
            .join("")}
          <div class="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span class="text-terra">${formatCurrency(getOrderTotal())}</span>
          </div>
        </div>
        <div class="bg-cream rounded-lg p-4 text-sm">
          <div class="flex justify-between mb-1">
            <span class="text-gray-600">Nama:</span>
            <span class="font-semibold">${name}</span>
          </div>
          <div class="flex justify-between mb-1">
            <span class="text-gray-600">WhatsApp:</span>
            <span class="font-semibold">${phone}</span>
          </div>
          <div class="mt-2">
            <span class="text-gray-600">Alamat:</span>
            <p class="font-semibold mt-1">${address}</p>
            ${notes ? `<p class="text-xs text-gray-500 mt-1">Catatan: ${notes}</p>` : ""}
          </div>
        </div>
        <p class="text-xs text-gray-500 text-center">
          Pembayaran wajib di awal (QRIS/Transfer). Tidak ada COD.
        </p>
      </div>
    `,
    confirmText: "Ya, Bayar Sekarang",
    cancelText: "Periksa Lagi",
    size: "md",
    onConfirm: () => {
      Router.navigate("/order-payment");
    },
  });
}

function getOrderTotal() {
  orderCart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");
  const subtotal = orderCart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const tax = Math.round(subtotal * 0.1);
  return subtotal + tax;
}

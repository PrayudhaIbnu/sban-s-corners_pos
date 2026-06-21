// ===== RESERVATION MENU PAGE =====
// Khusus untuk flow Reservasi Meja

let reservationCart = [];
let reservationCurrentCategory = "all";

function renderMenuPage(container) {
  const reservationData = JSON.parse(
    sessionStorage.getItem("pendingReservation") || "null",
  );

  if (!reservationData) {
    Modal.error({
      title: "Data Tidak Ditemukan",
      message: "Data reservasi tidak ditemukan",
      confirmText: "Kembali",
      onConfirm: () => Router.navigate("/home"),
    });
    return;
  }

  reservationCart = JSON.parse(sessionStorage.getItem("menuCart") || "[]");
  reservationCurrentCategory = "all";

  container.innerHTML = `
    <main class="max-w-6xl mx-auto px-4 py-8 pb-32">
      <h1 class="font-display text-3xl text-forest mb-2">Pilih Menu</h1>
      <p class="text-gray-600 mb-6">Pre-order menu Anda (opsional)</p>

      <div class="bg-forest/5 border border-forest/20 rounded-2xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <i data-lucide="calendar-check" class="w-5 h-5 text-forest"></i>
          <div class="flex-1 text-sm">
            <p class="font-semibold text-forest">
              Meja ${reservationData.tableNumber} • ${reservationData.guestCount} orang
            </p>
            <p class="text-gray-600">
              ${formatDate(reservationData.date)} • ${reservationData.time} - ${reservationData.endTime}
            </p>
          </div>
          <a href="#/reservation" class="text-forest text-sm font-medium hover:underline">
            Ubah
          </a>
        </div>
      </div>

      <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onclick="filterReservationMenu('all', this)" class="cat-btn active-cat">Semua</button>
        <button onclick="filterReservationMenu('Food', this)" class="cat-btn">Food</button>
        <button onclick="filterReservationMenu('Snack', this)" class="cat-btn">Snack</button>
        <button onclick="filterReservationMenu('Beverage', this)" class="cat-btn">Beverage</button>
      </div>

      <div id="menuGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      
      <div class="mt-8 text-center">
        <button onclick="skipReservationMenu()" class="text-forest font-medium hover:underline">
          Lewati, lanjut ke pembayaran →
        </button>
      </div>
    </main>

    <div id="cartSummary" class="cart-summary">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-gray-600">Total Pesanan</p>
          <p class="text-xl font-bold text-forest" id="cartTotal">Rp 0</p>
        </div>
        <button onclick="proceedToReservationPayment()" class="btn btn-primary">
          Lanjut ke Pembayaran →
        </button>
      </div>
    </div>
  `;

  renderReservationMenu();
}

function renderReservationMenu() {
  const grid = document.getElementById("menuGrid");
  if (!grid) return;

  const items = typeof menuItems !== "undefined" ? menuItems : [];
  const filtered =
    reservationCurrentCategory === "all"
      ? items
      : items.filter((item) => item.cat === reservationCurrentCategory);

  reservationCart = JSON.parse(sessionStorage.getItem("menuCart") || "[]");

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
      // Hitung total qty untuk item ini (semua variant)
      const totalQty = reservationCart
        .filter((c) => c.id === item.id)
        .reduce((sum, c) => sum + c.qty, 0);

      const hasVariant = hasVariants(item);

      return `
      <div class="menu-card stagger-item">
        <div class="menu-card-image">
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
                <button onclick="updateReservationCartQty(${item.id}, -1)" class="qty-btn">−</button>
                <span class="qty-value">${totalQty}</span>
                <button onclick="addToReservationCart(${item.id})" class="qty-btn">+</button>
              </div>
            `
                : `
              <button onclick="addToReservationCart(${item.id})" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
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
  updateReservationCartSummary();
}

function filterReservationMenu(category, btn) {
  reservationCurrentCategory = category;
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.remove("active-cat"));
  btn.classList.add("active-cat");
  renderReservationMenu();
}

function addToReservationCart(itemId) {
  const item = menuItems.find((m) => m.id === itemId);
  if (!item) return;

  // Jika ada variants → buka modal dulu
  if (hasVariants(item)) {
    openVariantModal(item, (selectedVariants) => {
      addToCartWithVariant(item, selectedVariants, 'reservation');
      renderReservationMenu();
    });
  } else {
    // Langsung tambah tanpa variant
    addToCartWithVariant(item, {}, 'reservation');
    renderReservationMenu();
  }
}

function addToCartWithVariant(item, selectedVariants, cartType) {
  const storageKey = cartType === 'reservation' ? 'menuCart' : 'orderCart';
  let cart = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
  
  const variantKey = generateVariantKey(item.id, selectedVariants);
  const existing = cart.find((c) => c.variantKey === variantKey);
  
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.images,
      qty: 1,
      variantKey: variantKey,
      variants: selectedVariants
    });
  }
  
  sessionStorage.setItem(storageKey, JSON.stringify(cart));
  
  // Show toast
  showToast(`${item.name} ditambahkan ke keranjang`, 'success');
}

function updateReservationCartQty(itemId, delta) {
  let cart = JSON.parse(sessionStorage.getItem("menuCart") || "[]");
  
  // Cari semua item dengan id yang sama
  const itemsWithId = cart.filter(c => c.id === itemId);
  
  if (itemsWithId.length === 0) return;
  
  if (delta > 0) {
    // Jika tambah dan hanya ada 1 variant, tambah qty-nya
    // Jika ada banyak variant, buka modal untuk pilih variant
    const item = menuItems.find(m => m.id === itemId);
    if (hasVariants(item)) {
      openVariantModal(item, (selectedVariants) => {
        addToCartWithVariant(item, selectedVariants, 'reservation');
        renderReservationMenu();
      });
      return;
    }
  }
  
  // Untuk pengurangan, kurangi qty variant terakhir
  const targetItem = itemsWithId[itemsWithId.length - 1];
  targetItem.qty += delta;
  
  if (targetItem.qty <= 0) {
    cart = cart.filter((c) => c.variantKey !== targetItem.variantKey);
  }

  sessionStorage.setItem("menuCart", JSON.stringify(cart));
  renderReservationMenu();
}

function updateReservationCartSummary() {
  const summary = document.getElementById("cartSummary");
  const totalEl = document.getElementById("cartTotal");

  if (!summary || !totalEl) return;

  reservationCart = JSON.parse(sessionStorage.getItem("menuCart") || "[]");

  if (reservationCart.length === 0) {
    summary.classList.remove("visible");
    return;
  }

  const total = reservationCart.reduce(
    (sum, item) => sum + item.price * item.qty, 0,
  );
  const count = reservationCart.reduce((sum, item) => sum + item.qty, 0);
  
  totalEl.textContent = formatCurrency(total);
  
  // Update button text dengan count
  const btn = summary.querySelector('button');
  if (btn) {
    btn.innerHTML = `Lanjut ke Pembayaran (${count}) →`;
  }
  
  summary.classList.add("visible");
}

// ✅ FUNGSI INI YANG DIPANGGIL SAAT KLIK "LEWATI"
function skipReservationMenu() {
  sessionStorage.setItem("menuCart", JSON.stringify([]));
  Router.navigate("/reservation-payment");
}

// ✅ FUNGSI INI YANG DIPANGGIL SAAT KLIK "LANJUT KE PEMBAYARAN"
function proceedToReservationPayment() {
  reservationCart = JSON.parse(sessionStorage.getItem("menuCart") || "[]");
  if (reservationCart.length === 0) {
    Modal.warning({
      title: "Keranjang Kosong",
      message: "Silakan pilih minimal 1 menu atau lewati",
      icon: "alert-circle",
    });
    return;
  }
  Router.navigate("/reservation-payment");
}

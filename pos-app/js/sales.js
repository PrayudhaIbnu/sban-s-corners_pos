// ===== SALES & CART =====

let cart = [];
let currentCat = "all";

function initSales() {
  renderMenu();
  renderCart();
}

// =========================
// CATEGORY
// =========================

function filterCat(cat) {
  currentCat = cat;

  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.classList.remove("active-cat");

    if (btn.dataset.cat === cat) {
      btn.classList.add("active-cat");
    }
  });

  renderMenu();
}

function getMenuItemsByCategory(cat) {
  if (cat === "all") return menuItems;

  return menuItems.filter((item) => item.cat === cat);
}

function getMenuItemById(id) {
  return menuItems.find((item) => item.id === id);
}

// =========================
// MENU
// =========================

function renderMenu() {
  const menuGrid = document.getElementById("menuGrid");

  if (!menuGrid) return;

  const items = getMenuItemsByCategory(currentCat);

  menuGrid.innerHTML = items
    .map(
      (item) => `
      
      <div
        onclick="addToCart(${item.id})"
        class="
          card-premium
          overflow-hidden
          cursor-pointer
          transition
          hover:-translate-y-1
          hover:shadow-lg
          ${item.stock <= 0 ? "opacity-60 pointer-events-none" : ""}
        "
      >

        <div class="h-48 bg-[#EFE7DE]">

          <img
            src="${item.images}"
            alt="${item.name}"
            class="w-full h-full object-cover"
          >

        </div>

        <div class="p-5">

          <div class="flex justify-between gap-3">

            <div>

              <h3 class="
                font-display
                text-xl
                text-forest
              ">
                ${item.name}
              </h3>

              <p class="
                text-xs
                uppercase
                tracking-widest
                text-gray-400
                mt-1
              ">
                ${item.cat}
              </p>

            </div>

            <span class="
              text-terra
              font-semibold
            ">
              Rp ${item.price.toLocaleString()}
            </span>

          </div>

          <p class="
            text-sm
            text-gray-500
            mt-3
            line-clamp-3
          ">
            ${item.details}
          </p>

          <div class="
            flex
            justify-between
            items-center
            mt-4
          ">

            <span class="
              text-xs
              ${item.stock <= 5 ? "text-red-500" : "text-green-600"}
            ">
              ${item.stock <= 0 ? "Out of Stock" : `Stock ${item.stock}`}
            </span>

            <span class="
              text-xs
              uppercase
              tracking-wider
              text-gray-400
            ">
              Add →
            </span>

          </div>

        </div>

      </div>

    `,
    )
    .join("");
}

// =========================
// CART
// =========================

function addToCart(id) {
  const item = getMenuItemById(id);

  if (!item) return;

  if (item.stock <= 0) return;

  const existing = cart.find((c) => c.id === id);

  if (existing) {
    if (existing.qty < item.stock) {
      existing.qty++;
    }
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      image: item.images,
      price: item.price,
      qty: 1,
    });
  }

  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");

  if (!cartItems) return;

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="
        text-center
        py-10
        text-gray-400
      ">
        Cart is empty
      </div>
    `;

    updateCartTotals();
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
      
      <div class="
        border
        border-[#E5DDD3]
        rounded-2xl
        p-4
      ">

        <div class="
          flex
          gap-3
        ">

          <img
            src="${item.image}"
            alt="${item.name}"
            class="
              w-14
              h-14
              rounded-xl
              object-cover
            "
          >

          <div class="flex-1">

            <p class="
              font-display
              text-lg
              text-forest
            ">
              ${item.name}
            </p>

            <p class="
              text-sm
              text-gray-500
            ">
              Rp ${item.price.toLocaleString()}
            </p>

          </div>

        </div>

        <div class="
          flex
          justify-between
          items-center
          mt-4
        ">

          <div class="flex gap-2">

            <button
              onclick="changeQty(${item.id}, -1)"
              class="qty-btn"
            >
              −
            </button>

            <span class="
              w-8
              text-center
              leading-8
            ">
              ${item.qty}
            </span>

            <button
              onclick="changeQty(${item.id}, 1)"
              class="qty-btn"
            >
              +
            </button>

          </div>

          <span class="
            font-semibold
            text-forest
          ">
            Rp ${(item.price * item.qty).toLocaleString()}
          </span>

        </div>

      </div>

    `,
    )
    .join("");

  updateCartTotals();
}

// =========================
// FLOATING CART BUTTON & PREVIEW
// =========================

// =========================
// FLOATING CART BUTTON
// =========================

// =========================
// HEADER CART BADGE (Mobile)
// =========================

function updateHeaderCartBadge() {
  const headerBtn = document.getElementById("headerCartBtn");
  const headerBadge = document.getElementById("headerCartBadge");
  const headerSpacer = document.getElementById("headerCartSpacer");
  
  if (!headerBtn || !headerBadge) return;
  
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  
  if (totalItems > 0) {
    // Tampilkan tombol cart di header
    headerBtn.classList.remove("hidden");
    headerBtn.style.display = "block";
    headerBadge.textContent = totalItems > 99 ? "99+" : totalItems;
    
    // Sembunyikan spacer agar tombol cart terlihat
    if (headerSpacer) {
      headerSpacer.style.display = "none";
    }
    
    // Bounce animation pada badge
    headerBadge.classList.remove("bounce");
    void headerBadge.offsetWidth; // Trigger reflow
    headerBadge.classList.add("bounce");
  } else {
    // Sembunyikan tombol cart jika cart kosong
    headerBtn.classList.add("hidden");
    headerBtn.style.display = "none";
    
    // Tampilkan spacer kembali
    if (headerSpacer) {
      headerSpacer.style.display = "block";
    }
  }
}

// Fungsi untuk buka cart dari header
function openCartFromHeader() {
  // Navigate ke sales page jika belum di sana
  if (currentPage !== 'sales') {
    navigate('sales');
    // Tunggu sebentar agar sales page ter-render
    setTimeout(() => {
      toggleCart(true);
    }, 100);
  } else {
    toggleCart(true);
  }
}

// Pastikan cart badge ter-update saat render
const originalRenderCart = renderCart;
renderCart = function() {
  originalRenderCart();
  updateHeaderCartBadge();
};

// Update juga saat init
const originalInitSales = initSales;
initSales = function() {
  originalInitSales();
  updateHeaderCartBadge();
};

// =========================
// TOGGLE CART (Mobile)
// =========================

function toggleCart(open) {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");
  
  if (!sidebar || !overlay) return;
  
  // Hanya berlaku di mobile
  if (window.innerWidth >= 1024) return;
  
  isCartOpen = open;
  
  if (open) {
    sidebar.classList.remove("translate-y-full");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    sidebar.classList.add("translate-y-full");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

// =========================
// TOTALS
// =========================

function updateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const tax = Math.round(subtotal * 0.1);

  const total = subtotal + tax;

  document.getElementById("cartSubtotal").textContent =
    "Rp " + subtotal.toLocaleString();

  document.getElementById("cartTax").textContent = "Rp " + tax.toLocaleString();

  document.getElementById("cartTotal").textContent =
    "Rp " + total.toLocaleString();
}

// =========================
// QTY
// =========================

function changeQty(id, amount) {
  const item = cart.find((c) => c.id === id);

  if (!item) return;

  const product = getMenuItemById(id);

  if (!product) return;

  const nextQty = item.qty + amount;

  if (nextQty <= 0) {
    cart = cart.filter((c) => c.id !== id);
  } else if (nextQty <= product.stock) {
    item.qty = nextQty;
  }

  renderCart();
}

// =========================
// CLEAR
// =========================

function clearCart() {
  cart = [];
  renderCart();
}

// =========================
// TOTAL PAYMENT
// =========================

function getSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getTax() {
  return Math.round(getSubtotal() * 0.1);
}

function getTotal() {
  return getSubtotal() + getTax();
}

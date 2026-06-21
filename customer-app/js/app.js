// ===== MAIN APP INITIALIZATION =====

document.addEventListener("DOMContentLoaded", () => {
  registerRoutes();
  Router.init();
});

function registerRoutes() {
  // Home
  Router.register('/home', renderHomePage, {
    title: "SBAN'S CORNER",
    showBack: false,
    step: null,
    hideFooter: false
  });
  
  // ✅ Reservation Flow - PASTIKAN ROUTE INI ADA
  Router.register('/reservation', renderReservationPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 1,
    totalSteps: 4
  });
  
  Router.register('/reservation-menu', renderMenuPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 2,
    totalSteps: 4,
    orderType: 'reservation'
  });
  
  Router.register('/reservation-payment', renderPaymentPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 3,
    totalSteps: 4,
    orderType: 'reservation'
  });
  
  Router.register('/reservation-confirmation', renderConfirmationPage, {
    title: "SBAN'S CORNER",
    showBack: false,
    step: 4,
    totalSteps: 4,
    hideFooter: true,
    orderType: 'reservation'
  });
  
  // Order Online Flow
  Router.register('/order', renderOrderPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 1,
    totalSteps: 3,
    orderType: 'delivery'
  });
  
  Router.register('/order-checkout', renderOrderCheckoutPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 2,
    totalSteps: 3,
    orderType: 'delivery'
  });
  
  Router.register('/order-payment', renderPaymentPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 3,
    totalSteps: 3,
    orderType: 'delivery'
  });
  
  Router.register('/order-tracking', renderOrderTrackingPage, {
    title: "SBAN'S CORNER",
    showBack: false,
    step: null,
    totalSteps: null,
    hideFooter: false,
    orderType: 'delivery'
  });
  
  // Tracking & Search
  Router.register('/tracking', renderOrderTrackingPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: null,
    totalSteps: null,
    hideFooter: false
  });
  
  Router.register('/search-order', renderSearchOrderPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: null,
    totalSteps: null,
    hideFooter: false
  });
}

/**
 * Render Home Page dengan 2 pilihan
 */
function renderHomePage(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-gradient text-white py-12 md:py-16 px-4">
      <div class="max-w-4xl mx-auto text-center relative z-10">
        <h1 class="font-display text-4xl md:text-5xl mb-4 animate-slide-up">
          Selamat Datang di Sban's Corner
        </h1>
        <p class="text-lg md:text-xl text-white/80 mb-2 animate-slide-up" style="animation-delay: 0.1s">
          Nikmati pengalaman kuliner terbaik kami
        </p>
        <p class="text-sm text-white/60 animate-slide-up" style="animation-delay: 0.15s">
          Pilih layanan yang Anda inginkan
        </p>
      </div>
    </section>

    <!-- Two Main Options -->
    <section class="py-8 px-4 -mt-6 relative z-20">
      <div class="max-w-4xl mx-auto">
        <div class="grid md:grid-cols-2 gap-4">
          
          <!-- Option 1: Reservasi -->
          <a href="#/reservation" class="group block bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-forest">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-forest group-hover:text-white transition-colors">
                <i data-lucide="calendar-check" class="w-8 h-8 text-forest group-hover:text-white transition-colors"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-display text-2xl font-bold text-forest mb-2">Reservasi Meja</h3>
                <p class="text-sm text-gray-600 mb-3">
                  Pesan meja untuk makan di tempat. Pilih meja, pre-order menu, dan dapatkan barcode untuk check-in.
                </p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="bg-forest/10 text-forest px-2 py-1 rounded-full">Pilih Meja</span>
                  <span class="bg-forest/10 text-forest px-2 py-1 rounded-full">Pre-order Menu</span>
                  <span class="bg-forest/10 text-forest px-2 py-1 rounded-full">Barcode Check-in</span>
                </div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span class="text-sm text-gray-500">Makan di tempat</span>
              <i data-lucide="arrow-right" class="w-5 h-5 text-forest group-hover:translate-x-1 transition-transform"></i>
            </div>
          </a>

          <!-- Option 2: Pesan Online -->
          <a href="#/order" class="group block bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-terra">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 bg-terra/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-terra group-hover:text-white transition-colors">
                <i data-lucide="shopping-bag" class="w-8 h-8 text-terra group-hover:text-white transition-colors"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-display text-2xl font-bold text-terra mb-2">Pesan Online</h3>
                <p class="text-sm text-gray-600 mb-3">
                  Pesan makanan untuk diantar ke rumah Anda. Bayar di awal, lacak pesanan secara real-time.
                </p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="bg-terra/10 text-terra px-2 py-1 rounded-full">Delivery</span>
                  <span class="bg-terra/10 text-terra px-2 py-1 rounded-full">Cashless</span>
                  <span class="bg-terra/10 text-terra px-2 py-1 rounded-full">Real-time Tracking</span>
                </div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span class="text-sm text-gray-500">Diantar ke rumah</span>
              <i data-lucide="arrow-right" class="w-5 h-5 text-terra group-hover:translate-x-1 transition-transform"></i>
            </div>
          </a>

        </div>

        <!-- ⚠️ BARU: Quick Access Buttons -->
        <div class="grid grid-cols-2 gap-3 mt-6">
          <a href="#/search-order" class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-forest transition flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <i data-lucide="search" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="font-semibold text-gray-800 text-sm">Cari Pesanan</p>
              <p class="text-xs text-gray-500">Lacak pesanan Anda</p>
            </div>
          </a>
          <a href="#/tracking" class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-forest transition flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <i data-lucide="package" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="font-semibold text-gray-800 text-sm">Tracking</p>
              <p class="text-xs text-gray-500">Status pesanan</p>
            </div>
          </a>
        </div>

        <!-- Info Cards -->
        <div class="grid grid-cols-3 gap-3 mt-6">
          <div class="bg-white rounded-xl p-4 text-center shadow-sm">
            <i data-lucide="credit-card" class="w-6 h-6 text-forest mx-auto mb-2"></i>
            <p class="text-xs font-semibold text-gray-700">Cashless Only</p>
            <p class="text-[10px] text-gray-500 mt-1">QRIS & Transfer</p>
          </div>
          <div class="bg-white rounded-xl p-4 text-center shadow-sm">
            <i data-lucide="clock" class="w-6 h-6 text-forest mx-auto mb-2"></i>
            <p class="text-xs font-semibold text-gray-700">Buka Setiap Hari</p>
            <p class="text-[10px] text-gray-500 mt-1">10:00 - 22:00</p>
          </div>
          <div class="bg-white rounded-xl p-4 text-center shadow-sm">
            <i data-lucide="map-pin" class="w-6 h-6 text-forest mx-auto mb-2"></i>
            <p class="text-xs font-semibold text-gray-700">Lokasi Strategis</p>
            <p class="text-[10px] text-gray-500 mt-1">Mudah dijangkau</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-12 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <h2 class="font-display text-3xl text-forest text-center mb-10">
          Mengapa Memilih Kami?
        </h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="text-center stagger-item">
            <div class="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="utensils" class="w-8 h-8 text-forest"></i>
            </div>
            <h3 class="font-semibold text-lg mb-2">Menu Berkualitas</h3>
            <p class="text-sm text-gray-600">Bahan segar dan resep autentik</p>
          </div>
          <div class="text-center stagger-item">
            <div class="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="shield-check" class="w-8 h-8 text-forest"></i>
            </div>
            <h3 class="font-semibold text-lg mb-2">Pembayaran Aman</h3>
            <p class="text-sm text-gray-600">Cashless dengan QRIS & Transfer</p>
          </div>
          <div class="text-center stagger-item">
            <div class="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="truck" class="w-8 h-8 text-forest"></i>
            </div>
            <h3 class="font-semibold text-lg mb-2">Pengiriman Cepat</h3>
            <p class="text-sm text-gray-600">Via Gojek/Grab Instan</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Show toast notification
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const icons = {
    success: "check-circle",
    error: "x-circle",
    warning: "alert-circle",
    info: "info",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  if (window.lucide) lucide.createIcons();

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "Rp 0";
  return "Rp " + amount.toLocaleString("id-ID");
}

function generateId(prefix = "ORD") {
  return (
    prefix +
    "-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substr(2, 4).toUpperCase()
  );
}

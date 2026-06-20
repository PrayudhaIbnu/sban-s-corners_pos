// ===== MAIN APP INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  // Register routes
  registerRoutes();
  
  // Initialize router
  Router.init();
});

/**
 * Register semua routes
 */
function registerRoutes() {
  // Home / Landing Page
  Router.register('/home', renderHomePage, {
    title: "SBAN'S CORNER",
    showBack: false,
    step: null,
    hideFooter: false
  });
  
  // Reservation Form
  Router.register('/reservation', renderReservationPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 1,
    totalSteps: 4
  });
  
  // Menu Selection
  Router.register('/menu', renderMenuPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 2,
    totalSteps: 4
  });
  
  // Payment
  Router.register('/payment', renderPaymentPage, {
    title: "SBAN'S CORNER",
    showBack: true,
    step: 3,
    totalSteps: 4
  });
  
  // Confirmation
  Router.register('/confirmation', renderConfirmationPage, {
    title: "SBAN'S CORNER",
    showBack: false,
    step: 4,
    totalSteps: 4,
    hideFooter: true
  });
}

/**
 * Render Home Page
 */
function renderHomePage(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-gradient text-white py-16 md:py-20 px-4">
      <div class="max-w-4xl mx-auto text-center relative z-10">
        <h1 class="font-display text-4xl md:text-6xl mb-6 animate-slide-up">
          Reservasi Meja Online
        </h1>
        <p class="text-lg md:text-xl text-white/80 mb-8 animate-slide-up" style="animation-delay: 0.1s">
          Nikmati pengalaman makan yang lebih nyaman dengan reservasi meja terlebih dahulu
        </p>
        <a 
          href="#/reservation" 
          class="inline-block bg-terra text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-terraLight transition shadow-lg animate-slide-up"
          style="animation-delay: 0.2s">
          Mulai Reservasi →
        </a>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="font-display text-3xl text-forest text-center mb-12">
          Mengapa Reservasi Online?
        </h2>
        <div class="grid md:grid-cols-3 gap-8">
          
          <div class="text-center stagger-item">
            <div class="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="calendar-check" class="w-8 h-8 text-forest"></i>
            </div>
            <h3 class="font-semibold text-lg mb-2">Mudah & Cepat</h3>
            <p class="text-gray-600">Reservasi hanya dalam 2 menit, tanpa perlu menunggu</p>
          </div>
          
          <div class="text-center stagger-item">
            <div class="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="qr-code" class="w-8 h-8 text-forest"></i>
            </div>
            <h3 class="font-semibold text-lg mb-2">Barcode Digital</h3>
            <p class="text-gray-600">Tunjukkan barcode saat datang, langsung duduk di meja</p>
          </div>
          
          <div class="text-center stagger-item">
            <div class="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="utensils" class="w-8 h-8 text-forest"></i>
            </div>
            <h3 class="font-semibold text-lg mb-2">Pre-Order Menu</h3>
            <p class="text-gray-600">Pesan menu bersamaan dengan reservasi</p>
          </div>
          
        </div>
      </div>
    </section>

    <!-- Info -->
    <section class="bg-white py-16 px-4">
      <div class="max-w-4xl mx-auto">
        <h2 class="font-display text-3xl text-forest text-center mb-8">
          Informasi Reservasi
        </h2>
        <div class="grid md:grid-cols-2 gap-6">
          
          <div class="bg-cream rounded-2xl p-6 stagger-item">
            <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
              <i data-lucide="users" class="w-5 h-5 text-forest"></i>
              Kapasitas Meja
            </h3>
            <p class="text-gray-600">Maksimal 6 orang per meja</p>
          </div>
          
          <div class="bg-cream rounded-2xl p-6 stagger-item">
            <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
              <i data-lucide="grid-3x3" class="w-5 h-5 text-forest"></i>
              Total Meja
            </h3>
            <p class="text-gray-600">16 meja tersedia</p>
          </div>
          
          <div class="bg-cream rounded-2xl p-6 stagger-item">
            <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
              <i data-lucide="clock" class="w-5 h-5 text-forest"></i>
              Durasi
            </h3>
            <p class="text-gray-600">2 jam per reservasi</p>
          </div>
          
          <div class="bg-cream rounded-2xl p-6 stagger-item">
            <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
              <i data-lucide="credit-card" class="w-5 h-5 text-forest"></i>
              Pembayaran
            </h3>
            <p class="text-gray-600">QRIS atau Transfer Bank (wajib di awal)</p>
          </div>
          
        </div>
      </div>
    </section>
  `;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-circle',
    info: 'info'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  if (window.lucide) lucide.createIcons();
  
  // Show
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto hide
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Format date untuk display
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

/**
 * Generate unique ID
 */
function generateId(prefix = 'RES') {
  return prefix + '-' + Date.now().toString(36).toUpperCase() + 
         Math.random().toString(36).substr(2, 4).toUpperCase();
}
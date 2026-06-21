// ===== NAVIGATION =====
let currentPage = "dashboard";

function initNavigation() {
  // Close sidebar saat resize ke desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("sidebarOverlay");
      if (overlay) overlay.classList.add("hidden");
    }
  });

  // Set active state untuk halaman awal
  updateActiveNav(currentPage);
}

function navigate(page) {
  currentPage = page;

  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));

  const selectedPage = document.getElementById("page-" + page);
  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === page);
  });

  if (page === "sales") renderMenu();
  if (page === "inventory") renderInventory();
  if (page === "dashboard") renderDashboard();
  if (page === "reports") renderReports();
  if (page === "orders") renderOrders();
  if (page === "reservations") {
    if (typeof initReservations === "function") {
      initReservations();
    } else {
      renderReservations();
    }
  }

  // ⚠️ BARU: Payment Verification
  if (page === "payment-verification") {
    if (typeof initPaymentVerification === "function") {
      initPaymentVerification();
    } else {
      renderPaymentVerification();
    }
  }

  if (window.innerWidth < 1024) {
    closeSidebar();
  }
}

/**
 * Update active state pada semua nav buttons (sidebar & bottom nav)
 */
function updateActiveNav(page) {
  // Update sidebar nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === page);
  });

  // Update mobile bottom nav buttons
  document.querySelectorAll(".mobile-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === page);
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (!sidebar || !overlay) return;

  sidebar.classList.remove("-translate-x-full");
  overlay.classList.remove("hidden");

  // Prevent body scroll saat sidebar terbuka
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (!sidebar || !overlay) return;

  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");

  // Restore body scroll
  document.body.style.overflow = "";
}

// Close sidebar dengan tombol ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSidebar();
  }
});

// Update header cart badge saat pindah halaman
const originalNavigate = navigate;

function navigate(page) {
  currentPage = page;

  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));

  const selectedPage = document.getElementById("page-" + page);
  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === page);
  });

  if (page === "sales") renderMenu();
  if (page === "inventory") renderInventory();
  if (page === "dashboard") renderDashboard();
  if (page === "reports") renderReports();
  if (page === "orders") {
    if (typeof initOrders === "function") {
      initOrders(); // ✅ Initialize dengan listener
    } else {
      renderOrders();
    }
  }
  if (page === "reservations") {
    if (typeof initReservations === "function") {
      initReservations();
    } else {
      renderReservations();
    }
  }

  if (window.innerWidth < 1024) {
    closeSidebar();
  }
}

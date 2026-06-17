// ===== NAVIGATION =====
let currentPage = "dashboard";

function initNavigation() {
  if (window.innerWidth < 1024) {
    closeSidebar();
  }
}

function navigate(page) {
  currentPage = page;

  // Hide all pages
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));

  // Show selected page
  const selectedPage = document.getElementById("page-" + page);
  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  // Update nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === page);
  });

  // Render page content
  if (page === "sales") renderMenu();
  if (page === "inventory") renderInventory();
  if (page === "reservation") renderReservations();
  if (page === "dashboard") renderDashboard();
  if (page === "reports") renderReports();
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");

  const overlay = document.getElementById("sidebarOverlay");

  sidebar.classList.remove("-translate-x-full");

  overlay.classList.remove("hidden");
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (!sidebar || !overlay) return;

  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
}

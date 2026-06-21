// ===== MAIN INITIALIZATION =====

document.addEventListener("DOMContentLoaded", async () => {
  await loadComponents();

  // Load data from localStorage
  initApp();

  // Initialize modules
  initAuth();
  initNavigation();
  initSales();
  initInventory();

  // Initial render
  renderCart();

  // Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }
});

function initApp() {
  loadTransactions();

  if (typeof loadMenuItems === "function") {
    loadMenuItems();
  }

  if (typeof loadReservations === "function") {
    loadReservations();
  }

  renderDashboard();
  renderOrders();
  renderOrdersList();
  renderReservations();
  renderInventory();
  renderReports();
}

// ===== LOAD COMPONENTS =====

async function loadComponents() {
  try {
    // Login
    const loginHtml = await fetch("components/login.html").then((r) =>
      r.text(),
    );

    document.getElementById("login-container").innerHTML = loginHtml;

    // Pages
    const sidebarHtml = await fetch("components/sidebar.html").then((r) =>
      r.text(),
    );

    const dashboardHtml = await fetch("components/dashboard.html").then((r) =>
      r.text(),
    );

    const paymentVerificationHtml = await fetch("components/payment-verification.html").then(
      (r) => r.text(),
    );

    const reservationHtml = await fetch("components/reservation.html").then(
      (r) => r.text(),
    );

    const salesHtml = await fetch("components/sales.html").then((r) =>
      r.text(),
    );
    
    const ordersHtml = await fetch("components/orders.html").then((r) =>
      r.text(),
    );

    const inventoryHtml = await fetch("components/inventory.html").then((r) =>
      r.text(),
    );

    const reportsHtml = await fetch("components/reports.html").then((r) =>
      r.text(),
    );

    document.getElementById("mainApp").innerHTML = `
      ${sidebarHtml}

      <main class="flex-1 overflow-auto p-6">
        ${dashboardHtml}
        ${paymentVerificationHtml}
        ${reservationHtml}
        ${salesHtml}
        ${ordersHtml}
        ${inventoryHtml}
        ${reportsHtml}
      </main>
    `;

    // Modals
    const paymentModalHtml = await fetch("components/payment-modal.html").then(
      (r) => r.text(),
    );

    const receiptModalHtml = await fetch("components/receipt-modal.html").then(
      (r) => r.text(),
    );

    const addMenuModalHtml = await fetch("components/add-menu-modal.html").then(
      (r) => r.text(),
    );

    const reservationModalHtml = await fetch(
      "components/reservation-modal.html",
    ).then((r) => r.text());

    document.getElementById("modals-container").innerHTML =
      paymentModalHtml +
      receiptModalHtml +
      addMenuModalHtml +
      reservationModalHtml;
  } catch (error) {
    console.error("Error loading components:", error);
  }
}

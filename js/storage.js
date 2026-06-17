const STORAGE_KEYS = {
  TRANSACTIONS: "sbans_transactions",
  RESERVATIONS: "sbans_reservations",
  MENU: "sbans_menu",
};

// ======================
// TRANSACTIONS
// ======================

function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function loadTransactions() {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

  transactions = data ? JSON.parse(data) : [];
}

// ======================
// MENU
// ======================

function saveMenuItems() {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
}

function loadMenuItems() {
  const data = localStorage.getItem(STORAGE_KEYS.MENU);

  if (data) {
    menuItems = JSON.parse(data);
  }
}

// ======================
// RESERVATIONS
// ======================

function saveReservations() {
  localStorage.setItem(
    "sbans_reservations",
    JSON.stringify(reservations)
  );
}

function loadReservations() {
  const data =
    localStorage.getItem(
      "sbans_reservations"
    );

  reservations =
    data ? JSON.parse(data) : [];
}

function cancelReservation(tableId) {
  reservations = reservations.filter(
    (r) => r.tableId !== tableId
  );

  saveReservations();
  renderReservations();
}
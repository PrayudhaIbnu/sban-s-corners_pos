const STORAGE_KEYS = {
  AUTH: "sbans_auth",
  MENU: "sbans_menu",
  RESERVATIONS: "sbans_reservations",
  TRANSACTIONS: "sbans_transactions",
};

function saveAuthState(isLoggedIn) {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
    isLoggedIn: isLoggedIn,
    loginTime: new Date().toISOString()
  }));
}

function loadAuthState() {
  const data = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (data) {
    try {
      const auth = JSON.parse(data);
      return auth.isLoggedIn === true;
    } catch (e) {
      return false
    }
  }
  return false;
}

function clearAuthState() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
}

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
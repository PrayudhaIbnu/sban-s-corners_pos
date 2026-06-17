// ===== PAYMENT =====
let payMethod = "CASH";

function openPayment() {
  if (!cart.length) return;

  const modal = document.getElementById("paymentModal");
  const payTotal = document.getElementById("payTotal");

  if (modal) modal.classList.remove("hidden");
  if (payTotal) payTotal.textContent = "Rp " + getTotal().toLocaleString();

  setPayMethod("CASH");
}

function closePayment() {
  const modal = document.getElementById("paymentModal");
  if (modal) modal.classList.add("hidden");
}

function setPayMethod(m) {
  payMethod = m;

  const btnCash = document.getElementById("btnCash");
  const btnQris = document.getElementById("btnQris");
  const cashSection = document.getElementById("cashSection");

  if (btnCash) {
    btnCash.className =
      "flex-1 py-2 border-2 rounded-lg font-medium text-sm " +
      (m === "CASH" ? "border-forest bg-forest text-white" : "border-gray-300");
  }

  if (btnQris) {
    btnQris.className =
      "flex-1 py-2 border-2 rounded-lg font-medium text-sm " +
      (m === "QRIS" ? "border-forest bg-forest text-white" : "border-gray-300");
  }

  if (cashSection) {
    cashSection.style.display = m === "CASH" ? "block" : "none";
  }
}

function calcChange() {
  const tendered = parseInt(document.getElementById("cashInput").value) || 0;
  const change = Math.max(0, tendered - getTotal());

  const changeDisplay = document.getElementById("changeDisplay");
  if (changeDisplay) {
    changeDisplay.textContent = "Rp " + change.toLocaleString();
  }
}

async function confirmPayment() {
  const total = getTotal();

  if (payMethod === "CASH") {
    const tendered = parseInt(document.getElementById("cashInput").value) || 0;
    if (tendered < total) return;
  }

  const btn = document.getElementById("confirmPayBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Processing...";
  }

  // Deduct stock
  cart.forEach((c) => {
    const item = getMenuItemById(c.id);

    if (item) {
      item.stock -= c.qty;
    }
  });

  saveMenuItems();

  const orderId = "ORD-" + Date.now().toString(36).toUpperCase();
  const tendered =
    payMethod === "CASH"
      ? parseInt(document.getElementById("cashInput").value) || total
      : total;
  const change = payMethod === "CASH" ? Math.max(0, tendered - total) : 0;

  // Simulate API call
  const result = { isOk: true };

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Confirm";
  }

  closePayment();

  const transaction = {
    order_id: orderId,
    date: new Date().toISOString(),
    total: total,
    payment_method: payMethod,
    tendered: tendered,
    change: change,

    items: cart.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
  };

  // Simpan ke localStorage
  saveTransactions();

  if (result.isOk) {
    const transaction = {
      order_id: orderId,
      date: new Date().toISOString(),
      total: total,
      payment_method: payMethod,
      tendered: tendered,
      change: change,

      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
    };

    transactions.push(transaction);

    saveTransactions();

    renderDashboard();
    renderReports();
    renderInventory();

    showReceipt(orderId, cart, total, payMethod, tendered, change);
  }

  cart = [];
  renderCart();
  renderMenu();
}

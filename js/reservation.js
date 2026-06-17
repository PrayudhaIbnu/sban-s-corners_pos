// ===== RESERVATION =====

let reservations = [];

const tables = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Table ${i + 1}`,
}));

// ====================
// STORAGE
// ====================

function saveReservations() {
  localStorage.setItem("sbans_reservations", JSON.stringify(reservations));
}

function loadReservations() {
  const data = localStorage.getItem("sbans_reservations");

  reservations = data ? JSON.parse(data) : [];
}

// ====================
// RENDER
// ====================

function renderReservations() {
  const tableGrid = document.getElementById("tableGrid");

  if (!tableGrid) return;

  if (!reservations.length) {
    tableGrid.innerHTML = `
      <div class="
        col-span-full
        card-premium
        p-12
        text-center
      ">
        <h3 class="font-display text-3xl text-terra">
          No Reservations
        </h3>

        <p class="text-gray-500 mt-3">
          There are currently no table reservations.
        </p>
      </div>
    `;

    updateReservationStats();
    return;
  }

  tableGrid.innerHTML = `
    <div class="col-span-full card-premium overflow-hidden">

      <div class="overflow-x-auto">

        <table class="w-full">

          <thead>

            <tr class="bg-[#F8F4EF]">

              <th class="px-6 py-4 text-left">
                Table
              </th>

              <th class="px-6 py-4 text-left">
                Customer
              </th>

              <th class="px-6 py-4 text-left">
                Date
              </th>

              <th class="px-6 py-4 text-left">
                Time
              </th>

              <th class="px-6 py-4 text-left">
                Guests
              </th>

              <th class="px-6 py-4 text-left">
                Notes
              </th>

              <th class="px-6 py-4 text-center">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            ${reservations
              .map(
                (reservation) => `
              
                <tr class="border-t border-[#E9DFD5]">

                  <td class="px-6 py-4 font-semibold text-forest">
                    Table ${reservation.tableId}
                  </td>

                  <td class="px-6 py-4">
                    ${reservation.customer}
                  </td>

                  <td class="px-6 py-4">
                    ${new Date(reservation.date).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td class="px-6 py-4">
                    ${reservation.time}
                  </td>

                  <td class="px-6 py-4">
                    ${reservation.guests}
                  </td>

                  <td class="px-6 py-4 max-w-xs truncate">
                    ${reservation.note || "-"}
                  </td>

                  <td class="px-6 py-4 text-center">

                    <button
                      onclick="cancelReservation(${reservation.tableId})"
                      class="
                        px-4
                        py-2
                        rounded-xl
                        bg-red-50
                        text-red-600
                        hover:bg-red-100
                        transition
                      "
                    >
                      Cancel
                    </button>

                  </td>

                </tr>

              `,
              )
              .join("")}

          </tbody>

        </table>

      </div>

    </div>
  `;

  updateReservationStats();
}

// ====================
// MODAL
// ====================

function openReservationModal() {
  const modal = document.getElementById("reservationModal");

  const tableSelect = document.getElementById("reservationTableId");

  if (!modal || !tableSelect) return;

  const availableTables = tables.filter(
    (table) => !reservations.some((r) => r.tableId === table.id),
  );

  tableSelect.innerHTML = availableTables
    .map(
      (table) => `
        <option value="${table.id}">
          ${table.name}
        </option>
      `,
    )
    .join("");

  document.getElementById("reservationDate").value = new Date()
    .toISOString()
    .split("T")[0];

  modal.classList.remove("hidden");
  
  if (!availableTables.length) {
    alert("All tables are currently reserved.");
    return;
  }
}

function closeReservationModal() {
  const modal = document.getElementById("reservationModal");

  if (!modal) return;

  modal.classList.add("hidden");
}

// ====================
// SAVE RESERVATION
// ====================

function saveReservation() {
  const customer = document.getElementById("customerName").value.trim();

  const guests = parseInt(document.getElementById("guestCount").value) || 0;

  const date = document.getElementById("reservationDate").value;

  const time = document.getElementById("reservationTime").value;

  const note = document.getElementById("reservationNote").value.trim();

  const tableId = parseInt(document.getElementById("reservationTableId").value);

  if (!customer) {
    alert("Customer name required");
    return;
  }

  if (!guests) {
    alert("Guest count required");
    return;
  }

  if (!time) {
    alert("Reservation time required");
    return;
  }

  let selectedTable = tableId;

  // Auto assign table
  if (!selectedTable) {
    const freeTable = tables.find(
      (t) => !reservations.some((r) => r.tableId === t.id),
    );

    if (!freeTable) {
      alert("No available table");
      return;
    }

    selectedTable = freeTable.id;
  }

  const alreadyReserved = reservations.some((r) => r.tableId === selectedTable);

  if (alreadyReserved) {
    alert("Table already reserved");
    return;
  }

  reservations.push({
    id: Date.now(),
    tableId,
    customer,
    guests,
    date,
    time,
    note,
    // createdAt: new Date().toISOString(),
  });

  saveReservations();

  document.getElementById("customerName").value = "";

  document.getElementById("guestCount").value = "";

  document.getElementById("reservationTime").value = "";

  document.getElementById("reservationNote").value = "";

  closeReservationModal();
  renderReservations();
}

// ====================
// CANCEL
// ====================

function cancelReservation(tableId) {
  const confirmed = confirm("Cancel this reservation?");

  if (!confirmed) return;

  reservations = reservations.filter((r) => r.tableId !== tableId);

  saveReservations();
  renderReservations();
}

// ====================
// STATS
// ====================

function updateReservationStats() {
  const total = tables.length;

  const reserved = reservations.length;

  const available = total - reserved;

  const totalEl = document.getElementById("totalTables");

  const reservedEl = document.getElementById("reservedTables");

  const availableEl = document.getElementById("availableTables");

  if (totalEl) totalEl.textContent = total;

  if (reservedEl) reservedEl.textContent = reserved;

  if (availableEl) availableEl.textContent = available;
}

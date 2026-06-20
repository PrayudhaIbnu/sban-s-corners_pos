// ===== RESERVATION PAGE =====

let selectedTable = null;
let guestCount = 2;
let currentCategoryFilter = "all";

function renderReservationPage(container) {
  selectedTable = null;
  guestCount = 2;
  currentCategoryFilter = "all";

  container.innerHTML = `
    <main class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="font-display text-3xl text-forest mb-2">Reservasi Meja</h1>
      <p class="text-gray-600 mb-8">Pilih tanggal, waktu, dan meja yang Anda inginkan</p>

      <form id="reservationForm" class="space-y-6">
        
        <!-- Date & Time -->
        <div class="card">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="calendar-clock" class="w-5 h-5 text-forest"></i>
            Tanggal & Waktu
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="input-label">Tanggal</label>
              <input 
                type="date" 
                id="resDate" 
                required
                class="input" />
            </div>
            <div>
              <label class="input-label">Jam Mulai</label>
              <select id="resTime" required class="input">
                <option value="">Pilih jam</option>
              </select>
              <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <i data-lucide="info" class="w-3 h-3"></i>
                Durasi reservasi: 2 jam
              </p>
            </div>
          </div>
        </div>

        <!-- Guest Count -->
        <div class="card">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="users" class="w-5 h-5 text-forest"></i>
            Jumlah Tamu
          </h2>
          <div class="guest-counter">
            <button type="button" onclick="updateGuestCount(-1)" class="guest-counter-btn" id="guestMinus">
              <i data-lucide="minus" class="w-5 h-5"></i>
            </button>
            <div class="text-center">
              <span id="guestCount" class="guest-counter-value">2</span>
              <p class="text-sm text-gray-500 mt-1">orang (maksimal 6)</p>
            </div>
            <button type="button" onclick="updateGuestCount(1)" class="guest-counter-btn" id="guestPlus">
              <i data-lucide="plus" class="w-5 h-5"></i>
            </button>
          </div>
          <div id="categorySuggestion" class="mt-4 p-3 bg-forest/5 rounded-xl text-sm text-forest"></div>
        </div>

        <!-- Table Category Filter -->
        <div class="card">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="filter" class="w-5 h-5 text-forest"></i>
            Filter Kategori Meja
          </h2>
          <div class="flex flex-wrap gap-2" id="categoryFilter">
            <button type="button" onclick="filterTableCategory('all', this)" class="cat-btn active-cat" data-cat="all">
              <i data-lucide="layout-grid" class="w-4 h-4"></i>
              Semua
            </button>
            <button type="button" onclick="filterTableCategory('couple', this)" class="cat-btn" data-cat="couple">
              <i data-lucide="heart" class="w-4 h-4"></i>
              Couple (1-2)
            </button>
            <button type="button" onclick="filterTableCategory('family-small', this)" class="cat-btn" data-cat="family-small">
              <i data-lucide="users" class="w-4 h-4"></i>
              Keluarga (2-4)
            </button>
            <button type="button" onclick="filterTableCategory('group', this)" class="cat-btn" data-cat="group">
              <i data-lucide="users-round" class="w-4 h-4"></i>
              Grup (4-6)
            </button>
          </div>
        </div>

        <!-- Table Selection -->
        <div class="card">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="layout-grid" class="w-5 h-5 text-forest"></i>
            Pilih Meja
          </h2>
          
          <!-- Enhanced Legend -->
          <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
              <span>Tersedia</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);"></div>
              <span>Tidak Kosong</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
              <span>Kapasitas Tidak Sesuai</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-forest border-2 border-forest rounded"></div>
              <span>Dipilih</span>
            </div>
          </div>
          
          <div id="tableGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <!-- Tables will be generated by JS -->
          </div>
          
          <!-- Table Detail Info -->
          <div id="tableInfo" class="mt-4 hidden"></div>
        </div>

        <!-- Customer Info -->
        <div class="card">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i data-lucide="user" class="w-5 h-5 text-forest"></i>
            Data Pemesan
          </h2>
          <div class="space-y-4">
            <div>
              <label class="input-label">Nama Lengkap</label>
              <input 
                type="text" 
                id="customerName" 
                required
                placeholder="Masukkan nama Anda"
                class="input" />
            </div>
            <div>
              <label class="input-label">Nomor WhatsApp</label>
              <input 
                type="tel" 
                id="customerPhone" 
                required
                placeholder="08xxxxxxxxxx"
                class="input" />
            </div>
          </div>
        </div>

        <!-- Submit -->
        <button 
          type="submit"
          class="btn btn-primary btn-full">
          Lanjut ke Pilih Menu →
        </button>

      </form>
    </main>
  `;

  initDatePicker();
  initTimePicker();
  renderTables();
  updateCategorySuggestion();

  document.getElementById("reservationForm").addEventListener("submit", (e) => {
    e.preventDefault();
    submitReservation();
  });
}

function initDatePicker() {
  const dateInput = document.getElementById("resDate");
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
  dateInput.value = today;

  dateInput.addEventListener("change", renderTables);
}

function initTimePicker() {
  const timeSelect = document.getElementById("resTime");
  const times = [];

  for (let hour = 10; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 21 && min > 0) break;
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      times.push(time);
    }
  }

  timeSelect.innerHTML =
    '<option value="">Pilih jam</option>' +
    times.map((t) => `<option value="${t}">${t}</option>`).join("");

  timeSelect.addEventListener("change", renderTables);
}

function updateGuestCount(delta) {
  guestCount = Math.max(1, Math.min(6, guestCount + delta));
  document.getElementById("guestCount").textContent = guestCount;

  document.getElementById("guestMinus").disabled = guestCount <= 1;
  document.getElementById("guestPlus").disabled = guestCount >= 6;

  if (selectedTable) {
    const table = getTableById(selectedTable);
    if (table && !isTableSuitable(table, guestCount)) {
      // ✅ GANTI: Modal warning saat meja tidak sesuai
      Modal.warning({
        title: "Meja Tidak Sesuai",
        message: `Meja yang dipilih tidak cocok untuk ${guestCount} orang. Silakan pilih meja lain.`,
        icon: "users",
        onConfirm: () => {
          selectedTable = null;
          renderTables();
        },
      });
    }
  }

  updateCategorySuggestion();
  renderTables();
}

/**
 * Update saran kategori meja berdasarkan jumlah tamu
 */
function updateCategorySuggestion() {
  const suggestion = document.getElementById("categorySuggestion");
  if (!suggestion) return;

  const suitable = TABLES_DATA.filter((t) => isTableSuitable(t, guestCount));
  const categories = [...new Set(suitable.map((t) => t.category))];

  if (categories.length > 0) {
    const catLabels = categories.map((c) => TABLE_CATEGORIES[c]?.label || c);
    suggestion.innerHTML = `
      <div class="flex items-start gap-2">
        <i data-lucide="lightbulb" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
        <div>
          <p class="font-semibold mb-1">Rekomendasi untuk ${guestCount} orang:</p>
          <p class="text-xs text-gray-600">${catLabels.join(", ")}</p>
        </div>
      </div>
    `;
  } else {
    suggestion.innerHTML = `
      <div class="flex items-start gap-2 text-orange-700">
        <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
        <p>Tidak ada meja yang cocok untuk ${guestCount} orang</p>
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Filter meja berdasarkan kategori
 */
function filterTableCategory(category, btn) {
  currentCategoryFilter = category;
  
  document.querySelectorAll('#categoryFilter .cat-btn').forEach(b => {
    b.classList.remove('active-cat');
  });
  btn.classList.add('active-cat');
  
  renderTables();
}

/**
 * ✅ RENDER TABLES - DENGAN FIX STATUS
 */
function renderTables() {
  const grid = document.getElementById("tableGrid");
  if (!grid) return;

  const date = document.getElementById("resDate").value;
  const time = document.getElementById("resTime").value;

  // ✅ Ambil reservasi untuk slot waktu ini
  const reservedTables =
    time && date ? getReservedTables(date, time) : new Set();

  console.log("📊 Reserved tables:", reservedTables);

  // Filter by category
  let tablesToShow = TABLES_DATA;
  if (currentCategoryFilter !== "all") {
    tablesToShow = TABLES_DATA.filter(
      (t) => t.category === currentCategoryFilter,
    );
  }

  if (tablesToShow.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-400">
        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-30"></i>
        <p>Tidak ada meja di kategori ini</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = tablesToShow
    .map((table) => {
      const isReserved = reservedTables.has(table.id);
      const isSuitable = isTableSuitable(table, guestCount);
      const isSelected = selectedTable === table.id;

      // ✅ Tentukan status meja
      let status, statusText, icon, onclick;

      if (isReserved) {
        status = "reserved";
        statusText = "Tidak Kosong";
        icon = "lock";
        onclick = `onclick="showReservedInfo(${table.id})"`;
      } else if (!isSuitable) {
        status = "unsuitable";
        statusText = `${table.minCapacity}-${table.maxCapacity} org`;
        icon = "alert-circle";
        onclick = ""; // Tidak bisa diklik
      } else if (isSelected) {
        status = "selected";
        statusText = "Dipilih ✓";
        icon = "check";
        onclick = `onclick="selectTable(${table.id})"`;
      } else {
        status = "available";
        statusText = "Tersedia";
        icon = table.icon || "armchair";
        onclick = `onclick="selectTable(${table.id})"`;
      }

      const locationIcon = TABLE_LOCATIONS[table.location]?.icon || "home";
      const positionLabels = {
        window: "Jendela",
        center: "Tengah",
        corner: "Pojok",
        terrace: "Teras",
        garden: "Taman",
        private: "Privat",
      };

      return `
      <div 
        class="table-card-enhanced status-${status} ${table.location}" 
        ${onclick}
        title="${table.description}">
        
        <!-- Category Badge -->
        <div class="table-category-badge category-${table.category}">
          <i data-lucide="${TABLE_CATEGORIES[table.category]?.icon || "users"}" class="w-3 h-3"></i>
        </div>
        
        <!-- Location Icon -->
        <div class="table-location-icon">
          <i data-lucide="${locationIcon}" class="w-3 h-3"></i>
        </div>
        
        <!-- Main Icon -->
        <div class="table-main-icon">
          <i data-lucide="${icon}" class="w-7 h-7"></i>
        </div>
        
        <!-- Table Name -->
        <div class="table-name">${table.name}</div>
        
        <!-- Capacity -->
        <div class="table-capacity">
          <i data-lucide="users" class="w-3 h-3"></i>
          <span>${table.minCapacity}-${table.maxCapacity}</span>
        </div>
        
        <!-- Status -->
        <div class="table-status">${statusText}</div>
        
        <!-- Position Tag -->
        <div class="table-position">${positionLabels[table.position] || table.position}</div>
        
        ${
          isReserved
            ? `
          <div class="reserved-info">
            <i data-lucide="clock" class="w-2.5 h-2.5"></i>
            <span>${getReservedSlotInfo(table.id, date, time)}</span>
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
  updateTableInfo();
}

/**
 * ✅ Get daftar meja yang sudah di-reserve untuk slot waktu tertentu
 */
function getReservedTables(date, time) {
  const reservedSet = new Set();

  if (!date || !time) return reservedSet;

  const allReservations = StorageBridge.getReservations();
  const endTime = calculateEndTime(time);

  console.log("🔍 Checking reservations for:", { date, time, endTime });
  console.log("📦 All reservations:", allReservations);

  allReservations.forEach((r) => {
    // Skip cancelled & checked-out
    if (r.status === "cancelled" || r.status === "checked-out") {
      console.log(`⏭️ Skip ${r.id}: status ${r.status}`);
      return;
    }

    // Check tanggal
    if (r.date !== date) {
      console.log(`⏭️ Skip ${r.id}: date mismatch (${r.date} vs ${date})`);
      return;
    }

    // Check overlap waktu
    const rStart = r.time;
    const rEnd = r.endTime;

    // Logic overlap: startTime < rEnd && endTime > rStart
    const isOverlapping = time < rEnd && endTime > rStart;

    console.log(
      `🔍 Check ${r.id}: ${rStart}-${rEnd} vs ${time}-${endTime} = ${isOverlapping ? "OVERLAP ✅" : "no overlap"}`,
    );

    if (isOverlapping) {
      reservedSet.add(r.tableNumber);
    }
  });

  return reservedSet;
}

/**
 * Get info slot waktu reservasi yang sudah ada (untuk tooltip)
 */
function getReservedSlotInfo(tableId, date, time) {
  const allReservations = StorageBridge.getReservations();
  const endTime = calculateEndTime(time);

  const reservation = allReservations.find((r) => {
    if (r.tableNumber !== tableId) return false;
    if (r.date !== date) return false;
    if (r.status === "cancelled" || r.status === "checked-out") return false;

    return time < r.endTime && endTime > r.time;
  });

  if (reservation) {
    return `${reservation.time}-${reservation.endTime}`;
  }
  return "";
}

/**
 * Show info ketika user klik meja yang sudah di-reserve
 */
function showReservedInfo(tableId) {
  const date = document.getElementById('resDate').value;
  const time = document.getElementById('resTime').value;
  const table = getTableById(tableId);
  
  const allReservations = StorageBridge.getReservations();
  const reservation = allReservations.find(r => {
    if (r.tableNumber !== tableId) return false;
    if (r.date !== date) return false;
    if (r.status === 'cancelled' || r.status === 'checked-out') return false;
    
    const endTime = calculateEndTime(time);
    return time < r.endTime && endTime > r.time;
  });
  
  if (reservation) {
    // ✅ MODAL KUSTOM (pengganti alert)
    Modal.alert({
      type: 'warning',
      title: 'Meja Tidak Tersedia',
      message: `${table.name} sudah dibooking`,
      html: `
        <div class="space-y-3">
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="user" class="w-4 h-4 text-orange-600"></i>
              <span class="font-semibold text-orange-900">${reservation.customerName}</span>
            </div>
            <div class="space-y-1 text-sm text-orange-800">
              <div class="flex justify-between">
                <span>Waktu:</span>
                <span class="font-semibold">${reservation.time} - ${reservation.endTime}</span>
              </div>
              <div class="flex justify-between">
                <span>Tamu:</span>
                <span class="font-semibold">${reservation.guestCount} orang</span>
              </div>
              <div class="flex justify-between">
                <span>Status:</span>
                <span class="font-semibold capitalize">${reservation.status}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-500 text-center">
            Silakan pilih meja lain atau ubah waktu reservasi
          </p>
        </div>
      `,
      confirmText: 'Mengerti',
      size: 'md'
    });
  }
}

function selectTable(tableId) {
  selectedTable = tableId;
  renderTables();
}

/**
 * Update detail info meja yang dipilih
 */
function updateTableInfo() {
  const infoDiv = document.getElementById("tableInfo");
  if (!infoDiv) return;

  if (!selectedTable) {
    infoDiv.classList.add("hidden");
    return;
  }

  const table = getTableById(selectedTable);
  if (!table) return;

  const date = document.getElementById("resDate").value;
  const time = document.getElementById("resTime").value;
  const endTime = calculateEndTime(time);
  const categoryInfo = TABLE_CATEGORIES[table.category];
  const locationInfo = TABLE_LOCATIONS[table.location];

  const positionLabels = {
    window: "Dekat Jendela",
    center: "Tengah Ruangan",
    corner: "Pojok Ruangan",
    terrace: "Teras",
    garden: "Taman",
    private: "Area Privat",
  };

  const shapeLabels = {
    round: "Bulat",
    square: "Kotak",
    long: "Panjang",
  };

  infoDiv.classList.remove("hidden");
  infoDiv.innerHTML = `
    <div class="bg-gradient-to-br from-forest/5 to-forest/10 rounded-2xl p-5 border border-forest/20">
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 bg-forest text-white rounded-2xl flex items-center justify-center flex-shrink-0">
          <i data-lucide="${table.icon || "armchair"}" class="w-8 h-8"></i>
        </div>
        
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <h3 class="font-display text-xl font-bold text-forest">${table.name}</h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-${categoryInfo.color}-100 text-${categoryInfo.color}-700">
              ${categoryInfo.label}
            </span>
          </div>
          
          <p class="text-sm text-gray-600 mb-3">${table.description}</p>
          
          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div class="flex items-center gap-1.5">
              <i data-lucide="users" class="w-3.5 h-3.5 text-forest"></i>
              <span><strong>${table.minCapacity}-${table.maxCapacity}</strong> orang</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="${locationInfo.icon}" class="w-3.5 h-3.5 text-forest"></i>
              <span>${locationInfo.label}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-forest"></i>
              <span>${positionLabels[table.position]}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="shapes" class="w-3.5 h-3.5 text-forest"></i>
              <span>Meja ${shapeLabels[table.shape]}</span>
            </div>
          </div>
          
          ${
            time
              ? `
            <div class="bg-white rounded-lg p-3 border border-forest/20">
              <p class="text-xs text-gray-500 mb-1">Jadwal Reservasi:</p>
              <p class="font-semibold text-forest">
                ${formatDate(date)} • ${time} - ${endTime}
              </p>
            </div>
          `
              : `
            <div class="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p class="text-xs text-yellow-700 flex items-center gap-1">
                <i data-lucide="info" class="w-3 h-3"></i>
                Pilih waktu untuk melihat jadwal reservasi
              </p>
            </div>
          `
          }
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function calculateEndTime(startTime) {
  if (!startTime) return "";
  const [hours, minutes] = startTime.split(":").map(Number);
  let endHours = hours + 2;
  let endMinutes = minutes;
  if (endHours >= 24) endHours -= 24;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

function submitReservation() {
  const date = document.getElementById('resDate').value;
  const time = document.getElementById('resTime').value;
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  
  // ✅ VALIDASI DENGAN MODAL (pengganti showToast)
  if (!date || !time) {
    Modal.warning({
      title: 'Tanggal & Waktu Belum Dipilih',
      message: 'Silakan pilih tanggal dan waktu reservasi terlebih dahulu.',
      icon: 'calendar-clock',
      confirmText: 'OK'
    });
    return;
  }
  
  if (!selectedTable) {
    Modal.warning({
      title: 'Meja Belum Dipilih',
      message: 'Silakan pilih meja yang ingin Anda reservasi.',
      icon: 'armchair',
      confirmText: 'Pilih Meja'
    });
    return;
  }
  
  if (!name || !phone) {
    Modal.warning({
      title: 'Data Pemesan Belum Lengkap',
      message: 'Silakan lengkapi nama dan nomor WhatsApp Anda.',
      icon: 'user',
      confirmText: 'Lengkapi Data'
    });
    return;
  }
  
  // Validasi nomor HP
  if (!/^08\d{8,12}$/.test(phone)) {
    Modal.error({
      title: 'Nomor WhatsApp Tidak Valid',
      message: 'Nomor WhatsApp harus dimulai dengan +62 dan terdiri dari 10-13 digit.',
      icon: 'phone',
      confirmText: 'Perbaiki'
    });
    return;
  }
  
  const table = getTableById(selectedTable);
  
  // ✅ KONFIRMASI SEBELUM LANJUT
  Modal.confirm({
    title: 'Konfirmasi Reservasi',
    message: 'Periksa kembali data reservasi Anda:',
    html: `
      <div class="bg-cream rounded-lg p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Tanggal:</span>
          <span class="font-semibold">${formatDate(date)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Waktu:</span>
          <span class="font-semibold">${time} - ${calculateEndTime(time)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Meja:</span>
          <span class="font-semibold">${table.name} (${table.minCapacity}-${table.maxCapacity} orang)</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Tamu:</span>
          <span class="font-semibold">${guestCount} orang</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Nama:</span>
          <span class="font-semibold">${name}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">WhatsApp:</span>
          <span class="font-semibold">${phone}</span>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-3 text-center">
        Klik "Ya, Lanjutkan" untuk melanjutkan ke pemilihan menu
      </p>
    `,
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Periksa Lagi',
    size: 'md',
    onConfirm: () => {
      const reservationData = {
        date,
        time,
        endTime: calculateEndTime(time),
        tableNumber: selectedTable,
        tableName: table?.name,
        tableCategory: table?.category,
        guestCount,
        customerName: name,
        customerPhone: phone
      };
      
      sessionStorage.setItem('pendingReservation', JSON.stringify(reservationData));
      Router.navigate('/menu');
    }
  });
}

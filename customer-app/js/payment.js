// ===== PAYMENT PAGE (Unified: Reservation & Delivery) =====

let paymentMethod = "QRIS";
let paymentProof = null;

function renderPaymentPage(container) {
  const orderType = Router.currentRoute?.includes("reservation")
    ? "reservation"
    : "delivery";
  paymentProof = null;

  if (orderType === "reservation") {
    renderReservationPayment(container);
  } else {
    renderDeliveryPayment(container);
  }
}

function renderReservationPayment(container) {
  const reservationData = JSON.parse(
    sessionStorage.getItem("pendingReservation") || "null",
  );
  const menuCart = JSON.parse(sessionStorage.getItem("menuCart") || "[]");

  if (!reservationData) {
    Modal.error({
      title: "Data Tidak Ditemukan",
      message: "Data reservasi tidak ditemukan",
      confirmText: "Kembali",
      onConfirm: () => Router.navigate("/home"),
    });
    return;
  }

  renderPaymentUI(container, reservationData, menuCart, "reservation");
}

function renderDeliveryPayment(container) {
  const deliveryData = JSON.parse(
    sessionStorage.getItem("orderDeliveryData") || "null",
  );
  const orderCart = JSON.parse(sessionStorage.getItem("orderCart") || "[]");

  if (!deliveryData) {
    Modal.error({
      title: "Data Tidak Ditemukan",
      message: "Data pengiriman tidak ditemukan",
      confirmText: "Kembali",
      onConfirm: () => Router.navigate("/order"),
    });
    return;
  }

  renderPaymentUI(container, deliveryData, orderCart, "delivery");
}

function renderPaymentUI(container, data, cart, orderType) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const isReservation = orderType === "reservation";
  const title = isReservation ? "Pembayaran Reservasi" : "Pembayaran Pesanan";
  const subtitle = isReservation
    ? "Selesaikan pembayaran untuk konfirmasi reservasi"
    : "Selesaikan pembayaran untuk memproses pesanan";

  container.innerHTML = `
    <main class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="font-display text-3xl ${isReservation ? "text-forest" : "text-terra"} mb-2">${title}</h1>
      <p class="text-gray-600 mb-8">${subtitle}</p>

      <!-- Order Summary -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4">Ringkasan Pesanan</h2>
        <div id="orderSummary" class="space-y-3 mb-4"></div>
        <div class="border-t pt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal</span>
            <span id="subtotal">Rp 0</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Tax (10%)</span>
            <span id="tax">Rp 0</span>
          </div>
          <div class="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span id="total" class="${isReservation ? "text-forest" : "text-terra"}">Rp 0</span>
          </div>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4">Metode Pembayaran</h2>
        <div class="space-y-3">
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="QRIS" checked>
            <div class="payment-icon">
              <i data-lucide="qr-code" class="w-6 h-6"></i>
            </div>
            <div class="flex-1">
              <p class="font-semibold">QRIS</p>
              <p class="text-sm text-gray-600">Scan QR code untuk bayar</p>
            </div>
          </label>
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="TRANSFER">
            <div class="payment-icon">
              <i data-lucide="building-2" class="w-6 h-6"></i>
            </div>
            <div class="flex-1">
              <p class="font-semibold">Transfer Bank</p>
              <p class="text-sm text-gray-600">Transfer ke rekening BCA</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Payment Details -->
      <div id="paymentDetails" class="card mb-6"></div>

      <!-- Upload Bukti Pembayaran -->
      <div class="card mb-6">
        <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
          <i data-lucide="upload" class="w-5 h-5 text-forest"></i>
          Upload Bukti Pembayaran
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          Setelah melakukan pembayaran, upload bukti transfer/screenshot untuk verifikasi.
        </p>
        
        <div id="uploadArea" class="upload-area border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-forest hover:bg-forest/5 transition">
          <input type="file" id="proofInput" accept="image/*" class="hidden" onchange="handleProofUpload(event)">
          <div id="uploadPlaceholder">
            <i data-lucide="image-plus" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
            <p class="font-semibold text-gray-700 mb-1">Klik untuk upload atau drag & drop</p>
            <p class="text-xs text-gray-500">Format: JPG, PNG, WEBP (Max 5MB)</p>
          </div>
          <div id="uploadPreview" class="hidden">
            <img id="previewImage" class="max-h-64 mx-auto rounded-lg shadow-md mb-3" alt="Preview">
            <div class="flex items-center justify-center gap-2">
              <span id="fileName" class="text-sm text-gray-600 truncate max-w-xs"></span>
              <button onclick="removeProof(event)" class="text-red-600 hover:text-red-700 p-1" title="Hapus">
                <i data-lucide="x-circle" class="w-5 h-5"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
          <i data-lucide="info" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
          <span>Bukti pembayaran akan diverifikasi oleh admin. Pesanan akan diproses setelah bukti valid.</span>
        </div>
      </div>

      <button onclick="confirmPayment()" class="btn ${isReservation ? "btn-primary" : "btn-terra"} btn-full">
        Konfirmasi Pembayaran ✓
      </button>
    </main>
  `;

  renderOrderSummary(data, cart, orderType);
  renderPaymentDetails(cart, total);
  setupDragDrop();

  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      paymentMethod = e.target.value;
      renderPaymentDetails(cart, total);
    });
  });
}

function setupDragDrop() {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("proofInput");

  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") {
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.add("border-forest", "bg-forest/5");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove("border-forest", "bg-forest/5");
    });
  });

  uploadArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processProofFile(files[0]);
    }
  });
}

function handleProofUpload(event) {
  const file = event.target.files[0];
  if (file) {
    processProofFile(file);
  }
}

function processProofFile(file) {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    Modal.error({
      title: "Format Tidak Valid",
      message: "Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan",
      icon: "file-x",
    });
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    Modal.error({
      title: "File Terlalu Besar",
      message: "Ukuran file maksimal 5MB",
      icon: "file-warning",
    });
    return;
  }

  const uploadPlaceholder = document.getElementById("uploadPlaceholder");
  if (uploadPlaceholder) {
    uploadPlaceholder.innerHTML = `
      <div class="animate-pulse">
        <i data-lucide="loader-2" class="w-12 h-12 mx-auto mb-3 text-forest animate-spin"></i>
        <p class="text-sm text-gray-600">Memproses gambar...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  compressImage(file, 800, 0.7)
    .then((base64) => {
      paymentProof = {
        data: base64,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };

      const preview = document.getElementById("uploadPreview");
      const previewImg = document.getElementById("previewImage");
      const fileName = document.getElementById("fileName");

      if (preview && previewImg && fileName) {
        previewImg.src = base64;
        fileName.textContent = file.name;
        preview.classList.remove("hidden");
        document.getElementById("uploadPlaceholder").classList.add("hidden");
      }

      showToast("Bukti pembayaran berhasil diupload", "success");
    })
    .catch((err) => {
      console.error("Error compressing image:", err);
      Modal.error({
        title: "Gagal Memproses",
        message: "Terjadi kesalahan saat memproses gambar",
        icon: "alert-circle",
      });
      resetUploadArea();
    });
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function removeProof(event) {
  event.stopPropagation();
  paymentProof = null;
  resetUploadArea();
  showToast("Bukti pembayaran dihapus", "info");
}

function resetUploadArea() {
  const uploadPlaceholder = document.getElementById("uploadPlaceholder");
  const uploadPreview = document.getElementById("uploadPreview");
  const fileInput = document.getElementById("proofInput");

  if (uploadPlaceholder) {
    uploadPlaceholder.classList.remove("hidden");
    uploadPlaceholder.innerHTML = `
      <i data-lucide="image-plus" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
      <p class="font-semibold text-gray-700 mb-1">Klik untuk upload atau drag & drop</p>
      <p class="text-xs text-gray-500">Format: JPG, PNG, WEBP (Max 5MB)</p>
    `;
  }
  if (uploadPreview) uploadPreview.classList.add("hidden");
  if (fileInput) fileInput.value = "";

  if (window.lucide) lucide.createIcons();
}

function renderOrderSummary(data, cart, orderType) {
  const summaryEl = document.getElementById("orderSummary");
  const isReservation = orderType === "reservation";

  let html = "";

  if (isReservation) {
    html = `
      <div class="pb-3 border-b">
        <p class="text-sm text-gray-600">Reservasi</p>
        <p class="font-semibold">Meja ${data.tableNumber} • ${data.guestCount} orang</p>
        <p class="text-sm text-gray-600">
          ${formatDate(data.date)} • ${data.time} - ${data.endTime}
        </p>
      </div>
    `;
  } else {
    html = `
      <div class="pb-3 border-b">
        <p class="text-sm text-gray-600">Pengiriman ke:</p>
        <p class="font-semibold">${data.name}</p>
        <p class="text-sm text-gray-600">${data.phone}</p>
        <p class="text-sm text-gray-600 mt-1">${data.address}</p>
        ${data.notes ? `<p class="text-xs text-gray-500 mt-1 italic">Catatan: ${data.notes}</p>` : ""}
      </div>
    `;
  }

  if (cart.length > 0) {
    html += '<div class="pt-3">';
    html += `<p class="text-sm text-gray-600 mb-2">${isReservation ? "Pre-order Menu" : "Menu Pesanan"}</p>`;
    cart.forEach((item) => {
      const variantText = formatVariants(item.variants);
      html += `
        <div class="py-2 border-b border-gray-100 last:border-0">
          <div class="flex justify-between text-sm">
            <span>${item.name} ×${item.qty}</span>
            <span class="font-semibold">${formatCurrency(item.price * item.qty)}</span>
          </div>
          ${variantText ? `<p class="text-xs text-forest mt-1 flex items-center gap-1"><i data-lucide="tag" class="w-3 h-3"></i>${variantText}</p>` : ""}
        </div>
      `;
    });
    html += "</div>";
  }

  summaryEl.innerHTML = html;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("tax").textContent = formatCurrency(tax);
  document.getElementById("total").textContent = formatCurrency(total);

  if (window.lucide) lucide.createIcons();
}

function renderPaymentDetails(cart, total) {
  const detailsEl = document.getElementById("paymentDetails");

  if (paymentMethod === "QRIS") {
    detailsEl.innerHTML = `
      <h2 class="font-semibold text-lg mb-4">Scan QR Code</h2>
      <div class="text-center">
        <div class="barcode-container inline-block mb-4">
          <div id="qrcode" class="w-64 h-64 flex items-center justify-center">
            <i data-lucide="qr-code" class="w-48 h-48 text-forest"></i>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-2">Scan dengan aplikasi e-wallet atau mobile banking</p>
        <p class="text-xs text-gray-500">
          Total: <span class="font-bold text-forest">${formatCurrency(total)}</span>
        </p>
      </div>
    `;
  } else {
    detailsEl.innerHTML = `
      <h2 class="font-semibold text-lg mb-4">Transfer Bank</h2>
      <div class="space-y-3">
        <div class="bg-cream rounded-xl p-4">
          <p class="text-sm text-gray-600 mb-1">Bank BCA</p>
          <p class="font-mono font-bold text-lg">1234567890</p>
          <p class="text-sm text-gray-600 mt-1">a.n. Sban's Corner</p>
        </div>
        <div class="bg-cream rounded-xl p-4">
          <p class="text-sm text-gray-600 mb-1">Jumlah Transfer</p>
          <p class="font-bold text-2xl text-forest">${formatCurrency(total)}</p>
        </div>
        <p class="text-xs text-gray-500">Setelah transfer, klik tombol konfirmasi di bawah</p>
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function confirmPayment() {
  const orderType = Router.currentRoute?.includes("reservation") ? "reservation" : "delivery";

  if (!paymentProof) {
    Modal.warning({
      title: "Bukti Pembayaran Belum Diupload",
      message: "Silakan upload bukti pembayaran untuk memverifikasi pesanan Anda.",
      icon: "upload",
      confirmText: "Upload Sekarang",
    });
    return;
  }

  const cart = orderType === "reservation"
    ? JSON.parse(sessionStorage.getItem("menuCart") || "[]")
    : JSON.parse(sessionStorage.getItem("orderCart") || "[]");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  Modal.confirm({
    title: "Konfirmasi Pembayaran",
    message: "Anda akan melakukan konfirmasi pembayaran untuk pesanan ini.",
    html: `
      <div class="space-y-3">
        <div class="bg-cream rounded-lg p-4">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Subtotal:</span>
            <span class="font-semibold">${formatCurrency(subtotal)}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Tax (10%):</span>
            <span class="font-semibold">${formatCurrency(tax)}</span>
          </div>
          <div class="border-t pt-2 mt-2 flex justify-between">
            <span class="font-bold text-lg">Total:</span>
            <span class="font-bold text-lg ${orderType === "reservation" ? "text-forest" : "text-terra"}">
              ${formatCurrency(total)}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-2 text-sm">
            <i data-lucide="${paymentMethod === "QRIS" ? "qr-code" : "building-2"}" class="w-4 h-4"></i>
            <span>Metode: ${paymentMethod}</span>
          </div>
        </div>
        
        <div class="border border-gray-200 rounded-lg p-3">
          <p class="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <i data-lucide="image" class="w-3 h-3"></i>
            Bukti Pembayaran:
          </p>
          <img src="${paymentProof.data}" class="max-h-32 rounded border border-gray-200" alt="Bukti">
          <p class="text-xs text-gray-500 mt-1 truncate">${paymentProof.name}</p>
        </div>
        
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
          <i data-lucide="info" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
          <span>Pesanan akan diproses setelah admin memverifikasi bukti pembayaran Anda.</span>
        </div>
      </div>
    `,
    confirmText: "Kirim Konfirmasi",
    cancelText: "Periksa Lagi",
    size: "md",
    onConfirm: () => {
      console.log('✅ Modal confirmed, processing payment...');
      
      try {
        if (orderType === "reservation") {
          processReservationPayment();
        } else {
          processDeliveryPayment();
        }
      } catch (error) {
        console.error('❌ Error processing payment:', error);
        Modal.error({
          title: 'Error',
          message: 'Terjadi kesalahan: ' + error.message,
          icon: 'alert-circle'
        });
      }
    },
  });

  if (window.lucide) lucide.createIcons();
}

function processReservationPayment() {
  const reservationData = JSON.parse(sessionStorage.getItem('pendingReservation') || 'null');
  const menuCart = JSON.parse(sessionStorage.getItem('menuCart') || '[]');
  
  if (!reservationData) {
    Modal.error({ 
      title: 'Error', 
      message: 'Data reservasi tidak ditemukan',
      confirmText: 'Kembali ke Beranda',
      onConfirm: () => Router.navigate('/home')
    });
    return;
  }
  
  const subtotal = menuCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  
  const orderId = generateId('RES');
  
  const reservation = {
    id: orderId,
    order_id: orderId,
    orderType: 'reservation',
    date: reservationData.date,
    time: reservationData.time,
    endTime: reservationData.endTime,
    tableNumber: reservationData.tableNumber,
    tableName: reservationData.tableName || '',
    tableCategory: reservationData.tableCategory || '',
    guestCount: reservationData.guestCount,
    customerName: reservationData.customerName,
    customerPhone: reservationData.customerPhone,
    menuOrders: menuCart,
    items: menuCart,
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentMethod: paymentMethod,
    payment_method: paymentMethod,
    
    // ✅ UBAH: Langsung verified & confirmed (tidak perlu admin verifikasi)
    paymentStatus: 'verified',  // Dari 'pending_verification' jadi 'verified'
    paymentProof: paymentProof,
    status: 'confirmed',  // Dari 'pending' jadi 'confirmed'
    
    statusHistory: [{
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      note: 'Reservasi dikonfirmasi otomatis setelah upload bukti pembayaran'
    }],
    createdAt: new Date().toISOString(),
    source: 'customer-app'
  };
  
  try {
    StorageBridge.saveReservation(reservation);
    sessionStorage.setItem('confirmedOrder', JSON.stringify(reservation));
    sessionStorage.removeItem('pendingReservation');
    sessionStorage.removeItem('menuCart');
    paymentProof = null;
    
    Router.navigate('/reservation-confirmation');
    
  } catch (error) {
    console.error('❌ Error saving reservation:', error);
    Modal.error({
      title: 'Error',
      message: 'Gagal menyimpan reservasi: ' + error.message,
      icon: 'alert-circle'
    });
  }
}

function processDeliveryPayment() {
  const deliveryData = JSON.parse(sessionStorage.getItem('orderDeliveryData') || 'null');
  const orderCart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
  
  if (!deliveryData) {
    Modal.error({ 
      title: 'Error', 
      message: 'Data pengiriman tidak ditemukan',
      confirmText: 'Kembali',
      onConfirm: () => Router.navigate('/order')
    });
    return;
  }
  
  const subtotal = orderCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  
  const orderId = generateId('ORD');
  
  const order = {
    id: orderId,
    order_id: orderId,
    orderType: 'delivery',
    items: orderCart,
    customerName: deliveryData.name,
    customerPhone: deliveryData.phone,
    deliveryAddress: deliveryData.address,
    deliveryNotes: deliveryData.notes || '',
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentMethod: paymentMethod,
    payment_method: paymentMethod,
    
    // ✅ UBAH: Langsung verified & preparing (tidak perlu admin verifikasi)
    paymentStatus: 'verified',  // Dari 'pending_verification' jadi 'verified'
    paymentProof: paymentProof,
    status: 'preparing',  // Dari 'pending' jadi 'preparing'
    
    statusHistory: [{
      status: 'preparing',
      timestamp: new Date().toISOString(),
      note: 'Pesanan dikonfirmasi otomatis dan sedang diproses'
    }],
    createdAt: new Date().toISOString(),
    source: 'customer-app'
  };
  
  try {
    StorageBridge.saveDeliveryOrder(order);
    sessionStorage.setItem('confirmedOrder', JSON.stringify(order));
    sessionStorage.removeItem('orderDeliveryData');
    sessionStorage.removeItem('orderCart');
    paymentProof = null;
    
    Router.navigate('/order-tracking');
    
  } catch (error) {
    console.error('❌ Error saving order:', error);
    Modal.error({
      title: 'Error',
      message: 'Gagal menyimpan pesanan: ' + error.message,
      icon: 'alert-circle'
    });
  }
}
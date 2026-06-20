// ===== RECEIPT MODULE =====

/**
 * Menampilkan struk pembayaran dengan desain premium
 */
// ===== RECEIPT MODULE =====

/**
 * Menampilkan struk pembayaran dengan desain premium
 */
function showReceipt(orderId, items, total, paymentMethod, tendered, change) {
  const receiptContent = document.getElementById('receiptContent');
  const receiptModal = document.getElementById('receiptModal');

  if (!receiptContent || !receiptModal) return;

  // Hitung subtotal & tax untuk ditampilkan
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(subtotal * 0.1);
  const date = new Date();
  const dateStr = date.toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const timeStr = date.toLocaleTimeString('id-ID', { 
    hour: '2-digit', minute: '2-digit' 
  });

  // Payment method styling
  const paymentStyles = {
    'CASH': { 
      bg: 'bg-green-50', 
      text: 'text-green-700', 
      icon: '💵',
      label: 'Cash Payment'
    },
    'QRIS': { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      icon: '📱',
      label: 'QRIS Payment'
    }
  };
  const pm = paymentStyles[paymentMethod] || paymentStyles['CASH'];

  receiptContent.innerHTML = `
    <!-- ===== HEADER WITH SUCCESS ANIMATION ===== -->
    <div class="relative bg-gradient-to-br from-forest to-forestLight px-6 pt-8 pb-16 text-center text-white overflow-hidden">
      <!-- Decorative circles -->
      <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
      <div class="absolute -bottom-20 -left-10 w-48 h-48 bg-white/5 rounded-full"></div>
      
      <!-- Animated Checkmark -->
      <div class="relative inline-block mb-4">
        <svg class="w-20 h-20" viewBox="0 0 52 52">
          <circle class="receipt-check-circle" cx="26" cy="26" r="25" 
            fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
          <path class="receipt-check-mark" fill="none" stroke="white" stroke-width="3" 
            stroke-linecap="round" stroke-linejoin="round"
            d="M14 27l7 7 16-16"/>
        </svg>
      </div>
      
      <p class="uppercase tracking-[0.3em] text-[10px] text-white/70 mb-2">
        Payment Successful
      </p>
      <h2 class="font-brand text-3xl font-bold">SBAN'S CORNER</h2>
      <p class="text-sm text-white/80 mt-1">Premium Coffee & Dining</p>
    </div>

    <!-- ===== ORDER INFO CARD ===== -->
    <div class="px-6 -mt-10 relative z-10">
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-3">
        
        <!-- Order ID -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-gray-500 text-sm">
            <i data-lucide="hash" class="w-4 h-4"></i>
            <span>Order ID</span>
          </div>
          <span class="font-mono font-semibold text-forest text-sm">${orderId}</span>
        </div>

        <!-- Date & Time -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-gray-500 text-sm">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>Date</span>
          </div>
          <div class="text-right">
            <div class="font-semibold text-sm">${dateStr}</div>
            <div class="text-xs text-gray-400">${timeStr} WIB</div>
          </div>
        </div>

        <!-- Payment Method Badge -->
        <div class="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
          <div class="flex items-center gap-2 text-gray-500 text-sm">
            <i data-lucide="credit-card" class="w-4 h-4"></i>
            <span>Payment</span>
          </div>
          <span class="${pm.bg} ${pm.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span>${pm.icon}</span>
            <span>${pm.label}</span>
          </span>
        </div>

      </div>
    </div>

    <!-- ===== ORDER ITEMS ===== -->
    <div class="px-6 mt-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-brand text-lg font-bold text-forest flex items-center gap-2">
          <i data-lucide="shopping-bag" class="w-5 h-5"></i>
          Order Items
        </h4>
        <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          ${items.reduce((sum, i) => sum + i.qty, 0)} items
        </span>
      </div>

      <div class="space-y-3">
        ${items.map((item, index) => {
          // Ambil data produk lengkap (termasuk images)
          const menuItem = typeof getMenuItemById === 'function' ? getMenuItemById(item.id) : null;
          const itemImages = menuItem?.images || '';
          const itemEmoji = menuItem?.emoji || '🍽️';
          const itemTotal = item.price * item.qty;
          
          return `
            <div class="receipt-item flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:border-forest/20 transition">
              <!-- Product Images with Fallback -->
              <div class="w-14 h-14 rounded-xl bg-cream flex-shrink-0 overflow-hidden relative group">
                ${itemImages ? `
                  <img 
                    src="${itemImages}" 
                    alt="${item.name}"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    loading="lazy"
                  />
                  <!-- Fallback Emoji (hidden by default) -->
                  <div class="hidden w-full h-full items-center justify-center text-2xl absolute inset-0 bg-cream">
                    ${itemEmoji}
                  </div>
                ` : `
                  <div class="w-full h-full flex items-center justify-center text-2xl">
                    ${itemEmoji}
                  </div>
                `}
              </div>
              
              <!-- Item Info -->
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-gray-800 truncate">${item.name}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-gray-500">Rp ${item.price.toLocaleString('id-ID')}</span>
                  <span class="text-gray-300">×</span>
                  <span class="text-xs font-semibold text-forest bg-forest/10 px-2 py-0.5 rounded-full">
                    ${item.qty}
                  </span>
                </div>
              </div>
              
              <!-- Item Total -->
              <div class="text-right flex-shrink-0">
                <p class="font-bold text-sm text-gray-800">Rp ${itemTotal.toLocaleString('id-ID')}</p>
                <p class="text-[10px] text-gray-400 mt-0.5">subtotal</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- ===== PAYMENT SUMMARY ===== -->
    <div class="px-6 mt-6">
      <div class="bg-gradient-to-br from-[#F9F6F2] to-[#FDFBF7] rounded-2xl p-5 space-y-2.5 border border-[#EFE7DE]">
        
        <!-- Subtotal -->
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Subtotal</span>
          <span class="font-medium text-gray-700">Rp ${subtotal.toLocaleString('id-ID')}</span>
        </div>
        
        <!-- Tax -->
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Tax (10%)</span>
          <span class="font-medium text-gray-700">Rp ${tax.toLocaleString('id-ID')}</span>
        </div>

        <!-- Divider -->
        <div class="border-t border-dashed border-[#E5DDD3] my-2"></div>

        <!-- Grand Total (Highlight) -->
        <div class="flex justify-between items-center py-2">
          <span class="font-brand text-lg font-bold text-forest">Grand Total</span>
          <span class="font-brand text-2xl font-bold text-terra">
            Rp ${total.toLocaleString('id-ID')}
          </span>
        </div>

        <!-- Divider -->
        <div class="border-t border-dashed border-[#E5DDD3] my-2"></div>

        <!-- Paid Amount -->
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 flex items-center gap-1">
            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
            Paid
          </span>
          <span class="font-semibold text-gray-800">Rp ${tendered.toLocaleString('id-ID')}</span>
        </div>

        ${paymentMethod === 'CASH' ? `
          <!-- Change (Only for CASH) -->
          <div class="flex justify-between text-sm bg-green-50 -mx-2 px-2 py-2 rounded-lg">
            <span class="text-green-700 font-medium flex items-center gap-1">
              <i data-lucide="coins" class="w-3.5 h-3.5"></i>
              Change
            </span>
            <span class="font-bold text-green-700">Rp ${change.toLocaleString('id-ID')}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- ===== QRIS QR CODE (Conditional) ===== -->
    ${paymentMethod === 'QRIS' ? `
      <div class="px-6 mt-6">
        <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
          <div class="inline-block bg-white p-3 rounded-xl mb-3 shadow-sm">
            <div class="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-2 grid grid-cols-8 grid-rows-8 gap-0.5">
                ${Array(64).fill(0).map(() => 
                  `<div class="${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'} rounded-sm"></div>`
                ).join('')}
              </div>
              <div class="relative bg-white p-1 rounded">
                <span class="text-xs font-bold text-forest">SC</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-blue-700 font-medium">Payment verified via QRIS</p>
          <p class="text-[10px] text-blue-500 mt-1">Transaction ID: ${orderId}</p>
        </div>
      </div>
    ` : ''}

    <!-- ===== FOOTER ===== -->
    <div class="px-6 mt-6 mb-6 text-center">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        <span class="text-forest text-lg">☕</span>
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      <p class="font-brand text-base font-bold text-forest italic">
        "Thank you for visiting!"
      </p>
      <p class="text-xs text-gray-500 mt-2">
        We hope to see you again soon
      </p>
      
      <div class="flex items-center justify-center gap-4 mt-4 text-gray-400">
        <a href="#" class="hover:text-forest transition">
          <i data-lucide="instagram" class="w-4 h-4"></i>
        </a>
        <a href="#" class="hover:text-forest transition">
          <i data-lucide="map-pin" class="w-4 h-4"></i>
        </a>
        <a href="#" class="hover:text-forest transition">
          <i data-lucide="phone" class="w-4 h-4"></i>
        </a>
      </div>

      <p class="text-[10px] text-gray-400 mt-4 font-mono">
        ${orderId} • ${date.toLocaleString('id-ID')}
      </p>
    </div>
  `;

  receiptModal.classList.remove('hidden');
  
  // Re-init Lucide icons untuk ikon baru
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

/**
 * Tutup modal receipt
 */
function closeReceipt() {
  const modal = document.getElementById('receiptModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Print struk
 */
function printReceipt() {
  window.print();
}

/**
 * Download struk sebagai file HTML
 */
function downloadReceipt() {
  const content = document.getElementById('receiptContent');
  if (!content) return;
  
  const orderId = content.querySelector('.font-mono')?.textContent || 'receipt';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${orderId}</title>
      <script src="https://cdn.tailwindcss.com"><\/script>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'DM Sans', sans-serif; background: #FDFBF7; padding: 20px; }
        .font-brand { font-family: 'Playfair Display', serif; }
      </style>
    </head>
    <body>
      <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
        ${content.innerHTML}
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${orderId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Tutup modal receipt
 */
function closeReceipt() {
  const modal = document.getElementById('receiptModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Print struk
 */
function printReceipt() {
  window.print();
}

/**
 * Download struk sebagai file HTML (atau bisa dikembangkan ke PDF)
 */
function downloadReceipt() {
  const content = document.getElementById('receiptContent');
  if (!content) return;
  
  const orderId = content.querySelector('.font-mono')?.textContent || 'receipt';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${orderId}</title>
      <script src="https://cdn.tailwindcss.com"><\/script>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'DM Sans', sans-serif; background: #FDFBF7; padding: 20px; }
        .font-brand { font-family: 'Playfair Display', serif; }
      </style>
    </head>
    <body>
      <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
        ${content.innerHTML}
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${orderId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
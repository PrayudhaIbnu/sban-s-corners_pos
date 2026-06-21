// ===== SEARCH ORDER PAGE =====

function renderSearchOrderPage(container) {
  container.innerHTML = `
    <main class="max-w-2xl mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-full bg-forest/10 flex items-center justify-center mb-4">
          <i data-lucide="search" class="w-8 h-8 text-forest"></i>
        </div>
        <h1 class="font-display text-3xl text-forest mb-2">Cari Pesanan</h1>
        <p class="text-gray-600">Masukkan ID pesanan Anda untuk melacak statusnya</p>
      </div>

      <!-- Search Form -->
      <div class="card mb-6">
        <form id="searchForm" class="space-y-4">
          <div>
            <label class="input-label">ID Pesanan</label>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="searchOrderId" 
                placeholder="Contoh: ORD-MQM600FB1D3C"
                class="input flex-1"
                required
              />
              <button type="submit" class="btn btn-primary whitespace-nowrap">
                <i data-lucide="search" class="w-4 h-4"></i>
                Cari
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">ID pesanan biasanya dimulai dengan "RES-" atau "ORD-"</p>
          </div>
        </form>
      </div>

      <!-- Recent Orders -->
      <div class="card">
        <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
          <i data-lucide="clock" class="w-5 h-5 text-forest"></i>
          Pesanan Terakhir (LocalStorage)
        </h2>
        <div id="recentOrders" class="space-y-3">
          <!-- Will be populated by JS -->
        </div>
      </div>
    </main>
  `;
  
  // Load recent orders
  renderRecentOrders();
  
  // Form submit
  document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const orderId = document.getElementById('searchOrderId').value.trim();
    if (orderId) {
      Router.navigate(`/tracking?id=${orderId}`);
    }
  });
  
  if (window.lucide) lucide.createIcons();
}

function renderRecentOrders() {
  const container = document.getElementById('recentOrders');
  if (!container) return;
  
  // Get orders from localStorage
  const allOrders = StorageBridge.getOrders();
  const recent = allOrders.slice(-5).reverse(); // Last 5 orders
  
  if (recent.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-30"></i>
        <p class="text-sm">Belum ada pesanan</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = recent.map(order => {
    const normalizedOrder = {
      order_id: order.order_id || order.id,
      id: order.id || order.order_id,
      date: order.date || order.createdAt,
      status: order.status || 'pending',
      total: order.total || 0,
      orderType: order.orderType || 'reservation',
      customerName: order.customerName || '',
      items: order.items || order.menuOrders || []
    };
    
    const itemCount = normalizedOrder.items.reduce((sum, item) => sum + item.qty, 0);
    const statusColors = {
      pending: 'orange',
      preparing: 'blue',
      ready: 'green',
      shipping: 'purple',
      completed: 'forest',
      cancelled: 'red'
    };
    
    const statusColor = statusColors[normalizedOrder.status] || 'gray';
    
    return `
      <div class="border border-gray-200 rounded-lg p-3 hover:border-forest transition cursor-pointer" 
           onclick="Router.navigate('/tracking?id=${normalizedOrder.order_id}')">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm font-semibold text-forest">${normalizedOrder.order_id}</span>
            <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${statusColor}-100 text-${statusColor}-700">
              ${normalizedOrder.status}
            </span>
          </div>
          <span class="text-xs text-gray-500">${new Date(normalizedOrder.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-600">
          <span>${normalizedOrder.orderType === 'delivery' ? 'Delivery' : ' Reservasi'}</span>
          <span>${itemCount} item • Rp ${normalizedOrder.total.toLocaleString('id-ID')}</span>
        </div>
      </div>
    `;
  }).join('');
}
// ===== STORAGE BRIDGE =====
// Utility untuk sinkronisasi data antar aplikasi

const StorageBridge = {
  channel: null,
  listeners: {},
  
  /**
   * Initialize bridge
   */
  init() {
    // Setup BroadcastChannel untuk real-time sync
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('sbans_sync');
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      console.log('🔗 StorageBridge initialized');
    } else {
      console.warn('⚠️ BroadcastChannel not supported, using storage events');
    }
    
    // Fallback: listen storage events (untuk tab berbeda)
    window.addEventListener('storage', (e) => {
      if (e.key && this.listeners[e.key]) {
        this.listeners[e.key].forEach(fn => fn(JSON.parse(e.newValue)));
      }
    });
  },
  
  /**
   * Broadcast message ke semua tab/window
   */
  broadcast(type, data) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      source: window.location.pathname
    };
    
    if (this.channel) {
      this.channel.postMessage(message);
    }
    
    // Trigger local listeners juga
    this.handleMessage(message);
  },
  
  /**
   * Handle incoming message
   */
  handleMessage(message) {
    const { type, data } = message;
    
    if (this.listeners[type]) {
      this.listeners[type].forEach(fn => {
        try {
          fn(data);
        } catch (err) {
          console.error('Error in listener:', err);
        }
      });
    }
  },
  
  /**
   * Register listener untuk event tertentu
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  /**
   * Remove listener
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(fn => fn !== callback);
  },
  
  // ========================================
  // RESERVATIONS
  // ========================================
  
  /**
   * Get semua reservasi
   */
  getReservations() {
    const data = localStorage.getItem('sbans_reservations');
    return data ? JSON.parse(data) : [];
  },
  
  /**
   * Save reservasi baru
   */
  saveReservation(reservation) {
    const reservations = this.getReservations();
    
    // Cek duplikasi
    const exists = reservations.find(r => r.id === reservation.id);
    if (exists) {
      // Update existing
      Object.assign(exists, reservation);
    } else {
      reservations.push(reservation);
    }
    
    localStorage.setItem('sbans_reservations', JSON.stringify(reservations));
    
    // Broadcast ke semua tab
    this.broadcast('reservation:new', reservation);
    
    return reservation;
  },
  
  /**
   * Update status reservasi
   */
  updateReservationStatus(reservationId, newStatus, note = '') {
    const reservations = this.getReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) return false;
    
    reservation.status = newStatus;
    reservation.statusHistory = reservation.statusHistory || [];
    reservation.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note
    });
    
    if (newStatus === 'checked-in') {
      reservation.checkedInAt = new Date().toISOString();
    } else if (newStatus === 'checked-out') {
      reservation.checkedOutAt = new Date().toISOString();
    }
    
    localStorage.setItem('sbans_reservations', JSON.stringify(reservations));
    
    // Broadcast update
    this.broadcast('reservation:update', reservation);
    
    return reservation;
  },
  
  /**
   * Cancel reservasi
   */
  cancelReservation(reservationId, reason = '') {
    return this.updateReservationStatus(reservationId, 'cancelled', reason);
  },
  
  /**
   * Get reservasi by ID
   */
  getReservationById(id) {
    const reservations = this.getReservations();
    return reservations.find(r => r.id === id);
  },
  
  /**
   * Get reservasi aktif (belum checked-out/cancelled)
   */
  getActiveReservations() {
    return this.getReservations().filter(r => 
      r.status !== 'cancelled' && r.status !== 'checked-out'
    );
  },
  
  /**
   * Get reservasi untuk tanggal & waktu tertentu
   */
  getReservationsForSlot(date, time, duration = 2) {
    const reservations = this.getReservations();
    const [hours, minutes] = time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (duration * 60);
    
    return reservations.filter(r => {
      if (r.date !== date) return false;
      if (r.status === 'cancelled' || r.status === 'checked-out') return false;
      
      const [rHours, rMinutes] = r.time.split(':').map(Number);
      const rStart = rHours * 60 + rMinutes;
      
      // Parse end time
      let rEnd;
      if (r.endTime) {
        const [eHours, eMinutes] = r.endTime.split(':').map(Number);
        rEnd = eHours * 60 + eMinutes;
      } else {
        rEnd = rStart + 120; // default 2 jam
      }
      
      // Check overlap
      return (startMinutes < rEnd && endMinutes > rStart);
    });
  }
};

// Auto-init saat script di-load
StorageBridge.init();
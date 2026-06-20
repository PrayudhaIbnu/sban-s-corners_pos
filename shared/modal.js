// ===== MODAL SYSTEM =====
// Modal kustom untuk menggantikan alert() dan confirm() browser

const Modal = {
  container: null,
  callbacks: {}, // ⚠️ SIMPAN CALLBACKS DI OBJECT, BUKAN DI DATASET
  
  /**
   * Initialize modal container
   */
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'modal-root';
      this.container.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none';
      document.body.appendChild(this.container);
    }
  },
  
  /**
   * Show modal
   */
  show(options) {
    this.init();
    
    const {
      type = 'info',
      title = '',
      message = '',
      icon = null,
      confirmText = 'OK',
      cancelText = 'Batal',
      showCancel = false,
      onConfirm = null,
      onCancel = null,
      onClose = null,
      size = 'md',
      html = null,
      input = null
    } = options;
    
    const icons = {
      info: 'info',
      success: 'check-circle',
      warning: 'alert-triangle',
      error: 'x-circle',
      confirm: 'help-circle'
    };
    const iconToUse = icon || icons[type] || 'info';
    
    const themes = {
      info: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700' },
      success: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200', button: 'bg-forest hover:bg-forestLight' },
      warning: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200', button: 'bg-orange-600 hover:bg-orange-700' },
      error: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200', button: 'bg-red-600 hover:bg-red-700' },
      confirm: { bg: 'bg-cream', icon: 'text-forest', border: 'border-forest/20', button: 'bg-forest hover:bg-forestLight' }
    };
    const theme = themes[type] || themes.info;
    
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg'
    };
    const sizeClass = sizes[size] || sizes.md;
    
    const modalId = 'modal-' + Date.now();
    const modalHtml = `
      <div id="${modalId}" class="modal-overlay pointer-events-auto animate-fade-in">
        <div class="modal-content ${sizeClass} w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          
          <!-- Header -->
          <div class="${theme.bg} ${theme.border} border-b px-6 py-5">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full ${theme.bg} flex items-center justify-center flex-shrink-0">
                <i data-lucide="${iconToUse}" class="w-6 h-6 ${theme.icon}"></i>
              </div>
              <div class="flex-1">
                ${title ? `<h3 class="font-display text-xl font-bold text-forest">${title}</h3>` : ''}
                ${message ? `<p class="text-sm text-gray-600 mt-1">${message}</p>` : ''}
              </div>
              <button onclick="Modal.close('${modalId}')" class="text-gray-400 hover:text-gray-600 transition">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>
          
          <!-- Body -->
          <div class="px-6 py-4">
            ${html || ''}
            ${input ? `
              <input 
                type="${input.type || 'text'}" 
                id="${modalId}-input"
                value="${input.value || ''}"
                placeholder="${input.placeholder || ''}"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                ${input.autofocus !== false ? 'autofocus' : ''}
              />
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2 justify-end">
            ${showCancel ? `
              <button onclick="Modal.handleCancel('${modalId}')" class="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
                ${cancelText}
              </button>
            ` : ''}
            <button onclick="Modal.handleConfirm('${modalId}')" class="px-5 py-2.5 ${theme.button} text-white rounded-lg text-sm font-medium transition">
              ${confirmText}
            </button>
          </div>
          
        </div>
      </div>
    `;
    
    this.container.insertAdjacentHTML('beforeend', modalHtml);
    
    // ⚠️ SIMPAN CALLBACKS DI OBJECT, BUKAN JSON
    this.callbacks[modalId] = {
      onConfirm,
      onCancel,
      onClose
    };
    
    if (window.lucide) lucide.createIcons();
    
    if (input) {
      setTimeout(() => {
        const inputEl = document.getElementById(`${modalId}-input`);
        if (inputEl) inputEl.focus();
      }, 100);
    }
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close(modalId);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close(modalId);
        }
      });
    }
    
    return modalId;
  },
  
  /**
   * Close modal
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Panggil onClose callback
    if (this.callbacks[modalId]?.onClose) {
      this.callbacks[modalId].onClose();
    }
    
    modal.classList.add('animate-fade-out');
    
    setTimeout(() => {
      modal.remove();
      // Hapus callbacks
      delete this.callbacks[modalId];
    }, 200);
  },
  
  /**
   * Handle confirm button
   */
  handleConfirm(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const input = document.getElementById(`${modalId}-input`);
    const inputValue = input ? input.value : null;
    
    // ⚠️ PANGGIL CALLBACK DARI OBJECT
    if (this.callbacks[modalId]?.onConfirm) {
      const result = this.callbacks[modalId].onConfirm(inputValue);
      if (result === false) return;
    }
    
    this.close(modalId);
  },
  
  /**
   * Handle cancel button
   */
  handleCancel(modalId) {
    // ⚠️ PANGGIL CALLBACK DARI OBJECT
    if (this.callbacks[modalId]?.onCancel) {
      this.callbacks[modalId].onCancel();
    }
    
    this.close(modalId);
  },
  
  // ===== SHORTCUT METHODS =====
  
  alert(options) {
    return this.show({
      ...options,
      type: options.type || 'info',
      showCancel: false
    });
  },
  
  success(options) {
    return this.show({
      ...options,
      type: 'success',
      showCancel: false,
      confirmText: options.confirmText || 'OK'
    });
  },
  
  warning(options) {
    return this.show({
      ...options,
      type: 'warning',
      showCancel: false
    });
  },
  
  error(options) {
    return this.show({
      ...options,
      type: 'error',
      showCancel: false
    });
  },
  
  confirm(options) {
    return this.show({
      ...options,
      type: 'confirm',
      showCancel: true,
      confirmText: options.confirmText || 'Ya, Lanjutkan',
      cancelText: options.cancelText || 'Batal'
    });
  },
  
  prompt(options) {
    return this.show({
      ...options,
      type: 'info',
      showCancel: true,
      input: options.input || { type: 'text', placeholder: '' }
    });
  }
};

// ===== ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes modal-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes modal-fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes modal-scale-in {
    from { 
      opacity: 0; 
      transform: scale(0.9) translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: scale(1) translateY(0); 
    }
  }
  
  .animate-fade-in {
    animation: modal-fade-in 0.2s ease-out;
  }
  
  .animate-fade-out {
    animation: modal-fade-out 0.2s ease-out;
  }
  
  .animate-scale-in {
    animation: modal-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  
  .modal-content {
    transform-origin: center;
  }
`;
document.head.appendChild(style);

// Auto-init
Modal.init();
// ===== VARIANT SELECTION =====

/**
 * Cek apakah produk punya variants
 */
function hasVariants(item) {
  return Array.isArray(item.variants) && item.variants.length > 0;
}

/**
 * Buka modal pemilihan variant
 * @param {Object} item - Product item
 * @param {Function} onConfirm - Callback dengan parameter selectedVariants object
 */
function openVariantModal(item, onConfirm) {
  if (!hasVariants(item)) {
    // Langsung konfirmasi jika tidak ada variant
    onConfirm({});
    return;
  }
  
  // Default selection: option pertama dari setiap variant
  const selectedVariants = {};
  item.variants.forEach(v => {
    selectedVariants[v.title] = v.options[0];
  });
  
  // Build HTML untuk modal
  const variantsHTML = item.variants.map(variant => {
    return `
      <div class="mb-4 last:mb-0">
        <label class="input-label font-semibold">${variant.title}</label>
        <div class="grid grid-cols-1 gap-2">
          ${variant.options.map((option, idx) => `
            <label class="variant-option flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition hover:border-forest"
                   data-variant="${variant.title}" 
                   data-option="${option}">
              <input type="radio" 
                     name="variant_${variant.title.replace(/\s+/g, '_')}" 
                     value="${option}"
                     ${idx === 0 ? 'checked' : ''}
                     class="w-4 h-4 accent-forest">
              <span class="flex-1 text-sm font-medium">${option}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Preview produk di modal
  const previewHTML = `
    <div class="bg-cream rounded-xl p-3 mb-4 flex items-center gap-3">
      <div class="w-16 h-16 rounded-lg bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
        ${item.images ? `
          <img src="${item.images}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
        ` : `<i data-lucide="utensils" class="w-6 h-6 text-gray-400"></i>`}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-forest truncate">${item.name}</p>
        <p class="text-xs text-gray-500 truncate">${item.cat}</p>
        <p class="text-sm font-bold text-terra mt-1">${formatCurrency(item.price)}</p>
      </div>
    </div>
  `;
  
  Modal.show({
    type: 'confirm',
    title: 'Pilih Variasi',
    message: `Silakan pilih variasi untuk ${item.name}`,
    html: previewHTML + variantsHTML,
    confirmText: 'Tambahkan ke Keranjang',
    cancelText: 'Batal',
    size: 'md',
    onConfirm: () => {
      // Collect selected variants dari radio buttons
      const finalVariants = {};
      item.variants.forEach(variant => {
        const radioName = `variant_${variant.title.replace(/\s+/g, '_')}`;
        const selected = document.querySelector(`input[name="${radioName}"]:checked`);
        finalVariants[variant.title] = selected ? selected.value : variant.options[0];
      });
      
      onConfirm(finalVariants);
    }
  });
  
  // Update visual saat radio dipilih
  setTimeout(() => {
    document.querySelectorAll('.variant-option input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        // Hapus selected dari semua options di group yang sama
        const groupName = e.target.name;
        document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
          r.closest('.variant-option').classList.remove('border-forest', 'bg-forest/5');
          r.closest('.variant-option').classList.add('border-gray-200');
        });
        
        // Tambahkan selected ke yang dipilih
        const selectedOption = e.target.closest('.variant-option');
        selectedOption.classList.add('border-forest', 'bg-forest/5');
        selectedOption.classList.remove('border-gray-200');
      });
    });
    
    // Trigger change untuk default selection
    document.querySelectorAll('.variant-option input[type="radio"]:checked').forEach(radio => {
      radio.dispatchEvent(new Event('change'));
    });
    
    if (window.lucide) lucide.createIcons();
  }, 100);
}

/**
 * Generate variant key unik untuk cart item
 * Digunakan untuk membedakan item sama dengan variant berbeda
 */
function generateVariantKey(itemId, variants) {
  if (!variants || Object.keys(variants).length === 0) {
    return String(itemId);
  }
  const variantStr = Object.entries(variants)
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${itemId}-${variantStr}`;
}

/**
 * Format variants untuk ditampilkan
 * Contoh: "Pilihan Isian: Cumi Pedas"
 */
function formatVariants(variants) {
  if (!variants || Object.keys(variants).length === 0) return '';
  return Object.entries(variants)
    .map(([title, option]) => `${title}: ${option}`)
    .join(' • ');
}

/**
 * Render variants di cart item
 */
function renderVariantTags(variants) {
  if (!variants || Object.keys(variants).length === 0) return '';
  
  return `
    <div class="flex flex-wrap gap-1 mt-1">
      ${Object.entries(variants).map(([title, option]) => `
        <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-forest/10 text-forest">
          <i data-lucide="tag" class="w-2.5 h-2.5"></i>
          <span class="font-semibold">${option}</span>
        </span>
      `).join('')}
    </div>
  `;
}
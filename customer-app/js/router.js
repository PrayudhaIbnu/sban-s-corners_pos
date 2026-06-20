// ===== SPA ROUTER =====

const Router = {
  routes: {},
  currentRoute: null,
  headerConfig: {},
  
  /**
   * Daftarkan route
   */
  register(path, handler, headerConfig = {}) {
    this.routes[path] = {
      handler,
      headerConfig
    };
  },
  
  /**
   * Navigate ke route tertentu
   */
  navigate(path, params = {}) {
    // Simpan params ke sessionStorage
    if (Object.keys(params).length > 0) {
      sessionStorage.setItem('route_params', JSON.stringify(params));
    }
    
    // Update hash
    window.location.hash = path;
  },
  
  /**
   * Handle route change
   */
  handleRoute() {
    const hash = window.location.hash.slice(1) || '/home';
    const path = hash.split('?')[0];
    const params = this.getRouteParams();
    
    const route = this.routes[path];
    
    if (!route) {
      // Redirect ke home jika route tidak ditemukan
      this.navigate('/home');
      return;
    }
    
    this.currentRoute = path;
    
    // Update header & footer
    this.renderHeader(route.headerConfig);
    // this.renderFooter(route.headerConfig);
    
    // Render page
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';
    mainContent.scrollTop = 0;
    
    // Panggil handler
    route.handler(mainContent, params);
    
    // Re-init icons
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 50);
    }
  },
  
  /**
   * Render header berdasarkan route
   */
  renderHeader(config) {
    const header = document.getElementById('appHeader');
    
    if (config.hideHeader) {
      header.style.display = 'none';
      return;
    }
    
    header.style.display = '';
    
    const showBack = config.showBack !== false;
    const step = config.step;
    const totalSteps = config.totalSteps;
    const title = config.title || "SBAN'S CORNER";
    
    header.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="#/home" class="flex items-center gap-2 text-forest">
          ${showBack ? '<i data-lucide="arrow-left" class="w-5 h-5"></i>' : ''}
          <span class="font-display text-xl font-bold">${title}</span>
        </a>
        ${step ? `
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>Step ${step} of ${totalSteps}</span>
          </div>
        ` : `
          <a href="#/reservation" class="bg-forest text-white px-4 md:px-6 py-2 rounded-full text-sm font-semibold hover:bg-forestLight transition">
            Reservasi
          </a>
        `}
      </div>
    `;
    
    if (window.lucide) lucide.createIcons();
  },
  
//   /**
//    * Render footer berdasarkan route
//    */
//   renderFooter(config) {
//     const footer = document.getElementById('appFooter');
    
//     if (config.hideFooter) {
//       footer.innerHTML = '';
//       return;
//     }
    
//     footer.innerHTML = `
//       <footer class="bg-forest text-white py-8 px-4 mt-auto">
//         <div class="max-w-6xl mx-auto text-center">
//           <p class="font-display text-xl mb-2">SBAN'S CORNER</p>
//           <p class="text-white/60 text-sm">© 2026 All rights reserved</p>
//           <div class="flex items-center justify-center gap-4 mt-4">
//             <a href="#" class="text-white/60 hover:text-white transition">
//               <i data-lucide="instagram" class="w-5 h-5"></i>
//             </a>
//             <a href="#" class="text-white/60 hover:text-white transition">
//               <i data-lucide="map-pin" class="w-5 h-5"></i>
//             </a>
//             <a href="#" class="text-white/60 hover:text-white transition">
//               <i data-lucide="phone" class="w-5 h-5"></i>
//             </a>
//           </div>
//         </div>
//       </footer>
//     `;
    
//     if (window.lucide) lucide.createIcons();
//   },
  
  /**
   * Get route params dari sessionStorage
   */
  getRouteParams() {
    const params = sessionStorage.getItem('route_params');
    if (params) {
      sessionStorage.removeItem('route_params');
      return JSON.parse(params);
    }
    return {};
  },
  
  /**
   * Initialize router
   */
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }
};
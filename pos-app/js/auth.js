// ===== LOGIN & LOGOUT =====

function initAuth() {
  checkLoginStatus()

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      login();
    });
  }
}

function checkLoginStatus() {
  const isLoggedIn = loadAuthState();
  
  if (isLoggedIn) {
    // User sudah login, langsung tampilkan main app
    showMainApp();
  } else {
    // User belum login, tampilkan login page
    showLoginPage();
  }
}

function showMainApp() {
  const loginPage = document.getElementById('loginPage');
  const mainApp = document.getElementById('mainApp');
  const mobileHeader = document.getElementById('mobileHeader');
  const bottomNav = document.getElementById('bottomNav');
  
  if (loginPage) loginPage.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');
  
  if (mobileHeader) mobileHeader.style.display = '';
  if (bottomNav) bottomNav.style.display = '';
  
  // Navigate ke dashboard jika belum di halaman manapun
  if (typeof currentPage !== 'undefined' && !currentPage) {
    navigate('dashboard');
  }
}

function showLoginPage() {
  saveAuthState();

  const loginPage = document.getElementById('loginPage');
  const mainApp = document.getElementById('mainApp');
  const mobileHeader = document.getElementById('mobileHeader');
  const bottomNav = document.getElementById('bottomNav');
  
  if (mainApp) mainApp.classList.add('hidden');
  if (loginPage) loginPage.classList.remove('hidden');
  
  if (mobileHeader) mobileHeader.style.display = 'none';
  if (bottomNav) bottomNav.style.display = 'none';

  showMainApp();
  navigate('dashboard')
}

function login() {
  const loginPage = document.getElementById('loginPage');
  const mainApp = document.getElementById('mainApp');
  const mobileHeader = document.getElementById('mobileHeader');
  const bottomNav = document.getElementById('bottomNav');
  
  if (loginPage) loginPage.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');
  
  // Show mobile header & bottom nav after login
  if (mobileHeader) mobileHeader.style.display = '';
  if (bottomNav) bottomNav.style.display = '';
  
  navigate('dashboard');
}

function logout() {
    // ⚠️ UPDATE: Hapus status login
  clearAuthState();
  
  // Tampilkan login page
  showLoginPage();

  const loginPage = document.getElementById('loginPage');
  const mainApp = document.getElementById('mainApp');
  const mobileHeader = document.getElementById('mobileHeader');
  const bottomNav = document.getElementById('bottomNav');
  
  if (mainApp) mainApp.classList.add('hidden');
  if (loginPage) loginPage.classList.remove('hidden');
  
  // Hide mobile header & bottom nav when logged out
  if (mobileHeader) mobileHeader.style.display = 'none';
  if (bottomNav) bottomNav.style.display = 'none';
  
  // Close sidebar if open
  if (typeof closeSidebar === 'function') {
    closeSidebar();
  }

}
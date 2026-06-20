// Data Produk
let menuItems = [
  {
    id: 1,
    name: "Nasi cokot",
    price: 7000,
    cat: "Food",
    stock: 50,
    details: "Nasi yang dibulatkan dan diberi isian lezat melimpah seperti ayam suwir, tongkol suwir, dan cumi pedas.",
    variants: [
      {
        title: "Pilihan Isian",
        options: ["Cumi Pedas", "Tongkol Suwir Pedas", "Ayam Suwir"],
      },
    ],
    // ✅ PERBAIKAN: Path absolut dari root project
    images: "/assets/images/products/varian-nasicokot.png",
  },
  {
    id: 2,
    name: "Paket nasi cokot",
    price: 10000,
    cat: "Food",
    stock: 40,
    details: "Paket hemat kenyang kombinasi produk Nasi Cokot pilihan Anda yang dipadukan langsung dengan minuman teh pucuk segar.",
    variants: [
      {
        title: "Pilihan Isian",
        options: ["Cumi Pedas", "Tongkol Suwir Pedas", "Ayam Suwir"],
      },
    ],
    images: "/assets/images/products/paket-nasicokot.png",
  },
  {
    id: 3,
    name: "Banana vla",
    price: 15000,
    cat: "Snack",
    stock: 30,
    details: "Pisang manis yang digoreng hingga keemasan lalu diberi siraman vla manis lembut dan ditaburi aneka topping pilihan.",
    images: "/assets/images/products/bananavla.png",
  },
  {
    id: 4,
    name: "Teh pucuk",
    price: 5000,
    cat: "Beverage",
    stock: 100,
    details: "Minuman teh dalam kemasan botol siap minum yang diracik dari pucuk daun teh pilihan untuk menyegarkan dahaga.",
    images: "/assets/images/products/tehpucuk.png",
  },
  {
    id: 5,
    name: "Air mineral",
    price: 5000,
    cat: "Beverage",
    stock: 150,
    details: "Air minum dalam kemasan botol higienis ukuran standar yang jernih dan menyegarkan.",
    images: "/assets/images/products/airmineral.png",
  },
];

let nextMenuId = 6;

// Fungsi untuk menambah produk baru
function addMenuItem(name, cat, price, stock, details = '', images = '') {
  menuItems.push({
    id: nextMenuId++,
    name: name,
    cat: cat,
    price: price,
    stock: stock,
    details: details,
    images: images,
  });
}

// Fungsi untuk mendapatkan produk berdasarkan ID
function getMenuItemById(id) {
  return menuItems.find(i => i.id === id);
}

// Fungsi untuk mendapatkan produk berdasarkan kategori
function getMenuItemsByCategory(cat) {
  if (cat === 'all') return menuItems;
  return menuItems.filter(i => i.cat === cat);
}

// Fungsi untuk update stock
function updateMenuItemStock(id, quantity) {
  const item = menuItems.find(m => m.id === id);
  if (item) {
    item.stock += quantity;
  }
}
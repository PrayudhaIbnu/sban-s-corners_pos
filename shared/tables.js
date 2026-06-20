// ===== TABLES MASTER DATA =====
// Data meja dengan kategori kapasitas & layout

const TABLES_DATA = [
  // ===== MEJA 2 ORANG (Intimate/Couple) =====
  {
    id: 1,
    name: "Meja 1",
    minCapacity: 1,
    maxCapacity: 2,
    category: "couple",
    location: "indoor",
    position: "window",
    description: "Meja dekat jendela, cocok untuk couple",
    shape: "round",
    icon: "heart"
  },
  {
    id: 2,
    name: "Meja 2",
    minCapacity: 1,
    maxCapacity: 2,
    category: "couple",
    location: "indoor",
    position: "center",
    description: "Meja kecil di tengah ruangan",
    shape: "round",
    icon: "heart"
  },
  {
    id: 3,
    name: "Meja 3",
    minCapacity: 1,
    maxCapacity: 2,
    category: "couple",
    location: "outdoor",
    position: "terrace",
    description: "Meja outdoor di teras",
    shape: "square",
    icon: "sun"
  },
  {
    id: 4,
    name: "Meja 4",
    minCapacity: 1,
    maxCapacity: 2,
    category: "couple",
    location: "indoor",
    position: "corner",
    description: "Meja pojok yang tenang",
    shape: "round",
    icon: "armchair"
  },
  
  // ===== MEJA 2-4 ORANG (Family Small) =====
  {
    id: 5,
    name: "Meja 5",
    minCapacity: 2,
    maxCapacity: 4,
    category: "family-small",
    location: "indoor",
    position: "window",
    description: "Meja keluarga dekat jendela",
    shape: "square",
    icon: "users"
  },
  {
    id: 6,
    name: "Meja 6",
    minCapacity: 2,
    maxCapacity: 4,
    category: "family-small",
    location: "indoor",
    position: "center",
    description: "Meja keluarga di tengah",
    shape: "square",
    icon: "users"
  },
  {
    id: 7,
    name: "Meja 7",
    minCapacity: 2,
    maxCapacity: 4,
    category: "family-small",
    location: "indoor",
    position: "center",
    description: "Meja keluarga di tengah",
    shape: "square",
    icon: "users"
  },
  {
    id: 8,
    name: "Meja 8",
    minCapacity: 2,
    maxCapacity: 4,
    category: "family-small",
    location: "outdoor",
    position: "garden",
    description: "Meja outdoor di taman",
    shape: "round",
    icon: "flower-2"
  },
  {
    id: 9,
    name: "Meja 9",
    minCapacity: 2,
    maxCapacity: 4,
    category: "family-small",
    location: "indoor",
    position: "window",
    description: "Meja keluarga dekat jendela",
    shape: "square",
    icon: "users"
  },
  {
    id: 10,
    name: "Meja 10",
    minCapacity: 2,
    maxCapacity: 4,
    category: "family-small",
    location: "indoor",
    position: "corner",
    description: "Meja pojok untuk keluarga kecil",
    shape: "square",
    icon: "users"
  },
  
  // ===== MEJA 4-6 ORANG (Group/Large) =====
  {
    id: 11,
    name: "Meja 11",
    minCapacity: 4,
    maxCapacity: 6,
    category: "group",
    location: "indoor",
    position: "center",
    description: "Meja besar di tengah, cocok untuk grup",
    shape: "long",
    icon: "users"
  },
  {
    id: 12,
    name: "Meja 12",
    minCapacity: 4,
    maxCapacity: 6,
    category: "group",
    location: "indoor",
    position: "center",
    description: "Meja besar di tengah, cocok untuk grup",
    shape: "long",
    icon: "users"
  },
  {
    id: 13,
    name: "Meja 13",
    minCapacity: 4,
    maxCapacity: 6,
    category: "group",
    location: "outdoor",
    position: "garden",
    description: "Meja grup di taman outdoor",
    shape: "round",
    icon: "flower-2"
  },
  {
    id: 14,
    name: "Meja 14",
    minCapacity: 4,
    maxCapacity: 6,
    category: "group",
    location: "indoor",
    position: "private",
    description: "Meja privat untuk meeting/grup",
    shape: "long",
    icon: "briefcase"
  },
  {
    id: 15,
    name: "Meja 15",
    minCapacity: 4,
    maxCapacity: 6,
    category: "group",
    location: "indoor",
    position: "window",
    description: "Meja besar dekat jendela",
    shape: "long",
    icon: "users"
  },
  {
    id: 16,
    name: "Meja 16",
    minCapacity: 4,
    maxCapacity: 6,
    category: "group",
    location: "outdoor",
    position: "terrace",
    description: "Meja grup di teras dengan view",
    shape: "long",
    icon: "mountain"
  }
];

// ===== TABLE CATEGORIES =====
const TABLE_CATEGORIES = {
  "couple": {
    label: "Meja Couple",
    description: "Kapasitas 1-2 orang",
    icon: "heart",
    color: "pink"
  },
  "family-small": {
    label: "Meja Keluarga",
    description: "Kapasitas 2-4 orang",
    icon: "users",
    color: "blue"
  },
  "group": {
    label: "Meja Grup",
    description: "Kapasitas 4-6 orang",
    icon: "users",
    color: "purple"
  }
};

// ===== TABLE LOCATIONS =====
const TABLE_LOCATIONS = {
  "indoor": { label: "Indoor", icon: "home", color: "forest" },
  "outdoor": { label: "Outdoor", icon: "sun", color: "orange" }
};

// ===== HELPER FUNCTIONS =====

/**
 * Get meja by ID
 */
function getTableById(id) {
  return TABLES_DATA.find(t => t.id === id);
}

/**
 * Get meja yang sesuai dengan jumlah tamu
 */
function getTablesByCapacity(guestCount) {
  return TABLES_DATA.filter(t => 
    guestCount >= t.minCapacity && guestCount <= t.maxCapacity
  );
}

/**
 * Get meja by category
 */
function getTablesByCategory(category) {
  return TABLES_DATA.filter(t => t.category === category);
}

/**
 * Check apakah kapasitas meja cocok untuk jumlah tamu
 */
function isTableSuitable(table, guestCount) {
  return guestCount >= table.minCapacity && guestCount <= table.maxCapacity;
}
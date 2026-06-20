// ===== INVENTORY =====

let selectedStockItem = null;
let stockAction = "add";

function initInventory() {
  const addMenuForm = document.getElementById("addMenuForm");

  if (addMenuForm) {
    addMenuForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitAddMenu();
    });
  }
}

// =====================
// RENDER INVENTORY
// =====================

function renderInventory() {
  const inventoryTable = document.getElementById("inventoryTable");

  if (!inventoryTable) return;

  inventoryTable.innerHTML = menuItems
    .map(
      (item) => `

      <div class="
        card-premium
        overflow-hidden
      ">

        <!-- Product Image -->
        <div class="
          h-52
          bg-[#EFE7DE]
        ">

          <img
            src="${item.images}"
            alt="${item.name}"
            class="
              w-full
              h-full
              object-cover
            "
          >

        </div>

        <!-- Content -->
        <div class="p-5">

          <div class="
            flex
            justify-between
            gap-3
          ">

            <div>

              <h3 class="
                font-display
                text-2xl
                text-forest
              ">
                ${item.name}
              </h3>

              <p class="
                text-xs
                uppercase
                tracking-widest
                text-gray-400
                mt-1
              ">
                ${item.cat}
              </p>

            </div>

            <span class="
              text-terra
              font-semibold
            ">
              Rp ${item.price.toLocaleString()}
            </span>

          </div>

          <!-- Description -->
          <p class="
            text-sm
            text-gray-500
            mt-4
            line-clamp-3
          ">
            ${item.details}
          </p>

          <!-- Variants -->
          ${
            item.variants?.length
              ? `
                <div class="
                  mt-4
                  text-xs
                  text-forest
                  bg-[#F5EFE7]
                  rounded-full
                  px-3
                  py-1
                  inline-flex
                ">
                  ${item.variants.length} Variant Group
                </div>
              `
              : ""
          }

          <!-- Stock -->
          <div class="
            flex
            justify-between
            items-center
            mt-5
          ">

            <span class="
              text-sm
              text-gray-500
            ">
              Current Stock
            </span>

            <span class="
              ${item.stock <= 10 ? "text-red-500" : "text-forest"}
              font-semibold
            ">
              ${item.stock}
            </span>

          </div>

          <!-- Status -->
          <div class="mt-4">

            ${
              item.stock <= 0
                ? `
                <span class="
                  bg-red-50
                  text-red-600
                  text-xs
                  px-3
                  py-1
                  rounded-full
                ">
                  Out of Stock
                </span>
              `
                : item.stock <= 10
                  ? `
                <span class="
                  bg-amber-50
                  text-amber-600
                  text-xs
                  px-3
                  py-1
                  rounded-full
                ">
                  Low Stock
                </span>
              `
                  : `
                <span class="
                  bg-green-50
                  text-green-600
                  text-xs
                  px-3
                  py-1
                  rounded-full
                ">
                  Available
                </span>
              `
            }

          </div>

          <!-- Actions -->
          <div class="
            grid
            grid-cols-2
            gap-3
            mt-5
          ">

            <button
              onclick="openStockModal(${item.id}, 'add')"
              class="btn-primary">
              Add Stock
            </button>

            <button
              onclick="openStockModal(${item.id}, 'reduce')"
              class="btn-secondary">
              Reduce Stock
            </button>

          </div>

        </div>

      </div>

    `,
    )
    .join("");

  updateInventoryStats();
}

// =====================
// STOCK
// =====================

function updateStock(id) {
  const item = menuItems.find((i) => i.id === id);

  if (!item) return;

  item.stock += 10;

  renderInventory();
}

function decreaseStock(id) {
  const item = menuItems.find((i) => i.id === id);

  if (!item) return;

  item.stock = Math.max(0, item.stock - 10);

  renderInventory();
}

// =====================
// STATS
// =====================

function updateInventoryStats() {
  const totalMenus = menuItems.length;

  const lowStock = menuItems.filter((item) => item.stock <= 10).length;

  const categories = new Set(menuItems.map((item) => item.cat)).size;

  document.getElementById("inventoryTotal").textContent = totalMenus;

  document.getElementById("inventoryLow").textContent = lowStock;

  document.getElementById("inventoryCat").textContent = categories;
}

// =====================
// MODAL
// =====================

function openStockModal(id, action) {

  selectedStockItem = id;
  stockAction = action;

  document
    .getElementById("stockQtyInput")
    .value = 1;

  document
    .getElementById("stockModalTitle")
    .textContent =
      action === "add"
        ? "Add Stock"
        : "Reduce Stock";

  document
    .getElementById("stockModal")
    .classList
    .remove("hidden");
}

function closeStockModal() {

  document
    .getElementById("stockModal")
    .classList
    .add("hidden");
}

function confirmStockUpdate() {

  const qty =
    parseInt(
      document.getElementById(
        "stockQtyInput"
      ).value
    );

  if (!qty || qty <= 0) return;

  const item =
    menuItems.find(
      i => i.id === selectedStockItem
    );

  if (!item) return;

  if (stockAction === "add") {

    item.stock += qty;

  } else {

    item.stock =
      Math.max(
        0,
        item.stock - qty
      );
  }

  saveMenuItems();

  renderInventory();
  closeStockModal();
}

function openAddMenu() {
  const modal = document.getElementById("addMenuModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeAddMenu() {
  const modal = document.getElementById("addMenuModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

// =====================
// ADD MENU
// =====================

function submitAddMenu() {
  const name = document.getElementById("menuName").value;
  
  const cat = document.getElementById("menuCat").value;

  const price = parseInt(document.getElementById("menuPrice").value);
  
  const stock = parseInt(document.getElementById("menuStock").value);

  menuItems.push({
    id: Date.now(),
    name,
    cat,
    price,
    stock,
    details: "",
    images: "https://placehold.co/600x400",
    variants: [],
  });

  closeAddMenu();
  
  document.getElementById("addMenuForm").reset();

  renderInventory();
  saveMenuItems();
}

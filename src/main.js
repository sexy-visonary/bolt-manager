import { Storage } from "./storage.js";

// DOM Elements
const elSearchInput = document.getElementById("search-input");
const elBtnNewPart = document.getElementById("btn-new-part");
const elPartsListContainer = document.getElementById("parts-list-container");
const elEmptyState = document.getElementById("empty-state-placeholder");
const elSummaryText = document.getElementById("parts-summary-text");

// Sidebar elements
const elTabAll = document.getElementById("tab-all");
const elTabBolt = document.getElementById("tab-bolt");
const elTabNut = document.getElementById("tab-nut");
const elTabWasher = document.getElementById("tab-washer");

const elBadgeAll = document.getElementById("badge-all");
const elBadgeBolt = document.getElementById("badge-bolt");
const elBadgeNut = document.getElementById("badge-nut");
const elBadgeWasher = document.getElementById("badge-washer");

const elFilterLocation = document.getElementById("filter-location");
const elFilterVendor = document.getElementById("filter-vendor");
const elFilterLowStock = document.getElementById("filter-low-stock");
const elFilterQtyMin = document.getElementById("filter-qty-min");
const elFilterQtyMax = document.getElementById("filter-qty-max");
const elBtnResetFilters = document.getElementById("btn-reset-filters");

const elBtnExport = document.getElementById("btn-export");
const elBtnImport = document.getElementById("btn-import");
const elFileImportInput = document.getElementById("file-import-input");

// Modal elements
const elModal = document.getElementById("part-modal");
const elModalTitle = document.getElementById("modal-title-text");
const elBtnCloseModal = document.getElementById("btn-close-modal");
const elBtnCancelModal = document.getElementById("btn-cancel-modal");
const elPartForm = document.getElementById("part-form");

// Form inputs
const elFormPartId = document.getElementById("form-part-id");
const elFormPartName = document.getElementById("form-part-name");
const elFormPartSize = document.getElementById("form-part-size");
const elFormPartCategory = document.getElementById("form-part-category");
const elFormPartQty = document.getElementById("form-part-qty");
const elFormPartThreshold = document.getElementById("form-part-threshold");
const elFormPartPrice = document.getElementById("form-part-price");
const elFormPartVendor = document.getElementById("form-part-vendor");
const elFormPartLocation = document.getElementById("form-part-location");

// Form validation errors
const elErrPartName = document.getElementById("err-part-name");
const elErrPartSize = document.getElementById("err-part-size");
const elErrPartQty = document.getElementById("err-part-qty");
const elErrPartThreshold = document.getElementById("err-part-threshold");
const elErrPartPrice = document.getElementById("err-part-price");

// Global filter state
let activeCategory = "all";
let searchQuery = "";
let selectedLocation = "all";
let selectedVendor = "all";
let lowStockOnly = false;
let minQty = null;
let maxQty = null;

// Initialize app
function init() {
  setupEventListeners();
  render();
}

// Setup all event handlers
function setupEventListeners() {
  // Search input
  elSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    render();
  });

  // Category selection tabs
  const tabs = [
    { el: elTabAll, cat: "all" },
    { el: elTabBolt, cat: "bolt" },
    { el: elTabNut, cat: "nut" },
    { el: elTabWasher, cat: "washer" }
  ];

  tabs.forEach(tab => {
    tab.el.addEventListener("click", () => {
      tabs.forEach(t => t.el.classList.remove("active"));
      tab.el.classList.add("active");
      activeCategory = tab.cat;
      render();
    });
  });

  // Dropdown & Checkbox filters
  elFilterLocation.addEventListener("change", (e) => {
    selectedLocation = e.target.value;
    render();
  });

  elFilterVendor.addEventListener("change", (e) => {
    selectedVendor = e.target.value;
    render();
  });

  elFilterLowStock.addEventListener("change", (e) => {
    lowStockOnly = e.target.checked;
    render();
  });

  elFilterQtyMin.addEventListener("input", (e) => {
    minQty = e.target.value !== "" ? parseInt(e.target.value) : null;
    render();
  });

  elFilterQtyMax.addEventListener("input", (e) => {
    maxQty = e.target.value !== "" ? parseInt(e.target.value) : null;
    render();
  });

  // Reset filters button
  elBtnResetFilters.addEventListener("click", () => {
    activeCategory = "all";
    searchQuery = "";
    selectedLocation = "all";
    selectedVendor = "all";
    lowStockOnly = false;
    minQty = null;
    maxQty = null;

    // Reset UI controls
    elSearchInput.value = "";
    tabs.forEach(t => t.el.classList.remove("active"));
    elTabAll.classList.add("active");
    elFilterLocation.value = "all";
    elFilterVendor.value = "all";
    elFilterLowStock.checked = false;
    elFilterQtyMin.value = "";
    elFilterQtyMax.value = "";

    render();
  });

  // Modals close triggers
  elBtnCloseModal.addEventListener("click", closeModal);
  elBtnCancelModal.addEventListener("click", closeModal);
  elModal.addEventListener("click", (e) => {
    if (e.target === elModal) closeModal();
  });

  // New Part Button
  elBtnNewPart.addEventListener("click", () => {
    openModal("new");
  });

  // Form Submit Handler
  elPartForm.addEventListener("submit", handleFormSubmit);

  // Backup actions
  elBtnExport.addEventListener("click", exportBackup);
  elBtnImport.addEventListener("click", () => elFileImportInput.click());
  elFileImportInput.addEventListener("change", handleImportBackup);
}

// Render dynamic elements
function render() {
  const allItems = Storage.getItems();

  // Populate filter dropdown choices dynamically (preserving selected value)
  updateFilterDropdowns(allItems);

  // Filter items
  const filteredItems = allItems.filter(item => {
    // 1. Search Query (name or size)
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                          item.size.toLowerCase().includes(searchQuery);

    // 2. Category Tab
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;

    // 3. Location
    const matchesLocation = selectedLocation === "all" || item.location === selectedLocation;

    // 4. Vendor
    const matchesVendor = selectedVendor === "all" || item.vendor === selectedVendor;

    // 5. Low Stock Status
    const matchesLowStock = !lowStockOnly || item.quantity <= item.reorderThreshold;

    // 6. Quantity bounds
    const matchesMinQty = minQty === null || item.quantity >= minQty;
    const matchesMaxQty = maxQty === null || item.quantity <= maxQty;

    return matchesSearch && matchesCategory && matchesLocation && matchesVendor && matchesLowStock && matchesMinQty && matchesMaxQty;
  });

  // Update Category Badge numbers
  updateSidebarBadges(allItems);

  // Render cards
  if (filteredItems.length === 0) {
    elPartsListContainer.style.display = "none";
    elEmptyState.style.display = "flex";
  } else {
    elPartsListContainer.style.display = "flex";
    elEmptyState.style.display = "none";
    
    elPartsListContainer.innerHTML = "";
    filteredItems.forEach(item => {
      const card = createPartCard(item);
      elPartsListContainer.appendChild(card);
    });
  }

  // Update Summary info
  elSummaryText.innerText = `Showing ${filteredItems.length} of ${allItems.length} items`;
}

// Populate Sidebar Categories with counts
function updateSidebarBadges(allItems) {
  const counts = { all: 0, bolt: 0, nut: 0, washer: 0 };
  allItems.forEach(item => {
    counts.all++;
    if (counts[item.category] !== undefined) {
      counts[item.category]++;
    }
  });

  elBadgeAll.innerText = counts.all;
  elBadgeBolt.innerText = counts.bolt;
  elBadgeNut.innerText = counts.nut;
  elBadgeWasher.innerText = counts.washer;
}

// Dynamically compile locations and vendors based on data
function updateFilterDropdowns(allItems) {
  const locations = new Set();
  const vendors = new Set();

  allItems.forEach(item => {
    if (item.location) locations.add(item.location);
    if (item.vendor) vendors.add(item.vendor);
  });

  // Preserve selected location option
  const prevLoc = elFilterLocation.value;
  elFilterLocation.innerHTML = '<option value="all">All Locations</option>';
  Array.from(locations).sort().forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.innerText = loc.split(",")[0]; // Display short name in dropdown filter
    elFilterLocation.appendChild(opt);
  });
  if (Array.from(locations).includes(prevLoc)) {
    elFilterLocation.value = prevLoc;
    selectedLocation = prevLoc;
  } else {
    elFilterLocation.value = "all";
    selectedLocation = "all";
  }

  // Preserve selected vendor option
  const prevVendor = elFilterVendor.value;
  elFilterVendor.innerHTML = '<option value="all">All Vendors</option>';
  Array.from(vendors).sort().forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.innerText = v;
    elFilterVendor.appendChild(opt);
  });
  if (Array.from(vendors).includes(prevVendor)) {
    elFilterVendor.value = prevVendor;
    selectedVendor = prevVendor;
  } else {
    elFilterVendor.value = "all";
    selectedVendor = "all";
  }
}

// Generate the visual Card component matching mockup
function createPartCard(item) {
  const card = document.createElement("div");
  card.className = "part-card";
  
  // Custom alerts based on stock
  const isOutOfStock = item.quantity === 0;
  const isLowStock = item.quantity <= item.reorderThreshold;

  // Status Badge details (lime green/orange/red badges like Paid)
  let badgeClass = "in-stock";
  let badgeLabel = "Paid"; // Matches "Paid" mockup visual
  if (isOutOfStock) {
    badgeClass = "out-of-stock";
    badgeLabel = "Out of Stock";
  } else if (isLowStock) {
    badgeClass = "low-stock";
    badgeLabel = "Low Stock";
  }

  // Set avatar class based on Vendor name (A vs V)
  const isAcme = item.vendor.toLowerCase().startsWith("a");
  const avatarClass = isAcme ? "acme" : "";
  const avatarLetter = item.vendor.charAt(0).toUpperCase();

  // Progress Bar / Shipment visual translation
  let activeStep = 1; // 1: Out, 2: Packaging, 3: Shipping, 4: Delivered
  let stepColor = "var(--critical-red)";
  let stepShadow = "var(--critical-red-muted)";
  let progressWidth = 0;
  let statusText = "Product is out of stock";
  let dateText = "November 7, 2022";

  if (item.quantity === 0) {
    activeStep = 1;
    stepColor = "var(--critical-red)";
    stepShadow = "var(--critical-red-muted)";
    progressWidth = 0;
    statusText = "Stock depleted";
    dateText = "November 7, 2022";
  } else if (item.quantity <= item.reorderThreshold) {
    activeStep = 2;
    stepColor = "var(--warning-orange)";
    stepShadow = "var(--warning-orange-muted)";
    progressWidth = 33;
    statusText = "Product in packaging";
    dateText = "November 1, 2022";
  } else if (item.quantity < item.reorderThreshold * 2) {
    activeStep = 3;
    stepColor = "var(--warning-orange)"; // Stepper color in mockup is orange-yellow for shipping
    stepShadow = "var(--warning-orange-muted)";
    progressWidth = 66;
    statusText = "Order is on shipping";
    dateText = "November 7, 2022";
  } else {
    activeStep = 4;
    stepColor = "var(--accent-green)";
    stepShadow = "var(--accent-green-muted)";
    progressWidth = 100;
    statusText = "Package received";
    dateText = "November 4, 2022";
  }

  // Format title in mockup style: "Part Name / Size xQty"
  const formattedTitle = `${item.name} / ${item.size} x${item.quantity}`;
  const formattedPrice = `$${parseFloat(item.price).toFixed(2)}`;

  card.innerHTML = `
    <div class="part-card-main">
      <!-- Top Row: PO-652 | Name / Size xQty | $Price | Paid | ... -->
      <div class="part-row-top">
        <div class="part-title-block">
          <span class="part-code">${item.id}</span>
          <span class="part-title-text">${formattedTitle}</span>
        </div>
        <div class="part-actions-block">
          <span class="part-price">${formattedPrice}</span>
          <span class="status-badge ${badgeClass}">${badgeLabel}</span>
          
          <!-- Actions: Edit and Delete disguised in a visual ... button or shown inline -->
          <button class="icon-btn btn-edit" title="Edit Part Spec" style="width: 28px; height: 28px; border-radius: 4px;">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"></path>
            </svg>
          </button>
          <button class="icon-btn btn-delete" title="Delete Part" style="width: 28px; height: 28px; border-radius: 4px; color: var(--text-muted);">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Row 2: Vendor Avatar | Vendor Name | Vendor Address/Loc | Billed status -->
      <div class="part-row-middle">
        <div class="vendor-avatar ${avatarClass}">${avatarLetter}</div>
        <div class="vendor-text">
          <span>${item.vendor}</span>
          <span class="vendor-separator">•</span>
          <span>${item.location}</span>
          <span class="vendor-separator">•</span>
          <div class="billed-indicator">
            <!-- Sheet file icon -->
            <svg class="billed-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path>
            </svg>
            <span>${item.quantity >= item.reorderThreshold * 2 ? 'Received' : 'Billed'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 3: Progress Sub-box -->
    <div class="part-card-sub">
      <div class="sub-header">
        <span class="sub-status-statement">${statusText} <span style="color: var(--text-muted); font-weight: normal; margin-left: 0.25rem;">${dateText}</span></span>
        
        <!-- Stock Adjust Controls -->
        <div class="sub-adjust-wrapper">
          <span class="sub-adjust-label">Stock Adjust:</span>
          <div class="adjust-controls">
            <button class="btn-adjust btn-decrement" title="Decrement Qty">-</button>
            <input type="text" class="adjust-value-input" value="${item.quantity}" title="Double click to edit count" />
            <button class="btn-adjust btn-increment" title="Increment Qty">+</button>
          </div>
        </div>
      </div>

      <!-- Mockup Progress Stepper with SVG icons -->
      <div class="progress-stepper">
        <div class="progress-track-line"></div>
        <div class="progress-track-line-fill" style="width: ${progressWidth}%; background-color: ${stepColor};"></div>
        
        <!-- Step 1: Placed / Document -->
        <div class="progress-node ${activeStep >= 1 ? 'active' : ''}" data-label="Placed" style="--step-color: ${activeStep >= 1 ? stepColor : ''}; --step-shadow: ${stepShadow};">
          <!-- Document icon with a + badge -->
          <svg class="progress-node-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
          </svg>
        </div>

        <!-- Step 2: Packaging / Box -->
        <div class="progress-node ${activeStep >= 2 ? 'active' : ''}" data-label="Packed" style="--step-color: ${activeStep >= 2 ? stepColor : ''}; --step-shadow: ${stepShadow};">
          <!-- Box icon -->
          <svg class="progress-node-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
        </div>

        <!-- Step 3: Shipping / Truck -->
        <div class="progress-node ${activeStep >= 3 ? 'active' : ''}" data-label="Shipped" style="--step-color: ${activeStep >= 3 ? stepColor : ''}; --step-shadow: ${stepShadow};">
          <!-- Truck icon -->
          <svg class="progress-node-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.75A1.125 1.125 0 012.625 17.625V4.625A1.125 1.125 0 013.75 3.5h11.25a1.125 1.125 0 011.125 1.125v1.25m-11 13h11.25m-11.25 0V11.25m11.25 7.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"></path>
          </svg>
        </div>

        <!-- Step 4: Delivered / Checkmark -->
        <div class="progress-node ${activeStep >= 4 ? 'active' : ''}" data-label="Delivered" style="--step-color: ${activeStep >= 4 ? stepColor : ''}; --step-shadow: ${stepShadow};">
          <!-- Checkmark icon -->
          <svg class="progress-node-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
          </svg>
        </div>
      </div>
    </div>
  `;

  // Attach control event listeners
  const input = card.querySelector(".adjust-value-input");
  const btnInc = card.querySelector(".btn-increment");
  const btnDec = card.querySelector(".btn-decrement");
  const btnEdit = card.querySelector(".btn-edit");
  const btnDelete = card.querySelector(".btn-delete");

  // Increment button
  btnInc.addEventListener("click", () => {
    const nextVal = item.quantity + 1;
    Storage.updateItem(item.id, { quantity: nextVal });
    render();
  });

  // Decrement button
  btnDec.addEventListener("click", () => {
    const nextVal = Math.max(0, item.quantity - 1);
    Storage.updateItem(item.id, { quantity: nextVal });
    render();
  });

  // Custom text stock-take count edit
  input.addEventListener("change", (e) => {
    let parsed = parseInt(e.target.value);
    if (isNaN(parsed) || parsed < 0) {
      parsed = 0;
    }
    Storage.updateItem(item.id, { quantity: parsed });
    render();
  });
  // Trigger blur on enter
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      input.blur();
    }
  });

  // Edit Specification button
  btnEdit.addEventListener("click", () => {
    openModal("edit", item);
  });

  // Delete button
  btnDelete.addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete ${item.name} (${item.size}) from the inventory?`)) {
      Storage.deleteItem(item.id);
      render();
    }
  });

  return card;
}

// Modal Form handling
function openModal(mode, item = null) {
  clearFormErrors();
  
  if (mode === "new") {
    elModalTitle.innerText = "New Purchase Specification";
    elFormPartId.value = "";
    elFormPartName.value = "";
    elFormPartSize.value = "";
    elFormPartCategory.value = "bolt";
    elFormPartQty.value = "0";
    elFormPartThreshold.value = "50";
    elFormPartPrice.value = "68.00";
    elFormPartVendor.value = "";
    elFormPartLocation.value = "";
  } else if (mode === "edit" && item) {
    elModalTitle.innerText = `Edit Specification: ${item.id}`;
    elFormPartId.value = item.id;
    elFormPartName.value = item.name;
    elFormPartSize.value = item.size;
    elFormPartCategory.value = item.category;
    elFormPartQty.value = item.quantity;
    elFormPartThreshold.value = item.reorderThreshold;
    elFormPartPrice.value = item.price.toFixed(2);
    elFormPartVendor.value = item.vendor || "";
    elFormPartLocation.value = item.location || "";
  }
  
  elModal.classList.add("active");
}

function closeModal() {
  elModal.classList.remove("active");
}

function clearFormErrors() {
  elErrPartName.style.display = "none";
  elErrPartSize.style.display = "none";
  elErrPartQty.style.display = "none";
  elErrPartThreshold.style.display = "none";
  elErrPartPrice.style.display = "none";
}

function handleFormSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  let isValid = true;

  // Validate Name
  if (!elFormPartName.value.trim()) {
    elErrPartName.style.display = "block";
    isValid = false;
  }

  // Validate Size
  if (!elFormPartSize.value.trim()) {
    elErrPartSize.style.display = "block";
    isValid = false;
  }

  // Validate Qty
  const qty = parseInt(elFormPartQty.value);
  if (isNaN(qty) || qty < 0) {
    elErrPartQty.style.display = "block";
    isValid = false;
  }

  // Validate Threshold
  const threshold = parseInt(elFormPartThreshold.value);
  if (isNaN(threshold) || threshold < 0) {
    elErrPartThreshold.style.display = "block";
    isValid = false;
  }

  // Validate Price
  const price = parseFloat(elFormPartPrice.value);
  if (isNaN(price) || price < 0) {
    elErrPartPrice.style.display = "block";
    isValid = false;
  }

  if (!isValid) return;

  const itemData = {
    name: elFormPartName.value,
    size: elFormPartSize.value,
    category: elFormPartCategory.value,
    quantity: qty,
    reorderThreshold: threshold,
    price: price,
    vendor: elFormPartVendor.value,
    location: elFormPartLocation.value
  };

  const id = elFormPartId.value;

  if (id) {
    Storage.updateItem(id, itemData);
  } else {
    Storage.addItem(itemData);
  }

  closeModal();
  render();
}

// Backup Utilities
function exportBackup() {
  const jsonContent = Storage.exportBackup();
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `inventar_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleImportBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      Storage.importBackup(evt.target.result);
      alert("Inventory backup imported successfully!");
      render();
    } catch (err) {
      alert("Failed to import backup: " + err.message);
    }
  };
  reader.readAsText(file);
  elFileImportInput.value = "";
}

// Run app init
init();

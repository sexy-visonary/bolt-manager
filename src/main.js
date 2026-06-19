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
const elFormPartVendor = document.getElementById("form-part-vendor");
const elFormPartLocation = document.getElementById("form-part-location");

// Form validation errors
const elErrPartName = document.getElementById("err-part-name");
const elErrPartSize = document.getElementById("err-part-size");
const elErrPartQty = document.getElementById("err-part-qty");
const elErrPartThreshold = document.getElementById("err-part-threshold");

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
  elSummaryText.innerText = `Showing ${filteredItems.length} of ${allItems.length} parts`;
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
    opt.innerText = loc;
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

// Format ISO date string into readable text
function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Generate the visual Card component for an item
function createPartCard(item) {
  const card = document.createElement("div");
  card.className = "part-card";
  
  // Custom alerts based on stock
  const isOutOfStock = item.quantity === 0;
  const isLowStock = item.quantity <= item.reorderThreshold;
  
  if (isOutOfStock) {
    card.classList.add("out-of-stock-critical");
  } else if (isLowStock) {
    card.classList.add("low-stock-critical");
  }

  // Status Badge details
  let badgeClass = "in-stock";
  let badgeLabel = "In Stock";
  if (isOutOfStock) {
    badgeClass = "out-of-stock";
    badgeLabel = "Out of Stock";
  } else if (isLowStock) {
    badgeClass = "low-stock";
    badgeLabel = "Low Stock";
  }

  // Stock status stepper calculation
  let activeStep = 1; // 1: Out/Critical, 2: Low, 3: Good, 4: Optimal
  let stepColor = "var(--critical-red)";
  let stepShadow = "var(--critical-red-muted)";
  let progressWidth = 0;
  let progressLabel = "Critical Status";

  if (item.quantity === 0) {
    activeStep = 1;
    stepColor = "var(--critical-red)";
    stepShadow = "var(--critical-red-muted)";
    progressWidth = 0;
    progressLabel = "Stock Depleted — Action Required";
  } else if (item.quantity <= item.reorderThreshold) {
    activeStep = 2;
    stepColor = "var(--warning-orange)";
    stepShadow = "var(--warning-orange-muted)";
    progressWidth = 33;
    progressLabel = "Low Stock — Below Reorder Threshold";
  } else if (item.quantity < item.reorderThreshold * 2) {
    activeStep = 3;
    stepColor = "var(--brand-green)";
    stepShadow = "var(--brand-green-muted)";
    progressWidth = 66;
    progressLabel = "Adequate stock levels";
  } else {
    activeStep = 4;
    stepColor = "var(--accent-blue)";
    stepShadow = "var(--accent-blue-muted)";
    progressWidth = 100;
    progressLabel = "Stock Level Optimal (Well Stocked)";
  }

  card.innerHTML = `
    <div class="part-card-main">
      <div class="part-info-block">
        <span class="part-id-badge">${item.id}</span>
        <div class="part-details">
          <div class="part-name">${item.name}</div>
          <div class="part-meta">
            <span>Size: <strong>${item.size}</strong></span>
            <span class="meta-divider">•</span>
            <span>Category: <strong style="text-transform: capitalize;">${item.category}</strong></span>
            <span class="meta-divider">•</span>
            <span>Loc: <strong>${item.location}</strong></span>
            <span class="meta-divider">•</span>
            <span>Vendor: <strong>${item.vendor}</strong></span>
          </div>
        </div>
      </div>

      <div class="part-status-block">
        <span class="status-badge ${badgeClass}">${badgeLabel}</span>
        
        <!-- On-Hand Adjustment controls -->
        <div class="adjust-controls">
          <button class="btn-adjust btn-decrement" title="Decrement Qty">-</button>
          <input type="text" class="adjust-value-input" value="${item.quantity}" title="Double click to edit count" />
          <button class="btn-adjust btn-increment" title="Increment Qty">+</button>
        </div>

        <!-- Action tools -->
        <button class="icon-btn btn-edit" title="Edit part spec">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
          </svg>
        </button>
        <button class="icon-btn btn-delete" title="Delete part" style="color: var(--text-muted); border-color: transparent;">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Stepper progress (mimics visual delivery indicator in mockup) -->
    <div class="part-progress-container">
      <div class="progress-header">
        <span class="progress-track-label">${progressLabel}</span>
        <span class="progress-date">Last Updated: ${formatDate(item.lastUpdated)}</span>
      </div>
      <div class="progress-bar-stepper">
        <div class="progress-line"></div>
        <div class="progress-line-fill" style="width: ${progressWidth}%; background-color: ${stepColor};"></div>
        
        <div class="progress-step-node ${activeStep >= 1 ? 'active' : ''}" data-label="Out" style="--step-color: ${activeStep >= 1 ? 'var(--critical-red)' : ''}; --step-shadow: var(--critical-red-muted);"></div>
        <div class="progress-step-node ${activeStep >= 2 ? 'active' : ''}" data-label="Low" style="--step-color: ${activeStep >= 2 ? 'var(--warning-orange)' : ''}; --step-shadow: var(--warning-orange-muted);"></div>
        <div class="progress-step-node ${activeStep >= 3 ? 'active' : ''}" data-label="Good" style="--step-color: ${activeStep >= 3 ? 'var(--brand-green)' : ''}; --step-shadow: var(--brand-green-muted);"></div>
        <div class="progress-step-node ${activeStep >= 4 ? 'active' : ''}" data-label="Full" style="--step-color: ${activeStep >= 4 ? 'var(--accent-blue)' : ''}; --step-shadow: var(--accent-blue-muted);"></div>
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
    elModalTitle.innerText = "New Part Specification";
    elFormPartId.value = "";
    elFormPartName.value = "";
    elFormPartSize.value = "";
    elFormPartCategory.value = "bolt";
    elFormPartQty.value = "0";
    elFormPartThreshold.value = "50";
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

  if (!isValid) return;

  const itemData = {
    name: elFormPartName.value,
    size: elFormPartSize.value,
    category: elFormPartCategory.value,
    quantity: qty,
    reorderThreshold: threshold,
    vendor: elFormPartVendor.value,
    location: elFormPartLocation.value
  };

  const id = elFormPartId.value;

  if (id) {
    // Update existing
    Storage.updateItem(id, itemData);
  } else {
    // Create new
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
  // Clear input value to allow re-upload of same file
  elFileImportInput.value = "";
}

// Run app init
init();

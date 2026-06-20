// Default seed data matching the "inventar" mockup style
const DEFAULT_ITEMS = [
  {
    id: "PO-652",
    name: "Men Cotton Polo Shirt Army (Hex Bolt)",
    size: "L",
    category: "bolt",
    quantity: 500,
    reorderThreshold: 100,
    price: 68.00,
    vendor: "Vahement Part",
    location: "846 Innovation Ave. Enterprise, AL 36330",
    lastUpdated: "2026-06-19T18:07:00.000Z"
  },
  {
    id: "PO-655",
    name: "Men Cotton Polo Shirt Ocean Blue (Nyloc Nut)",
    size: "S",
    category: "nut",
    quantity: 300,
    reorderThreshold: 100,
    price: 68.00,
    vendor: "Acme Corp",
    location: "846 Innovation Ave. Enterprise, AL 36330",
    lastUpdated: "2026-06-19T18:01:00.000Z"
  },
  {
    id: "PO-654",
    name: "Men Cotton Polo Shirt Army (Flat Washer)",
    size: "L",
    category: "washer",
    quantity: 1000,
    reorderThreshold: 200,
    price: 32.00,
    vendor: "Acme Corp",
    location: "846 Innovation Ave. Enterprise, AL 36330",
    lastUpdated: "2026-06-19T18:04:00.000Z"
  },
  {
    id: "PO-658",
    name: "Socket Head Cap Screw",
    size: "M6",
    category: "bolt",
    quantity: 15,
    reorderThreshold: 50,
    price: 15.00,
    vendor: "Vahement Part",
    location: "Aisle 3, Bin C1",
    lastUpdated: "2026-06-19T18:06:00.000Z"
  }
];

const STORAGE_KEY = "inventar_items_v2"; // Increment key to reset storage

// Helper to generate a new item ID in PO-xxx format
function generateId() {
  const num = Math.floor(600 + Math.random() * 300);
  return `PO-${num}`;
}

export const Storage = {
  // Get all items, initializing with defaults if empty
  getItems() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      this.saveItems(DEFAULT_ITEMS);
      return DEFAULT_ITEMS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse inventory data, resetting to defaults", e);
      return DEFAULT_ITEMS;
    }
  },

  // Save all items
  saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  // Add a new item
  addItem(itemData) {
    const items = this.getItems();
    const newItem = {
      id: itemData.id || generateId(),
      name: itemData.name.trim(),
      size: itemData.size.trim(),
      category: itemData.category || "bolt",
      quantity: Math.max(0, parseInt(itemData.quantity) || 0),
      reorderThreshold: Math.max(0, parseInt(itemData.reorderThreshold) || 0),
      price: Math.max(0, parseFloat(itemData.price) || 0.00),
      vendor: itemData.vendor ? itemData.vendor.trim() : "Unknown Vendor",
      location: itemData.location ? itemData.location.trim() : "Unassigned",
      lastUpdated: new Date().toISOString()
    };
    items.push(newItem);
    this.saveItems(items);
    return newItem;
  },

  // Update an existing item
  updateItem(id, updates) {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Item not found");

    const updatedItem = {
      ...items[index],
      ...updates,
      // Ensure numeric bounds are respected
      quantity: updates.quantity !== undefined ? Math.max(0, parseInt(updates.quantity) || 0) : items[index].quantity,
      reorderThreshold: updates.reorderThreshold !== undefined ? Math.max(0, parseInt(updates.reorderThreshold) || 0) : items[index].reorderThreshold,
      price: updates.price !== undefined ? Math.max(0, parseFloat(updates.price) || 0.00) : items[index].price,
      lastUpdated: new Date().toISOString()
    };

    items[index] = updatedItem;
    this.saveItems(items);
    return updatedItem;
  },

  // Delete an item
  deleteItem(id) {
    const items = this.getItems();
    const filtered = items.filter(item => item.id !== id);
    this.saveItems(filtered);
    return filtered;
  },

  // Export JSON string for download
  exportBackup() {
    const items = this.getItems();
    return JSON.stringify(items, null, 2);
  },

  // Import JSON string back
  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error("Backup must be a JSON array of items.");
      }

      const validatedItems = parsed.map((item, idx) => {
        if (!item.name || !item.size) {
          throw new Error(`Item at index ${idx} is missing required fields (name, size).`);
        }
        return {
          id: item.id || `PO-${600 + idx}`,
          name: String(item.name).trim(),
          size: String(item.size).trim(),
          category: String(item.category || "bolt").toLowerCase(),
          quantity: Math.max(0, parseInt(item.quantity) || 0),
          reorderThreshold: Math.max(0, parseInt(item.reorderThreshold) || 0),
          price: Math.max(0, parseFloat(item.price) || 0.00),
          vendor: item.vendor ? String(item.vendor).trim() : "Unknown Vendor",
          location: item.location ? String(item.location).trim() : "Unassigned",
          lastUpdated: item.lastUpdated || new Date().toISOString()
        };
      });

      this.saveItems(validatedItems);
      return true;
    } catch (e) {
      console.error("Backup import failed", e);
      throw e;
    }
  }
};

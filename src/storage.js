// Default seed data matching the "inventar" mockup style
const DEFAULT_ITEMS = [
  {
    id: "PART-652",
    name: "Men Cotton Polo Shirt Army (Hex Bolt)",
    size: "M8 x 40mm",
    category: "bolt",
    quantity: 500,
    reorderThreshold: 100,
    vendor: "Vahement Part",
    location: "Aisle 2, Bin A1",
    lastUpdated: "2026-06-19T18:07:00.000Z"
  },
  {
    id: "PART-655",
    name: "Men Cotton Polo Shirt Ocean Blue (Nyloc Nut)",
    size: "M8",
    category: "nut",
    quantity: 80,
    reorderThreshold: 100,
    vendor: "Acme Corp",
    location: "Aisle 2, Bin A2",
    lastUpdated: "2026-06-19T18:01:00.000Z"
  },
  {
    id: "PART-654",
    name: "Men Cotton Polo Shirt Army (Flat Washer)",
    size: "M8",
    category: "washer",
    quantity: 1000,
    reorderThreshold: 200,
    vendor: "Acme Corp",
    location: "Aisle 2, Bin B1",
    lastUpdated: "2026-06-19T18:04:00.000Z"
  },
  {
    id: "PART-658",
    name: "Socket Head Cap Screw",
    size: "M6 x 20mm",
    category: "bolt",
    quantity: 15,
    reorderThreshold: 50,
    vendor: "Vahement Part",
    location: "Aisle 3, Bin C1",
    lastUpdated: "2026-06-19T18:06:00.000Z"
  }
];

const STORAGE_KEY = "inventar_items_v1";

// Helper to generate a new item ID
function generateId() {
  const num = Math.floor(100 + Math.random() * 900);
  return `PART-${num}`;
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

      // Basic validation of fields
      const validatedItems = parsed.map((item, idx) => {
        if (!item.name || !item.size) {
          throw new Error(`Item at index ${idx} is missing required fields (name, size).`);
        }
        return {
          id: item.id || `PART-${100 + idx}`,
          name: String(item.name).trim(),
          size: String(item.size).trim(),
          category: String(item.category || "bolt").toLowerCase(),
          quantity: Math.max(0, parseInt(item.quantity) || 0),
          reorderThreshold: Math.max(0, parseInt(item.reorderThreshold) || 0),
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

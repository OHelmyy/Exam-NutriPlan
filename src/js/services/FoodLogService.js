import { FoodLogEntry } from '../models/FoodLogEntry.js';

export class FoodLogService {
  constructor() {
    this.storageKey = 'nutriplan_food_log';
    this.targetsKey = 'nutriplan_daily_targets';
  }

  // Safe helper to check if localStorage is available
  getStorage() {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    // Fallback in-memory storage for testing
    if (!this.memoryStore) this.memoryStore = {};
    return {
      getItem: (key) => this.memoryStore[key] || null,
      setItem: (key, val) => { this.memoryStore[key] = String(val); },
      removeItem: (key) => { delete this.memoryStore[key]; }
    };
  }

  // Get all food log entries from localStorage
  getEntries() {
    try {
      const raw = this.getStorage().getItem(this.storageKey);
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list.map(item => new FoodLogEntry(item));
    } catch (error) {
      console.error('Error reading food log from localStorage:', error.message);
      return [];
    }
  }

  // Save all entries array to localStorage
  saveEntries(entries) {
    try {
      this.getStorage().setItem(this.storageKey, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Error saving food log to localStorage:', error.message);
      return false;
    }
  }

  // Add a new consumed meal or product entry
  addEntry(item, type = 'meal', quantity = 1, date = null) {
    const validQty = Number(quantity) > 0 ? Number(quantity) : 1;
    const logDate = date || new Date().toISOString().split('T')[0];

    // Extract item data and calculate nutrition based on quantity
    let entryNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let unit = 'serving';

    if (type === 'product') {
      unit = 'g';
      // Products give nutrients per 100g
      const nut = item.nutrients || {};
      const factor = validQty / 100;
      entryNutrition = {
        calories: Math.round((nut.calories || 0) * factor),
        protein: Math.round((nut.protein || 0) * factor),
        carbs: Math.round((nut.carbs || 0) * factor),
        fat: Math.round((nut.fat || 0) * factor)
      };
    } else {
      // Meal nutrition is per serving
      const nut = item.nutrition || {};
      entryNutrition = {
        calories: Math.round((nut.calories || 0) * validQty),
        protein: Math.round((nut.protein || 0) * validQty),
        carbs: Math.round((nut.carbs || 0) * validQty),
        fat: Math.round((nut.fat || 0) * validQty)
      };
    }

    const newEntry = new FoodLogEntry({
      itemId: item.id || item.barcode || '',
      name: item.name || 'Unnamed Food',
      type: type,
      date: logDate,
      quantity: validQty,
      unit: unit,
      image: item.thumbnail || item.image || '',
      nutrition: entryNutrition
    });

    const entries = this.getEntries();
    entries.unshift(newEntry); // Add to the top of the list
    this.saveEntries(entries);
    return newEntry;
  }

  // Get all entries for a specific date (YYYY-MM-DD)
  getEntriesByDate(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const entries = this.getEntries();
    return entries.filter(entry => entry.date === targetDate);
  }

  // Delete a single entry by its unique entry ID
  deleteEntry(id) {
    const entries = this.getEntries();
    const updated = entries.filter(entry => entry.id !== id);
    this.saveEntries(updated);
    return updated;
  }

  // Clear all entries for a specific date
  clearEntriesByDate(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const entries = this.getEntries();
    const remaining = entries.filter(entry => entry.date !== targetDate);
    this.saveEntries(remaining);
    return remaining;
  }

  // Calculate total nutrition for a specific date
  calculateDailyNutrition(date) {
    const dayEntries = this.getEntriesByDate(date);
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    for (let i = 0; i < dayEntries.length; i++) {
      const item = dayEntries[i];
      totals.calories += item.nutrition.calories || 0;
      totals.protein += item.nutrition.protein || 0;
      totals.carbs += item.nutrition.carbs || 0;
      totals.fat += item.nutrition.fat || 0;
    }

    return totals;
  }

  // Get daily targets (default: 2000 cal, 50g protein, 250g carbs, 65g fat)
  getTargets() {
    try {
      const raw = this.getStorage().getItem(this.targetsKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading targets:', e.message);
    }
    return {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65
    };
  }

  // Save customized daily targets
  saveTargets(targets) {
    try {
      this.getStorage().setItem(this.targetsKey, JSON.stringify(targets));
      return true;
    } catch (e) {
      console.error('Error saving targets:', e.message);
      return false;
    }
  }
}

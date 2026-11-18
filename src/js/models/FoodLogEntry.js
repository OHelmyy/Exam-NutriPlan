export class FoodLogEntry {
  constructor(data = {}) {
    // Generate a unique ID for this entry
    this.id = data.id || 'entry_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    this.itemId = data.itemId || '';
    this.name = data.name || 'Unnamed Food';
    this.type = data.type || 'meal'; // 'meal' or 'product'
    this.date = data.date || new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    this.quantity = Number(data.quantity) > 0 ? Number(data.quantity) : 1;
    this.unit = data.unit || 'serving';
    this.image = data.image || '';

    // Store nutrition for this entry
    const nut = data.nutrition || {};
    this.nutrition = {
      calories: Math.round(Number(nut.calories) || 0),
      protein: Math.round(Number(nut.protein) || 0),
      carbs: Math.round(Number(nut.carbs) || 0),
      fat: Math.round(Number(nut.fat) || 0)
    };
  }
}

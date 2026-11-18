import { ApiService } from './ApiService.js';
import { Meal } from '../models/Meal.js';

export class MealService extends ApiService {
  constructor(baseUrl) {
    super(baseUrl);
    this.apiKey = 'xRGnhxcXrKuX8hJpeeQE5Rac9b7dyQDpaMs5fWFL';
  }

  // Get meals (default 25 meals or search by name)
  async getMeals(search = '') {
    const endpoint = `/meals/search?q=${search}`;
    const data = await this.get(endpoint);
    const rawMeals = data.results || [];
    return rawMeals.map(raw => new Meal(raw));
  }

  // Filter meals by category (e.g. Beef, Chicken)
  async getMealsByCategory(category) {
    const endpoint = `/meals/filter?category=${category}`;
    const data = await this.get(endpoint);
    const rawMeals = data.results || [];
    return rawMeals.map(raw => new Meal(raw));
  }

  // Filter meals by area/country (e.g. Egyptian, Canadian)
  async getMealsByArea(area) {
    const endpoint = `/meals/filter?area=${area}`;
    const data = await this.get(endpoint);
    const rawMeals = data.results || [];
    return rawMeals.map(raw => new Meal(raw));
  }

  // Get a single meal by its id
  async getMealById(id) {
    const endpoint = `/meals/${id}`;
    const data = await this.get(endpoint);
    if (!data.result || !data.result.id) {
      return null;
    }
    return new Meal(data.result);
  }

  // Get all meal categories
  async getCategories() {
    const data = await this.get('/meals/categories');
    return data.results || [];
  }

  // Get all cuisine areas
  async getAreas() {
    const data = await this.get('/meals/areas');
    return data.results || [];
  }

  // Analyze nutrition for a recipe using its ingredients
  async analyzeRecipeNutrition(recipeName, ingredients) {
    try {
      const response = await fetch(`${this.baseUrl}/nutrition/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          recipeName: recipeName,
          ingredients: ingredients
        })
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Nutrition analyze error:', error.message);
      return null;
    }
  }
}

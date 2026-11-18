import { getLoadingSpinner, getErrorMessage } from '../ui/components.js';

export class MealDetailsPage {
  constructor(mealService, onBackClick, onLogMeal) {
    this.mealService = mealService;
    this.onBackClick = onBackClick;
    this.onLogMeal = onLogMeal;

    this.container = document.querySelector('#meal-details .max-w-7xl');
    this.currentMeal = null;
  }

  // Load a single meal by ID and render it
  async loadMeal(mealId) {
    if (!this.container) return;

    // Show loading spinner
    this.container.innerHTML = `
      <button id="back-to-meals-btn" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
        <i class="fa-solid fa-arrow-left"></i>
        <span>Back to Recipes</span>
      </button>
      ${getLoadingSpinner()}
    `;

    // Bind back button
    document.getElementById('back-to-meals-btn')?.addEventListener('click', () => {
      if (typeof this.onBackClick === 'function') this.onBackClick();
    });

    try {
      const meal = await this.mealService.getMealById(mealId);

      if (!meal) {
        this.container.innerHTML = `
          <button id="back-to-meals-btn" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Back to Recipes</span>
          </button>
          ${getErrorMessage('Recipe not found.')}
        `;
        document.getElementById('back-to-meals-btn')?.addEventListener('click', () => {
          if (typeof this.onBackClick === 'function') this.onBackClick();
        });
        return;
      }

      this.currentMeal = meal;
      this.renderMeal(meal);

      // Now fetch and render the live nutrition facts
      this.loadNutrition(meal);
    } catch (error) {
      this.container.innerHTML = `
        <button id="back-to-meals-btn" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back to Recipes</span>
        </button>
        ${getErrorMessage(error.message)}
      `;
      document.getElementById('back-to-meals-btn')?.addEventListener('click', () => {
        if (typeof this.onBackClick === 'function') this.onBackClick();
      });
    }
  }

  // Fetch nutrition facts from USDA analyze endpoint
  async loadNutrition(meal) {
    const nutritionContainer = document.getElementById('nutrition-facts-container');
    if (!nutritionContainer) return;

    // Prepare ingredient lines (e.g. "2kg Mixed Beef Cuts", "4 Chorizo")
    const ingredientList = meal.ingredients.map(item => `${item.measure || ''} ${item.ingredient}`.trim());

    const data = await this.mealService.analyzeRecipeNutrition(meal.name, ingredientList);

    if (data && data.perServing && data.totals) {
      const servings = data.servings || 4;
      const per = data.perServing;
      const tot = data.totals;

      // Store normalized nutrition in meal object for the Food Log
      meal.nutrition = {
        calories: Math.round(per.calories || 0),
        protein: Math.round(per.protein || 0),
        carbs: Math.round(per.carbs || 0),
        fat: Math.round(per.fat || 0)
      };

      // Update hero badges
      const heroServings = document.getElementById('hero-servings');
      const heroCalories = document.getElementById('hero-calories');
      if (heroServings) heroServings.textContent = `${servings} servings`;
      if (heroCalories) heroCalories.textContent = `${Math.round(per.calories)} cal/serving`;

      // Render full nutrition facts card
      nutritionContainer.innerHTML = `
        <p class="text-sm text-gray-500 mb-4">Per serving (${servings} servings)</p>

        <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
          <p class="text-sm text-gray-600">Calories per serving</p>
          <p class="text-4xl font-bold text-emerald-600">${Math.round(per.calories)}</p>
          <p class="text-xs text-gray-500 mt-1">Total recipe: ${Math.round(tot.calories)} cal</p>
        </div>

        <div class="space-y-4">
          <!-- Protein -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span class="text-gray-700">Protein</span>
              </div>
              <span class="font-bold text-gray-900">${Math.round(per.protein)}g</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-emerald-500 h-2 rounded-full" style="width: ${Math.min(Math.round(per.protein / 50 * 100), 100)}%"></div>
            </div>
          </div>

          <!-- Carbs -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                <span class="text-gray-700">Carbs</span>
              </div>
              <span class="font-bold text-gray-900">${Math.round(per.carbs)}g</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-blue-500 h-2 rounded-full" style="width: ${Math.min(Math.round(per.carbs / 300 * 100), 100)}%"></div>
            </div>
          </div>

          <!-- Fat -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-purple-500"></div>
                <span class="text-gray-700">Fat</span>
              </div>
              <span class="font-bold text-gray-900">${Math.round(per.fat)}g</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-purple-500 h-2 rounded-full" style="width: ${Math.min(Math.round(per.fat / 65 * 100), 100)}%"></div>
            </div>
          </div>

          <!-- Fiber -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                <span class="text-gray-700">Fiber</span>
              </div>
              <span class="font-bold text-gray-900">${Math.round(per.fiber || 0)}g</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-orange-500 h-2 rounded-full" style="width: ${Math.min(Math.round((per.fiber || 0) / 25 * 100), 100)}%"></div>
            </div>
          </div>

          <!-- Sugar -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-pink-500"></div>
                <span class="text-gray-700">Sugar</span>
              </div>
              <span class="font-bold text-gray-900">${Math.round(per.sugar || 0)}g</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-pink-500 h-2 rounded-full" style="width: ${Math.min(Math.round((per.sugar || 0) / 50 * 100), 100)}%"></div>
            </div>
          </div>
        </div>
      `;
    } else {
      // If USDA cannot analyze or has no match
      nutritionContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500 bg-gray-50 rounded-xl p-4">
          <i class="fa-solid fa-circle-info text-3xl mb-2 text-gray-400"></i>
          <p class="font-medium text-gray-700">Nutrition Unavailable</p>
          <p class="text-xs text-gray-400 mt-1">Nutritional data is not provided for this recipe.</p>
        </div>
      `;
    }
  }

  // Render the recipe details into the DOM
  renderMeal(meal) {
    const embedUrl = meal.getYoutubeEmbedUrl();

    this.container.innerHTML = `
      <!-- Back Button -->
      <button id="back-to-meals-btn" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors cursor-pointer">
        <i class="fa-solid fa-arrow-left"></i>
        <span>Back to Recipes</span>
      </button>

      <!-- Hero Banner -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="relative h-80 md:h-96">
          <img src="${meal.thumbnail}" alt="${meal.name}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-8">
            <div class="flex items-center gap-3 mb-3 flex-wrap">
              <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${meal.category}</span>
              <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${meal.area}</span>
              ${meal.tags.map(tag => `<span class="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">${tag}</span>`).join('')}
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
              ${meal.name}
            </h1>
            <div class="flex items-center gap-6 text-white/90">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-utensils"></i>
                <span id="hero-servings">${meal.ingredients.length} ingredients</span>
              </span>
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-fire"></i>
                <span id="hero-calories">Calculating nutrition...</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 mb-8">
        <button id="log-meal-btn" class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-sm hover:shadow" data-meal-id="${meal.id}">
          <i class="fa-solid fa-clipboard-list"></i>
          <span>Log This Meal</span>
        </button>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Ingredients and Instructions -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Ingredients -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-emerald-600"></i>
              Ingredients
              <span class="text-sm font-normal text-gray-500 ml-auto">${meal.ingredients.length} items</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${meal.ingredients.map(item => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
                  <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
                  <span class="text-gray-700">
                    <span class="font-medium text-gray-900">${item.measure || ''}</span> ${item.ingredient}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Instructions -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-shoe-prints text-emerald-600"></i>
              Instructions
            </h2>
            <div class="space-y-4">
              ${meal.instructions.map((step, idx) => `
                <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    ${idx + 1}
                  </div>
                  <p class="text-gray-700 leading-relaxed pt-2">
                    ${step}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Video Tutorial (only shown if a valid video exists) -->
          ${embedUrl ? `
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-video text-red-500"></i>
                Video Tutorial
              </h2>
              <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                <iframe src="${embedUrl}" class="absolute inset-0 w-full h-full"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
                </iframe>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Right Column: Nutrition Facts -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-chart-pie text-emerald-600"></i>
              Nutrition Facts
            </h2>
            <div id="nutrition-facts-container">
              <div class="text-center py-8 text-gray-500">
                <i class="fa-solid fa-spinner animate-spin text-emerald-600 text-2xl mb-2"></i>
                <p class="text-sm">Calculating nutrition facts...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    this.bindEvents();
  }

  // Bind clicks for back button and log button
  bindEvents() {
    const backBtn = document.getElementById('back-to-meals-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (typeof this.onBackClick === 'function') {
          this.onBackClick();
        }
      });
    }

    const logBtn = document.getElementById('log-meal-btn');
    if (logBtn) {
      logBtn.addEventListener('click', () => {
        if (typeof this.onLogMeal === 'function' && this.currentMeal) {
          this.onLogMeal(this.currentMeal);
        }
      });
    }
  }
}

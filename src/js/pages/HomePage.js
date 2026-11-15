import { getLoadingSpinner, getEmptyState, getErrorMessage } from '../ui/components.js';

export class HomePage {
  constructor(mealService, onMealSelect) {
    this.mealService = mealService;
    this.onMealSelect = onMealSelect;

    // Current filter states
    this.currentCategory = '';
    this.currentArea = '';
    this.searchQuery = '';
    this.isListView = false;

    // DOM Elements
    this.recipesGrid = document.getElementById('recipes-grid');
    this.recipesCount = document.getElementById('recipes-count');
    this.categoriesGrid = document.getElementById('categories-grid');
    this.searchInput = document.getElementById('search-input');
    this.gridViewBtn = document.getElementById('grid-view-btn');
    this.listViewBtn = document.getElementById('list-view-btn');
    this.areaFilterContainer = document.querySelector('#search-filters-section .flex.items-center.gap-3.overflow-x-auto');

    // Popular areas to show as filter buttons
    this.popularAreas = ['Egyptian', 'Italian', 'American', 'Canadian', 'Mexican', 'Chinese', 'Japanese', 'Indian'];
  }

  // Initialize event listeners and load data
  init() {
    this.bindEvents();
    this.loadCategories();
    this.renderAreaPills();
    this.loadMeals();
  }

  // Bind UI event listeners
  bindEvents() {
    // 1. Search input event
    if (this.searchInput) {
      let timeout = null;
      this.searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.loadMeals();
        }, 300);
      });
    }

    // 2. View toggle: Grid view
    if (this.gridViewBtn) {
      this.gridViewBtn.addEventListener('click', () => {
        this.setViewMode(false);
      });
    }

    // 3. View toggle: List view
    if (this.listViewBtn) {
      this.listViewBtn.addEventListener('click', () => {
        this.setViewMode(true);
      });
    }

    // 4. Recipe card clicks (delegated on recipesGrid)
    if (this.recipesGrid) {
      this.recipesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.recipe-card');
        if (card && card.dataset.mealId) {
          const mealId = card.dataset.mealId;
          if (typeof this.onMealSelect === 'function') {
            this.onMealSelect(mealId);
          }
        }
      });
    }

    // 5. Category clicks (delegated on categoriesGrid)
    if (this.categoriesGrid) {
      this.categoriesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        if (card && card.dataset.category) {
          const selected = card.dataset.category;
          // Toggle off if already active, or activate
          this.currentCategory = (this.currentCategory === selected) ? '' : selected;
          this.currentArea = ''; // Reset area filter
          this.highlightActiveCategory();
          this.updateAreaPillStyles();
          this.loadMeals();
        }
      });
    }
  }

  // Load and render meal categories in the carousel/grid
  async loadCategories() {
    if (!this.categoriesGrid) return;
    try {
      const categories = await this.mealService.getCategories();
      this.renderCategories(categories);
    } catch (error) {
      console.error('Failed to load categories:', error.message);
    }
  }

  // Render categories HTML
  renderCategories(categories) {
    if (!categories.length) return;

    this.categoriesGrid.innerHTML = categories.map(cat => `
      <div class="category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border ${this.currentCategory === cat.name ? 'border-emerald-500 shadow-md ring-2 ring-emerald-400' : 'border-emerald-200'} hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group" data-category="${cat.name}">
        <div class="flex items-center gap-2.5">
          <div class="text-white w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <i class="fa-solid fa-utensils"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900">${cat.name}</h3>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Highlight selected category card
  highlightActiveCategory() {
    const cards = this.categoriesGrid?.querySelectorAll('.category-card') || [];
    cards.forEach(card => {
      const isSelected = card.dataset.category === this.currentCategory;
      if (isSelected) {
        card.classList.add('border-emerald-500', 'shadow-md', 'ring-2', 'ring-emerald-400');
        card.classList.remove('border-emerald-200');
      } else {
        card.classList.remove('border-emerald-500', 'shadow-md', 'ring-2', 'ring-emerald-400');
        card.classList.add('border-emerald-200');
      }
    });
  }

  // Render area filter pill buttons
  renderAreaPills() {
    if (!this.areaFilterContainer) return;

    const allPills = ['All Recipes', ...this.popularAreas];
    this.areaFilterContainer.innerHTML = allPills.map(area => {
      const isAll = area === 'All Recipes';
      const isActive = (isAll && !this.currentArea) || (this.currentArea === area);
      const activeClass = 'bg-emerald-600 text-white';
      const inactiveClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

      return `
        <button class="area-pill-btn px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${isActive ? activeClass : inactiveClass}" data-area="${isAll ? '' : area}">
          ${area}
        </button>
      `;
    }).join('');

    // Add click listeners to area pills
    this.areaFilterContainer.querySelectorAll('.area-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentArea = btn.dataset.area;
        this.currentCategory = ''; // Reset category
        this.highlightActiveCategory();
        this.updateAreaPillStyles();
        this.loadMeals();
      });
    });
  }

  // Update area pill styling when active changes
  updateAreaPillStyles() {
    if (!this.areaFilterContainer) return;
    const buttons = this.areaFilterContainer.querySelectorAll('.area-pill-btn');
    buttons.forEach(btn => {
      const isAll = btn.dataset.area === '';
      const isActive = (isAll && !this.currentArea) || (this.currentArea === btn.dataset.area);
      if (isActive) {
        btn.className = 'area-pill-btn px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all bg-emerald-600 text-white';
      } else {
        btn.className = 'area-pill-btn px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all bg-gray-100 text-gray-700 hover:bg-gray-200';
      }
    });
  }

  // Set grid or list view mode
  setViewMode(isList) {
    this.isListView = isList;
    if (!this.recipesGrid) return;

    if (isList) {
      this.recipesGrid.className = 'grid grid-cols-1 gap-4';
      this.listViewBtn?.classList.add('bg-white', 'shadow-sm');
      this.gridViewBtn?.classList.remove('bg-white', 'shadow-sm');
    } else {
      this.recipesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';
      this.gridViewBtn?.classList.add('bg-white', 'shadow-sm');
      this.listViewBtn?.classList.remove('bg-white', 'shadow-sm');
    }
  }

  // Main method to fetch and render meals
  async loadMeals() {
    if (!this.recipesGrid) return;

    // Show loading state
    this.recipesGrid.innerHTML = getLoadingSpinner();
    if (this.recipesCount) this.recipesCount.textContent = 'Loading recipes...';

    try {
      let meals = [];

      // Determine which API call to make
      if (this.searchQuery) {
        meals = await this.mealService.getMeals(this.searchQuery);
      } else if (this.currentCategory) {
        meals = await this.mealService.getMealsByCategory(this.currentCategory);
      } else if (this.currentArea) {
        meals = await this.mealService.getMealsByArea(this.currentArea);
      } else {
        // Default: 25 meals
        meals = await this.mealService.getMeals();
      }

      this.renderMeals(meals);
    } catch (error) {
      console.error('Error loading meals:', error.message);
      this.recipesGrid.innerHTML = getErrorMessage(error.message);
      if (this.recipesCount) this.recipesCount.textContent = 'Error loading recipes';
    }
  }

  // Render recipes to DOM
  renderMeals(meals) {
    if (!this.recipesGrid) return;

    // Update count display
    if (this.recipesCount) {
      this.recipesCount.textContent = `Showing ${meals.length} recipes`;
    }

    // Handle empty state
    if (!meals || meals.length === 0) {
      this.recipesGrid.innerHTML = getEmptyState('No recipes found', 'Try adjusting your search or filter');
      return;
    }

    // Render cards
    this.recipesGrid.innerHTML = meals.map(meal => this.createMealCardHtml(meal)).join('');
  }

  // Create single recipe card HTML
  createMealCardHtml(meal) {
    const isList = this.isListView;

    if (isList) {
      return `
        <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex items-center p-3 gap-4" data-meal-id="${meal.id}">
          <div class="w-32 h-24 shrink-0 rounded-lg overflow-hidden relative">
            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              src="${meal.thumbnail}" alt="${meal.name}" loading="lazy" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 bg-gray-100 text-xs font-semibold rounded-full text-gray-700">${meal.category}</span>
              <span class="px-2 py-0.5 bg-emerald-500 text-xs font-semibold rounded-full text-white">${meal.area}</span>
            </div>
            <h3 class="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
              ${meal.name}
            </h3>
            <p class="text-xs text-gray-500 mt-1 line-clamp-1">Click to view full recipe ingredients and instructions</p>
          </div>
          <i class="fa-solid fa-chevron-right text-gray-400 mr-2 group-hover:text-emerald-600 transition-colors"></i>
        </div>
      `;
    }

    return `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${meal.id}">
        <div class="relative h-48 overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src="${meal.thumbnail}" alt="${meal.name}" loading="lazy" />
          <div class="absolute bottom-3 left-3 flex gap-2">
            <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
              ${meal.category}
            </span>
            <span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">
              ${meal.area}
            </span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
            ${meal.name}
          </h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">
            Delicious recipe to try!
          </p>
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-gray-900">
              <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
              ${meal.category}
            </span>
            <span class="font-semibold text-gray-500">
              <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
              ${meal.area}
            </span>
          </div>
        </div>
      </div>
    `;
  }
}

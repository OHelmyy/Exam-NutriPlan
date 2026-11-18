export class FoodLogPage {
  constructor(foodLogService, onNavigate) {
    this.foodLogService = foodLogService;
    this.onNavigate = onNavigate;

    // Default to today (YYYY-MM-DD)
    this.selectedDate = new Date().toISOString().split('T')[0];

    // DOM Elements
    this.dateDisplay = document.getElementById('foodlog-date');
    this.todaySection = document.getElementById('foodlog-today-section');
    this.itemsList = document.getElementById('logged-items-list');
    this.clearBtn = document.getElementById('clear-foodlog');
    this.weeklyChart = document.getElementById('weekly-chart');
  }

  // Initialize page and events
  init() {
    this.setupDateHeader();
    this.bindEvents();
    this.render();
  }

  // Setup date picker in the header
  setupDateHeader() {
    if (!this.dateDisplay) return;

    // Add a date input beside the date display so user can pick any date
    const parent = this.dateDisplay.parentElement;
    if (parent && !document.getElementById('foodlog-date-picker')) {
      const picker = document.createElement('input');
      picker.type = 'date';
      picker.id = 'foodlog-date-picker';
      picker.value = this.selectedDate;
      picker.className = 'mt-2 text-xs text-gray-800 bg-white/90 px-2 py-1 rounded border border-white/50 cursor-pointer block';
      picker.addEventListener('change', (e) => {
        if (e.target.value) {
          this.selectedDate = e.target.value;
          this.render();
        }
      });
      parent.appendChild(picker);
    }
  }

  // Bind UI events
  bindEvents() {
    // 1. Clear all entries for selected date
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to clear all logged foods for ${this.selectedDate}?`)) {
          this.foodLogService.clearEntriesByDate(this.selectedDate);
          this.render();
        }
      });
    }

    // 2. Delete single entry (delegated)
    if (this.itemsList) {
      this.itemsList.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-entry-btn');
        if (btn && btn.dataset.id) {
          this.foodLogService.deleteEntry(btn.dataset.id);
          this.render();
        }
      });
    }

    // 3. Quick action buttons
    const quickBtns = document.querySelectorAll('#foodlog-section .quick-log-btn');
    if (quickBtns.length >= 3) {
      // Button 0: Log a Meal (navigate to Home)
      quickBtns[0].addEventListener('click', () => {
        if (typeof this.onNavigate === 'function') this.onNavigate('home');
      });

      // Button 1: Scan Product (navigate to Scanner)
      quickBtns[1].addEventListener('click', () => {
        if (typeof this.onNavigate === 'function') this.onNavigate('products');
      });

      // Button 2: Custom Entry
      quickBtns[2].addEventListener('click', () => {
        this.promptCustomEntry();
      });
    }
  }

  // Render the entire Food Log UI
  render() {
    this.updateDateDisplay();
    this.renderProgressBars();
    this.renderItemsList();
    this.renderWeeklyChart();
  }

  // Format and update date header
  updateDateDisplay() {
    if (this.dateDisplay) {
      const parts = this.selectedDate.split('-');
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      this.dateDisplay.textContent = dateObj.toLocaleDateString('en-US', options);
    }
    const picker = document.getElementById('foodlog-date-picker');
    if (picker) picker.value = this.selectedDate;
  }

  // Render daily totals, progress bars, and calorie warning
  renderProgressBars() {
    const totals = this.foodLogService.calculateDailyNutrition(this.selectedDate);
    const targets = this.foodLogService.getTargets();

    // Calculate percentage caps
    const calPercent = targets.calories > 0 ? Math.round((totals.calories / targets.calories) * 100) : 0;
    const proteinPercent = targets.protein > 0 ? Math.round((totals.protein / targets.protein) * 100) : 0;
    const carbsPercent = targets.carbs > 0 ? Math.round((totals.carbs / targets.carbs) * 100) : 0;
    const fatPercent = targets.fat > 0 ? Math.round((totals.fat / targets.fat) * 100) : 0;

    const isExceeded = totals.calories > targets.calories;

    // Progress grid container
    const progressContainer = this.todaySection?.querySelector('.grid');
    if (progressContainer) {
      progressContainer.innerHTML = `
        <!-- Calories -->
        <div class="${isExceeded ? 'bg-red-50 border border-red-200' : 'bg-emerald-50'} rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700">Calories</span>
            <span class="text-sm ${isExceeded ? 'text-red-600 font-bold' : 'text-gray-500'}">${totals.calories} / ${targets.calories} kcal</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div class="${isExceeded ? 'bg-red-500' : 'bg-emerald-500'} h-2.5 rounded-full transition-all duration-500" style="width: ${Math.min(calPercent, 100)}%"></div>
          </div>
        </div>

        <!-- Protein -->
        <div class="bg-blue-50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700">Protein</span>
            <span class="text-sm text-gray-500">${totals.protein} / ${targets.protein} g</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style="width: ${Math.min(proteinPercent, 100)}%"></div>
          </div>
        </div>

        <!-- Carbs -->
        <div class="bg-amber-50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700">Carbs</span>
            <span class="text-sm text-gray-500">${totals.carbs} / ${targets.carbs} g</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div class="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style="width: ${Math.min(carbsPercent, 100)}%"></div>
          </div>
        </div>

        <!-- Fat -->
        <div class="bg-purple-50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700">Fat</span>
            <span class="text-sm text-gray-500">${totals.fat} / ${targets.fat} g</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div class="bg-purple-500 h-2.5 rounded-full transition-all duration-500" style="width: ${Math.min(fatPercent, 100)}%"></div>
          </div>
        </div>
      `;
    }

    // Exceeded warning banner
    let warningBanner = document.getElementById('calorie-warning-banner');
    if (isExceeded) {
      if (!warningBanner && this.todaySection) {
        warningBanner = document.createElement('div');
        warningBanner.id = 'calorie-warning-banner';
        warningBanner.className = 'mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm flex items-center gap-2';
        warningBanner.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span><strong>Calorie Warning:</strong> You have exceeded your daily calorie target for this date.</span>';
        progressContainer?.before(warningBanner);
      }
    } else {
      warningBanner?.remove();
    }
  }

  // Render list of logged foods for selected date
  renderItemsList() {
    if (!this.itemsList) return;

    const entries = this.foodLogService.getEntriesByDate(this.selectedDate);

    // Update count header
    const countTitle = this.todaySection?.querySelector('h4');
    if (countTitle) {
      countTitle.textContent = `Logged Items (${entries.length})`;
    }

    // Toggle Clear All button
    if (this.clearBtn) {
      this.clearBtn.style.display = entries.length > 0 ? 'inline-block' : 'none';
    }

    // Empty State
    if (entries.length === 0) {
      this.itemsList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
          <p class="font-medium">No meals logged for this date</p>
          <p class="text-sm">Add meals from the Meals page or scan products</p>
        </div>
      `;
      return;
    }

    // Render logged item rows
    this.itemsList.innerHTML = entries.map(item => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
        <div class="flex items-center gap-3">
          ${item.image ? `
            <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover" />
          ` : `
            <div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <i class="fa-solid fa-utensils"></i>
            </div>
          `}
          <div>
            <div class="flex items-center gap-2">
              <h5 class="font-bold text-gray-900 text-sm">${item.name}</h5>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${item.type === 'product' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
                ${item.type}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">${item.quantity} ${item.unit || 'serving'}</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Macros pills -->
          <div class="text-right">
            <span class="font-bold text-gray-900 text-sm">${item.nutrition.calories} kcal</span>
            <p class="text-[10px] text-gray-500">
              P: ${item.nutrition.protein}g | C: ${item.nutrition.carbs}g | F: ${item.nutrition.fat}g
            </p>
          </div>

          <!-- Delete button -->
          <button class="delete-entry-btn text-gray-400 hover:text-red-600 p-2 transition-colors cursor-pointer" data-id="${item.id}" title="Delete entry">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Build last 7 days data ending on today
  getWeeklyLogData() {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const list = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const nut = this.foodLogService.calculateDailyNutrition(iso);
      const entries = this.foodLogService.getEntriesByDate(iso);

      list.push({
        iso: iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        calories: nut.calories || 0,
        itemCount: entries.length,
        isToday: iso === todayIso
      });
    }

    return list;
  }

  // Render weekly 7-day overview grid
  renderWeeklyChart() {
    if (!this.weeklyChart) return;

    // Use 7-column grid matching the reference design
    this.weeklyChart.className = 'grid grid-cols-7 gap-2 py-2';

    const weeklyData = this.getWeeklyLogData();

    this.weeklyChart.innerHTML = weeklyData.map(day => {
      // Highlight today column with a soft rounded background
      const highlightClass = day.isToday
        ? 'bg-indigo-100/70 rounded-2xl'
        : 'hover:bg-gray-50 rounded-2xl';

      const calColor = day.calories > 0 ? 'text-emerald-600' : 'text-gray-300';
      const kcalColor = day.calories > 0 ? 'text-emerald-600 font-semibold' : 'text-gray-400';

      return `
        <div class="weekly-day-col text-center py-4 px-1 transition-all cursor-pointer ${highlightClass}" data-date="${day.iso}">
          <p class="text-xs text-gray-500 mb-1 font-medium">${day.dayName}</p>
          <p class="text-sm font-bold text-gray-800">${day.date}</p>
          <div class="mt-2 ${calColor}">
            <p class="text-lg font-bold leading-tight">${day.calories}</p>
            <p class="text-xs ${kcalColor} leading-tight">kcal</p>
          </div>
          ${day.itemCount > 0 ? `<p class="text-[11px] text-gray-400 mt-1">${day.itemCount} items</p>` : ''}
        </div>
      `;
    }).join('');

    // Clicking a day in the weekly overview switches the active view to that date
    this.weeklyChart.querySelectorAll('.weekly-day-col').forEach(col => {
      col.addEventListener('click', () => {
        const targetDate = col.dataset.date;
        if (targetDate) {
          this.selectedDate = targetDate;
          this.render();
        }
      });
    });
  }

  // Quick action: Custom food entry prompt
  promptCustomEntry() {
    const name = prompt('Enter food name:');
    if (!name) return;

    const calInput = prompt('Enter calories (kcal):', '250');
    if (calInput === null) return;

    const proInput = prompt('Enter protein (g):', '10');
    const carbInput = prompt('Enter carbs (g):', '25');
    const fatInput = prompt('Enter fat (g):', '5');

    const customFood = {
      id: 'custom_' + Date.now(),
      name: name,
      nutrition: {
        calories: Number(calInput) || 0,
        protein: Number(proInput) || 0,
        carbs: Number(carbInput) || 0,
        fat: Number(fatInput) || 0
      }
    };

    this.foodLogService.addEntry(customFood, 'custom', 1, this.selectedDate);
    this.render();
  }
}

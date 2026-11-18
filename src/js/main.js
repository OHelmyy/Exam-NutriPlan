import { API_BASE_URL } from './config/apiConfig.js';
import { MealService } from './services/MealService.js';
import { FoodLogService } from './services/FoodLogService.js';
import { HomePage } from './pages/HomePage.js';
import { MealDetailsPage } from './pages/MealDetailsPage.js';
import { FoodLogPage } from './pages/FoodLogPage.js';
import { ProductService } from './services/ProductService.js';
import { ProductScannerPage } from './pages/ProductScannerPage.js';

console.log('NutriPlan initialized.');

// Shared service instances
const mealService = new MealService(API_BASE_URL);
const foodLogService = new FoodLogService();
const productService = new ProductService(API_BASE_URL);

// Pages
let homePage = null;
let mealDetailsPage = null;
let foodLogPage = null;
let productScannerPage = null;

// Function to switch between main sections
function showSection(sectionName) {
  const homeSections = [
    document.getElementById('search-filters-section'),
    document.getElementById('meal-categories-section'),
    document.getElementById('all-recipes-section')
  ];
  const mealDetails = document.getElementById('meal-details');
  const products = document.getElementById('products-section');
  const foodlog = document.getElementById('foodlog-section');

  // Hide all sections first
  homeSections.forEach(s => s?.classList.add('hidden'));
  mealDetails?.classList.add('hidden');
  products?.classList.add('hidden');
  foodlog?.classList.add('hidden');

  // Show the chosen section
  if (sectionName === 'home') {
    homeSections.forEach(s => s?.classList.remove('hidden'));
  } else if (sectionName === 'meal-details') {
    mealDetails?.classList.remove('hidden');
  } else if (sectionName === 'products') {
    products?.classList.remove('hidden');
  } else if (sectionName === 'foodlog') {
    foodlog?.classList.remove('hidden');
    if (foodLogPage) {
      foodLogPage.render();
    }
  }

  // Scroll to top when switching pages
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// When a meal card is clicked on HomePage
function handleMealSelect(mealId) {
  showSection('meal-details');
  if (mealDetailsPage) {
    mealDetailsPage.loadMeal(mealId);
  }
}

// When back button is clicked in MealDetailsPage
function handleBackToMeals() {
  showSection('home');
}

// When "Log This Meal" is clicked in MealDetailsPage
function handleLogMeal(meal) {
  // Add entry into LocalStorage via FoodLogService
  const entry = foodLogService.addEntry(meal, 'meal', 1);
  console.log('Meal logged to LocalStorage:', entry);

  // Update FoodLogPage view if active
  if (foodLogPage) {
    foodLogPage.render();
  }

  // Show friendly confirmation toast with SweetAlert
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'Meal Logged!',
      text: `"${meal.name}" has been added to your Food Log.`,
      confirmButtonColor: '#10b981',
      timer: 2000
    });
  } else {
    alert(`"${meal.name}" has been added to your Food Log!`);
  }
}

// When a product is logged from the Product Scanner
function handleLogProduct(product, grams = 100) {
  const entry = foodLogService.addEntry(product, 'product', grams);
  console.log('Product logged to LocalStorage:', entry);

  if (foodLogPage) {
    foodLogPage.render();
  }

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'Product Logged!',
      text: `"${product.name}" has been added to your Food Log.`,
      confirmButtonColor: '#10b981',
      timer: 2000
    });
  } else {
    alert(`"${product.name}" has been added to your Food Log!`);
  }
}

// Setup sidebar navigation links
function setupNavigation() {
  const navLinks = document.querySelectorAll('#sidebar .nav-link');
  navLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Update active styling
      navLinks.forEach(l => {
        l.className = 'nav-link flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-all';
      });
      link.className = 'nav-link flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg transition-all font-semibold';

      // Index 0: Meals & Recipes, Index 1: Product Scanner, Index 2: Food Log
      if (index === 0) showSection('home');
      else if (index === 1) showSection('products');
      else if (index === 2) showSection('foodlog');
    });
  });

  // Mobile sidebar toggle button
  const menuBtn = document.getElementById('header-menu-btn');
  const closeBtn = document.getElementById('sidebar-close-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay?.classList.toggle('active');
    });
  }
  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay?.classList.remove('active');
    });
  }
  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
}

// Initialize when running in browser
if (typeof window !== 'undefined') {
  window.mealService = mealService;
  window.foodLogService = foodLogService;
  window.showSection = showSection;

  // Hide the app loading overlay
  const appLoader = document.getElementById('app-loading-overlay');
  if (appLoader) {
    appLoader.classList.add('hidden');
    appLoader.style.display = 'none';
  }

  // Show home section by default
  showSection('home');

  // Setup sidebar links
  setupNavigation();

  // Initialize HomePage
  homePage = new HomePage(mealService, handleMealSelect);
  homePage.init();
  window.homePage = homePage;

  // Initialize MealDetailsPage
  mealDetailsPage = new MealDetailsPage(mealService, handleBackToMeals, handleLogMeal);
  window.mealDetailsPage = mealDetailsPage;

  productScannerPage = new ProductScannerPage(productService, handleLogProduct);
  productScannerPage.init();
  window.productScannerPage = productScannerPage;

  // Initialize FoodLogPage
  foodLogPage = new FoodLogPage(foodLogService, (targetSection) => {
    // If quick-log buttons navigate:
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    if (targetSection === 'home' && navLinks[0]) {
      navLinks[0].click();
    } else if (targetSection === 'products' && navLinks[1]) {
      navLinks[1].click();
    } else {
      showSection(targetSection);
    }
  });
  foodLogPage.init();
  window.foodLogPage = foodLogPage;
}

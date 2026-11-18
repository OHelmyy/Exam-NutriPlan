import { API_BASE_URL } from './config/apiConfig.js';
import { MealService } from './services/MealService.js';
import { FoodLogService } from './services/FoodLogService.js';
import { HomePage } from './pages/HomePage.js';
import { MealDetailsPage } from './pages/MealDetailsPage.js';
import { FoodLogPage } from './pages/FoodLogPage.js';
import { ProductService } from './services/ProductService.js';
import { ProductScannerPage } from './pages/ProductScannerPage.js';
import { Router } from './router/Router.js';

console.log('NutriPlan initialized.');

// Shared service instances
const mealService = new MealService(API_BASE_URL);
const foodLogService = new FoodLogService();
const productService = new ProductService(API_BASE_URL);

// Router instance
const router = new Router();

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
  router.navigate('/meal/' + mealId);
}

// When back button is clicked in MealDetailsPage
function handleBackToMeals() {
  router.navigate('/home');
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

      // Navigate via Router
      if (index === 0) router.navigate('/home');
      else if (index === 1) router.navigate('/scanner');
      else if (index === 2) router.navigate('/foodlog');
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
  window.productService = productService;
  window.router = router;
  window.showSection = showSection;

  // Hide the app loading overlay
  const appLoader = document.getElementById('app-loading-overlay');
  if (appLoader) {
    appLoader.classList.add('hidden');
    appLoader.style.display = 'none';
  }

  // Setup sidebar links
  setupNavigation();

  // Initialize HomePage
  homePage = new HomePage(mealService, handleMealSelect);
  homePage.init();
  window.homePage = homePage;

  // Initialize MealDetailsPage
  mealDetailsPage = new MealDetailsPage(mealService, handleBackToMeals, handleLogMeal);
  window.mealDetailsPage = mealDetailsPage;

  // Initialize ProductScannerPage
  productScannerPage = new ProductScannerPage(productService, handleLogProduct);
  productScannerPage.init();
  window.productScannerPage = productScannerPage;

  // Initialize FoodLogPage
  foodLogPage = new FoodLogPage(foodLogService, (targetSection) => {
    if (targetSection === 'home') {
      router.navigate('/home');
    } else if (targetSection === 'products' || targetSection === 'scanner') {
      router.navigate('/scanner');
    } else {
      router.navigate('/' + targetSection);
    }
  });
  foodLogPage.init();
  window.foodLogPage = foodLogPage;

  // Register application routes
  router.addRoute('/home', () => {
    showSection('home');
  });

  router.addRoute('/meal/:id', (params) => {
    showSection('meal-details');
    if (mealDetailsPage) {
      mealDetailsPage.loadMeal(params.id);
    }
  });

  router.addRoute('/foodlog', () => {
    showSection('foodlog');
  });

  router.addRoute('/scanner', () => {
    showSection('products');
  });

  // Start routing (matches initial URL & handles Back/Forward popstate)
  router.start();
}

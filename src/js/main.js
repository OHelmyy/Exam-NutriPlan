import { API_BASE_URL } from './config/apiConfig.js';
import { MealService } from './services/MealService.js';
import { HomePage } from './pages/HomePage.js';

console.log('NutriPlan initialized.');

// Shared service instance
const mealService = new MealService(API_BASE_URL);

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
            }
        }

        // Callback when a meal card is clicked
        function handleMealSelect(mealId) {
            console.log(`Meal selected with ID: ${mealId} (will display full details in Phase 5)`);
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
            window.showSection = showSection;

            // Show home section by default
            showSection('home');

            // Setup sidebar links
            setupNavigation();

            // Initialize HomePage
            const homePage = new HomePage(mealService, handleMealSelect);
            homePage.init();
            window.homePage = homePage;
        }

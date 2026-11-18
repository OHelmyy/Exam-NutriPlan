# NutriPlan — Nutrition & Recipe SPA

NutriPlan is a responsive vanilla JavaScript Single Page Application (SPA) designed to help users discover healthy recipes, search packaged food products with Nutri-Score analysis, and track their daily nutrition intake. Built using Object-Oriented Programming (OOP) and native ES modules.

---

## Features

- **Meals & Recipes:**
  - Browse 25 curated recipes with category carousel and area filter pills.
  - Live search input with debouncing and Grid/List view toggle.
  - Recipe details with ingredient checklists, step-by-step instructions, YouTube video embed, and USDA nutrition analysis.
  - One-click "Log This Meal" into the browser Food Log.

- **Product Scanner:**
  - Search packaged foods by name or barcode lookup.
  - Filter by Nutri-Score grade (A to E) and browse categories (Snacks, Beverages, Breakfast, Desserts, Dairy).
  - Detailed product modal with Nutri-Score rating, NOVA group badge, 100g nutrition facts breakdown, and ingredients list.
  - Direct logging of products into the Food Log.

- **Daily Food Log:**
  - 100% client-side persistence using browser `LocalStorage` (no backend calls).
  - Live daily macro progress bars (Calories, Protein, Carbs, Fat) measured against configurable daily targets.
  - Calorie target exceeded warning banner.
  - Interactive 7-day Weekly Overview calendar showing daily totals and today's summary.
  - Date picker to view or manage logs from any date, with single-item deletion and "Clear All" with confirmation.

- **Client-Side History Router:**
  - Built-in lightweight Router using native HTML5 History API (`pushState` and `popstate`).
  - Supports clean routes: `/home`, `/meal/:id`, `/foodlog`, and `/scanner`.
  - Browser Back and Forward navigation without full page reloads.
  - Automatic active sidebar navigation updates.

---

## Project Architecture

```text
src/
├── css/
│   ├── index.css
│   └── style.css
├── images/
│   └── favicon.png
├── js/
│   ├── config/
│   │   └── apiConfig.js
│   ├── models/
│   │   ├── Meal.js
│   │   ├── Product.js
│   │   └── FoodLogEntry.js
│   ├── services/
│   │   ├── ApiService.js
│   │   ├── MealService.js
│   │   ├── ProductService.js
│   │   └── FoodLogService.js
│   ├── pages/
│   │   ├── HomePage.js
│   │   ├── MealDetailsPage.js
│   │   ├── FoodLogPage.js
│   │   └── ProductScannerPage.js
│   ├── router/
│   │   └── Router.js
│   ├── ui/
│   │   └── components.js
│   └── main.js
├── index.html
└── README.md
```

---

## How to Run

1. Since the project uses native ES modules (`type="module"`), it must be served through a local HTTP server (not directly via `file:///` due to browser CORS policies).
2. Recommended methods:
   - **VS Code Live Server:** Right-click `index.html` and select **Open with Live Server**.
   - **Node.js:** Run `npx serve .` in the project root directory.

---

## What I Learned
- JavaScript ES6+ and Object-Oriented Programming (OOP).
- Classes, Objects, Constructors, Methods, and Encapsulation.
- Inheritance (`extends` and `super`) and Composition.
- JavaScript Modules (`import` and `export`).
- Asynchronous JavaScript using Promises and `async/await`.
- Handling asynchronous operations, errors, and loading states.
- DOM Manipulation and Event Handling.
- Array Methods (`map`, `filter`, and `reduce`).
- Client-side Routing using the History API.
- Browser LocalStorage for persistent data management.
- CRUD Operations for managing food log entries.
- Data Modeling and Separation of Concerns.
- Dynamic UI Rendering and Filtering.
- Managing nutritional data and calculating daily nutrition totals.
- Building a modular and maintainable JavaScript project architecture.

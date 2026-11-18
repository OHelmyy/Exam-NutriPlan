// Router class
// Handles client-side navigation using the HTML5 History API (pushState & popstate).
// Allows switching between views with unique URLs without reloading the page.

export class Router {
  constructor() {
    this.routes = [];
  }

  // Register a route pattern and its callback handler
  // Example patterns: '/home', '/meal/:id', '/foodlog', '/scanner'
  addRoute(pattern, handler) {
    const paramNames = [];
    const regexPath = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPath}$`);
    this.routes.push({ pattern, regex, paramNames, handler });
  }

  // Navigate to a new route and update browser history
  navigate(path, addToHistory = true) {
    if (addToHistory && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.handleCurrentUrl();
  }

    // Extract clean current path from pathname or hash
    getPath() {
      if (window.location.hash && window.location.hash.startsWith('#/')) {
        return window.location.hash.slice(1);
      }

      let path = window.location.pathname;

        if (path.endsWith('/index.html')) {
          path = path.replace(/\/index\.html$/, '');
        }

        if (path === '' || path === '/') {
          return '/home';
        }

        return path;
      }

      // Read current URL from the browser and run the matching route handler
      handleCurrentUrl() {
        let path = this.getPath();

        // Strip trailing slash if present
        if (path.length > 1 && path.endsWith('/')) {
          path = path.slice(0, -1);
        }

        let matched = false;

        for (const route of this.routes) {
          const match = path.match(route.regex);
          if (match) {
            matched = true;
            // Extract route parameters (like id from /meal/:id)
            const params = {};
            route.paramNames.forEach((name, index) => {
              params[name] = match[index + 1];
            });

            route.handler(params);
            this.updateActiveNav(path);
            break;
          }
        }

        // If no route matched, safely fallback to /home
        if (!matched) {
          this.navigate('/home', false);
        }
      }

      // Highlight the active link in the sidebar matching the route
      updateActiveNav(path) {
        const navLinks = document.querySelectorAll('#sidebar .nav-link');
        if (!navLinks || navLinks.length === 0) return;

        const defaultClass = 'nav-link flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-all';
        const activeClass = 'nav-link flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg transition-all font-semibold';

        navLinks.forEach(link => {
          link.className = defaultClass;
        });

        // 0: Meals (/home, /meal/:id)
        // 1: Product Scanner (/scanner)
        // 2: Food Log (/foodlog)
        if (path.startsWith('/scanner')) {
          if (navLinks[1]) navLinks[1].className = activeClass;
        } else if (path.startsWith('/foodlog')) {
          if (navLinks[2]) navLinks[2].className = activeClass;
        } else {
          if (navLinks[0]) navLinks[0].className = activeClass;
        }
      }

      // Start listening to Back/Forward buttons and handle initial page load
      start() {
        window.addEventListener('popstate', () => {
          this.handleCurrentUrl();
        });

        window.addEventListener('hashchange', () => {
          this.handleCurrentUrl();
        });

        this.handleCurrentUrl();
      }
    }

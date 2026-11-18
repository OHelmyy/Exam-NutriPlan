// ProductScannerPage
// Handles the Product Scanner section: search by name, barcode lookup,
// category buttons, Nutri-Score filter and choosing a quantity to log.

// Small helper so API text can never break our HTML
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Show a number with at most one decimal, or a dash when it is missing
function formatNumber(value) {
    if (value === null || value === undefined) return '–';
    return Math.round(value * 10) / 10;
}

export class ProductScannerPage {
    // The page receives what it needs from outside (composition):
    // the service to get products, and a function to call when a product is logged
    constructor(productService, onLogProduct) {
        this.productService = productService;
        this.onLogProduct = onLogProduct;

        this.currentProducts = []; // products from the last search
        this.selectedGrade = ''; // '' means "All"
    }

    // Find the elements and add the event listeners (called once)
    init() {
        this.searchInput = document.getElementById('product-search-input');
        this.searchButton = document.getElementById('search-product-btn');
        this.barcodeInput = document.getElementById('barcode-input');
        this.barcodeButton = document.getElementById('lookup-barcode-btn');
        this.grid = document.getElementById('products-grid');
        this.countText = document.getElementById('products-count');
        this.gradeButtons = document.querySelectorAll('.nutri-score-filter');
        this.categoryButtons = document.querySelectorAll('.product-category-btn');

        if (!this.grid) return;

        this.searchButton?.addEventListener('click', () => this.searchByName());
        this.searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.searchByName();
        });

        this.barcodeButton?.addEventListener('click', () => this.lookupBarcode());
        this.barcodeInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.lookupBarcode();
        });

        this.gradeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.selectedGrade = button.dataset.grade || '';
                this.updateGradeButtons();
                this.renderProducts();
            });
        });

        this.categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.loadCategory(button.textContent.trim());
            });
        });

        // One click listener on the grid handles every product card
        this.grid.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            const product = this.currentProducts.find(p => p.barcode === card.dataset.barcode);
            if (product) this.showProductModal(product);
        });

        this.updateGradeButtons();
        this.showMessage('fa-barcode', 'Search for a product', 'Type a name, enter a barcode, or pick a category.');
    }

    // ---------- Loading data ----------

    async searchByName() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showMessage('fa-search', 'Type a product name first', 'For example: Nutella, Cheerios, Coca-Cola.');
            return;
        }

        this.showLoading();
        try {
            this.currentProducts = await this.productService.searchProducts(query);
            this.renderProducts();
        } catch (error) {
            this.showError('Could not search products. Please try again.');
        }
    }

    async lookupBarcode() {
        const code = this.barcodeInput.value.trim();
        if (!code) {
            this.showMessage('fa-barcode', 'Enter a barcode first', 'For example: 3017620422003');
            return;
        }

        this.showLoading();
        try {
            const product = await this.productService.getProductByBarcode(code);
            this.currentProducts = product ? [product] : [];
            this.renderProducts();
        } catch (error) {
            // The API answers with an error status when the barcode does not exist
            if (error.message.includes('404')) {
                this.currentProducts = [];
                this.showMessage('fa-circle-question', 'Product not found', `No product matches barcode ${escapeHtml(code)}.`);
            } else {
                this.showError('Could not look up the barcode. Please try again.');
            }
        }
    }

    // Map category button label to API category ID
    getCategoryId(name) {
        const cleanName = name.toLowerCase().trim();
        const map = {
            'snacks': 'snacks',
            'beverages': 'beverages',
            'breakfast': 'breakfast-cereals',
            'desserts': 'desserts',
            'dairy': 'dairies'
        };
        return map[cleanName] || cleanName;
    }

    async loadCategory(category) {
        this.showLoading();
        try {
            const categoryId = this.getCategoryId(category);
            this.currentProducts = await this.productService.getProductsByCategory(categoryId);
            this.renderProducts();
        } catch (error) {
            this.showError('Could not load this category. Please try again.');
        }
    }

    // ---------- Showing data ----------

    // Highlight the selected Nutri-Score button
    updateGradeButtons() {
        this.gradeButtons.forEach(button => {
            const isActive = (button.dataset.grade || '') === this.selectedGrade;
            button.style.opacity = isActive ? '1' : '0.6';
            button.style.boxShadow = isActive ? '0 0 0 2px #059669' : 'none';
        });
    }

    // Draw the product cards (after applying the Nutri-Score filter)
    renderProducts() {
        let visible = this.currentProducts;
        if (this.selectedGrade) {
            visible = visible.filter(p => p.nutritionGrade === this.selectedGrade);
        }

        if (this.currentProducts.length === 0) {
            this.countText.textContent = 'No products found';
            this.showMessage('fa-box-open', 'No products found', 'Try a different name, barcode or category.');
            return;
        }

        if (visible.length === 0) {
            this.countText.textContent = `0 of ${this.currentProducts.length} products`;
            this.showMessage('fa-filter', 'No products with this Nutri-Score', 'Choose another grade or select All.');
            return;
        }

        this.countText.textContent = `Showing ${visible.length} of ${this.currentProducts.length} products`;
        this.grid.innerHTML = visible.map(product => this.createCard(product)).join('');
    }

    // Build the HTML for one product card (same classes as the existing design)
    createCard(product) {
        const nut = product.nutrients;

        const image = product.image
            ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
            : '<i class="fa-solid fa-image text-4xl text-gray-300"></i>';

        const gradeBadge = product.hasGrade()
            ? `<div class="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded uppercase" style="background:${product.getGradeColor()}">Nutri-Score ${product.nutritionGrade}</div>`
            : '';

        const novaBadge = product.novaGroup
            ? `<div class="absolute top-2 right-2 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" style="background:${product.getNovaColor()}" title="NOVA ${product.novaGroup}">${product.novaGroup}</div>`
            : '';

        const calories = product.hasNutrition()
            ? `${formatNumber(nut.calories)} kcal/100g`
            : 'Nutrition unavailable';

        return `
      <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${escapeHtml(product.barcode)}">
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          ${image}
          ${gradeBadge}
          ${novaBadge}
        </div>
        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(product.brand || 'Unknown brand')}</p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHtml(product.name)}</h3>
          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fa-solid fa-fire mr-1"></i>${calories}</span>
          </div>
          <div class="grid grid-cols-4 gap-1 text-center">
            <div class="bg-emerald-50 rounded p-1.5">
              <p class="text-xs font-bold text-emerald-700">${formatNumber(nut.protein)}g</p>
              <p class="text-[10px] text-gray-500">Protein</p>
            </div>
            <div class="bg-blue-50 rounded p-1.5">
              <p class="text-xs font-bold text-blue-700">${formatNumber(nut.carbs)}g</p>
              <p class="text-[10px] text-gray-500">Carbs</p>
            </div>
            <div class="bg-purple-50 rounded p-1.5">
              <p class="text-xs font-bold text-purple-700">${formatNumber(nut.fat)}g</p>
              <p class="text-[10px] text-gray-500">Fat</p>
            </div>
            <div class="bg-orange-50 rounded p-1.5">
              <p class="text-xs font-bold text-orange-700">${formatNumber(nut.sugar)}g</p>
              <p class="text-[10px] text-gray-500">Sugar</p>
            </div>
          </div>
        </div>
      </div>`;
    }

    // Loading state
    showLoading() {
        this.countText.textContent = 'Searching...';
        this.grid.innerHTML = `
      <div style="grid-column: 1 / -1" class="text-center py-12 text-gray-500">
        <i class="fa-solid fa-spinner fa-spin text-3xl mb-3 text-emerald-500"></i>
        <p class="font-medium">Loading products...</p>
      </div>`;
    }

    // Empty or info state (used for "no results" and the first screen)
    showMessage(icon, title, text) {
        this.grid.innerHTML = `
      <div style="grid-column: 1 / -1" class="text-center py-12 text-gray-500">
        <i class="fa-solid ${icon} text-4xl mb-3 text-gray-300"></i>
        <p class="font-medium">${title}</p>
        <p class="text-sm">${text}</p>
      </div>`;
    }

    // Error state
    showError(text) {
        this.countText.textContent = 'Something went wrong';
        this.grid.innerHTML = `
      <div style="grid-column: 1 / -1" class="text-center py-12 text-red-500">
        <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
        <p class="font-medium">${escapeHtml(text)}</p>
      </div>`;
    }

    // ---------- Product Detail Modal & Logging ----------

    // Open full detail modal when clicking a card
    async showProductModal(product) {
        if (!product) return;

        // Fetch extra fields if missing (ingredients, quantity, saturated fat, etc.)
        if (!product.ingredients || product.nutrients.saturatedFat === null) {
            await this.productService.getProductDetails(product);
        }

        const nut = product.nutrients;
        const gradeInfo = product.getNutriScoreInfo();
        const novaInfo = product.getNovaGroupInfo();

        // Remove any existing modal first
        const oldModal = document.getElementById('product-detail-modal');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.id = 'product-detail-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4';

        modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
        <!-- Header -->
        <div class="flex items-start gap-5 mb-6">
          <div class="w-28 h-28 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 p-2">
            ${product.image ? `
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-contain" />
            ` : `
              <i class="fa-solid fa-box text-gray-300 text-4xl"></i>
            `}
          </div>
          <div class="flex-1 min-w-0 pr-6">
            <p class="text-sm text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(product.brand || 'Unknown Brand')}</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-1 leading-snug">${escapeHtml(product.name)}</h2>
            <p class="text-xs text-gray-500 mb-3">${escapeHtml(product.quantity || '')}</p>
            
            <div class="flex items-center gap-2.5 flex-wrap">
              ${product.hasGrade() ? `
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background-color: ${gradeInfo.color}15">
                  <span class="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-xs uppercase" style="background-color: ${gradeInfo.color}">
                    ${escapeHtml(product.nutritionGrade)}
                  </span>
                  <div>
                    <p class="text-xs font-bold leading-tight" style="color: ${gradeInfo.color}">Nutri-Score</p>
                    <p class="text-[10px] text-gray-600 font-medium leading-tight">${escapeHtml(gradeInfo.label)}</p>
                  </div>
                </div>
              ` : ''}

              ${product.novaGroup ? `
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background-color: ${novaInfo.color}15">
                  <span class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style="background-color: ${novaInfo.color}">
                    ${escapeHtml(product.novaGroup)}
                  </span>
                  <div>
                    <p class="text-xs font-bold leading-tight" style="color: ${novaInfo.color}">NOVA</p>
                    <p class="text-[10px] text-gray-600 font-medium leading-tight">${escapeHtml(novaInfo.label)}</p>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          <button class="close-product-modal text-gray-400 hover:text-gray-600 transition-colors p-1" title="Close">
            <i class="fa-solid fa-times text-2xl"></i>
          </button>
        </div>

        <!-- Nutrition Facts (per 100g) -->
        <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 mb-5 border border-emerald-200">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="fa-solid fa-chart-pie text-emerald-600"></i>
            Nutrition Facts <span class="text-sm font-normal text-gray-500">(per 100g)</span>
          </h3>
          
          <div class="text-center mb-4 pb-4 border-b border-emerald-200">
            <p class="text-4xl font-bold text-gray-900">${formatNumber(nut.calories)}</p>
            <p class="text-sm text-gray-500">Calories</p>
          </div>
          
          <div class="grid grid-cols-4 gap-3">
            <!-- Protein -->
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                <div class="bg-emerald-500 h-2 rounded-full" style="width: ${Math.min(((nut.protein || 0) / 50) * 100, 100)}%"></div>
              </div>
              <p class="text-lg font-bold text-emerald-600">${formatNumber(nut.protein)}g</p>
              <p class="text-xs text-gray-500">Protein</p>
            </div>
            <!-- Carbs -->
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                <div class="bg-blue-500 h-2 rounded-full" style="width: ${Math.min(((nut.carbs || 0) / 100) * 100, 100)}%"></div>
              </div>
              <p class="text-lg font-bold text-blue-600">${formatNumber(nut.carbs)}g</p>
              <p class="text-xs text-gray-500">Carbs</p>
            </div>
            <!-- Fat -->
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                <div class="bg-purple-500 h-2 rounded-full" style="width: ${Math.min(((nut.fat || 0) / 65) * 100, 100)}%"></div>
              </div>
              <p class="text-lg font-bold text-purple-600">${formatNumber(nut.fat)}g</p>
              <p class="text-xs text-gray-500">Fat</p>
            </div>
            <!-- Sugar -->
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                <div class="bg-orange-500 h-2 rounded-full" style="width: ${Math.min(((nut.sugar || 0) / 50) * 100, 100)}%"></div>
              </div>
              <p class="text-lg font-bold text-orange-600">${formatNumber(nut.sugar)}g</p>
              <p class="text-xs text-gray-500">Sugar</p>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-200">
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">${formatNumber(nut.saturatedFat)}g</p>
              <p class="text-xs text-gray-500">Saturated Fat</p>
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">${formatNumber(nut.fiber)}g</p>
              <p class="text-xs text-gray-500">Fiber</p>
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">${formatNumber(nut.salt)}g</p>
              <p class="text-xs text-gray-500">Salt</p>
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        ${product.ingredients ? `
          <div class="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-100">
            <h3 class="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
              <i class="fa-solid fa-list text-gray-600"></i>
              Ingredients
            </h3>
            <p class="text-xs text-gray-600 leading-relaxed">${escapeHtml(product.ingredients)}</p>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex gap-3">
          <button class="add-product-to-log flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm">
            <i class="fa-solid fa-plus"></i>Log This Food
          </button>
          <button class="close-product-modal flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-center">
            Close
          </button>
        </div>
      </div>`;

        document.body.appendChild(modal);

        // Close handlers
        const closeModal = () => {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', handleEsc);

        modal.querySelectorAll('.close-product-modal').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Add to food log handler (logs standard 100g)
        const logBtn = modal.querySelector('.add-product-to-log');
        logBtn?.addEventListener('click', () => {
            if (!product.hasNutrition()) {
                this.showAlert('warning', 'No nutrition data', 'This product has no nutrition information, so it cannot be logged.');
                return;
            }

            this.onLogProduct(product, 100);
            closeModal();
        });
    }

    // Small alert helper
    showAlert(icon, title, text) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: icon, title: title, text: text, confirmButtonColor: '#10b981' });
        } else {
            alert(`${title}: ${text}`);
        }
    }
}

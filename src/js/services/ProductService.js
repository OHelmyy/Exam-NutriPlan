import { ApiService } from './ApiService.js';
import { Product } from '../models/Product.js';

// ProductService talks to the product endpoints of the API.
// It extends ApiService, so it can use this.get() without rewriting fetch code.
export class ProductService extends ApiService {
    constructor(baseUrl) {
        super(baseUrl);
    }

    // Search products by name (one page of results)
    async searchProducts(query, page = 1, limit = 24) {
        const endpoint = `/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        const data = await this.get(endpoint);
        const rawProducts = data.results || [];
        return rawProducts.map(raw => new Product(raw));
    }

    // Look up one product by its barcode. Returns null if nothing was found.
    async getProductByBarcode(code) {
        const endpoint = `/products/barcode/${encodeURIComponent(code)}`;
        const data = await this.get(endpoint);
        if (!data.result) {
            return null;
        }
        return new Product(data.result);
    }

    // Get products from one category (for example Snacks)
    async getProductsByCategory(category, page = 1, limit = 24) {
        const endpoint = `/products/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`;
        const data = await this.get(endpoint);
        const rawProducts = data.results || [];
        return rawProducts.map(raw => new Product(raw));
    }

    // Enhance product with extra details (ingredients, quantity, saturated fat)
    async getProductDetails(product) {
        if (!product || !product.barcode) return product;
        try {
            const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(product.barcode)}.json`);
            if (offRes.ok) {
                const offData = await offRes.json();
                if (offData && offData.status === 1 && offData.product) {
                    const p = offData.product;
                    const nut = p.nutriments || {};
                    if (!product.ingredients && (p.ingredients_text || p.ingredients_text_en)) {
                        product.ingredients = p.ingredients_text || p.ingredients_text_en;
                    }
                    if (!product.quantity && p.quantity) {
                        product.quantity = p.quantity;
                    }
                    if (!product.novaGroup && p.nova_group) {
                        product.novaGroup = p.nova_group;
                    }
                    if (product.nutrients.saturatedFat === null && nut['saturated-fat_100g'] !== undefined) {
                        product.nutrients.saturatedFat = Number(nut['saturated-fat_100g']);
                    }
                    if (product.nutrients.salt === null && nut.salt_100g !== undefined) {
                        product.nutrients.salt = Number(nut.salt_100g);
                    }
                }
            }
        } catch (error) {
            // If offline or blocked, silently use existing product data
        }
        return product;
    }
}

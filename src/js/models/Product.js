// Product model
// Turns the raw product data from the API into a clean object that is safe to use.
// All nutrition values from the API are per 100 grams.

// Small helper: turns a value into a number, or null when it is missing
function toNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    return isNaN(number) ? null : number;
}

export class Product {
    constructor(raw) {
        const data = raw || {};
        const nut = data.nutrients || {};

        this.barcode = data.barcode || data.code || '';
        this.name = data.name || data.product_name || 'Unnamed product';
        this.brand = data.brand || data.brands || '';
        this.image = data.image || data.image_front_url || data.image_url || '';
        this.quantity = data.quantity || data.netWeight || '';
        this.nutritionGrade = String(data.nutritionGrade || data.nutrition_grades || 'unknown').toLowerCase();
        this.novaGroup = data.novaGroup || data.nova_group || null;
        this.ingredients = data.ingredients || data.ingredients_text || '';
        this.allergens = data.allergens || '';

        // Nutrition per 100g. A missing value stays null instead of becoming 0.
        const sodium = toNumber(nut.sodium ?? nut.sodium_100g);
        const salt = toNumber(nut.salt ?? nut.salt_100g ?? (sodium !== null ? sodium * 2.5 : null));

        this.nutrients = {
            calories: toNumber(nut.calories ?? nut['energy-kcal_100g'] ?? nut.energy_100g),
            protein: toNumber(nut.protein ?? nut.protein_100g),
            carbs: toNumber(nut.carbs ?? nut.carbohydrates_100g),
            fat: toNumber(nut.fat ?? nut.fat_100g),
            sugar: toNumber(nut.sugar ?? nut.sugars_100g),
            fiber: toNumber(nut.fiber ?? nut.fiber_100g),
            sodium: sodium,
            saturatedFat: toNumber(nut.saturatedFat ?? nut['saturated-fat_100g']),
            salt: salt
        };
    }

    // Return badge color and label for Nutri-Score
    getNutriScoreInfo() {
        const grades = {
            a: { color: '#038141', label: 'Very Good' },
            b: { color: '#85bb2f', label: 'Good' },
            c: { color: '#fecb02', label: 'Average' },
            d: { color: '#ee8100', label: 'Poor' },
            e: { color: '#e63e11', label: 'Bad' }
        };
        return grades[this.nutritionGrade] || { color: '#9ca3af', label: 'Unknown' };
    }

    // Return badge color and label for NOVA group
    getNovaGroupInfo() {
        const groups = {
            1: { color: '#00aa00', label: 'Unprocessed' },
            2: { color: '#ffcc00', label: 'Processed culinary ingredients' },
            3: { color: '#ff6600', label: 'Processed' },
            4: { color: '#ff0000', label: 'Ultra-processed' }
        };
        return groups[this.novaGroup] || { color: '#9ca3af', label: 'Unknown' };
    }

    // True when the API gave us at least the calories value
    hasNutrition() {
        return this.nutrients.calories !== null;
    }

    // True when the Nutri-Score is a real grade (a to e), not "unknown"
    hasGrade() {
        return ['a', 'b', 'c', 'd', 'e'].includes(this.nutritionGrade);
    }

    // Badge background color for the Nutri-Score
    getGradeColor() {
        const colors = {
            a: '#22c55e',
            b: '#84cc16',
            c: '#eab308',
            d: '#f97316',
            e: '#ef4444'
        };
        return colors[this.nutritionGrade] || '#9ca3af';
    }

    // Badge background color for the NOVA group (1 to 4)
    getNovaColor() {
        const colors = {
            1: '#22c55e',
            2: '#84cc16',
            3: '#f97316',
            4: '#ef4444'
        };
        return colors[this.novaGroup] || '#9ca3af';
    }

    // Work out the nutrition for an amount in grams
    // Formula: value per 100g x grams / 100
    calculateForGrams(grams) {
        const factor = Number(grams) / 100;
        const result = {};
        const keys = ['calories', 'protein', 'carbs', 'fat'];

        keys.forEach(key => {
            const value = this.nutrients[key];
            result[key] = value === null ? 0 : Math.round(value * factor);
        });

        return result;
    }
}

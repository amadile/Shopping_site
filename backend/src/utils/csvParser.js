/**
 * CSV Parser Utility for Product Bulk Operations
 * Handles parsing, validation, and generation of CSV files for products
 */

/**
 * Parse CSV text to array of product objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of product objects
 */
export function parseProductCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one product');
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Required fields
    const requiredFields = ['name', 'price', 'category', 'stock'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Parse products
    const products = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = parseCSVLine(line);

        if (values.length !== headers.length) {
            errors.push(`Line ${i + 1}: Column count mismatch`);
            continue;
        }

        const product = {};
        headers.forEach((header, index) => {
            product[header] = values[index];
        });

        // Validate and transform product
        try {
            const validatedProduct = validateProduct(product, i + 1);
            products.push(validatedProduct);
        } catch (error) {
            errors.push(`Line ${i + 1}: ${error.message}`);
        }
    }

    return { products, errors };
}

/**
 * Parse a single CSV line, handling quoted values
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

/**
 * Validate and transform product data
 * @param {Object} product - Raw product object
 * @param {number} lineNumber - Line number for error reporting
 * @returns {Object} Validated product object
 */
function validateProduct(product, lineNumber) {
    const validated = {};

    // Name (required)
    if (!product.name || product.name.length < 3) {
        throw new Error('Product name must be at least 3 characters');
    }
    validated.name = product.name;

    // Description (optional)
    validated.description = product.description || '';

    // Price (required, must be positive number)
    const price = parseFloat(product.price);
    if (isNaN(price) || price <= 0) {
        throw new Error('Price must be a positive number');
    }
    validated.price = price;

    // Category (required)
    const validCategories = ['electronics', 'clothing', 'home', 'sports', 'books', 'toys', 'food', 'other'];
    if (!product.category || !validCategories.includes(product.category.toLowerCase())) {
        throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
    }
    validated.category = product.category.toLowerCase();

    // Stock (required, must be non-negative integer)
    const stock = parseInt(product.stock);
    if (isNaN(stock) || stock < 0) {
        throw new Error('Stock must be a non-negative integer');
    }
    validated.stock = stock;

    // SKU (optional)
    validated.sku = product.sku || '';

    // Images (optional, comma-separated URLs)
    if (product.images) {
        validated.images = product.images.split('|').map(url => url.trim()).filter(url => url);
    } else {
        validated.images = [];
    }

    // Default values
    validated.isActive = true;

    return validated;
}

/**
 * Generate CSV text from array of products
 * @param {Array} products - Array of product objects
 * @returns {string} CSV text
 */
export function generateProductCSV(products) {
    const headers = ['name', 'description', 'price', 'category', 'stock', 'sku', 'images', 'isActive'];

    let csv = headers.join(',') + '\n';

    products.forEach(product => {
        const row = headers.map(header => {
            let value = product[header] || '';

            // Handle images array
            if (header === 'images' && Array.isArray(value)) {
                value = value.join('|');
            }

            // Quote values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }

            return value;
        });

        csv += row.join(',') + '\n';
    });

    return csv;
}

/**
 * Create sample CSV template
 * @returns {string} Sample CSV text
 */
export function createSampleCSV() {
    return `name,description,price,category,stock,sku,images
"Sample Product 1","A great product description",29.99,electronics,100,SKU001,https://example.com/image1.jpg|https://example.com/image2.jpg
"Sample Product 2","Another product",49.99,clothing,50,SKU002,https://example.com/image3.jpg`;
}

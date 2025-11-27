import axios from 'axios';

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
let vendorToken = '';

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
    console.log(`\n${colors.cyan}━━━ Testing: ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

// Helper to make authenticated requests
async function apiCall(method, endpoint, data = null, token = vendorToken) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
}

// Test 1: Vendor Dashboard
async function testVendorDashboard() {
    logTest('Vendor Dashboard API');

    const result = await apiCall('GET', '/vendor/dashboard');

    if (result.success) {
        logSuccess(`Dashboard endpoint working (${result.status})`);
        console.log('Dashboard data structure:', JSON.stringify(result.data, null, 2));

        // Verify expected fields
        const dashboard = result.data.dashboard;
        if (dashboard) {
            const requiredFields = ['overview', 'products', 'recentOrders'];
            const missingFields = requiredFields.filter(f => !dashboard[f]);

            if (missingFields.length === 0) {
                logSuccess('All required fields present');
            } else {
                logWarning(`Missing fields: ${missingFields.join(', ')}`);
            }
        }
    } else {
        logError(`Dashboard failed: ${result.error.error || result.error} (${result.status})`);
    }

    return result;
}

// Test 2: Vendor Orders
async function testVendorOrders() {
    logTest('Vendor Orders API');

    const result = await apiCall('GET', '/vendor/orders');

    if (result.success) {
        logSuccess(`Orders endpoint working (${result.status})`);
        console.log(`Found ${result.data.orders?.length || 0} orders`);

        if (result.data.orders && result.data.orders.length > 0) {
            console.log('Sample order:', JSON.stringify(result.data.orders[0], null, 2));
        }

        // Test filtering
        const filteredResult = await apiCall('GET', '/vendor/orders?status=pending');
        if (filteredResult.success) {
            logSuccess('Order filtering works');
        }
    } else {
        logError(`Orders failed: ${result.error.error || result.error} (${result.status})`);
    }

    return result;
}

// Test 3: Vendor Products
async function testVendorProducts() {
    logTest('Vendor Products API');

    const result = await apiCall('GET', '/vendor/products');

    if (result.success) {
        logSuccess(`Products endpoint working (${result.status})`);
        console.log(`Found ${result.data.products?.length || 0} products`);

        if (result.data.products && result.data.products.length > 0) {
            const product = result.data.products[0];
            logSuccess(`Sample product: ${product.name} - ${product.price} UGX`);
        }
    } else {
        logError(`Products failed: ${result.error.error || result.error} (${result.status})`);
    }

    return result;
}

// Test 4: Vendor Earnings (may not exist yet)
async function testVendorEarnings() {
    logTest('Vendor Earnings API');

    const result = await apiCall('GET', '/vendor/earnings');

    if (result.success) {
        logSuccess(`Earnings endpoint working (${result.status})`);
        console.log('Earnings data:', JSON.stringify(result.data, null, 2));
    } else if (result.status === 404) {
        logWarning('Earnings endpoint not implemented yet (404)');
    } else {
        logError(`Earnings failed: ${result.error.error || result.error} (${result.status})`);
    }

    return result;
}

// Test 5: Vendor Payouts
async function testVendorPayouts() {
    logTest('Vendor Payouts API');

    // Test payout history
    const historyResult = await apiCall('GET', '/vendor/payouts');

    if (historyResult.success) {
        logSuccess(`Payout history endpoint working (${historyResult.status})`);
        console.log(`Found ${historyResult.data.payouts?.length || 0} payouts`);
    } else if (historyResult.status === 404) {
        logWarning('Payout history endpoint may have different path');
    } else {
        logError(`Payout history failed: ${historyResult.error.error || historyResult.error}`);
    }

    return historyResult;
}

// Test 6: Vendor Reviews
async function testVendorReviews() {
    logTest('Vendor Reviews API');

    // Try different possible endpoints
    let result = await apiCall('GET', '/vendor/reviews');

    if (!result.success && result.status === 404) {
        // Try alternative endpoint
        result = await apiCall('GET', '/reviews/vendor');
    }

    if (result.success) {
        logSuccess(`Reviews endpoint working (${result.status})`);
        console.log(`Found ${result.data.reviews?.length || result.data.length || 0} reviews`);
    } else {
        logWarning('Reviews endpoint not found or not implemented');
    }

    return result;
}

// Main test runner
async function runTests() {
    log('\n╔════════════════════════════════════════════╗', 'blue');
    log('║   Vendor Backend API Verification Tests   ║', 'blue');
    log('╚════════════════════════════════════════════╝', 'blue');

    vendorToken = process.env.VENDOR_TOKEN;

    if (!vendorToken) {
        logError('No vendor token provided!');
        log('\n📋 Steps to run tests:');
        log('1. Get a vendor token: node get-vendor-token.js <email> <password>');
        log('2. Run tests with token: set VENDOR_TOKEN=<token> && node test-vendor-apis.js');
        process.exit(1);
    }

    // Run all tests
    const results = {
        dashboard: await testVendorDashboard(),
        orders: await testVendorOrders(),
        products: await testVendorProducts(),
        earnings: await testVendorEarnings(),
        payouts: await testVendorPayouts(),
        reviews: await testVendorReviews()
    };

    // Summary
    log('\n╔════════════════════════════════════════════╗', 'blue');
    log('║            Test Summary                    ║', 'blue');
    log('╚════════════════════════════════════════════╝', 'blue');

    const passed = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;

    log(`\nPassed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

    Object.entries(results).forEach(([name, result]) => {
        const status = result.success ? '✓' : '✗';
        const color = result.success ? 'green' : 'red';
        log(`${status} ${name.padEnd(15)} - ${result.status || 'N/A'}`, color);
    });

    console.log('\n');
}

runTests().catch(console.error);

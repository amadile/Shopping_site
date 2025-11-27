/**
 * Cash on Delivery (COD) Integration Test Script
 * Tests COD payment flow
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_USER_EMAIL = 'codtest@example.com';
const TEST_USER_PASSWORD = 'TestPass123!';

let authToken = null;
let testOrderId = null;

console.log('🧪 Cash on Delivery (COD) Test Suite\n');
console.log('='.repeat(60));

/**
 * Test 1: User Authentication
 */
async function testAuthentication() {
    console.log('\n📝 TEST 1: User Authentication');
    console.log('-'.repeat(60));

    try {
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER_EMAIL,
                password: TEST_USER_PASSWORD,
            }),
        });

        if (loginResponse.ok) {
            const data = await loginResponse.json();
            authToken = data.token;
            console.log('✅ Login successful');
            return true;
        }

        console.log('   Login failed, attempting registration...');
        const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'COD Test User',
                email: TEST_USER_EMAIL,
                password: TEST_USER_PASSWORD,
            }),
        });

        if (registerResponse.ok) {
            console.log('✅ Registration successful, logging in...');
            return testAuthentication();
        }

        throw new Error('Authentication failed');
    } catch (error) {
        console.log('❌ Authentication failed:', error.message);
        return false;
    }
}

/**
 * Test 2: Place COD Order
 */
async function testPlaceCODOrder() {
    console.log('\n📝 TEST 2: Place COD Order');
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${BASE_URL}/api/payment/cod/place-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                items: [
                    {
                        product: '507f1f77bcf86cd799439011',
                        quantity: 2,
                        price: 25000,
                    },
                    {
                        product: '507f1f77bcf86cd799439012',
                        quantity: 1,
                        price: 50000,
                    },
                ],
                shippingAddress: {
                    fullName: 'John Doe',
                    phone: '+256777123456',
                    district: 'Kampala',
                    zone: 'Nakawa',
                    landmark: 'Near City Square Mall',
                    addressLine1: 'Plot 123, Kampala Road',
                },
                notes: 'Please call before delivery',
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            testOrderId = data.order.id;
            console.log('✅ COD order placed successfully');
            console.log(`   Order ID: ${testOrderId}`);
            console.log(`   Order Number: ${data.order.orderNumber}`);
            console.log(`   Total: ${data.order.total} ${data.order.currency}`);
            console.log(`   Payment Method: ${data.order.paymentMethod}`);
            console.log(`   Status: ${data.order.status}`);
            console.log(`   Items: ${data.order.items}`);
            console.log(`   Estimated Delivery: ${new Date(data.order.estimatedDelivery).toLocaleDateString()}`);
            return true;
        } else {
            console.log('❌ COD order placement failed');
            console.log(`   Error: ${data.error || data.message}`);
            return false;
        }
    } catch (error) {
        console.log('❌ COD order placement error:', error.message);
        return false;
    }
}

/**
 * Test 3: Confirm COD Payment
 */
async function testConfirmCODPayment() {
    console.log('\n📝 TEST 3: Confirm COD Payment');
    console.log('-'.repeat(60));

    if (!testOrderId) {
        console.log('⚠️  Skipping - No order ID available');
        return false;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/payment/cod/confirm/${testOrderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                amountReceived: 100000,
                notes: 'Payment received in full',
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ COD payment confirmed successfully');
            console.log(`   Order ID: ${data.order.id}`);
            console.log(`   Status: ${data.order.status}`);
            console.log(`   Amount Received: ${data.order.amountReceived} UGX`);
            console.log(`   Expected Amount: ${data.order.total} UGX`);
            return true;
        } else {
            console.log('❌ COD payment confirmation failed');
            console.log(`   Error: ${data.error || data.message}`);
            return false;
        }
    } catch (error) {
        console.log('❌ COD payment confirmation error:', error.message);
        return false;
    }
}

/**
 * Test 4: Cancel COD Order
 */
async function testCancelCODOrder() {
    console.log('\n📝 TEST 4: Cancel COD Order');
    console.log('-'.repeat(60));

    try {
        // Place a new order to cancel
        const placeResponse = await fetch(`${BASE_URL}/api/payment/cod/place-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                items: [
                    {
                        product: '507f1f77bcf86cd799439013',
                        quantity: 1,
                        price: 15000,
                    },
                ],
                shippingAddress: {
                    fullName: 'Jane Doe',
                    phone: '+256750123456',
                    district: 'Wakiso',
                    landmark: 'Near Entebbe Road',
                },
            }),
        });

        const placeData = await placeResponse.json();
        if (!placeData.success) {
            console.log('⚠️  Could not create order to cancel');
            return false;
        }

        const orderToCancel = placeData.order.id;

        // Now cancel it
        const cancelResponse = await fetch(`${BASE_URL}/api/payment/cod/cancel/${orderToCancel}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                reason: 'Changed my mind',
            }),
        });

        const cancelData = await cancelResponse.json();

        if (cancelResponse.ok && cancelData.success) {
            console.log('✅ COD order cancelled successfully');
            console.log(`   Order ID: ${cancelData.order.id}`);
            console.log(`   Status: ${cancelData.order.status}`);
            console.log(`   Reason: ${cancelData.order.cancellationReason}`);
            return true;
        } else {
            console.log('❌ COD order cancellation failed');
            console.log(`   Error: ${cancelData.error || cancelData.message}`);
            return false;
        }
    } catch (error) {
        console.log('❌ COD order cancellation error:', error.message);
        return false;
    }
}

/**
 * Test 5: Validation Tests
 */
async function testValidation() {
    console.log('\n📝 TEST 5: Validation Tests');
    console.log('-'.repeat(60));

    let passedTests = 0;
    const totalTests = 3;

    // Test 1: Missing shipping address
    try {
        const response = await fetch(`${BASE_URL}/api/payment/cod/place-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                items: [{ product: '123', quantity: 1, price: 1000 }],
            }),
        });

        if (!response.ok) {
            console.log('✅ Correctly rejected: Missing shipping address');
            passedTests++;
        }
    } catch (error) {
        console.log('⚠️  Error testing missing address');
    }

    // Test 2: Empty items array
    try {
        const response = await fetch(`${BASE_URL}/api/payment/cod/place-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                items: [],
                shippingAddress: { fullName: 'Test', phone: '123', district: 'Kampala' },
            }),
        });

        if (!response.ok) {
            console.log('✅ Correctly rejected: Empty items array');
            passedTests++;
        }
    } catch (error) {
        console.log('⚠️  Error testing empty items');
    }

    // Test 3: Invalid amount in confirmation
    if (testOrderId) {
        try {
            const response = await fetch(`${BASE_URL}/api/payment/cod/confirm/${testOrderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    amountReceived: -1000,
                }),
            });

            if (!response.ok) {
                console.log('✅ Correctly rejected: Negative amount');
                passedTests++;
            }
        } catch (error) {
            console.log('⚠️  Error testing negative amount');
        }
    }

    console.log(`\n   Validation tests passed: ${passedTests}/${totalTests}`);
    return passedTests === totalTests;
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('\n🚀 Starting COD Integration Tests...\n');

    const results = {
        authentication: await testAuthentication(),
        placeOrder: false,
        confirmPayment: false,
        cancelOrder: false,
        validation: false,
    };

    if (results.authentication) {
        results.placeOrder = await testPlaceCODOrder();
        results.confirmPayment = await testConfirmCODPayment();
        results.cancelOrder = await testCancelCODOrder();
        results.validation = await testValidation();
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const tests = Object.entries(results);
    const passed = tests.filter(([_, result]) => result).length;
    const total = tests.length;

    tests.forEach(([name, result]) => {
        const icon = result ? '✅' : '❌';
        const status = result ? 'PASSED' : 'FAILED';
        console.log(`${icon} ${name.padEnd(20)} ${status}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log('='.repeat(60));

    console.log('\n✨ COD test suite completed!\n');
}

// Run tests
runTests().catch(console.error);

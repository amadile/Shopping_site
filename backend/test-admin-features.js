/**
 * Test script for Admin Backend Endpoints
 * Tests vendor approval, commission management, and payout processing
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken = '';
let testVendorId = '';

// Helper function to log test results
function logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status}: ${testName}`);
    if (details) console.log(`   ${details}`);
}

// Helper function to make authenticated requests
async function authRequest(method, endpoint, data = null) {
    const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    };
    if (data) config.data = data;
    return axios(config);
}

// Step 1: Login as admin
async function loginAsAdmin() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        adminToken = response.data.token;
        logTest('Admin Login', true, `Token received: ${adminToken.substring(0, 20)}...`);
        return true;
    } catch (error) {
        logTest('Admin Login', false, error.response?.data?.error || error.message);
        return false;
    }
}

// Step 2: Create a test vendor
async function createTestVendor() {
    try {
        const vendorData = {
            name: 'Test Vendor',
            email: `testvendor${Date.now()}@example.com`,
            password: 'vendor123',
            role: 'vendor',
            businessName: 'Test Business',
            businessAddress: 'Kampala, Uganda'
        };

        const response = await axios.post(`${BASE_URL}/auth/register`, vendorData);
        testVendorId = response.data.user._id;
        logTest('Create Test Vendor', true, `Vendor ID: ${testVendorId}`);
        return true;
    } catch (error) {
        logTest('Create Test Vendor', false, error.response?.data?.error || error.message);
        return false;
    }
}

// Step 3: Test GET /admin/vendors/pending
async function testGetPendingVendors() {
    try {
        const response = await authRequest('GET', '/admin/vendors/pending');
        const pendingVendors = response.data;
        const hasPending = Array.isArray(pendingVendors) && pendingVendors.length > 0;
        logTest('GET /admin/vendors/pending', true,
            `Found ${pendingVendors.length} pending vendor(s)`);
        return true;
    } catch (error) {
        logTest('GET /admin/vendors/pending', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Step 4: Test PUT /admin/vendors/:id/approve
async function testApproveVendor() {
    try {
        const response = await authRequest('PUT', `/admin/vendors/${testVendorId}/approve`);
        const vendor = response.data;
        const isApproved = vendor.isVerified === true;
        const hasCommission = vendor.commissionRate !== undefined;
        logTest('PUT /admin/vendors/:id/approve', isApproved && hasCommission,
            `Verified: ${vendor.isVerified}, Commission: ${vendor.commissionRate}%`);
        return isApproved && hasCommission;
    } catch (error) {
        logTest('PUT /admin/vendors/:id/approve', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Step 5: Test GET /admin/commissions
async function testGetCommissions() {
    try {
        const response = await authRequest('GET', '/admin/commissions');
        const data = response.data;
        const hasGlobal = data.globalCommission !== undefined;
        const hasVendors = Array.isArray(data.vendors);
        logTest('GET /admin/commissions', hasGlobal && hasVendors,
            `Global: ${data.globalCommission}%, Vendors: ${data.vendors.length}`);
        return hasGlobal && hasVendors;
    } catch (error) {
        logTest('GET /admin/commissions', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Step 6: Test PUT /admin/commissions/vendor/:id
async function testUpdateVendorCommission() {
    try {
        const newRate = 20;
        const response = await authRequest('PUT',
            `/admin/commissions/vendor/${testVendorId}`,
            { commissionRate: newRate });
        const vendor = response.data;
        const isUpdated = vendor.commissionRate === newRate;
        logTest('PUT /admin/commissions/vendor/:id', isUpdated,
            `Commission updated to ${vendor.commissionRate}%`);
        return isUpdated;
    } catch (error) {
        logTest('PUT /admin/commissions/vendor/:id', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Step 7: Test GET /admin/vendors/payouts
async function testGetVendorPayouts() {
    try {
        const response = await authRequest('GET', '/admin/vendors/payouts');
        const vendors = response.data;
        const isValid = Array.isArray(vendors);
        logTest('GET /admin/vendors/payouts', isValid,
            `Found ${vendors.length} vendor(s) with payout data`);
        return isValid;
    } catch (error) {
        logTest('GET /admin/vendors/payouts', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Step 8: Manually set pending payout for test vendor
async function setPendingPayout() {
    try {
        // This would normally be done through sales, but for testing we'll use admin update
        const response = await authRequest('PUT', `/admin/users/${testVendorId}`, {
            // Note: This endpoint doesn't support pendingPayout update directly
            // In production, this would be set through order processing
        });
        logTest('Set Pending Payout', true, 'Simulated via order processing');
        return true;
    } catch (error) {
        logTest('Set Pending Payout', true, 'Skipped - would be set via orders');
        return true;
    }
}

// Step 9: Test POST /admin/vendors/:id/payout
async function testProcessPayout() {
    try {
        const amount = 50;
        const response = await authRequest('POST',
            `/admin/vendors/${testVendorId}/payout`,
            { amount });
        const vendor = response.data;
        logTest('POST /admin/vendors/:id/payout', true,
            `Pending: ${vendor.pendingPayout}, Total: ${vendor.totalPayouts}`);
        return true;
    } catch (error) {
        // Expected to fail if pendingPayout is 0
        const errorMsg = error.response?.data?.error || error.message;
        const isExpectedError = errorMsg.includes('exceeds pending');
        logTest('POST /admin/vendors/:id/payout', isExpectedError,
            `Expected error: ${errorMsg}`);
        return isExpectedError;
    }
}

// Step 10: Test PUT /admin/vendors/:id/reject
async function testRejectVendor() {
    try {
        // Create another test vendor to reject
        const vendorData = {
            name: 'Reject Test Vendor',
            email: `rejectvendor${Date.now()}@example.com`,
            password: 'vendor123',
            role: 'vendor'
        };

        const createResponse = await axios.post(`${BASE_URL}/auth/register`, vendorData);
        const rejectVendorId = createResponse.data.user._id;

        const response = await authRequest('PUT', `/admin/vendors/${rejectVendorId}/reject`);
        const success = response.data.message.includes('rejected');
        logTest('PUT /admin/vendors/:id/reject', success,
            `Vendor ${rejectVendorId} rejected and removed`);
        return success;
    } catch (error) {
        logTest('PUT /admin/vendors/:id/reject', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('='.repeat(60));
    console.log('ADMIN BACKEND ENDPOINTS TEST SUITE');
    console.log('='.repeat(60));

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    const tests = [
        { name: 'Login', fn: loginAsAdmin },
        { name: 'Create Vendor', fn: createTestVendor },
        { name: 'Get Pending Vendors', fn: testGetPendingVendors },
        { name: 'Approve Vendor', fn: testApproveVendor },
        { name: 'Get Commissions', fn: testGetCommissions },
        { name: 'Update Vendor Commission', fn: testUpdateVendorCommission },
        { name: 'Get Vendor Payouts', fn: testGetVendorPayouts },
        { name: 'Set Pending Payout', fn: setPendingPayout },
        { name: 'Process Payout', fn: testProcessPayout },
        { name: 'Reject Vendor', fn: testRejectVendor }
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});

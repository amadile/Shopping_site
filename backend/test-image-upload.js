/**
 * Comprehensive Test Script for Vendor Product Image Upload
 * Tests all aspects of the image upload functionality
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const VENDOR_EMAIL = 'testvendor@example.com';
const VENDOR_PASSWORD = 'vendor123';

let vendorToken = '';
let productId = '';
let uploadedImageUrls = [];

// Test utilities
function logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status}: ${testName}`);
    if (details) console.log(`   ${details}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
}

// Helper to make authenticated requests
async function authRequest(method, endpoint, data = null, headers = {}) {
    const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
            'Authorization': `Bearer ${vendorToken}`,
            ...headers
        }
    };
    if (data) config.data = data;
    return axios(config);
}

// Test 1: Login as vendor
async function loginAsVendor() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: VENDOR_EMAIL,
            password: VENDOR_PASSWORD
        });
        vendorToken = response.data.token;
        logTest('Vendor Login', true, `Token: ${vendorToken.substring(0, 20)}...`);
        return true;
    } catch (error) {
        // Try to register if login fails
        try {
            const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
                name: 'Test Vendor',
                email: VENDOR_EMAIL,
                password: VENDOR_PASSWORD,
                role: 'vendor',
                businessName: 'Test Business'
            });
            vendorToken = registerResponse.data.token;
            logTest('Vendor Registration & Login', true, 'New vendor created');
            return true;
        } catch (regError) {
            logTest('Vendor Login/Registration', false, error.message);
            return false;
        }
    }
}

// Test 2: Create test image file
async function createTestImage() {
    try {
        const testImagePath = path.join(__dirname, 'test-product-image.jpg');

        // Create a simple test image (1x1 pixel) if it doesn't exist
        if (!fs.existsSync(testImagePath)) {
            // Base64 of a 1x1 red pixel JPEG
            const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';
            const buffer = Buffer.from(base64Image, 'base64');
            fs.writeFileSync(testImagePath, buffer);
        }

        logTest('Create Test Image', true, `Image created at: ${testImagePath}`);
        return testImagePath;
    } catch (error) {
        logTest('Create Test Image', false, error.message);
        return null;
    }
}

// Test 3: Upload single image (standalone)
async function testSingleImageUpload(imagePath) {
    try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));

        const response = await authRequest('POST', '/api/upload/image', formData, {
            ...formData.getHeaders()
        });

        const imageUrl = response.data.imageUrl;
        uploadedImageUrls.push(imageUrl);

        logTest('Single Image Upload', true,
            `URL: ${imageUrl}, CDN: ${response.data.cdn}`);
        return imageUrl;
    } catch (error) {
        logTest('Single Image Upload', false,
            error.response?.data?.error || error.message);
        return null;
    }
}

// Test 4: Upload multiple images (standalone)
async function testMultipleImageUpload(imagePath) {
    try {
        const formData = new FormData();
        // Upload the same image 3 times for testing
        for (let i = 0; i < 3; i++) {
            formData.append('images', fs.createReadStream(imagePath));
        }

        const response = await authRequest('POST', '/api/upload/images', formData, {
            ...formData.getHeaders()
        });

        const images = response.data.images;
        images.forEach(img => uploadedImageUrls.push(img.url));

        logTest('Multiple Images Upload', true,
            `Uploaded ${images.length} images, CDN: ${response.data.cdn}`);
        return images.map(img => img.url);
    } catch (error) {
        logTest('Multiple Images Upload', false,
            error.response?.data?.error || error.message);
        return [];
    }
}

// Test 5: Create product with images
async function testCreateProductWithImages(imageUrls) {
    try {
        const productData = {
            name: 'Test Product with Images',
            description: 'This is a test product with uploaded images',
            category: 'electronics',
            brand: 'Test Brand',
            price: 50000,
            stock: 10,
            images: imageUrls,
            featured: false,
            freeShipping: true
        };

        const response = await authRequest('POST', '/api/vendor/product', productData);
        productId = response.data._id || response.data.product?._id;

        logTest('Create Product with Images', true,
            `Product ID: ${productId}, Images: ${imageUrls.length}`);
        return true;
    } catch (error) {
        logTest('Create Product with Images', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Test 6: Verify product has images
async function testVerifyProductImages() {
    try {
        const response = await authRequest('GET', `/api/products/${productId}`);
        const product = response.data;

        const hasImages = product.images && product.images.length > 0;
        logTest('Verify Product Images', hasImages,
            `Product has ${product.images?.length || 0} images`);
        return hasImages;
    } catch (error) {
        logTest('Verify Product Images', false,
            error.response?.data?.error || error.message);
        return false;
    }
}

// Test 7: Test file size validation
async function testFileSizeValidation() {
    try {
        // Create a large file (>5MB) for testing
        const largePath = path.join(__dirname, 'test-large-image.jpg');
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
        fs.writeFileSync(largePath, largeBuffer);

        const formData = new FormData();
        formData.append('image', fs.createReadStream(largePath));

        try {
            await authRequest('POST', '/api/upload/image', formData, {
                ...formData.getHeaders()
            });
            // Should not reach here
            fs.unlinkSync(largePath);
            logTest('File Size Validation', false, 'Large file was accepted (should reject)');
            return false;
        } catch (error) {
            fs.unlinkSync(largePath);
            const isCorrectError = error.response?.status === 400 ||
                error.message.includes('File too large');
            logTest('File Size Validation', isCorrectError,
                'Correctly rejected file >5MB');
            return isCorrectError;
        }
    } catch (error) {
        logTest('File Size Validation', false, error.message);
        return false;
    }
}

// Test 8: Test file type validation
async function testFileTypeValidation() {
    try {
        // Create a text file
        const textPath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(textPath, 'This is not an image');

        const formData = new FormData();
        formData.append('image', fs.createReadStream(textPath), {
            filename: 'test.txt',
            contentType: 'text/plain'
        });

        try {
            await authRequest('POST', '/api/upload/image', formData, {
                ...formData.getHeaders()
            });
            // Should not reach here
            fs.unlinkSync(textPath);
            logTest('File Type Validation', false, 'Non-image file was accepted (should reject)');
            return false;
        } catch (error) {
            fs.unlinkSync(textPath);
            const isCorrectError = error.response?.status === 400 ||
                error.message.includes('Only image files');
            logTest('File Type Validation', isCorrectError,
                'Correctly rejected non-image file');
            return isCorrectError;
        }
    } catch (error) {
        logTest('File Type Validation', false, error.message);
        return false;
    }
}

// Test 9: Test unauthorized upload
async function testUnauthorizedUpload(imagePath) {
    try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));

        // Make request without token
        try {
            await axios.post(`${BASE_URL}/api/upload/image`, formData, {
                headers: formData.getHeaders()
            });
            logTest('Unauthorized Upload Prevention', false,
                'Upload succeeded without authentication (should fail)');
            return false;
        } catch (error) {
            const isCorrectError = error.response?.status === 401;
            logTest('Unauthorized Upload Prevention', isCorrectError,
                'Correctly rejected unauthorized upload');
            return isCorrectError;
        }
    } catch (error) {
        logTest('Unauthorized Upload Prevention', false, error.message);
        return false;
    }
}

// Test 10: Clean up test data
async function cleanupTestData() {
    try {
        // Delete test product if created
        if (productId) {
            try {
                await authRequest('DELETE', `/api/vendor/product/${productId}`);
            } catch (e) {
                // Product might not exist, that's okay
            }
        }

        // Delete test image file
        const testImagePath = path.join(__dirname, 'test-product-image.jpg');
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }

        logTest('Cleanup Test Data', true, 'Test data cleaned up');
        return true;
    } catch (error) {
        logTest('Cleanup Test Data', false, error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    logSection('VENDOR PRODUCT IMAGE UPLOAD TEST SUITE');

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    const tests = [
        { name: 'Login', fn: loginAsVendor },
        { name: 'Create Test Image', fn: createTestImage },
        {
            name: 'Single Image Upload', fn: async () => {
                const imagePath = await createTestImage();
                return await testSingleImageUpload(imagePath);
            }
        },
        {
            name: 'Multiple Images Upload', fn: async () => {
                const imagePath = await createTestImage();
                return await testMultipleImageUpload(imagePath);
            }
        },
        {
            name: 'Create Product with Images', fn: async () => {
                return await testCreateProductWithImages(uploadedImageUrls.slice(0, 3));
            }
        },
        { name: 'Verify Product Images', fn: testVerifyProductImages },
        { name: 'File Size Validation', fn: testFileSizeValidation },
        { name: 'File Type Validation', fn: testFileTypeValidation },
        {
            name: 'Unauthorized Upload Prevention', fn: async () => {
                const imagePath = await createTestImage();
                return await testUnauthorizedUpload(imagePath);
            }
        },
        { name: 'Cleanup', fn: cleanupTestData }
    ];

    for (const test of tests) {
        results.total++;
        try {
            const passed = await test.fn();
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
            }
        } catch (error) {
            console.error(`Test "${test.name}" threw error:`, error.message);
            results.failed++;
        }
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    logSection('TEST RESULTS');
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Image upload is working 100%\n');
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the errors above.\n`);
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});

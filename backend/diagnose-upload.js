/**
 * Simple image upload test - Direct API test
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';

async function testUploadEndpoint() {
    console.log('='.repeat(60));
    console.log('IMAGE UPLOAD DIAGNOSTIC TEST');
    console.log('='.repeat(60));

    // Step 1: Check if backend is running
    console.log('\n1. Checking if backend is running...');
    try {
        const response = await axios.get(BASE_URL);
        console.log('✅ Backend is running:', response.data);
    } catch (error) {
        console.log('❌ Backend is NOT running!');
        console.log('   Please start backend: cd backend && npm run dev');
        process.exit(1);
    }

    // Step 2: Create a test image
    console.log('\n2. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-upload.jpg');
    const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';
    fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));
    console.log('✅ Test image created:', testImagePath);

    // Step 3: Test upload WITHOUT authentication (should fail with 401)
    console.log('\n3. Testing upload WITHOUT authentication...');
    try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath));

        await axios.post(`${BASE_URL}/api/upload/image`, formData, {
            headers: formData.getHeaders()
        });
        console.log('❌ UNEXPECTED: Upload succeeded without auth (should fail)');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Correctly rejected: 401 Unauthorized');
        } else {
            console.log('❌ Unexpected error:', error.response?.status, error.response?.data || error.message);
        }
    }

    // Step 4: Register a test vendor
    console.log('\n4. Registering test vendor...');
    let token = '';
    const vendorEmail = `testvendor${Date.now()}@test.com`;
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            name: 'Test Vendor',
            email: vendorEmail,
            password: 'test123',
            role: 'vendor',
            businessName: 'Test Shop'
        });
        token = response.data.token;
        console.log('✅ Vendor registered, token received');
    } catch (error) {
        console.log('❌ Registration failed:', error.response?.data || error.message);
        console.log('   Trying to login instead...');

        // Try login
        try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'vendor@test.com',
                password: 'vendor123'
            });
            token = loginResponse.data.token;
            console.log('✅ Logged in with existing vendor');
        } catch (loginError) {
            console.log('❌ Login also failed:', loginError.response?.data || loginError.message);
            process.exit(1);
        }
    }

    // Step 5: Test upload WITH authentication
    console.log('\n5. Testing upload WITH authentication...');
    try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath));

        const response = await axios.post(`${BASE_URL}/api/upload/image`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Upload successful!');
        console.log('   Image URL:', response.data.imageUrl);
        console.log('   CDN:', response.data.cdn);
        console.log('   Message:', response.data.message);
    } catch (error) {
        console.log('❌ Upload failed!');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.response?.data || error.message);
        console.log('   Full response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Step 6: Check uploads directory
    console.log('\n6. Checking uploads directory...');
    try {
        const uploadsPath = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsPath)) {
            const files = fs.readdirSync(uploadsPath);
            console.log(`✅ Uploads directory exists with ${files.length} file(s)`);
            if (files.length > 0) {
                console.log('   Recent files:', files.slice(-3));
            }
        } else {
            console.log('❌ Uploads directory does NOT exist!');
            console.log('   Creating it now...');
            fs.mkdirSync(uploadsPath, { recursive: true });
            console.log('✅ Uploads directory created');
        }
    } catch (error) {
        console.log('❌ Error checking uploads:', error.message);
    }

    // Cleanup
    try {
        fs.unlinkSync(testImagePath);
    } catch (e) { }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSTIC TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nIf upload succeeded, the feature is working!');
    console.log('If it failed, check the error messages above.\n');
}

testUploadEndpoint().catch(error => {
    console.error('Test error:', error);
    process.exit(1);
});

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function loginVendor(email, password) {
    try {
        const response = await axios.post(`${BASE_URL}/vendor/login`, {
            email,
            password
        });

        if (response.data.token) {
            console.log('\n✓ Vendor login successful!');
            console.log('\nVendor Token:');
            console.log(response.data.token);
            console.log('\nVendor Info:');
            console.log(JSON.stringify(response.data.user, null, 2));
            console.log('\n📋 To run API tests, use:');
            console.log(`set VENDOR_TOKEN=${response.data.token} && node test-vendor-apis.js`);
            console.log('\nOr on Unix/Mac:');
            console.log(`VENDOR_TOKEN="${response.data.token}" node test-vendor-apis.js`);
            return response.data.token;
        }
    } catch (error) {
        console.error('✗ Login failed:', error.response?.data || error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (!error.response) {
            console.error('Could not connect to server. Make sure the backend is running on http://localhost:5000');
        }
        return null;
    }
}

// Check if credentials provided
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log('Usage: node get-vendor-token.js <email> <password>');
    console.log('Example: node get-vendor-token.js vendor@example.com password123');
    process.exit(1);
}

loginVendor(email, password);

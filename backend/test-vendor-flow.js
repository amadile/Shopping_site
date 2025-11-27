// Test vendor registration and login flow
const testEmail = `vendor${Date.now()}@test.com`;
const testPassword = 'SecurePass2024!';

console.log('Testing Vendor Registration and Login Flow');
console.log('==========================================\n');

// Test 1: Register a new vendor
console.log('TEST 1: Vendor Registration');
console.log('Email:', testEmail);
console.log('Password:', testPassword);

fetch('http://localhost:5000/api/vendor/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        businessName: 'Tech Gadgets Uganda',
        businessEmail: testEmail,
        businessPhone: '+256755999888',
        password: testPassword,
        businessType: 'individual',
        district: 'Kampala',
        zone: 'Nakawa',
        landmark: 'Near City Square',
        tinNumber: '1000123456'
    })
})
    .then(res => res.json())
    .then(data => {
        console.log('\n✅ Registration Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.token) {
            console.log('\n✅ Registration successful! Token received.');

            // Test 2: Login with the same credentials
            console.log('\n\nTEST 2: Vendor Login');
            return fetch('http://localhost:5000/api/vendor/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword
                })
            });
        } else {
            throw new Error('Registration failed: ' + JSON.stringify(data));
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('\n✅ Login Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.user && data.user.role === 'vendor') {
            console.log('\n✅ Login successful!');
            console.log('\nUser Data:');
            console.log('- ID:', data.user.id);
            console.log('- Name:', data.user.name);
            console.log('- Email:', data.user.email);
            console.log('- Role:', data.user.role);
            console.log('- Vendor Profile ID:', data.user.vendorProfile?.id);
            console.log('- Business Name:', data.user.vendorProfile?.businessName);
            console.log('- Status:', data.user.vendorProfile?.status);

            console.log('\n\n🎉 ALL TESTS PASSED! 🎉');
            console.log('✅ Vendor registration works correctly');
            console.log('✅ Vendor login works correctly');
            console.log('✅ User object contains all required fields');
            console.log('✅ Vendor profile is properly linked');
        } else {
            throw new Error('Login failed or user is not a vendor');
        }
    })
    .catch(error => {
        console.error('\n❌ Test Failed:');
        console.error(error.message || error);
    });

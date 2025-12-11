import axios from 'axios';

async function testForgotPassword() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
            email: 'amadilemajid10@gmail.com'
        });
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
}

testForgotPassword();

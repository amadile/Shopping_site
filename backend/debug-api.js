import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function debugApi() {
    try {
        console.log('🔐 Logging in...');
        const loginRes = await axios.post(`${API_URL}/vendor/login`, {
            email: 'dramaniamir@gmail.com',
            password: 'Dramani@123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful. Token obtained.');
        console.log('User ID:', loginRes.data.user.id);
        console.log('Vendor ID:', loginRes.data.user.vendorProfile.id);

        console.log('\n📊 Fetching Analytics Summary...');
        try {
            const summaryRes = await axios.get(`${API_URL}/vendor/analytics/summary?days=30`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Response Status:', summaryRes.status);
            console.log('✅ Response Data:', JSON.stringify(summaryRes.data, null, 2));
        } catch (err) {
            console.error('❌ Analytics API Error:', err.response?.status, err.response?.data);
        }

        console.log('\n📈 Fetching Analytics Chart...');
        try {
            const chartRes = await axios.get(`${API_URL}/vendor/analytics/chart?startDate=2024-10-26`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Response Status:', chartRes.status);
            console.log('✅ Response Data Length:', chartRes.data.length);
            if (chartRes.data.length > 0) {
                console.log('First Record:', chartRes.data[0]);
                console.log('Last Record:', chartRes.data[chartRes.data.length - 1]);
            }
        } catch (err) {
            console.error('❌ Chart API Error:', err.response?.status, err.response?.data);
        }

    } catch (error) {
        console.error('❌ Fatal Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

debugApi();

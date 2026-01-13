
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use the secret from .env (or fallback as seen in code)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

async function testRoleAddFull() {
    try {
        console.log('🧪 Testing Add Role Full Logic...');

        // 1. Generate Admin Token
        const adminUser = {
            _id: '507f1f77bcf86cd799439011', // Dummy ObjectID
            username: 'admin',
            email: 'admin@deepcytes.com',
            isAdmin: true
        };

        const token = jwt.sign(
            { id: adminUser._id, username: adminUser.username, email: adminUser.email, isAdmin: adminUser.isAdmin },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('🔑 Generated Admin Token');

        // 2. Perform POST request
        const url = 'http://localhost:3001/api/application/admin/roles';
        const payload = { name: 'TestRole_' + Date.now(), category: 'Custom' };

        console.log(`📡 Sending POST to ${url}`);
        console.log('📦 Payload:', payload);

        const response = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Success:', response.status);
        console.log('📄 Data:', response.data);

    } catch (error) {
        console.error('❌ Request Failed:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('🔴 Data:', error.response.data);
        }
    }
}

testRoleAddFull();

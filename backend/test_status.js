const axios = require('axios');

async function testStatusUpdate() {
    try {
        const res = await axios.patch('http://localhost:3001/api/application/admin/status', {
            applicantId: '659549f3957297e2c9f56e01', // Dummy ID for start, will check real one
            status: 'ACCEPTED',
            tenureEndDate: '01012027'
        });
        console.log("Success:", res.data);
    } catch (error) {
        console.log("Error Status:", error.response?.status);
        console.log("Error Data:", JSON.stringify(error.response?.data, null, 2));
    }
}

testStatusUpdate();

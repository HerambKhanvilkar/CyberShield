const express = require('express');
const router = express.Router();
const DocumentService = require('../services/DocumentService');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

/**
 * Test endpoint to generate sample NDA
 * GET /api/test/generate-nda
 */
router.get('/generate-nda', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const testApplicantData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            globalPid: 'DC-TEST-001'
        };

        const testSignatureInfo = {
            type: 'TYPED',
            data: null
        };

        const result = await DocumentService.generateNDA(testApplicantData, testSignatureInfo);

        res.json({
            success: true,
            message: 'NDA generated successfully',
            hash: result.hash,
            password: result.password,
            filename: result.path.split('/').pop()
        });

    } catch (error) {
        console.error('Test NDA generation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Test endpoint to generate sample Offer Letter
 * GET /api/test/generate-offer
 */
router.get('/generate-offer', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const testFellowData = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            globalPid: 'DC-TEST-002'
        };

        const testTenureData = {
            role: 'Security Researcher',
            startDate: '01/02/2026',
            endDate: '01/06/2026'
        };

        const result = await DocumentService.generateOfferLetter(testFellowData, testTenureData);

        res.json({
            success: true,
            message: 'Offer Letter generated successfully',
            hash: result.hash,
            password: result.password,
            filename: result.path.split('/').pop()
        });

    } catch (error) {
        console.error('Test Offer Letter generation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

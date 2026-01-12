/**
 * Test script to generate sample NDA and Offer Letter PDFs
 * Run with: node backend/testPDFGeneration.js
 */

const DocumentService = require('./services/DocumentService');
const path = require('path');

async function generateTestPDFs() {
    console.log('🎨 Generating premium test PDFs for Aryan Lomte...\n');

    try {
        // Test 1: Generate NDA
        console.log('📄 Generating NDA...');
        const ndaData = {
            firstName: 'Aryan',
            lastName: 'Lomte',
            email: 'aryan.lomte@deepcytes.com',
            globalPid: 'DC-TEST-2026-001'
        };

        const ndaSignature = {
            type: 'TYPED',
            data: null
        };

        const ndaResult = await DocumentService.generateNDA(ndaData, ndaSignature);
        console.log('✅ NDA Generated!');
        console.log(`   📁 Saved to: ${ndaResult.path}`);
        console.log(`   🔒 Password: ${ndaResult.password}`);
        console.log(`   🔐 Hash: ${ndaResult.hash.substring(0, 16)}...`);
        console.log('');

        // Test 2: Generate Offer Letter
        console.log('📄 Generating Offer Letter...');
        const offerFellowData = {
            firstName: 'Aryan',
            lastName: 'Lomte',
            email: 'aryan.lomte@deepcytes.com',
            globalPid: 'DC-TEST-2026-001'
        };

        const offerTenureData = {
            role: 'Security Researcher',
            startDate: '13/01/2026',
            endDate: '13/07/2026'
        };

        const offerResult = await DocumentService.generateOfferLetter(offerFellowData, offerTenureData);
        console.log('✅ Offer Letter Generated!');
        console.log(`   📁 Saved to: ${offerResult.path}`);
        console.log(`   🔒 Password: ${offerResult.password}`);
        console.log(`   🔐 Hash: ${offerResult.hash.substring(0, 16)}...`);
        console.log('');

        console.log('🎉 All PDFs generated successfully!');
        console.log('');
        console.log('📂 Check: backend/uploads/signed_documents/');
        console.log(`🔑 Password format: LastName_GlobalPID (e.g., ${ndaResult.password})`);
        console.log('');
        console.log('✨ PDFs include:');
        console.log('   • DeepCytes logo (DC_LOGO.png)');
        console.log('   • Shubham sir\'s signature (SP Sign DCFP.png)');
        console.log('   • Premium layouts with cyan accents');
        console.log('   • Password protection');
        console.log('   • Document watermarks');

    } catch (error) {
        console.error('❌ Error generating PDFs:', error.message);
        console.error(error);
    }
}

// Run the test
generateTestPDFs();

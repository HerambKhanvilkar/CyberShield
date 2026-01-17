const DocumentService = require('./services/DocumentService');
const fs = require('fs');
const path = require('path');

async function test() {
    const applicantData = {
        firstName: "Test",
        lastName: "Lomte",
        email: "test@example.com",
        globalPid: "F00007"
    };

    const signatureInfo = {
        type: 'TYPED',
        data: 'TEST SIGNATURE'
    };

    console.log("Testing Preview Generation...");
    try {
        const preview = await DocumentService.generateNDA(applicantData, { ...signatureInfo, isPreview: true });
        console.log("Preview generated. Size:", preview.buffer.length);
        fs.writeFileSync('test_preview.pdf', Buffer.from(preview.buffer));
        console.log("Saved test_preview.pdf");
    } catch (e) {
        console.error("Preview failed:", e);
    }

    console.log("\nTesting Signed NDA Generation...");
    try {
        const signed = await DocumentService.generateNDA(applicantData, signatureInfo);
        console.log("Signed NDA generated. Size:", signed.buffer.length);
        console.log("Path:", signed.path);
        console.log("Password:", signed.password);
        fs.writeFileSync('test_signed.pdf', Buffer.from(signed.buffer));
        console.log("Saved test_signed.pdf");
    } catch (e) {
        console.error("Signed NDA failed:", e);
    }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

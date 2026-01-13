const express = require('express');
const router = express.Router();
const { authenticateJWT, isFellow, isAdmin } = require('../middleware/auth');
const DocumentTemplate = require('../models/DocumentTemplate');
const DocumentService = require('../services/DocumentService');
const path = require('path');
const fs = require('fs');

// 1. Get Member Profile (Dashboard Overview)
router.get('/profile', authenticateJWT, isFellow, async (req, res) => {
    try {
        const profile = req.fellow; // Attached by isFellow middleware

        // Calculate stats
        const activeTenure = profile.tenures.find(t => t.status === 'ACTIVE') || profile.tenures[profile.tenures.length - 1];
        const totalTenures = profile.tenures.length;

        // Return structured dashboard data
        res.json({
            profile: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                globalPid: profile.globalPid,
                status: profile.status,
                onboardingState: profile.onboardingState,
                email: profile.email
            },
            activeTenure: activeTenure,
            stats: {
                totalTenures,
                currentRole: activeTenure ? activeTenure.role : "None",
                programStart: profile.tenures[0]?.startDate || "N/A"
            }
        });
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// 2. Get Tenure History (Timeline)
router.get('/tenures', authenticateJWT, isFellow, async (req, res) => {
    try {
        // Return tenures with embedded documents
        res.json(req.fellow.tenures);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 3. Get Documents for a specific tenure
router.get('/documents/:tenureIndex', authenticateJWT, isFellow, async (req, res) => {
    try {
        const tenureIndex = parseInt(req.params.tenureIndex);
        if (isNaN(tenureIndex) || tenureIndex < 0 || tenureIndex >= req.fellow.tenures.length) {
            return res.status(400).json({ message: "Invalid tenure index" });
        }

        const tenure = req.fellow.tenures[tenureIndex];

        // If signedDocuments structure doesn't exist yet (migration case), return empty stub
        const docs = tenure.signedDocuments || {
            nda: null,
            offerLetter: null,
            completionLetter: null
        };

        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 4. Check available templates (helper for frontend to know what's signable)
router.get('/templates/available', authenticateJWT, isFellow, async (req, res) => {
    try {
        const templates = await DocumentTemplate.find({ isActive: true }).select('name type version');
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 5. Sign Document Endpoint
router.post('/sign-document', authenticateJWT, isFellow, async (req, res) => {
    // Body: { tenureIndex, documentType, signatureData, signatureType }
    try {
        const { tenureIndex, documentType, signatureData, signatureType } = req.body;
        const fellow = req.fellow;

        if (tenureIndex === undefined || !['nda', 'offerLetter', 'completionLetter'].includes(documentType)) {
            return res.status(400).json({ message: "Invalid request parameters" });
        }

        // Use hardcoded template paths for Sprint 1/2
        const templateNameMap = {
            'nda': 'NDA_Template.pdf',
            'offerLetter': 'Offer_Letter.pdf',
            'completionLetter': 'Completion_Letter.pdf'
        };

        // Ensure templates dir exists
        const templatesDir = path.join(__dirname, '../../uploads/templates');
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
        }

        const templatePath = path.join(templatesDir, templateNameMap[documentType]);

        // Generate Premium PDF based on document type
        let pdfResult;
        if (documentType === 'nda') {
            const applicantData = {
                firstName: fellow.firstName,
                lastName: fellow.lastName,
                email: fellow.email,
                globalPid: fellow.globalPid
            };
            pdfResult = await DocumentService.generateNDA(applicantData, { type: signatureType, data: signatureData });
        } else if (documentType === 'offerLetter') {
            const fellowData = {
                firstName: fellow.firstName,
                lastName: fellow.lastName,
                email: fellow.email,
                globalPid: fellow.globalPid
            };
            const tenureData = {
                role: fellow.tenures[tenureIndex].role || 'Fellow',
                startDate: fellow.tenures[tenureIndex].startDate || new Date().toLocaleDateString('en-GB'),
                endDate: fellow.tenures[tenureIndex].endDate || 'Ongoing'
            };
            pdfResult = await DocumentService.generateOfferLetter(fellowData, tenureData);
        } else {
            // Use generic for other document types (completion letter, etc.)
            pdfResult = await DocumentService.generateSecurePDF(
                templatePath,
                {
                    fullName: `${fellow.firstName} ${fellow.lastName}`,
                    role: fellow.tenures[tenureIndex].role || "Fellow",
                    globalPid: fellow.globalPid,
                    email: fellow.email
                },
                { type: signatureType, data: signatureData },
                fellow.email,
                fellow.lastName,
                fellow.globalPid
            );
        }

        // Update Tenure
        if (!fellow.tenures[tenureIndex].signedDocuments) {
            fellow.tenures[tenureIndex].signedDocuments = {};
        }

        // Use Mongoose mixed type update trigger
        const signedDocs = fellow.tenures[tenureIndex].signedDocuments;
        signedDocs[documentType] = {
            signedAt: new Date().toISOString(),
            signedBy: `${fellow.firstName} ${fellow.lastName}`,
            documentHash: pdfResult.hash,
            signatureData: "[PROTECTED]",
            signatureType: signatureType,
            pdfPath: pdfResult.path
        };

        fellow.markModified('tenures');
        await fellow.save();

        res.json({
            success: true,
            message: "Document signed successfully",
            documentHash: pdfResult.hash
        });

    } catch (err) {
        console.error("Signing error:", err);
        res.status(500).json({ message: "Signing failed" });
    }
});

// 6. Download Signed Document
router.get('/download-document/:tenureIndex/:documentType', authenticateJWT, isFellow, async (req, res) => {
    try {
        const { tenureIndex, documentType } = req.params;
        const fellow = req.fellow;
        // Access mixed type safely
        const docRecord = fellow.tenures[tenureIndex]?.signedDocuments?.[documentType];

        if (!docRecord || !docRecord.pdfPath || !fs.existsSync(docRecord.pdfPath)) {
            return res.status(404).json({ message: "Document not found" });
        }

        res.download(docRecord.pdfPath, `${documentType}_${fellow.lastName}.pdf`);
    } catch (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Download error" });
    }
});

// 7. Admin Download Document
router.get('/admin/download/:fellowId/:tenureIndex/:documentType', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { fellowId, tenureIndex, documentType } = req.params;
        const fellow = await FellowshipProfile.findById(fellowId);

        if (!fellow) return res.status(404).json({ message: "Fellow not found" });

        const docRecord = fellow.tenures[tenureIndex]?.signedDocuments?.[documentType];

        if (!docRecord || !docRecord.pdfPath || !fs.existsSync(docRecord.pdfPath)) {
            return res.status(404).json({ message: "Document not found" });
        }

        res.download(docRecord.pdfPath, `${documentType}_${fellow.lastName}.pdf`);
    } catch (err) {
        console.error("Admin Download error:", err);
        res.status(500).json({ message: "Download error" });
    }
});

module.exports = router;

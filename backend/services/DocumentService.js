const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const muhammara = require('muhammara');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DocumentService {
    /**
     * Generate Premium NDA Document
     * @param {Object} applicantData - { firstName, lastName, email, globalPid }
     * @param {Object} signatureInfo - { type: 'TYPED'|'DRAWN', data: string }
     * @returns {Object} - { buffer, hash, path, password }
     */
    static async generateNDA(applicantData, signatureInfo) {
        const uploadDir = path.join(__dirname, '../../uploads/signed_documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeLastName = (applicantData.lastName || 'FELLOW').trim();
        const safePid = (applicantData.globalPid || 'PENDING').trim();
        const outputPath = path.join(uploadDir, `NDA_${safeLastName}_${Date.now()}.pdf`);
        const password = `${safeLastName.toUpperCase()}_${safePid.toUpperCase()}`;

        console.log(`[DOC_GEN] Generating NDA for ${applicantData.email}. PID: ${safePid}. Password set to: ${password}`);

        try {
            // Create new PDF document
            const pdfDoc = await PDFDocument.create();

            // Embed fonts
            const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
            const headingFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Page setup - A4 size
            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 70;
            const contentWidth = pageWidth - (2 * margin);

            // Colors
            const primaryColor = rgb(0.024, 0.714, 0.831); // Cyan #06b6d4
            const darkGray = rgb(0.2, 0.2, 0.2);
            const black = rgb(0, 0, 0);
            const lightGray = rgb(0.5, 0.5, 0.5);

            // === PAGE 1: Header & Opening ===
            let page = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPos = pageHeight - margin;

            // Logo (if exists)
            const logoPath = path.join(__dirname, '../uploads/assets/DC_LOGO.png');
            if (fs.existsSync(logoPath)) {
                const logoBytes = fs.readFileSync(logoPath);
                const logoImage = await pdfDoc.embedPng(logoBytes);
                const logoDims = logoImage.scale(0.15); // Adjust scale as needed
                page.drawImage(logoImage, {
                    x: margin,
                    y: yPos - 40,
                    width: logoDims.width,
                    height: logoDims.height,
                });
                yPos -= 60;
            }

            // Title
            yPos -= 30;
            page.drawText('EMPLOYEE CONFIDENTIALITY AND', {
                x: margin,
                y: yPos,
                size: 16,
                font: headingFont,
                color: primaryColor,
            });
            yPos -= 22;
            page.drawText('NON-DISCLOSURE AGREEMENT', {
                x: margin,
                y: yPos,
                size: 16,
                font: headingFont,
                color: primaryColor,
            });

            // Decorative line
            yPos -= 15;
            page.drawLine({
                start: { x: margin, y: yPos },
                end: { x: pageWidth - margin, y: yPos },
                thickness: 2,
                color: primaryColor,
            });

            // Document metadata
            yPos -= 30;
            const today = new Date().toLocaleDateString('en-GB');
            page.drawText(`Effective Date: ${today}`, {
                x: margin,
                y: yPos,
                size: 11,
                font: boldFont,
                color: darkGray,
            });

            yPos -= 18;
            page.drawText('Company: DeepCytes Ventures (hereinafter, the "Company")', {
                x: margin,
                y: yPos,
                size: 11,
                font: regularFont,
                color: black,
            });

            yPos -= 18;
            page.drawText(`Employee: ${applicantData.firstName} ${applicantData.lastName} (hereinafter, the "Employee")`, {
                x: margin,
                y: yPos,
                size: 11,
                font: regularFont,
                color: black,
            });

            // Introduction paragraph
            yPos -= 30;
            const introText = `This Agreement sets forth the terms and conditions under which the Employee agrees to maintain the confidentiality of information disclosed by the Company during the course of their work with the DeepCytes Fellowship Program.`;
            const introLines = this._wrapText(introText, contentWidth, 11, regularFont);
            for (const line of introLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Section 1: Confidential Information
            yPos -= 20;
            page.drawText('1. Confidential Information', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 22;
            const confidentialText = `"Confidential Information" refers to all technical, non-technical, proprietary, or sensitive information disclosed to the Employee by the Company in connection with the Fellowship, including, but not limited to, product plans, processes, drawings, research, data, business operations, and any other information disclosed verbally, in writing, electronically, or in any other form.`;
            const confidentialLines = this._wrapText(confidentialText, contentWidth, 11, regularFont);
            for (const line of confidentialLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Section 2: Employee Obligations
            yPos -= 20;
            page.drawText('2. Employee Obligations', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 22;
            page.drawText('The Employee agrees to:', {
                x: margin,
                y: yPos,
                size: 11,
                font: regularFont,
                color: black,
            });

            // Subsections
            yPos -= 22;
            page.drawText('A. Maintain Confidentiality:', {
                x: margin + 10,
                y: yPos,
                size: 11,
                font: boldFont,
                color: black,
            });

            yPos -= 18;
            const maintainText = `Hold all Confidential Information in strict confidence and exercise a reasonable degree of care to prevent its disclosure to unauthorised third parties.`;
            const maintainLines = this._wrapText(maintainText, contentWidth - 20, 11, regularFont);
            for (const line of maintainLines) {
                page.drawText(line, {
                    x: margin + 20,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            yPos -= 8;
            page.drawText('B. No Disclosure:', {
                x: margin + 10,
                y: yPos,
                size: 11,
                font: boldFont,
                color: black,
            });

            yPos -= 18;
            const noDisclosureText = `Not disclose, share, or otherwise make available the Confidential Information to any third party unless authorised in writing by the Company.`;
            const noDisclosureLines = this._wrapText(noDisclosureText, contentWidth - 20, 11, regularFont);
            for (const line of noDisclosureLines) {
                page.drawText(line, {
                    x: margin + 20,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            yPos -= 8;
            page.drawText('C. No Unauthorised Use:', {
                x: margin + 10,
                y: yPos,
                size: 11,
                font: boldFont,
                color: black,
            });

            yPos -= 18;
            const noUseText = `Not reproduce, use, or exploit the Confidential Information for any purpose other than for the performance of duties for the Company.`;
            const noUseLines = this._wrapText(noUseText, contentWidth - 20, 11, regularFont);
            for (const line of noUseLines) {
                page.drawText(line, {
                    x: margin + 20,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Check if we need a new page
            if (yPos < 200) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPos = pageHeight - margin;
            }

            yPos -= 8;
            page.drawText('D. Return of Materials:', {
                x: margin + 10,
                y: yPos,
                size: 11,
                font: boldFont,
                color: black,
            });

            yPos -= 18;
            const returnText = `Upon request or termination of the Fellowship, immediately return any materials, notes, documents, or equipment containing Confidential Information provided by the Company.`;
            const returnLines = this._wrapText(returnText, contentWidth - 20, 11, regularFont);
            for (const line of returnLines) {
                page.drawText(line, {
                    x: margin + 20,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Continue with remaining sections...
            // Section 3
            yPos -= 20;
            page.drawText("3. Company's Rights", {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 22;
            const companyRightsText = `The Company retains the sole right to determine the treatment of any information disclosed, including the ability to keep it confidential, file patents, copyrights, or take other actions as deemed necessary.`;
            const companyRightsLines = this._wrapText(companyRightsText, contentWidth, 11, regularFont);
            for (const line of companyRightsLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Section 4
            yPos -= 20;
            page.drawText('4. Intellectual Property', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 22;
            const ipText = `The Employee agrees not to file any patents or seek any intellectual property rights related to developments or inventions arising from the use of Confidential Information. Any discoveries, inventions, or technologies developed during the Fellowship shall remain the property of the Company.`;
            const ipLines = this._wrapText(ipText, contentWidth, 11, regularFont);
            for (const line of ipLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Section 5
            yPos -= 20;
            page.drawText('5. Severability', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 22;
            const severabilityText = `If any provision of this Agreement is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions will remain valid and enforceable, and the Agreement shall continue as intended by the parties.`;
            const severabilityLines = this._wrapText(severabilityText, contentWidth, 11, regularFont);
            for (const line of severabilityLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Section 6
            yPos -= 20;
            page.drawText('6. Employment Terms', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 22;
            const employmentText = `This Agreement does not constitute a promise of continued employment or a guarantee of any specific employment term. The Employee's participation in the Fellowship remains subject to the "at-will" nature of their engagement.`;
            const employmentLines = this._wrapText(employmentText, contentWidth, 11, regularFont);
            for (const line of employmentLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // Section 7
            yPos -= 20;
            page.drawText('7. Violation and Consequences', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 22;
            const violationText = `A violation of this Agreement may result in disciplinary action, up to and including termination from the Fellowship, in accordance with the Company's policies.`;
            const violationLines = this._wrapText(violationText, contentWidth, 11, regularFont);
            for (const line of violationLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            // === NEW PAGE FOR SIGNATURES ===
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPos = pageHeight - margin;

            // Acknowledgment heading
            yPos -= 20;
            page.drawText('Acknowledgment and Acceptance', {
                x: margin,
                y: yPos,
                size: 13,
                font: boldFont,
                color: primaryColor,
            });

            yPos -= 25;
            const ackText = `By signing below, both the Company and the Employee acknowledge and accept the terms of this Confidentiality and Non-Disclosure Agreement.`;
            const ackLines = this._wrapText(ackText, contentWidth, 11, regularFont);
            for (const line of ackLines) {
                page.drawText(line, {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: regularFont,
                    color: black,
                });
                yPos -= 16;
            }

            yPos -= 40;
            page.drawText('AGREED:', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: black,
            });

            // Two-column signature layout
            yPos -= 40;
            const col1X = margin;
            const col2X = pageWidth / 2 + 20;
            const sigStartY = yPos;

            // Column 1: Company signature
            page.drawText('Mr. Shubham Pareek,', {
                x: col1X,
                y: yPos,
                size: 10,
                font: regularFont,
                color: black,
            });
            yPos -= 14;
            page.drawText('Global Alliance Officer,', {
                x: col1X,
                y: yPos,
                size: 10,
                font: regularFont,
                color: black,
            });
            yPos -= 14;
            page.drawText('DeepCytes Ventures', {
                x: col1X,
                y: yPos,
                size: 10,
                font: regularFont,
                color: black,
            });

            // Company signature image
            const signaturePath = path.join(__dirname, '../uploads/assets/SP Sign DCFP.png');
            if (fs.existsSync(signaturePath)) {
                const sigBytes = fs.readFileSync(signaturePath);
                const sigImage = await pdfDoc.embedPng(sigBytes);
                const sigDims = sigImage.scale(0.3);
                page.drawImage(sigImage, {
                    x: col1X,
                    y: yPos - 50,
                    width: sigDims.width,
                    height: sigDims.height,
                });
                yPos -= 60;
            } else {
                yPos -= 40;
            }

            // Signature line for company
            page.drawLine({
                start: { x: col1X, y: yPos },
                end: { x: col1X + 200, y: yPos },
                thickness: 1,
                color: black,
            });
            yPos -= 12;
            page.drawText('(Signature)', {
                x: col1X + 70,
                y: yPos,
                size: 9,
                font: italicFont,
                color: lightGray,
            });

            yPos -= 20;
            page.drawText(`Date: ${today}`, {
                x: col1X,
                y: yPos,
                size: 10,
                font: regularFont,
                color: black,
            });

            // Column 2: Employee signature
            let col2Y = sigStartY;
            page.drawText(`${applicantData.firstName} ${applicantData.lastName}`, {
                x: col2X,
                y: col2Y,
                size: 10,
                font: regularFont,
                color: black,
            });

            // Employee signature (typed or drawn)
            col2Y -= 40;
            if (signatureInfo && signatureInfo.isPreview) {
                const sigFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
                page.drawText(`[UNSIGNED PREVIEW]`, {
                    x: col2X,
                    y: col2Y,
                    size: 14,
                    font: sigFont,
                    color: rgb(0.8, 0, 0),
                });
                col2Y -= 30;
            } else if (signatureInfo && signatureInfo.type === 'TYPED') {
                const sigFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
                page.drawText(`${applicantData.firstName} ${applicantData.lastName}`, {
                    x: col2X,
                    y: col2Y,
                    size: 20,
                    font: sigFont,
                    color: rgb(0, 0, 0.4),
                });
                col2Y -= 30;
            }

            // Signature line for employee
            page.drawLine({
                start: { x: col2X, y: col2Y },
                end: { x: col2X + 200, y: col2Y },
                thickness: 1,
                color: black,
            });
            col2Y -= 12;
            page.drawText('(Signature)', {
                x: col2X + 70,
                y: col2Y,
                size: 9,
                font: italicFont,
                color: lightGray,
            });

            col2Y -= 20;
            page.drawText(`Date: ${today}`, {
                x: col2X,
                y: col2Y,
                size: 10,
                font: regularFont,
                color: black,
            });

            // Footer watermark on all pages
            const pages = pdfDoc.getPages();
            pages.forEach((pg, idx) => {
                pg.drawText(`DeepCytes Ventures | ${applicantData.email} | Page ${idx + 1}/${pages.length}`, {
                    x: margin,
                    y: 30,
                    size: 8,
                    font: regularFont,
                    color: lightGray,
                    opacity: 0.6,
                });

                if (signatureInfo && signatureInfo.isPreview) {
                    pg.drawText('UNSIGNED PREVIEW', {
                        x: 100,
                        y: 300,
                        size: 60,
                        font: headingFont,
                        color: rgb(1, 0, 0),
                        opacity: 0.15,
                        rotate: degrees(45),
                    });
                }
            });

            // Save unprotected PDF
            const pdfBytes = await pdfDoc.save();

            if (signatureInfo && signatureInfo.isPreview) {
                // If it's a preview, we return the buffer directly without protection or hash storage
                return { buffer: pdfBytes, path: null, hash: null };
            }

            const tempPath = path.join(path.dirname(outputPath), `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
            fs.writeFileSync(tempPath, pdfBytes);
            const protectedPath = path.join(path.dirname(outputPath), `prot_${crypto.randomBytes(4).toString('hex')}.pdf`);

            // Apply password protection to a temporary protected path first
            muhammara.recrypt(tempPath, protectedPath, {
                userPassword: password,
                ownerPassword: crypto.randomBytes(32).toString('hex'),
                userProtectionFlag: 4
            });

            if (!fs.existsSync(protectedPath)) {
                throw new Error("Encryption failed - Protected file not created");
            }

            // Move to final output path
            fs.copyFileSync(protectedPath, outputPath);

            fs.unlinkSync(tempPath);
            fs.unlinkSync(protectedPath);

            const finalBytes = fs.readFileSync(outputPath);
            console.log(`[DOC_GEN] NDA Generated successfully: ${outputPath} (${finalBytes.length} bytes)`);
            const hash = crypto.createHash('sha256').update(finalBytes).digest('hex');

            return {
                buffer: finalBytes,
                hash,
                path: outputPath,
                password
            };

        } catch (error) {
            console.error('NDA Generation Error:', error);
            throw error;
        }
    }

    /**
     * Helper to wrap text
     */
    static _wrapText(text, maxWidth, fontSize, font) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const width = font.widthOfTextAtSize(testLine, fontSize);

            if (width < maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        }

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // Keep existing method for backward compatibility
    static async generateSecurePDF(templatePath, data, signatureInfo, userEmail, userLastName, userPid) {
        // Existing implementation remains the same
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const outputPath = path.join(uploadDir, `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
        const password = `${userLastName}_${userPid}`;
        const watermarkText = `DEEPCYTES R&D - ${userEmail} - ${new Date().toLocaleString()}`;

        try {
            if (!fs.existsSync(templatePath)) {
                const dummyDoc = await PDFDocument.create();
                const page = dummyDoc.addPage([600, 800]);
                page.drawText("MISSING TEMPLATE - FALLBACK MODE", { x: 50, y: 700, size: 20 });
                const dummyBytes = await dummyDoc.save();
                fs.mkdirSync(path.dirname(templatePath), { recursive: true });
                fs.writeFileSync(templatePath, dummyBytes);
            }

            const templateBytes = fs.readFileSync(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pages = pdfDoc.getPages();
            const lastPage = pages[pages.length - 1];
            const { width, height } = lastPage.getSize();

            let yPos = 180;
            lastPage.drawLine({
                start: { x: 50, y: yPos + 20 },
                end: { x: width - 50, y: yPos + 20 },
                thickness: 1,
                color: rgb(0, 0, 0),
            });

            lastPage.drawText(`Signed By: ${data.fullName}`, { x: 50, y: yPos, size: 10, font: boldFont });
            lastPage.drawText(`Role: ${data.role}`, { x: 300, y: yPos, size: 10, font });
            yPos -= 15;
            lastPage.drawText(`Date: ${new Date().toISOString().split('T')[0]}`, { x: 50, y: yPos, size: 10, font });
            lastPage.drawText(`Fellowship ID: ${data.globalPid}`, { x: 300, y: yPos, size: 10, font });

            yPos -= 50;
            lastPage.drawText("Signature:", { x: 50, y: yPos + 20, size: 8, font });

            if (signatureInfo && signatureInfo.type === 'DRAWN' && signatureInfo.data) {
                try {
                    const base64Data = signatureInfo.data.split(',')[1] || signatureInfo.data;
                    const pngImage = await pdfDoc.embedPng(base64Data);
                    const pngDims = pngImage.scale(0.5);
                    lastPage.drawImage(pngImage, {
                        x: 50, y: yPos - 40,
                        width: Math.min(pngDims.width, 200), height: Math.min(pngDims.height, 60),
                    });
                } catch (e) {
                    lastPage.drawText(`[Digital Signature: ${data.fullName}]`, { x: 50, y: yPos, size: 18, font: boldFont, color: rgb(0, 0, 1) });
                }
            } else {
                const sigFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
                lastPage.drawText(`${data.fullName}`, { x: 50, y: yPos, size: 24, font: sigFont, color: rgb(0, 0, 0.6) });
            }

            pages.forEach(page => {
                page.drawText(watermarkText, { x: 20, y: 20, size: 8, font, color: rgb(0.6, 0.6, 0.6), opacity: 0.5 });
                page.drawText(`SECURE DOCUMENT // ${data.globalPid}`, { x: 20, y: page.getHeight() - 20, size: 8, font: boldFont, color: rgb(1, 0, 0), opacity: 0.3 });
            });

            const pdfBytes = await pdfDoc.save();
            const protectedTempPath = path.join(path.dirname(outputPath), `prot_${crypto.randomBytes(4).toString('hex')}.pdf`);
            fs.writeFileSync(protectedTempPath, pdfBytes);

            muhammara.recrypt(protectedTempPath, outputPath, {
                userPassword: password,
                ownerPassword: crypto.randomBytes(32).toString('hex'),
                userProtectionFlag: 4
            });

            fs.unlinkSync(protectedTempPath);
            const finalBytes = fs.readFileSync(outputPath);
            const hash = crypto.createHash('sha256').update(finalBytes).digest('hex');

            return { buffer: finalBytes, hash, path: outputPath, password };
        } catch (err) {
            console.error("PDF GEN ERROR:", err);
            throw err;
        }
    }

    /**
     * Generate Premium Offer Letter Document
     */
    static async generateOfferLetter(fellowData, tenureData) {
        const uploadDir = path.join(__dirname, '../../uploads/signed_documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeLastName = (fellowData.lastName || 'FELLOW').trim();
        const safePid = (fellowData.globalPid || 'PENDING').trim();
        const outputPath = path.join(uploadDir, `OfferLetter_${safeLastName}_${Date.now()}.pdf`);
        const password = `${safeLastName.toUpperCase()}_${safePid.toUpperCase()}`;

        console.log(`[DOC_GEN] Generating Offer Letter for ${fellowData.email}. PID: ${safePid}. Password set to: ${password}`);

        try {
            const pdfDoc = await PDFDocument.create();
            const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 70;
            const contentWidth = pageWidth - (2 * margin);

            const primaryColor = rgb(0.024, 0.714, 0.831);
            const darkGray = rgb(0.2, 0.2, 0.2);
            const black = rgb(0, 0, 0);
            const lightGray = rgb(0.5, 0.5, 0.5);

            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPos = pageHeight - margin;

            // Logo
            const logoPath = path.join(__dirname, '../uploads/assets/DC_LOGO.png');
            if (fs.existsSync(logoPath)) {
                const logoBytes = fs.readFileSync(logoPath);
                const logoImage = await pdfDoc.embedPng(logoBytes);
                const logoDims = logoImage.scale(0.18);
                page.drawImage(logoImage, { x: margin, y: yPos - 45, width: logoDims.width, height: logoDims.height });
                yPos -= 65;
            }

            page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 3, color: primaryColor });
            yPos -= 2;
            page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 1, color: primaryColor, opacity: 0.5 });

            yPos -= 35;
            const today = new Date().toLocaleDateString('en-GB');
            const dateText = `Date: ${today}`;
            page.drawText(dateText, { x: pageWidth - margin - boldFont.widthOfTextAtSize(dateText, 11), y: yPos, size: 11, font: boldFont, color: darkGray });

            yPos -= 18;
            const termText = `Fellowship Term: ${tenureData.startDate} to ${tenureData.endDate}`;
            page.drawText(termText, { x: pageWidth - margin - regularFont.widthOfTextAtSize(termText, 10), y: yPos, size: 10, font: regularFont, color: darkGray });

            yPos -= 18;
            const roleText = `Role: ${tenureData.role}`;
            page.drawText(roleText, { x: pageWidth - margin - regularFont.widthOfTextAtSize(roleText, 10), y: yPos, size: 10, font: regularFont, color: primaryColor });

            yPos -= 50;
            page.drawText(`Dear ${fellowData.firstName} ${fellowData.lastName},`, { x: margin, y: yPos, size: 12, font: boldFont, color: black });

            yPos -= 30;
            const paragraphs = [
                `We are delighted to welcome you to the DeepCytes Fellowship Program, where you will join DeepCytes Cyber Labs as a ${tenureData.role}. Your selection reflects not only your technical potential, but also your curiosity, mindset, and commitment to addressing complex challenges in the evolving cyber landscape.`,
                `As a Fellow at DeepCytes, you will work at the intersection of emerging technologies, real-world cyber threats, and strategic problem-solving. The Fellowship is designed to tackle pressing cybersecurity challenges—ranging from digital trust, privacy, and resilience, to adversarial threats impacting individuals, institutions, and nations. You will contribute to building practical, forward-looking solutions that strengthen cyber resilience at scale.`,
                `DeepCytes Cyber Labs is more than a workplace—it is a community of solution builders, researchers, and practitioners committed to developing and sharing skills that matter. Throughout your Fellowship, you will collaborate with like-minded professionals, exchange knowledge, and sharpen your expertise while contributing to a culture of continuous learning and collective growth.`,
                `We believe that the future of cybersecurity will be shaped by individuals who think deeply, act boldly, and share knowledge openly. As part of the DC Cyber Universe, your contributions will help define how emerging technologies are secured and how cyber resilience is built for the world ahead.`,
                `Welcome to DeepCytes Cyber Labs. We look forward to the impact you will create.`
            ];

            for (let i = 0; i < paragraphs.length; i++) {
                const lines = this._wrapText(paragraphs[i], contentWidth, 11, i === 4 ? boldFont : regularFont);
                for (const line of lines) {
                    page.drawText(line, { x: margin, y: yPos, size: 11, font: i === 4 ? boldFont : regularFont, color: i === 4 ? primaryColor : black });
                    yPos -= 16;
                }
                yPos -= 10;
            }

            yPos -= 40;
            const signaturePath = path.join(__dirname, '../uploads/assets/SP Sign DCFP.png');
            if (fs.existsSync(signaturePath)) {
                const sigBytes = fs.readFileSync(signaturePath);
                const sigImage = await pdfDoc.embedPng(sigBytes);
                const sigDims = sigImage.scale(0.35);
                page.drawImage(sigImage, { x: margin, y: yPos - 50, width: sigDims.width, height: sigDims.height });
                yPos -= 60;
            } else {
                yPos -= 40;
            }

            page.drawLine({ start: { x: margin, y: yPos }, end: { x: margin + 220, y: yPos }, thickness: 1, color: black });
            yPos -= 18;
            page.drawText('Mr. Shubham Pareek,', { x: margin, y: yPos, size: 10, font: boldFont, color: black });
            yPos -= 14;
            page.drawText('Co-Founder | Global Alliance Officer', { x: margin, y: yPos, size: 10, font: regularFont, color: darkGray });
            yPos -= 14;
            page.drawText('DeepCytes Cyber Labs UK', { x: margin, y: yPos, size: 10, font: regularFont, color: darkGray });

            page.drawText(`DeepCytes Ventures | ${fellowData.email} | Fellowship Offer Letter`, { x: margin, y: 30, size: 8, font: regularFont, color: lightGray, opacity: 0.6 });
            page.drawLine({ start: { x: margin, y: 50 }, end: { x: pageWidth - margin, y: 50 }, thickness: 1, color: primaryColor, opacity: 0.3 });

            if (tenureData && tenureData.isPreview) {
                page.drawText('UNSIGNED PREVIEW', {
                    x: 100,
                    y: 300,
                    size: 60,
                    font: boldFont,
                    color: rgb(1, 0, 0),
                    opacity: 0.15,
                    rotate: degrees(45),
                });
            }

            const pdfBytes = await pdfDoc.save();

            if (tenureData && tenureData.isPreview) {
                return { buffer: pdfBytes, path: null, hash: null };
            }

            const tempPath = path.join(path.dirname(outputPath), `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
            fs.writeFileSync(tempPath, pdfBytes);
            const protectedPath = path.join(path.dirname(outputPath), `prot_${crypto.randomBytes(4).toString('hex')}.pdf`);

            muhammara.recrypt(tempPath, protectedPath, {
                userPassword: password,
                ownerPassword: crypto.randomBytes(32).toString('hex'),
                userProtectionFlag: 4
            });

            if (!fs.existsSync(protectedPath)) {
                throw new Error("Encryption failed - Protected file not created");
            }

            fs.copyFileSync(protectedPath, outputPath);

            fs.unlinkSync(tempPath);
            fs.unlinkSync(protectedPath);

            const finalBytes = fs.readFileSync(outputPath);
            console.log(`[DOC_GEN] Offer Letter Generated successfully: ${outputPath} (${finalBytes.length} bytes)`);
            const hash = crypto.createHash('sha256').update(finalBytes).digest('hex');

            return { buffer: finalBytes, hash, path: outputPath, password };

        } catch (error) {
            console.error('Offer Letter Generation Error:', error);
            throw error;
        }
    }
}

module.exports = DocumentService;

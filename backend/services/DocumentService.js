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
            const pdfDoc = await PDFDocument.create();
            const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
            // Using Helvetica for header to match visual style if needed
            const headingFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 70;
            const contentWidth = pageWidth - (2 * margin);

            const primaryColor = rgb(0.024, 0.714, 0.831);
            const darkGray = rgb(0.2, 0.2, 0.2);
            const black = rgb(0, 0, 0);
            const lightGray = rgb(0.5, 0.5, 0.5);

            let page = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPos = pageHeight - margin;

            // Logo
            const logoPath = path.join(__dirname, '../uploads/assets/DC_LOGO.png');
            if (fs.existsSync(logoPath)) {
                const logoBytes = fs.readFileSync(logoPath);
                const logoImage = await pdfDoc.embedPng(logoBytes);
                // Same scale as Offer Letter
                const logoDims = logoImage.scale(0.25);
                page.drawImage(logoImage, { x: margin, y: yPos - 55, width: logoDims.width, height: logoDims.height });
                yPos -= 80;
            }

            page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 3, color: primaryColor });
            yPos -= 2;
            page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 1, color: primaryColor, opacity: 0.5 });

            yPos -= 40;
            const title1 = "FELLOWSHIP CONFIDENTIALITY AND";
            const title2 = "NON-DISCLOSURE AGREEMENT";

            page.drawText(title1, { x: margin, y: yPos, size: 14, font: boldFont, color: primaryColor });
            yPos -= 20;
            page.drawText(title2, { x: margin, y: yPos, size: 14, font: boldFont, color: primaryColor });

            yPos -= 40;
            const today = new Date().toLocaleDateString('en-GB');

            // Party definitions
            page.drawText('This Confidentiality and Non-Disclosure Agreement (the "Agreement") is entered into by and between:', { x: margin, y: yPos, size: 11, font: regularFont, color: black });
            yPos -= 25;

            // Company
            page.drawText('DeepCytes Ventures', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            page.drawText(' (hereinafter referred to as the "Disclosing Party" or "Company"),', { x: margin + boldFont.widthOfTextAtSize('DeepCytes Ventures', 11), y: yPos, size: 11, font: regularFont });
            yPos -= 18;

            // Employee
            const nameText = `${applicantData.firstName} ${applicantData.lastName}`;
            page.drawText(nameText, { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            page.drawText(' (hereinafter referred to as the "Receiving Party" or "Fellow").', { x: margin + boldFont.widthOfTextAtSize(nameText, 11), y: yPos, size: 11, font: regularFont });

            yPos -= 30;
            page.drawText('1. Purpose', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para1 = 'The Receiving Party understands that during the course of the Fellowship, they may have access to confidential information regarding the Business, operations, and technology of the Disclosing Party. The purpose of this Agreement is to prevent the unauthorized disclosure of such Confidential Information.';
            let lines = this._wrapText(para1, contentWidth, 11, regularFont);
            for (const line of lines) { page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont }); yPos -= 15; }

            yPos -= 15;
            page.drawText('2. Confidential Information', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para2 = '"Confidential Information" shall include all non-public information, intellectual property, research data, technical specifications, and proprietary knowledge shared by the Disclosing Party.';
            lines = this._wrapText(para2, contentWidth, 11, regularFont);
            for (const line of lines) { page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont }); yPos -= 15; }

            yPos -= 15;
            page.drawText('3. Obligations of Receiving Party', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para3 = 'The Receiving Party agrees to hold all Confidential Information in strict confidence and shall not disclose, reproduce, or use such information for any purpose other than the Fellowship activities without prior written consent.';
            lines = this._wrapText(para3, contentWidth, 11, regularFont);
            for (const line of lines) { page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont }); yPos -= 15; }

            yPos -= 15;
            page.drawText('4. Term', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para4 = 'The obligations of confidentiality shall commence on the Effective Date and survive the termination of the Fellowship indefinitely for trade secrets and for a period of five (5) years for other Confidential Information.';
            lines = this._wrapText(para4, contentWidth, 11, regularFont);
            for (const line of lines) { page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont }); yPos -= 15; }

            // Acknowledgment
            yPos -= 25;
            page.drawText('Acknowledgment and Acceptance', { x: margin, y: yPos, size: 12, font: boldFont, color: primaryColor });
            yPos -= 20;
            const ackText = 'By signing below, both the Company and the Employee acknowledge and accept the terms of this Confidentiality and Non-Disclosure Agreement.';
            lines = this._wrapText(ackText, contentWidth, 11, regularFont);
            for (const line of lines) { page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont }); yPos -= 15; }

            yPos -= 40;
            page.drawText('AGREED:', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: black,
            });

            // ========== SIGNATURE SECTION (REPLICATED FROM OFFER LETTER) ==========
            yPos -= 70;

            const leftColX = margin;
            const rightColX = pageWidth / 2 + 20;
            const signatureWidth = 180;
            const signatureBaseY = yPos;

            // === LEFT COLUMN: Shubham Pareek ===
            const signaturePath = path.join(__dirname, '../uploads/assets/SP Sign DCFP.png');
            if (fs.existsSync(signaturePath)) {
                const sigBytes = fs.readFileSync(signaturePath);
                const sigImage = await pdfDoc.embedPng(sigBytes);
                // Matched Offer Letter Scale
                const sigDims = sigImage.scale(0.22);
                page.drawImage(sigImage, {
                    x: leftColX - 40,
                    y: signatureBaseY - 45,
                    width: sigDims.width,
                    height: sigDims.height
                });
            }

            page.drawLine({ start: { x: leftColX, y: signatureBaseY - 50 }, end: { x: leftColX + signatureWidth, y: signatureBaseY - 50 }, thickness: 0.5, color: black });

            page.drawText('Mr. Shubham Pareek,', { x: leftColX, y: signatureBaseY - 65, size: 10, font: boldFont, color: black });
            page.drawText('Global Alliance Officer,', { x: leftColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: darkGray });
            page.drawText('DeepCytes Ventures', { x: leftColX, y: signatureBaseY - 91, size: 9, font: regularFont, color: darkGray });

            // === RIGHT COLUMN: Fellow ===
            page.drawText(`${applicantData.firstName} ${applicantData.lastName}`, { x: rightColX, y: signatureBaseY - 35, size: 14, font: italicFont, color: primaryColor });
            page.drawLine({ start: { x: rightColX, y: signatureBaseY - 50 }, end: { x: rightColX + signatureWidth, y: signatureBaseY - 50 }, thickness: 0.5, color: black });

            page.drawText('(Signature)', { x: rightColX, y: signatureBaseY - 63, size: 8, font: italicFont, color: lightGray });

            const fellowDateText = `Date: ${today}`;
            page.drawText(fellowDateText, { x: rightColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: darkGray });

            // Footer watermark on all pages
            const pages = pdfDoc.getPages();
            pages.forEach((pg, idx) => {
                // Removed email from footer as requested
                pg.drawText(`DeepCytes Ventures | Confidentiality Agreement | Page ${idx + 1}/${pages.length}`, {
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

            return { buffer: finalBytes, hash, path: outputPath, password };
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
                // Increased scale based on feedback (was 0.18)
                const logoDims = logoImage.scale(0.25);
                page.drawImage(logoImage, { x: margin, y: yPos - 55, width: logoDims.width, height: logoDims.height });
                yPos -= 80;
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

            // ========== SIGNATURE SECTION ==========
            // Add significantly more spacing before signatures to prevent overlap with "Welcome to DeepCytes..." text
            yPos -= 70;

            // Calculate column positions
            const leftColX = margin;
            const rightColX = pageWidth / 2 + 20;
            const signatureWidth = 180;

            // Store the Y position for both signatures to align
            const signatureBaseY = yPos;

            // === LEFT COLUMN: Shubham Pareek ===
            const signaturePath = path.join(__dirname, '../uploads/assets/SP Sign DCFP.png');
            if (fs.existsSync(signaturePath)) {
                const sigBytes = fs.readFileSync(signaturePath);
                const sigImage = await pdfDoc.embedPng(sigBytes);
                // Smaller scale and positioned further left/up based on feedback
                const sigDims = sigImage.scale(0.22);
                page.drawImage(sigImage, {
                    x: leftColX - 40, // Moved even more left (was -20)
                    y: signatureBaseY - 45, // Moved down relative to base (was -35)
                    width: sigDims.width,
                    height: sigDims.height
                });
            }

            // Line under Shubham's signature
            page.drawLine({
                start: { x: leftColX, y: signatureBaseY - 50 },
                end: { x: leftColX + signatureWidth, y: signatureBaseY - 50 },
                thickness: 0.5,
                color: black
            });

            // Shubham's details
            page.drawText('Mr. Shubham Pareek,', { x: leftColX, y: signatureBaseY - 65, size: 10, font: boldFont, color: black });
            page.drawText('Co-Founder | Global Alliance Officer', { x: leftColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: darkGray });
            page.drawText('DeepCytes Cyber Labs UK', { x: leftColX, y: signatureBaseY - 91, size: 9, font: regularFont, color: darkGray });

            // === RIGHT COLUMN: Fellow ===
            // Fellow's typed signature name
            page.drawText(`${fellowData.firstName} ${fellowData.lastName}`, {
                x: rightColX,
                y: signatureBaseY - 35,
                size: 14,
                font: italicFont,
                color: primaryColor
            });

            // Line under Fellow's signature
            page.drawLine({
                start: { x: rightColX, y: signatureBaseY - 50 },
                end: { x: rightColX + signatureWidth, y: signatureBaseY - 50 },
                thickness: 0.5,
                color: black
            });

            // (Signature) label
            page.drawText('(Signature)', { x: rightColX, y: signatureBaseY - 63, size: 8, font: italicFont, color: lightGray });

            // Date
            const fellowDateText = `Date: ${today}`;
            page.drawText(fellowDateText, { x: rightColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: darkGray });

            // ========== FOOTER ==========
            page.drawText(`DeepCytes Ventures | Fellowship Offer Letter`, { x: margin, y: 30, size: 8, font: regularFont, color: lightGray, opacity: 0.6 });
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

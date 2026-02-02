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

            // Helper to check for new page
            const checkPageAdd = (requiredSpace = 20) => {
                if (yPos < 70) {
                    page = pdfDoc.addPage([pageWidth, pageHeight]);
                    yPos = pageHeight - margin;
                    return true;
                }
                return false;
            };

            // Header Details
            page.drawText(`Effective Date: ${today}`, { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            page.drawText('Company: DeepCytes Ventures (hereinafter, the "Company")', { x: margin, y: yPos, size: 11, font: regularFont, color: black });
            yPos -= 15;
            const fellowNameText = `Fellow: ${applicantData.firstName} ${applicantData.lastName} (hereinafter, the "Fellow")`;
            page.drawText(fellowNameText, { x: margin, y: yPos, size: 11, font: regularFont, color: black });
            yPos -= 25;

            // Preamble
            const preamble = 'This Agreement sets forth the terms and conditions under which the Fellow agrees to maintain the confidentiality of information disclosed by the Company during the course of their work with the DeepCytes Fellowship Program.';
            let lines = this._wrapText(preamble, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }
            yPos -= 10;

            // 1. Confidential Information
            checkPageAdd();
            page.drawText('1. Confidential Information', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para1 = '"Confidential Information" refers to all technical, non-technical, proprietary, or sensitive information disclosed to the Fellow by the Company in connection with the Fellowship, including, but not limited to, product plans, processes, drawings, research, data, business operations, and any other information disclosed verbally, in writing, electronically, or in any other form.';
            lines = this._wrapText(para1, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            yPos -= 10;

            // 2. Fellow Obligations
            checkPageAdd();
            page.drawText('2. Fellow Obligations', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            checkPageAdd();
            page.drawText('The Fellow agrees to:', { x: margin, y: yPos, size: 11, font: regularFont });
            yPos -= 15;

            // 2.A
            checkPageAdd();
            page.drawText('A. Maintain Confidentiality:', { x: margin + 20, y: yPos, size: 11, font: boldFont });
            yPos -= 15;
            const para2A = 'Hold all Confidential Information in strict confidence and exercise a reasonable degree of care to prevent its disclosure to unauthorised third parties.';
            lines = this._wrapText(para2A, contentWidth - 20, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin + 20, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }
            yPos -= 5;

            // 2.B
            checkPageAdd();
            page.drawText('B. No Disclosure:', { x: margin + 20, y: yPos, size: 11, font: boldFont });
            yPos -= 15;
            const para2B = 'Not disclose, share, or otherwise make available the Confidential Information to any third party unless authorised in writing by the Company.';
            lines = this._wrapText(para2B, contentWidth - 20, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin + 20, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }
            yPos -= 5;

            // 2.C
            checkPageAdd();
            page.drawText('C. No Unauthorised Use:', { x: margin + 20, y: yPos, size: 11, font: boldFont });
            yPos -= 15;
            const para2C = 'Not reproduce, use, or exploit the Confidential Information for any purpose other than for the performance of duties for the Company.';
            lines = this._wrapText(para2C, contentWidth - 20, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin + 20, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }
            yPos -= 5;

            // 2.D
            checkPageAdd();
            page.drawText('D. Return of Materials:', { x: margin + 20, y: yPos, size: 11, font: boldFont });
            yPos -= 15;
            const para2D = 'Upon request or termination of the Fellowship, immediately return any materials, notes, documents, or equipment containing Confidential Information provided by the Company.';
            lines = this._wrapText(para2D, contentWidth - 20, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin + 20, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            yPos -= 10;

            // 3. Company's Rights
            checkPageAdd();
            page.drawText('3. Company’s Rights', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para3 = 'The Company retains the sole right to determine the treatment of any information disclosed, including the ability to keep it confidential, file patents, copyrights, or take other actions as deemed necessary.';
            lines = this._wrapText(para3, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            yPos -= 10;

            // 4. Intellectual Property
            checkPageAdd();
            page.drawText('4. Intellectual Property', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para4 = 'The Fellow agrees not to file any patents or seek any intellectual property rights related to developments or inventions arising from the use of Confidential Information. Any discoveries, inventions, or technologies developed during the Fellowship shall remain the property of the Company.';
            lines = this._wrapText(para4, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            yPos -= 10;

            // 5. Severability
            checkPageAdd();
            page.drawText('5. Severability', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para5 = 'If any provision of this Agreement is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions will remain valid and enforceable, and the Agreement shall continue as intended by the parties.';
            lines = this._wrapText(para5, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            yPos -= 10;

            // 6. Employment Terms
            checkPageAdd();
            page.drawText('6. Employment Terms', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para6 = 'This Agreement does not constitute a promise of continued employment or a guarantee of any specific employment term. The Fellow’s participation in the Fellowship remains subject to the "at-will" nature of their engagement.';
            lines = this._wrapText(para6, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            yPos -= 10;

            // 7. Violation and Consequences
            checkPageAdd();
            page.drawText('7. Violation and Consequences', { x: margin, y: yPos, size: 11, font: boldFont, color: black });
            yPos -= 15;
            const para7 = 'A violation of this Agreement may result in disciplinary action, up to and including termination from the Fellowship, in accordance with the Company’s policies.';
            lines = this._wrapText(para7, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            // Acknowledgment
            yPos -= 25;
            checkPageAdd(40); // Need more space for title
            page.drawText('Acknowledgment and Acceptance', { x: margin, y: yPos, size: 12, font: boldFont, color: primaryColor });
            yPos -= 20;
            const ackText = 'By signing below, both the Company and the Fellow acknowledge and accept the terms of this Confidentiality and Non-Disclosure Agreement.';
            lines = this._wrapText(ackText, contentWidth, 11, regularFont);
            for (const line of lines) {
                checkPageAdd();
                page.drawText(line, { x: margin, y: yPos, size: 11, font: regularFont });
                yPos -= 15;
            }

            yPos -= 40;
            checkPageAdd(40);
            page.drawText('AGREED:', {
                x: margin,
                y: yPos,
                size: 12,
                font: boldFont,
                color: black,
            });

            // ========== SIGNATURE SECTION (REPLICATED FROM OFFER LETTER) ==========
            // Add significantly more spacing before signatures to prevent overlap
            yPos -= 70;

            // Check if there's enough space for signatures, otherwise add page
            if (yPos < 150) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPos = pageHeight - margin - 50;
            }

            const leftColX = margin;
            const rightColX = pageWidth / 2 + 20;
            const signatureWidth = 180;
            const signatureBaseY = yPos;

            // === LEFT COLUMN: Shubham Pareek ===
            const signaturePath = path.join(__dirname, '../uploads/assets/SP Sign DCFP.png');
            if (fs.existsSync(signaturePath)) {
                const sigBytes = fs.readFileSync(signaturePath);
                const sigImage = await pdfDoc.embedPng(sigBytes);
                // Smaller scale and positioned further left/up based on feedback
                const sigDims = sigImage.scale(0.18); // Reduced size
                page.drawImage(sigImage, {
                    x: leftColX - 80, // More to left
                    y: signatureBaseY - 60, // Lowered
                    width: sigDims.width,
                    height: sigDims.height
                });
            }

            page.drawLine({ start: { x: leftColX, y: signatureBaseY - 50 }, end: { x: leftColX + signatureWidth, y: signatureBaseY - 50 }, thickness: 0.5, color: black });

            page.drawText('Mr. Shubham Pareek,', { x: leftColX, y: signatureBaseY - 65, size: 10, font: boldFont, color: black });
            page.drawText('Co-Founder | Global Alliance Officer', { x: leftColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: darkGray }); // Added Co-Founder
            page.drawText('DeepCytes Ventures', { x: leftColX, y: signatureBaseY - 91, size: 9, font: regularFont, color: darkGray });

            // === RIGHT COLUMN: Fellow ===
            const fellowName = `${applicantData.firstName} ${applicantData.lastName}`.toUpperCase();
            page.drawText(fellowName, { x: rightColX, y: signatureBaseY - 35, size: 12, font: regularFont, color: black }); // Times Roman, CAPS, Black
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
                const sigDims = sigImage.scale(0.18); // Reduced size
                page.drawImage(sigImage, {
                    x: leftColX - 80, // Moved even more left (was -40)
                    y: signatureBaseY - 60, // Moved down relative to base (was -35)
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
            const fellowName = `${fellowData.firstName} ${fellowData.lastName}`.toUpperCase();
            page.drawText(fellowName, {
                x: rightColX,
                y: signatureBaseY - 35,
                size: 12, // Standard size
                font: regularFont, // Times Roman
                color: black // Standard Black
            });

            // Line under Fellow's signature
            page.drawLine({
                start: { x: rightColX, y: signatureBaseY - 50 },
                end: { x: rightColX + signatureWidth, y: signatureBaseY - 50 },
                thickness: 0.5,
                color: black
            });

            page.drawText('(Signature)', { x: rightColX, y: signatureBaseY - 63, size: 8, font: italicFont, color: lightGray });

            const fellowDateText = `Date: ${today}`;
            page.drawText(fellowDateText, { x: rightColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: darkGray });

            // Footer watermark on all pages
            const pages = pdfDoc.getPages();
            pages.forEach((pg, idx) => {
                // Removed email from footer as requested
                pg.drawText(`DeepCytes Ventures | Offer Letter | Page ${idx + 1}/${pages.length}`, {
                    x: margin,
                    y: 30,
                    size: 8,
                    font: regularFont,
                    color: lightGray,
                    opacity: 0.6,
                });
            });

            // Save unprotected PDF
            const pdfBytes = await pdfDoc.save();

            const tempPath = path.join(path.dirname(outputPath), `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
            fs.writeFileSync(tempPath, pdfBytes);
            const protectedPath = path.join(path.dirname(outputPath), `prot_${crypto.randomBytes(4).toString('hex')}.pdf`);

            // Apply password protection
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

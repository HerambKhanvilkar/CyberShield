const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
// const muhammara = require('muhammara'); // removed — password protection disabled (muhammara not used)
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
        const uploadDir = path.join(__dirname, '../uploads/signed_documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeLastName = (applicantData.lastName || 'FELLOW').trim();
        const safePid = (applicantData.globalPid || 'PENDING').trim();
        const outputPath = path.join(uploadDir, `NDA_${safeLastName}_${Date.now()}.pdf`);
        // Password protection disabled — generate unprotected PDF
        const password = undefined;

        console.log(`[DOC_GEN] Generating NDA for ${applicantData.email}. PID: ${safePid}. (password protection disabled)`);

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

            page.drawText(title1, { x: margin, y: yPos, size: 14, font: boldFont, color: black });
            yPos -= 20;
            page.drawText(title2, { x: margin, y: yPos, size: 14, font: boldFont, color: black });

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
            page.drawText('Acknowledgment and Acceptance', { x: margin, y: yPos, size: 12, font: boldFont, color: black });
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

            // === LEFT COLUMN: Company representative + company signature (use template spsign.png if present) ===
            const companySigCandidates = [
                path.join(__dirname, '../uploads/templates/spsign.png'),
                path.join(__dirname, '../uploads/assets/SP Sign DCFP.png')
            ];
            let companySigPath = null;
            for (const p of companySigCandidates) { if (fs.existsSync(p)) { companySigPath = p; break; } }

            // Company signature image should only appear in signed PDFs (not in preview/unsigned)
            if (!signatureInfo?.isPreview && companySigPath) {
                const sigBytes = fs.readFileSync(companySigPath);
                // support PNG/JPEG automatically if possible (prefer PNG)
                let sigImage;
                try { sigImage = await pdfDoc.embedPng(sigBytes); }
                catch (e) { sigImage = await pdfDoc.embedJpg(sigBytes); }

                // Signed PDF: larger and shifted right per request
                const sigDims = sigImage.scale(0.75); // increased size for signed output
                page.drawImage(sigImage, {
                    x: leftColX + 10, // shift to the right so signature sits more prominently above the line
                    y: signatureBaseY - (sigDims.height / 2) - 8,
                    width: sigDims.width,
                    height: sigDims.height
                });
            }
            // If preview/unsigned, do not draw company signature image (keep signature area empty)


            page.drawLine({ start: { x: leftColX, y: signatureBaseY - 50 }, end: { x: leftColX + signatureWidth, y: signatureBaseY - 50 }, thickness: 0.5, color: black });

            page.drawText('Mr. Shubham Pareek,', { x: leftColX, y: signatureBaseY - 65, size: 10, font: boldFont, color: black });
            page.drawText('Co-Founder | Global Alliance Officer', { x: leftColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: black }); // Added Co-Founder
            page.drawText('DeepCytes Ventures', { x: leftColX, y: signatureBaseY - 91, size: 9, font: regularFont, color: black });

            // === RIGHT COLUMN: Fellow ===
            const fellowName = `${applicantData.firstName} ${applicantData.lastName}`.toUpperCase();
            page.drawText(fellowName, { x: rightColX, y: signatureBaseY - 35, size: 12, font: regularFont, color: black }); // Times Roman, CAPS, Black
            page.drawLine({ start: { x: rightColX, y: signatureBaseY - 50 }, end: { x: rightColX + signatureWidth, y: signatureBaseY - 50 }, thickness: 0.5, color: black });

            page.drawText('(Signature)', { x: rightColX, y: signatureBaseY - 63, size: 8, font: italicFont, color: black });

            const fellowDateText = `Date: ${today}`;
            page.drawText(fellowDateText, { x: rightColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: black });

            // Footer watermark on all pages
            const pages = pdfDoc.getPages();
            pages.forEach((pg, idx) => {
                // Removed email from footer as requested
                pg.drawText(`DeepCytes Ventures | Confidentiality Agreement | Page ${idx + 1}/${pages.length}`, {
                    x: margin,
                    y: 30,
                    size: 8,
                    font: regularFont,
                    color: black,
                    opacity: 0.6,
                });

                if (signatureInfo && signatureInfo.isPreview) {
                    pg.drawText('PREVIEW', {
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
            let protectedSuccessfully = false;
            try {
                muhammara.recrypt(tempPath, protectedPath, {
                    userPassword: password,
                    ownerPassword: crypto.randomBytes(32).toString('hex'),
                    userProtectionFlag: 4
                });
                if (fs.existsSync(protectedPath)) {
                    protectedSuccessfully = true;
                    fs.copyFileSync(protectedPath, outputPath);
                }
            } catch (e) {
                console.warn('[DOC_GEN] muhammara.recrypt failed, will use unprotected PDF as fallback:', e.message || e);
            }

            // If protection failed, copy the unprotected temp file instead
            if (!protectedSuccessfully) {
                fs.copyFileSync(tempPath, outputPath);
            }

            // Cleanup
            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (__) {}
            try { if (fs.existsSync(protectedPath)) fs.unlinkSync(protectedPath); } catch (__) {}

            const finalBytes = fs.readFileSync(outputPath);
            console.log(`[DOC_GEN] NDA Generated successfully: ${outputPath} (${finalBytes.length} bytes)`);
            const hash = crypto.createHash('sha256').update(finalBytes).digest('hex');

            // If protection failed, still return (password will be undefined)
            return { buffer: finalBytes, hash, path: outputPath, password: protectedSuccessfully ? password : undefined };
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
     * Generate Offer Letter using a PDF template (preferred) or fall back to previous builder
     */
    static async generateOfferLetter(fellowData, tenureData) {
        const uploadDir = path.join(__dirname, '../uploads/signed_documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeLastName = (fellowData.lastName || 'FELLOW').trim();
        const safePid = (fellowData.globalPid || 'PENDING').trim();
        const outputPath = path.join(uploadDir, `OfferLetter_${safeLastName}_${Date.now()}.pdf`);
        // Password protection disabled — generate unprotected PDF
        const password = undefined;

        console.log(`[DOC_GEN] Generating Offer Letter for ${fellowData.email}. PID: ${safePid}. (password protection disabled)`);
            const today = new Date();
        try {
            // Ensure templates dir exists and attempt to use a PDF form template
            const templatesDir = path.join(__dirname, '../uploads/templates');
            if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

            const localTemplate = path.join(templatesDir, 'Offer_Letter.pdf');

            // If no local template is present, the code falls back to the programmatic builder.

            if (!fs.existsSync(localTemplate)) {
                // As a fallback, reuse the old builder implementation (keeps behavior safe)
                console.warn('[DOC_GEN] Offer template not found. Falling back to programmatic builder.');
                console.log('[DOC_GEN] generateOfferLetter - USING PROGRAMMATIC BUILDER (no template present)');
            } else {
                console.log(`[DOC_GEN] generateOfferLetter - USING PDF TEMPLATE: ${localTemplate}`);
            }

            // If no template is present, execute the original programmatic builder and return
            if (!fs.existsSync(localTemplate)) {
                // Original builder code (kept as fallback)
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
                    const logoDims = logoImage.scale(0.25);
                    page.drawImage(logoImage, { x: margin, y: yPos - 55, width: logoDims.width, height: logoDims.height });
                    yPos -= 80;
                }

                page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 3, color: primaryColor });
                yPos -= 2;
                page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 1, color: primaryColor, opacity: 0.5 });

                yPos -= 35;
                const dateText = `Date: ${formatDate(today)}`;
                page.drawText(dateText, { x: pageWidth - margin - boldFont.widthOfTextAtSize(dateText, 11), y: yPos, size: 11, font: boldFont, color: black });

                yPos -= 18;
                const termText = `Fellowship Term: ${formatDate(tenureData.startDate)} - ${formatDate(tenureData.endDate || 'Ongoing')}`;
                page.drawText(termText, { x: pageWidth - margin - regularFont.widthOfTextAtSize(termText, 10), y: yPos, size: 10, font: regularFont, color: black });

                yPos -= 18;
                const roleText = `Role: ${tenureData.role}`;
                page.drawText(roleText, { x: pageWidth - margin - regularFont.widthOfTextAtSize(roleText, 10), y: yPos, size: 10, font: regularFont, color: black });

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
                        page.drawText(line, { x: margin, y: yPos, size: 11, font: i === 4 ? boldFont : regularFont, color: black });
                        yPos -= 16;
                    }
                    yPos -= 10;
                }

                yPos -= 70;

                const leftColX = margin;
                const rightColX = pageWidth / 2 + 20;
                const signatureWidth = 180;
                const signatureBaseY = yPos;

                const signaturePath = path.join(__dirname, '../uploads/assets/SP Sign DCFP.png');
                if (fs.existsSync(signaturePath)) {
                    const sigBytes = fs.readFileSync(signaturePath);
                    const sigImage = await pdfDoc.embedPng(sigBytes);
                    const sigDims = sigImage.scale(0.18);
                    page.drawImage(sigImage, {
                        x: leftColX - 80,
                        y: signatureBaseY - 60,
                        width: sigDims.width,
                        height: sigDims.height
                    });
                }

                page.drawLine({ start: { x: leftColX, y: signatureBaseY - 50 }, end: { x: leftColX + signatureWidth, y: signatureBaseY - 50 }, thickness: 0.5, color: rgb(0,0,0) });

                page.drawText('Mr. Shubham Pareek,', { x: leftColX, y: signatureBaseY - 65, size: 10, font: boldFont, color: rgb(0,0,0) });
                page.drawText('Co-Founder | Global Alliance Officer', { x: leftColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: black });
                page.drawText('DeepCytes Cyber Labs UK', { x: leftColX, y: signatureBaseY - 91, size: 9, font: regularFont, color: black });

                const fellowName = `${fellowData.firstName} ${fellowData.lastName}`.toUpperCase();
                page.drawText(fellowName, { x: rightColX, y: signatureBaseY - 35, size: 12, font: regularFont, color: rgb(0,0,0) });

                page.drawLine({ start: { x: rightColX, y: signatureBaseY - 50 }, end: { x: rightColX + signatureWidth, y: signatureBaseY - 50 }, thickness: 0.5, color: rgb(0,0,0) });

                page.drawText('(Signature)', { x: rightColX, y: signatureBaseY - 63, size: 8, font: italicFont, color: black });

                const fellowDateText = `Date: ${formatDate(today, true)}`;
                page.drawText(fellowDateText, { x: rightColX, y: signatureBaseY - 78, size: 9, font: regularFont, color: black });

                const pages = pdfDoc.getPages();
                pages.forEach((pg, idx) => {
                    pg.drawText(`DeepCytes Ventures | Offer Letter | Page ${idx + 1}/${pages.length}`, { x: margin, y: 30, size: 8, font: regularFont, color: black, opacity: 0.6 });
                });

                const pdfBytes = await pdfDoc.save();
                const tempPath = path.join(path.dirname(outputPath), `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
                fs.writeFileSync(tempPath, pdfBytes);
                const protectedPath = path.join(path.dirname(outputPath), `prot_${crypto.randomBytes(4).toString('hex')}.pdf`);

                // Password protection disabled — simply move temp -> output
                try {
                    fs.copyFileSync(tempPath, outputPath);
                } catch (e) {
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (__) {}
                    throw e;
                }

                try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (__) {}

                const finalBytes = fs.readFileSync(outputPath);
                console.log(`[DOC_GEN] Offer Letter Generated successfully (fallback, unprotected): ${outputPath} (${finalBytes.length} bytes)`);
                const hash = crypto.createHash('sha256').update(finalBytes).digest('hex');

                return { buffer: finalBytes, hash, path: outputPath, password: undefined };
            }

            // Load template and fill fields
            const originalBytes = fs.readFileSync(localTemplate);
            const pdfDoc = await PDFDocument.load(originalBytes);
            const form = pdfDoc.getForm();

            // using shared `today` variable defined above

            // Map values directly to PDF field names (fixed positions from OFFER_TEMPLATE_DEBUG)
            const formatDate = (d, includeTime = false) => {
                if (d === undefined || d === null) return '';
                // preserve 'Ongoing' literal
                if (typeof d === 'string' && d.toLowerCase && d.toLowerCase() === 'ongoing') return 'Ongoing';

                const pad = (n) => String(n).padStart(2, '0');
                let dateObj = null;

                if (d instanceof Date && !isNaN(d)) {
                    dateObj = d;
                } else if (typeof d === 'number') {
                    // treat 10-digit numbers as seconds
                    const ms = String(d).length === 10 ? d * 1000 : d;
                    dateObj = new Date(ms);
                    if (isNaN(dateObj)) return String(d);
                } else if (typeof d === 'string') {
                    const s = d.trim();
                    // already formatted like DD/MM/YYYY — return as-is (unless time requested)
                    if (s.includes('/') && !includeTime) return s;

                    // accept DDMMYYYY (e.g. 16022026)
                    if (/^\d{8}$/.test(s)) {
                        const day = parseInt(s.slice(0, 2), 10);
                        const month = parseInt(s.slice(2, 4), 10);
                        const year = parseInt(s.slice(4, 8), 10);
                        dateObj = new Date(year, month - 1, day);
                    } else {
                        const parsed = Date.parse(s);
                        if (!isNaN(parsed)) dateObj = new Date(parsed);
                        else return s;
                    }
                } else {
                    return String(d);
                }

                const day = pad(dateObj.getDate());
                const month = pad(dateObj.getMonth() + 1);
                const year = dateObj.getFullYear();
                const datePart = `${day}/${month}/${year}`;

                if (!includeTime) return datePart;

                const hours = pad(dateObj.getHours());
                const minutes = pad(dateObj.getMinutes());
                return `${datePart} ${hours}:${minutes}`;
            };

            const pdfFieldValues = {
                // visual positions discovered in the debug template:
                // text_1cuuy -> top Date
                // text_2kilj -> Fellowship Term (we'll place start - end)
                // text_3emom -> Role
                // text_4hrdq -> Dear <Full Name>
                // text_5vuet -> Signature Date
                // text_6jgkv -> Certificate ID (globalPid)
                text_1cuuy: formatDate(today),
                text_2kilj: `${formatDate(tenureData.startDate)} - ${formatDate(tenureData.endDate || 'Ongoing')}`,
                text_3emom: tenureData.role || '',
                text_4hrdq: `${(fellowData.firstName || '').trim()} ${(fellowData.lastName || '').trim()}`.trim(),
                text_5vuet: formatDate(today, true),
                text_6jgkv: fellowData.globalPid || ''
            };

            for (const [pdfFieldName, value] of Object.entries(pdfFieldValues)) {
                try {
                    const field = form.getTextField(pdfFieldName);
                    field.setText(String(value));
                } catch (err) {
                    console.warn(`[DOC_GEN] Could not set template field ${pdfFieldName}: ${err.message}`);
                }
            }

            // Flatten the form so it can't be edited
            form.flatten();

            // Save and protect
            const filledBytes = await pdfDoc.save();
            const tempPath = path.join(path.dirname(outputPath), `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
            fs.writeFileSync(tempPath, filledBytes);
            const protectedPath = path.join(path.dirname(outputPath), `prot_${crypto.randomBytes(4).toString('hex')}.pdf`);

            // Password protection disabled — directly use the filled temp PDF
            try {
                fs.copyFileSync(tempPath, outputPath);
            } catch (e) {
                try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (__) {}
                throw e;
            }

            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (__) {}
            try { if (fs.existsSync(protectedPath)) fs.unlinkSync(protectedPath); } catch (__) {}

            const finalBytes = fs.readFileSync(outputPath);
            console.log(`[DOC_GEN] Offer Letter Generated successfully (unprotected): ${outputPath} (${finalBytes.length} bytes)`);
            const hash = crypto.createHash('sha256').update(finalBytes).digest('hex');

            return { buffer: finalBytes, hash, path: outputPath, password: undefined };
        } catch (error) {
            console.error('Offer Letter Generation Error:', error);
            throw error;
        }
    }

    /**
     * Generate a secure PDF from an existing template by filling form fields.
     * Used as a generic fallback for documents that have a filled PDF template.
     * @param {String} templatePath - absolute path to a PDF template with form fields
     * @param {Object} fieldValues - key/value pairs to fill into form fields
     * @param {Object} signatureInfo - { type, data, isPreview }
     * @param {String} recipientEmail
     * @param {String} lastName
     * @param {String} pid
     */
    static async generateSecurePDF(templatePath, fieldValues = {}, signatureInfo = {}, recipientEmail = '', lastName = 'FELLOW', pid = 'PENDING') {
        if (!templatePath || !fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        const uploadDir = path.join(__dirname, '../uploads/signed_documents');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const safeLastName = (lastName || 'FELLOW').trim();
        const safePid = (pid || 'PENDING').trim();
        const outputPath = path.join(uploadDir, `Document_${safeLastName}_${Date.now()}.pdf`);
        // Password protection disabled — generate unprotected PDF
        const password = undefined;

        try {
            const originalBytes = fs.readFileSync(templatePath);
            const pdfDoc = await PDFDocument.load(originalBytes);

            // Try to fill AcroForm fields if present
            try {
                const form = pdfDoc.getForm();

                for (const [key, val] of Object.entries(fieldValues)) {
                    if (val === undefined || val === null) continue;
                    try {
                        const field = form.getTextField(key);
                        field.setText(String(val));
                    } catch (e) {
                        // Field not found by exact name - ignore and continue
                        console.warn(`[DOC_GEN] Template field not found for key='${key}': ${e.message}`);
                    }
                }

                // If signature provided and there's a field named 'signature' (common), try to set it
                if (signatureInfo && signatureInfo.type === 'TYPED' && signatureInfo.data) {
                    const sigCandidates = ['signature', 'Signature', 'Fellow_Signature', 'SignedBy'];
                    for (const name of sigCandidates) {
                        try {
                            const sf = form.getTextField(name);
                            sf.setText(String(signatureInfo.data));
                            break;
                        } catch (e) {
                            // not found - try next
                        }
                    }
                }

                // Flatten so fields are no longer editable
                form.flatten();
            } catch (e) {
                console.warn('[DOC_GEN] No form fields found or failed to set fields on template:', e.message);
            }

            // If preview requested, return unprotected bytes
            if (signatureInfo && signatureInfo.isPreview) {
                const previewBytes = await pdfDoc.save();
                return { buffer: previewBytes, path: null, hash: null };
            }

            // Save and apply password protection (same flow as other generators)
            const filledBytes = await pdfDoc.save();
            const tempPath = path.join(path.dirname(outputPath), `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
            fs.writeFileSync(tempPath, filledBytes);
            const protectedPath = path.join(path.dirname(outputPath), `prot_${crypto.randomBytes(4).toString('hex')}.pdf`);

            let protectedSuccessfully = false;
            try {
                muhammara.recrypt(tempPath, protectedPath, {
                    userPassword: password,
                    ownerPassword: crypto.randomBytes(32).toString('hex'),
                    userProtectionFlag: 4
                });
                if (fs.existsSync(protectedPath)) {
                    protectedSuccessfully = true;
                    fs.copyFileSync(protectedPath, outputPath);
                }
            } catch (e) {
                console.warn('[DOC_GEN] muhammara.recrypt failed for generateSecurePDF; using unprotected PDF as fallback:', e.message || e);
            }

            if (!protectedSuccessfully) {
                // Move temp -> output (unprotected)
                fs.copyFileSync(tempPath, outputPath);
            }

            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (__) {}
            try { if (fs.existsSync(protectedPath)) fs.unlinkSync(protectedPath); } catch (__) {}

            const finalBytes = fs.readFileSync(outputPath);
            const hash = crypto.createHash('sha256').update(finalBytes).digest('hex');

            console.log(`[DOC_GEN] Secure PDF generated from template: ${outputPath}`);
            return { buffer: finalBytes, hash, path: outputPath, password: protectedSuccessfully ? password : undefined };
        } catch (err) {
            console.error('generateSecurePDF error:', err);
            throw err;
        }
    }
}

module.exports = DocumentService;

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const muhammara = require('muhammara');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DocumentService {
    static async generateSecurePDF(templatePath, data, signatureInfo, userEmail, userLastName, userPid) {
        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const outputPath = path.join(uploadDir, `temp_${crypto.randomBytes(4).toString('hex')}.pdf`);
        const password = `${userLastName}_${userPid}`;
        const watermarkText = `DEEPCYTES R&D - ${userEmail} - ${new Date().toLocaleString()}`;

        try {
            // 1. Ensure template exists
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

            // 2. Add Signature Block
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

            // 3. Draw Signature
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

            // 4. Watermarks
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
}

module.exports = DocumentService;

const FellowshipProfile = require('../models/FellowshipProfile');
const emailService = require('./emailService');
const crypto = require('crypto');

class LifecycleManager {
    static async generateAndSendOTP(email) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // In a real scenario, you'd store this in an OTP model with expiry
        // For now, let's assume we have an Otp model or similar
        const Otp = require('../models/Otp');
        await Otp.findOneAndUpdate(
            { email },
            { code: otp, expiresAt: new Date(Date.now() + 10 * 60000) },
            { upsert: true, new: true }
        );

        await emailService.sendRegistrationOTP(email, otp);
        return true;
    }

    static async verifyOTP(email, code) {
        const Otp = require('../models/Otp');
        const record = await Otp.findOne({ email, code });
        if (!record || record.expiresAt < new Date()) return false;

        await Otp.deleteOne({ _id: record._id });
        return true;
    }

    static async getNextPid() {
        const lastProfile = await FellowshipProfile.findOne({ globalPid: /^F/ }).sort({ globalPid: -1 });
        if (!lastProfile || !lastProfile.globalPid) return "F00001";

        const currentHex = lastProfile.globalPid.substring(1);
        const nextVal = parseInt(currentHex, 16) + 1;
        return "F" + nextVal.toString(16).toUpperCase().padStart(5, '0');
    }

    static async signNDA(profileId, legalName) {
        const profile = await FellowshipProfile.findById(profileId);
        if (!profile) throw new Error("Profile not found");
        if (profile.nda.dateTimeUser !== "0") throw new Error("NDA already signed");

        const pid = await this.getNextPid();
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const timestampStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())} ${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;

        profile.globalPid = pid;
        profile.nda.signedName = legalName;
        profile.nda.dateTimeUser = timestampStr;
        profile.nda.dateTimeDC = timestampStr; // Near-simultaneous
        profile.onboardingState = 'OFFER';
        profile.status = 'ACTIVE';

        // Generate and Store Documents immediately
        try {
            const DocumentService = require('./DocumentService');

            // 1. Generate NDA
            const ndaResult = await DocumentService.generateNDA(
                { firstName: profile.firstName, lastName: profile.lastName, email: profile.email, globalPid: pid },
                { type: 'TYPED', data: legalName }
            );

            // 2. Generate Offer Letter for the first tenure
            const firstTenure = profile.tenures[0];
            const offerResult = await DocumentService.generateOfferLetter(
                { firstName: profile.firstName, lastName: profile.lastName, email: profile.email, globalPid: pid },
                {
                    role: firstTenure?.role || 'Fellow',
                    startDate: firstTenure?.startDate || now.toLocaleDateString('en-GB'),
                    endDate: firstTenure?.endDate || 'Ongoing'
                }
            );

            // Update Tenure with Signed Documents
            if (profile.tenures.length > 0) {
                profile.tenures[0].signedDocuments = {
                    nda: {
                        signedAt: timestampStr,
                        signedBy: legalName,
                        documentHash: ndaResult.hash,
                        signatureData: "[PROTECTED]",
                        signatureType: 'TYPED',
                        pdfPath: ndaResult.path
                    },
                    offerLetter: {
                        signedAt: timestampStr,
                        signedBy: "DeepCytes Ventures",
                        documentHash: offerResult.hash,
                        signatureData: "[OFFICIAL]",
                        signatureType: 'TYPED',
                        pdfPath: offerResult.path
                    }
                };
            }

            profile.nda.pdfHash = ndaResult.hash;
            profile.markModified('tenures');
        } catch (docErr) {
            console.error("Critical Post-Activation Document Generation Failure:", docErr);
            // We still proceed with activation, but log the error
        }

        await profile.save();
        return profile;
    }

    static async transitionState(profileId, nextState) {
        const profile = await FellowshipProfile.findById(profileId);
        if (!profile) throw new Error("Profile not found");

        const validTransitions = {
            'PROFILE': 'NDA',
            'NDA': 'OFFER',
            'OFFER': 'RESOURCES',
            'RESOURCES': 'RESEARCH',
            'RESEARCH': 'FEEDBACK',
            'FEEDBACK': 'COMPLETION'
        };

        if (validTransitions[profile.onboardingState] !== nextState) {
            throw new Error(`Invalid transition from ${profile.onboardingState} to ${nextState}`);
        }

        profile.onboardingState = nextState;
        await profile.save();
        return profile;
    }

    static async promoteFellow(profileId, promotionData) {
        const profile = await FellowshipProfile.findById(profileId);
        if (!profile) throw new Error("Profile not found");

        const lastTenure = profile.tenures[profile.tenures.length - 1];
        const oldRole = lastTenure ? lastTenure.role : "NONE";

        // Mark previous tenure as COMPLETED if it's currently ACTIVE
        if (lastTenure && lastTenure.status === 'ACTIVE') {
            lastTenure.status = 'COMPLETED';
            lastTenure.endDate = new Date();
            lastTenure.completionStatus = promotionData.completionStatus || 'PROMOTED';
        }

        // Add New Tenure
        profile.tenures.push({
            role: promotionData.role || oldRole,
            startDate: new Date(),
            status: promotionData.status || 'ACTIVE',
            cohort: promotionData.cohort || (lastTenure ? lastTenure.cohort : 'C1'),
            promotionInfo: {
                promotedFrom: oldRole,
                promotedTo: promotionData.role || oldRole
            }
        });

        // Reset onboarding state if re-signing is required (Deepcytes policy)
        profile.onboardingState = 'NDA';
        profile.nda.dateTimeUser = "0"; // Trigger re-verification

        await profile.save();
        return profile;
    }

    static async updateOnboardingState(profileId, newState) {
        const profile = await FellowshipProfile.findById(profileId);
        if (!profile) throw new Error("Profile not found");
        profile.onboardingState = newState;
        await profile.save();
        return profile;
    }
}

module.exports = LifecycleManager;

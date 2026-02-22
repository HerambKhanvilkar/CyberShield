"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, XCircle, Clock, ArrowRight, Mail, Calendar, ExternalLink } from "lucide-react";

export default function ApplicationStatus() {
        // Cooldown state for resend OTP
        const [resendCooldown, setResendCooldown] = useState(0);

        // Cooldown timer effect
        useEffect(() => {
            let timer;
            if (resendCooldown > 0) {
                timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            }
            return () => clearTimeout(timer);
        }, [resendCooldown]);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Result
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const router = useRouter();

    const handleSendOtp = async (e, isResend = false) => {
        if (e) e.preventDefault();
        if (isResend && resendCooldown > 0) return;
        setLoading(true);
        try {
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/register/otp`, { email });
            toast.success("OTP sent to your email!");
            setStep(2);
            setResendCooldown(45);
        } catch (error) {
            toast.error(error.response?.data?.msg || error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/check-status`, { email, otp });
            setResult(res.data);
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.msg || error.response?.data?.message || "Invalid OTP or application not found");
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = () => {
        if (!result) return;
        // Redirect to signup with pre-filled application email
        const query = new URLSearchParams({
            email: result.email,
            ref: 'hiring'
        }).toString();
        router.push(`/signup?${query}`);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a1a2f] to-[#0a0a23] text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
                {/* Blurred color blobs for background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/10 blur-[100px] rounded-full" />
                </div>

                <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    {/* Header */}
                    {step !== 3 && (
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 mb-4 shadow-lg">
                                <Search className="text-cyan-400 w-8 h-8" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight italic mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400">Fellowship Application Status</h1>
                            <p className="text-gray-400 text-base sm:text-lg mt-2">Monitor the status of your DeepCytes Fellowship application</p>
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-7">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter the email used for your application"
                                    className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-base"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 rounded-xl font-bold transition-all shadow-lg">
                                {loading ? "Searching for Application..." : "View Application Status"}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-7">
                            <div className="text-center mb-6">
                                <p className="text-base text-gray-400">A one-time passcode (OTP) has been sent to <span className="text-white font-semibold">{email}</span></p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Verification Code</label>
                                <Input
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    placeholder="Enter 6-digit code"
                                    className="bg-black/40 border-white/10 text-white h-12 text-center text-2xl tracking-[0.5em] font-mono rounded-xl"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl font-bold transition-all shadow-lg">
                                    {loading ? "Verifying..." : "Submit Verification Code"}
                                </Button>
                                <Button type="button" onClick={(e) => handleSendOtp(e, true)} disabled={resendCooldown > 0 || loading} className="w-full h-12 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 rounded-xl font-bold transition-all shadow-lg">
                                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                                </Button>
                                {resendCooldown > 0 && (
                                    <span className="text-xs text-gray-400 text-center">You may request a new code in {resendCooldown} seconds.</span>
                                )}
                            </div>
                            <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-500 hover:text-white transition-colors">Use a different email address</button>
                        </form>
                    )}

                    {step === 3 && result && (
                        <div className="text-center animate-in fade-in zoom-in duration-500">
                            {result.status === "PENDING" && (
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto border border-yellow-500/30 shadow-lg">
                                        <Clock className="text-yellow-400 w-10 h-10 animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-yellow-400">Application Under Review</h2>
                                        <p className="text-gray-400">Thank you for your interest, {result.firstName}. Your profile is currently under review. You will be notified via email once a decision has been made.</p>
                                    </div>
                                </div>
                            )}

                            {result.status === "INTERVIEW_SCHEDULED" && (
                                <div className="space-y-8 text-center animate-in fade-in zoom-in duration-700">
                                    <div className="mb-2">
                                        <img
                                            src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                                            className="h-12 mx-auto grayscale brightness-200"
                                            alt="DeepCytes Logo"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-cyan-400 w-8 h-8" />
                                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                                                Interview Scheduled
                                            </h2>
                                        </div>
                                        <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                                            Your interview has been scheduled. Please review the details below and ensure you are prepared at the designated time.
                                        </p>
                                    </div>

                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-left space-y-4 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
                                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />

                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60 mb-2">Interview Details</h3>

                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Date & Time:</span>
                                                <span className="text-white font-mono text-sm">
                                                    {result.interviewDetails?.scheduledAt ? new Date(result.interviewDetails.scheduledAt).toLocaleString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        timeZoneName: 'short'
                                                    }) : 'Unable to retrieve date.'}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Meeting Link:</span>
                                                <a
                                                    href={result.interviewDetails?.meetLink?.startsWith('http') ? result.interviewDetails.meetLink : `https://${result.interviewDetails?.meetLink}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 font-mono text-sm hover:underline flex items-center gap-2"
                                                >
                                                    Join Meeting <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Button
                                            onClick={() => window.open(result.interviewDetails?.meetLink?.startsWith('http') ? result.interviewDetails.meetLink : `https://${result.interviewDetails?.meetLink}`, '_blank')}
                                            className="w-full h-14 bg-[#38C8F8] hover:bg-[#2bb0dc] text-black font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-cyan-900/20 group"
                                        >
                                            Join Interview
                                        </Button>

                                        <div className="pt-4 border-t border-white/5 space-y-2">
                                            <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">[Secure Transmission Protocol: v4.1]</p>
                                            <p className="text-[10px] text-gray-400 px-4">
                                                Please ensure your audio and video equipment are functioning properly at least 5 minutes prior to your scheduled interview. For assistance, please contact our support team.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result.status === "REJECTED" && (
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30 shadow-lg">
                                        <XCircle className="text-red-400 w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-red-500">Application Unsuccessful</h2>
                                        <p className="text-gray-400">We appreciate your interest in DeepCytes, {result.firstName}. At this time, we are unable to offer you a position in the Fellowship. Your application will remain on file for future consideration.</p>
                                    </div>
                                    <Button onClick={() => router.push("/")} variant="outline" className="border-white/10 hover:bg-white/5">Return to Homepage</Button>
                                </div>
                            )}

                            {result.status === "ACCEPTED" && (
                                <div className="space-y-6">
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/40 relative shadow-lg">
                                        <CheckCircle className="text-green-400 w-12 h-12" />
                                        <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-extrabold text-green-400">Application Approved</h2>
                                        <p className="text-gray-300">Congratulations, {result.firstName}. You have been selected to join the DeepCytes Fellowship.</p>
                                    </div>

                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-left space-y-4 shadow-lg">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Next Steps: Account Activation</h3>
                                        <p className="text-sm text-gray-400">To proceed, please activate your account using the email address provided in your application:</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <Mail className="w-4 h-4 text-cyan-400" />
                                                <span className="text-sm font-mono truncate">{result.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => result.hasAccount ? router.push('/login?ref=hiring') : handleActivate()}
                                        className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-2xl font-bold shadow-xl shadow-green-900/20 text-lg group"
                                    >
                                        {result.hasAccount ? 'Access Fellowship Portal' : 'Activate Fellowship Account'}
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

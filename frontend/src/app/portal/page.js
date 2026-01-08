"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, XCircle, Clock, ArrowRight, Mail } from "lucide-react";

export default function ApplicationStatus() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Result
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const router = useRouter();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/register/otp`, { email });
            toast.success("OTP sent to your email!");
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
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
            toast.error(error.response?.data?.message || "Invalid OTP or application not found");
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
            <div className="min-h-screen bg-[#00040A] text-white flex flex-col items-center justify-center p-4">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 mb-4">
                            <Search className="text-cyan-400 w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Application Status</h1>
                        <p className="text-gray-400 text-sm mt-2">Track your progress in the DeepCytes Fellowship</p>
                    </div>

                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Registered Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your application email"
                                    className="bg-black/40 border-white/10 text-white h-12 rounded-xl"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-all">
                                {loading ? "Finding Application..." : "Check My Status"}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-400">An OTP has been sent to <span className="text-white font-semibold">{email}</span></p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Enter Verification Code</label>
                                <Input
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    placeholder="6-digit code"
                                    className="bg-black/40 border-white/10 text-white h-12 text-center text-2xl tracking-[0.5em] font-mono rounded-xl"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full h-12 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all">
                                {loading ? "Verifying..." : "View Result"}
                            </Button>
                            <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-500 hover:text-white transition-colors">Using a different email?</button>
                        </form>
                    )}

                    {step === 3 && result && (
                        <div className="text-center animate-in fade-in zoom-in duration-500">
                            {result.status === "PENDING" && (
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto border border-yellow-500/30">
                                        <Clock className="text-yellow-400 w-10 h-10 animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-yellow-400">Application Under Review</h2>
                                        <p className="text-gray-400">Sit tight, {result.firstName}! Our team is currently reviewing your expertise. You'll receive an email once a decision is made.</p>
                                    </div>
                                </div>
                            )}

                            {result.status === "REJECTED" && (
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                                        <XCircle className="text-red-400 w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-red-500">Not Selected This Time</h2>
                                        <p className="text-gray-400">Thank you for your interest in DeepCytes, {result.firstName}. While we can't move forward now, we keep all applications on file for future opportunities.</p>
                                    </div>
                                    <Button onClick={() => router.push("/")} variant="outline" className="border-white/10 hover:bg-white/5">Back to Home</Button>
                                </div>
                            )}

                            {result.status === "ACCEPTED" && (
                                <div className="space-y-6">
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/40 relative">
                                        <CheckCircle className="text-green-400 w-12 h-12" />
                                        <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-extrabold text-green-400">Welcome to the Team!</h2>
                                        <p className="text-gray-300">Congratulations {result.firstName}! You have been selected for the DeepCytes Fellowship.</p>
                                    </div>

                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-left space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Next Step: Account Activation</h3>
                                        <p className="text-sm text-gray-400">Please create your official account using the email address from your application:</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <Mail className="w-4 h-4 text-cyan-400" />
                                                <span className="text-sm font-mono truncate">{result.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button onClick={handleActivate} className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-2xl font-bold shadow-xl shadow-green-900/20 text-lg group">
                                        Create Fellowship Account
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

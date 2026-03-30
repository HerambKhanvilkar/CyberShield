"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Sparkles, ShieldCheck, Search, Mail, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

export default function ApplyLanding() {
    const [code, setCode] = useState("");
    const [activeTab, setActiveTab] = useState("apply"); // "apply" or "status"
    const router = useRouter();

    // Status Check State
    const [statusEmail, setStatusEmail] = useState("");
    const [statusOtp, setStatusOtp] = useState("");
    const [statusStep, setStatusStep] = useState("email"); // email, otp
    const [statusLoading, setStatusLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.trim()) {
            router.push(`/apply/${code.trim()}`);
        }
    };

    // Status Check Handlers
    const handleSendOtp = async () => {
        if (!statusEmail) return toast.error("Please enter your email");
        setStatusLoading(true);
        try {
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/register/otp`, { email: statusEmail });
            setStatusStep("otp");
            toast.success("OTP sent to your email!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!statusOtp) return toast.error("Please enter the OTP");
        setStatusLoading(true);
        try {
            const res = await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/validate-otp`, {
                email: statusEmail,
                otp: statusOtp
            });
            localStorage.setItem('accessToken', res.data.accessToken);
            toast.success("Login Successful! Redirecting...");
            router.push('/portal');
        } catch (error) {
            toast.error("Invalid OTP");
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Aesthetics */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="z-10 w-full max-w-xl"
                >
                    <div className="text-center mb-4">
                        <div className="inline-flex p-4 rounded-3xl bg-white/5 border border-white/10 mb-6 group">
                            <KeyRound className="w-10 h-10 text-cyan-400 group-hover:rotate-12 transition-transform" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                            UNLOCK YOUR <br />FUTURE.
                        </h1>
                        <p className="text-gray-500 text-lg max-w-md mx-auto">
                            Enter the unique Organization Code provided by your institution to begin your DeepCytes Fellowship application.
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex mb-6 bg-black/50 border border-white/10 rounded-2xl p-1">
                        <button
                            onClick={() => setActiveTab("apply")}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === "apply" ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}
                        >
                            Apply
                        </button>
                        <button
                            onClick={() => setActiveTab("status")}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === "status" ? "bg-cyan-500 text-black" : "text-gray-500 hover:text-white"}`}
                        >
                            Check Status
                        </button>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                        <AnimatePresence mode="wait">
                            {activeTab === "apply" ? (
                                <motion.form
                                    key="apply"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-6 relative z-10"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/70 ml-1">Access Credential</label>
                                        <Input
                                            placeholder="ORG-CODE"
                                            className="bg-black/50 border-white/10 text-center text-2xl h-20 tracking-[0.1em] font-black text-white placeholder:text-gray-800 rounded-2xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-16 text-xl font-black italic tracking-widest bg-white text-black hover:bg-cyan-400 hover:text-black transition-all rounded-2xl group"
                                    >
                                        CONTINUE TO FORM
                                        <Sparkles className="ml-2 w-5 h-5 group-hover:scale-125 transition-transform" />
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="status"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 relative z-10"
                                    onSubmit={(e) => e.preventDefault()}
                                >
                                    {statusStep === "email" ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/70 ml-1">Registered Email</label>
                                            <Input
                                                type="email"
                                                placeholder="your.email@institution.edu"
                                                className="bg-black/50 border-white/10 text-center text-2xl h-20 tracking-[0.1em] font-black text-white placeholder:text-gray-800 rounded-2xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
                                                value={statusEmail}
                                                onChange={(e) => setStatusEmail(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/70 ml-1">Enter OTP</label>
                                            <Input
                                                placeholder="000000"
                                                className="bg-black/50 border-white/10 text-center text-2xl h-20 tracking-[0.1em] font-black text-white placeholder:text-gray-800 rounded-2xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
                                                value={statusOtp}
                                                onChange={(e) => setStatusOtp(e.target.value)}
                                                maxLength={6}
                                            />
                                        </div>
                                    )}

                                    {statusStep === "email" ? (
                                        <Button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={statusLoading}
                                            className="w-full h-16 text-xl font-black italic tracking-widest bg-white text-black hover:bg-cyan-400 hover:text-black transition-all rounded-2xl group"
                                        >
                                            {statusLoading ? "Sending..." : "SEND OTP"}
                                            <Sparkles className="ml-2 w-5 h-5 group-hover:scale-125 transition-transform" />
                                        </Button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => setStatusStep("email")}
                                                variant="outline"
                                                className="flex-1 h-16 border-white/20 text-gray-400 hover:text-white rounded-2xl"
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleVerifyOtp}
                                                disabled={statusLoading}
                                                className="flex-1 h-16 bg-white text-black hover:bg-cyan-400 hover:text-black rounded-2xl font-black"
                                            >
                                                {statusLoading ? "Verifying..." : "Verify & Login"}
                                            </Button>
                                        </div>
                                    )}
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Verified System</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Gated Access</span>
                        </div>
                    </div> */}
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
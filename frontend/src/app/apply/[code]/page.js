"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { User, Calendar, Mail, FileText, Send, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ApplicationForm() {
    const { code } = useParams();
    const router = useRouter();

    const [org, setOrg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        otp: "",
        role: "",
        resume: ""
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [emailStep, setEmailStep] = useState("start"); // start, otp_sent, verified
    const [otpLoading, setOtpLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const res = await axios.get(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/org/${code}`);
                setOrg(res.data);
            } catch (error) {
                console.error("Org fetch error:", error);
                setErrorMsg(error.response?.data?.message || "Organization Code not found or has expired.");
            } finally {
                setLoading(false);
            }
        };
        if (code) fetchOrg();
    }, [code, router]);

    const handleSendOtp = async () => {
        if (!formData.email) return toast.error("Please enter email");
        setOtpLoading(true);
        try {
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/register/otp`, { email: formData.email });
            setEmailStep("otp_sent");
            toast.success("OTP sent to your email");
        } catch (error) {
            toast.error("Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setOtpLoading(true);
        try {
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/validate-otp`, {
                email: formData.email,
                otp: formData.otp
            });
            setEmailStep("verified");
            toast.success("Email Verified!");
        } catch (error) {
            toast.error("Invalid OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (emailStep !== "verified") return toast.error("Please verify your email.");
        if (!resumeFile && !formData.resume) return toast.error("Resume is mandatory.");

        setSubmitLoading(true);
        try {
            const data = new FormData();
            data.append("orgCode", code);
            data.append("email", formData.email);
            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            data.append("role", formData.role);
            if (resumeFile) data.append("resumeFile", resumeFile);
            data.append("data", JSON.stringify({ resumeLink: formData.resume }));

            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/apply`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Application Received!");
            router.push("/portal"); // Go to status check
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!org) return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <Navbar />
            <div className="max-w-md text-center space-y-6">
                <h1 className="text-4xl font-black italic text-red-500">ACCESS DENIED</h1>
                <p className="text-gray-400">{errorMsg || `The organization code ${code} was not found or has expired.`}</p>
                <Button onClick={() => router.push("/apply")} className="bg-white text-black hover:bg-gray-200 rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-xs">Try Another Code</Button>
            </div>
            <Footer />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 py-16 px-4">
                <div className="max-w-3xl mx-auto">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 sm:p-16 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 blur-[100px] rounded-full" />

                        <header className="mb-12 border-b border-white/5 pb-8 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">
                                <ShieldCheck className="w-3 h-3" /> Secure Application
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight italic mb-2">{org.name}</h1>
                            <p className="text-gray-500 font-medium">Application Reference — <span className="text-white font-mono">{code}</span></p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                            {/* Personal Info */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-gray-400 flex items-center gap-2"><User className="w-4 h-4" /> First Name</Label>
                                    <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required className="bg-black/50 border-white/10 h-12 rounded-xl focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-400 flex items-center gap-2">Last Name</Label>
                                    <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required className="bg-black/50 border-white/10 h-12 rounded-xl focus:border-cyan-500/50" />
                                </div>
                            </div>


                            {/* Email Verification */}
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                                <Label className="text-gray-400 flex items-center gap-2"><Mail className="w-4 h-4" /> Identity Verification (Email)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        disabled={emailStep !== "start"}
                                        required
                                        placeholder="institutional-email@domain.com"
                                        className="bg-black/40 border-white/10 h-12 rounded-xl"
                                    />
                                    {emailStep === "start" && (
                                        <Button type="button" onClick={handleSendOtp} disabled={otpLoading} className="h-12 bg-cyan-600 hover:bg-cyan-500 px-6 rounded-xl">
                                            {otpLoading ? "..." : "Send Code"}
                                        </Button>
                                    )}
                                    {emailStep === "verified" && (
                                        <div className="flex items-center gap-2 text-green-400 px-4 font-bold text-xs">
                                            <CheckCircle2 className="w-5 h-5" /> VERIFIED
                                        </div>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {emailStep === "otp_sent" && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-2">
                                            <Input placeholder="Enter 6-digit OTP" value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })} className="bg-black/40 border-white/10 h-12 text-center tracking-[0.2em] rounded-xl" />
                                            <Button type="button" onClick={handleVerifyOtp} disabled={otpLoading} className="h-12 bg-green-600 hover:bg-green-500 px-6 rounded-xl">
                                                Confirm
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <Label className="text-gray-400">Target Role</Label>
                                <Select onValueChange={val => setFormData({ ...formData, role: val })} required>
                                    <SelectTrigger className="bg-black/50 border-white/10 h-12 rounded-xl text-white">
                                        <SelectValue placeholder="Select Specialization" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f0f0f] text-white border-white/10">
                                        {org.formVars?.roles?.map(r => (
                                            <SelectItem key={r} value={r} className="hover:bg-white/10">{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Resume */}
                            <div className="space-y-4 border-t border-white/10 pt-8">
                                <Label className="text-gray-400 flex items-center gap-2"><FileText className="w-4 h-4" /> Academic Record / Portfolio</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={e => setResumeFile(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="h-24 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center transition-colors group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5">
                                            <span className="text-[10px] font-black uppercase text-gray-600">Upload PDF</span>
                                            <span className="text-xs font-mono mt-1 text-cyan-400">{resumeFile ? resumeFile.name.slice(0, 15) + '...' : 'Browse Documents'}</span>
                                        </div>
                                    </div>
                                    <div className="h-24 bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <span className="text-[10px] font-black uppercase text-gray-600 mb-1 block">Portfolio Link</span>
                                        <Input
                                            value={formData.resume}
                                            onChange={e => setFormData({ ...formData, resume: e.target.value })}
                                            placeholder="Drive or GitHub link"
                                            className="bg-transparent border-0 border-b border-white/10 rounded-none h-8 px-0 focus:ring-0 focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitLoading || emailStep !== "verified"}
                                className="w-full h-16 text-xl font-black italic tracking-[0.1em] bg-white text-black hover:bg-cyan-400 transition-all rounded-[2rem] shadow-2xl shadow-cyan-500/10 group"
                            >
                                {submitLoading ? "TRANSMITTING DATA..." : "TRANSMIT APPLICATION"}
                                <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Button>

                        </form>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

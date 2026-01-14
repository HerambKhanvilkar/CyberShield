"use client";

import { useEffect, useState, useRef } from "react";
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
    const [showConfetti, setShowConfetti] = useState(false);
    const confettiTimeout = useRef(null);
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
        roles: [],
        resume: "",
        whyFellowship: "",
        innovativeIdeas: "",
        consent: false
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
        // Frontend domain whitelist check
        if (org && Array.isArray(org.emailDomainWhitelist)) {
            const emailDomain = formData.email.split('@')[1]?.toLowerCase();
            const allowed = org.emailDomainWhitelist.map(d => d.toLowerCase()).includes(emailDomain);
            if (!allowed) {
                toast.error(`Email domain @${emailDomain} is not allowed for registration. If you believe this is an error, try using your institutional email or reach out for support.`);
                return;
            }
        }
        setOtpLoading(true);
        try {
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/register/otp`, {
                email: formData.email,
                orgCode: code
            });
            setEmailStep("otp_sent");
            toast.success("OTP sent to your email");
        } catch (error) {
            const errorMsg = error.response?.data?.msg || error.response?.data?.message || error.message || "Failed to send OTP";
            toast.error(errorMsg);
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
        if (!formData.roles || formData.roles.length === 0) return toast.error("Please select at least one role.");
        if (formData.whyFellowship.length < 100) return toast.error("Motivation must be at least 100 characters.");
        if (!resumeFile && !formData.resume) return toast.error("Resume/Portfolio is mandatory.");
        if (formData.roles.length > 2) return toast.error("You can select up to 2 roles only.");

        setSubmitLoading(true);
        try {
            const data = new FormData();
            data.append("orgCode", code);
            data.append("email", formData.email);
            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            // Primary Role for backward compatibility
            data.append("roles", JSON.stringify(formData.roles));

            data.append("whyJoin", formData.whyFellowship);
            data.append("ideas", formData.innovativeIdeas);
            if (resumeFile) data.append("resumeFile", resumeFile);
            data.append("data", JSON.stringify({ resumeLink: formData.resume }));

            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/apply`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Application Received!");
            router.push("/portal");
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <Footer />
        </div>
    );

    if (!org) return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-2 sm:px-6 py-8 sm:py-16">
                <div className="w-full max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 md:p-16 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full" />
                        <header className="mb-8 sm:mb-12 border-b border-white/5 pb-6 sm:pb-8 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-red-400 mb-4">
                                <ShieldCheck className="w-3 h-3 text-red-400" /> ORG CODE AUTHORIZATION FAILURE
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight italic mb-2 text-red-500 drop-shadow">ACCESS DENIED</h1>
                        </header>
                        <div className="text-center space-y-6 relative z-10">
                            <p className="text-gray-400 text-lg font-medium">{errorMsg || `The organization code ${code} was not found or has expired.`}</p>
                            <Button onClick={() => router.push("/apply")} className="bg-white text-black hover:bg-gray-200 rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-xs shadow-lg transition-all">Try Another Code</Button>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );

    return (

        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-2 sm:px-6 py-8 sm:py-16">
                <div className="w-full max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 md:p-16 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 blur-[100px] rounded-full" />
                        <header className="mb-7 sm:mb-10 border-b border-white/5 pb-5 sm:pb-7 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-cyan-400 mb-4">
                                <ShieldCheck className="w-3 h-3" /> Secure Application
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight italic mb-2 leading-tight">Fellowship | DeepCytes Cyber Labs UK</h1>
                            <p className="text-gray-400 text-base sm:text-lg font-semibold mb-2">Organization: {org.name}</p>
                            <div className="text-gray-300 text-sm sm:text-base space-y-2">
                                <p>As part of our global community, you will join a diverse and talented group of individuals who are passionate about using their skills to combat cybercrime and organized digital threats worldwide. This is your opportunity to contribute to innovative, impactful projects and collaborate with experts in the field of cybersecurity.</p>
                                <p>We’re looking for creative problem-solvers, dedicated learners, and future leaders in cybersecurity. If you believe you have the skills and passion to make an impact, we want to hear from you!</p>
                            </div>
                        </header>
                        <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-10 relative z-10">
                            {/* Personal Info */}
                            <div className="mb-2">
                                <p className="text-cyan-300 text-xs sm:text-sm font-semibold mb-2">Please enter your name as it appears on your official documents</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-gray-400 flex items-center gap-2 text-sm sm:text-base"><User className="w-4 h-4" /> First Name</Label>
                                    <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required className="bg-black/50 border-white/10 h-10 sm:h-12 rounded-xl focus:border-cyan-500/50 text-sm sm:text-base" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">Last Name</Label>
                                    <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required className="bg-black/50 border-white/10 h-10 sm:h-12 rounded-xl focus:border-cyan-500/50 text-sm sm:text-base" />
                                </div>
                            </div>
                            {/* Email Verification */}
                            <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                                <Label className="text-gray-400 flex items-center gap-2 text-sm sm:text-base"><Mail className="w-4 h-4" /> Identity Verification (Email)</Label>
                                <div className="flex gap-2 flex-wrap">
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        disabled={emailStep !== "start"}
                                        required
                                        placeholder="institutional-email@domain.com"
                                        className="bg-black/40 border-white/10 h-10 sm:h-12 rounded-xl min-w-[160px] text-sm sm:text-base"
                                    />
                                    {emailStep === "start" && (
                                        <Button type="button" onClick={handleSendOtp} disabled={otpLoading} className="h-10 sm:h-12 bg-cyan-600 hover:bg-cyan-500 px-5 rounded-xl text-sm sm:text-base">
                                            {otpLoading ? "..." : "Send Code"}
                                        </Button>
                                    )}
                                    {emailStep === "verified" && (
                                        <div className="flex items-center gap-2 text-green-400 px-3 font-bold text-xs sm:text-sm">
                                            <CheckCircle2 className="w-5 h-5" /> VERIFIED
                                        </div>
                                    )}
                                </div>

                                {org.emailDomainWhitelist && org.emailDomainWhitelist.length > 0 && emailStep === "start" && (
                                    <div className="mt-2 flex flex-wrap gap-2 px-1">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Authorized Domains:</span>
                                        {org.emailDomainWhitelist.map(domain => (
                                            <span key={domain} className="text-[10px] text-cyan-500/70 font-mono">@{domain}</span>
                                        ))}
                                    </div>
                                )}

                                <AnimatePresence>
                                    {emailStep === "otp_sent" && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-2 flex-wrap">
                                            <Input placeholder="Enter 6-digit OTP" value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })} className="bg-black/40 border-white/10 h-10 sm:h-12 text-center tracking-[0.2em] rounded-xl min-w-[100px] text-sm sm:text-base" />
                                            <Button type="button" onClick={handleVerifyOtp} disabled={otpLoading} className="h-10 sm:h-12 bg-green-600 hover:bg-green-500 px-5 rounded-xl text-sm sm:text-base">
                                                Confirm
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {/* Role Selection */}
                            <div className="space-y-4">
                                <Label className="text-gray-400 text-sm sm:text-base flex items-center gap-2">
                                    Target Roles (Select up to 2)
                                </Label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {(org.formVars?.roles || []).map((role) => {
                                        const roleName = typeof role === 'object' ? role.name : role;
                                        const isSelected = formData.roles.includes(roleName);
                                        return (
                                            <button
                                                key={roleName}
                                                type="button"
                                                onClick={() => {
                                                    let newRoles = [...formData.roles];
                                                    if (isSelected) {
                                                        newRoles = newRoles.filter(r => r !== roleName);
                                                    } else {
                                                        if (newRoles.length >= 2) {
                                                            // Automatic unselection post overflow: drop the first one
                                                            newRoles.shift();
                                                        }
                                                        newRoles.push(roleName);
                                                    }
                                                    setFormData({ ...formData, roles: newRoles });
                                                }}
                                                className={`p-4 rounded-xl border text-sm font-bold transition-all duration-200 text-left flex items-center justify-between group ${isSelected
                                                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/[0.08]"
                                                    }`}
                                            >
                                                <span className="truncate">{roleName}</span>
                                                {isSelected && (
                                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-in zoom-in duration-300" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Resume */}
                            <div className="space-y-3 border-t border-white/10 pt-7">
                                <Label className="text-gray-400 flex items-center gap-2 text-sm sm:text-base"><FileText className="w-4 h-4" /> Academic Record / Portfolio</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={e => setResumeFile(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="h-20 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center transition-colors group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5">
                                            <span className="text-xs font-black uppercase text-gray-600">Upload PDF</span>
                                            <span className="text-xs font-mono mt-1 text-cyan-400">{resumeFile ? resumeFile.name.slice(0, 15) + '...' : 'Browse Documents'}</span>
                                        </div>
                                    </div>
                                    <div className="h-20 bg-white/5 rounded-2xl p-3 border border-white/5">
                                        <span className="text-xs font-black uppercase text-gray-600 mb-1 block">Portfolio Link</span>
                                        <Input
                                            value={formData.resume}
                                            onChange={e => setFormData({ ...formData, resume: e.target.value })}
                                            placeholder="Drive or GitHub link"
                                            className="bg-transparent border-0 border-b border-white/10 rounded-none h-8 px-0 focus:ring-0 focus:border-cyan-500 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="border-t border-white/10 pt-7 space-y-5">
                                <div>
                                    <Label className="text-gray-400 font-bold mb-2 block text-base sm:text-lg">Why should we select you for the DeepCytes Network?</Label>
                                    <textarea
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white min-h-[120px] focus:border-cyan-500/50 focus:ring-0 resize-none text-sm sm:text-base"
                                        placeholder="In 100-200 words, tell us about your skills, research abilities, and why you’re passionate about the field of cybersecurity."
                                        value={formData.whyFellowship || ''}
                                        onChange={e => setFormData({ ...formData, whyFellowship: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-400 font-bold mb-2 block text-base sm:text-lg">Do you have any innovative ideas or projects you would like to pursue?</Label>
                                    <textarea
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white min-h-[120px] focus:border-cyan-500/50 focus:ring-0 resize-none text-sm sm:text-base"
                                        placeholder="Share any innovative ideas or projects you would like to pursue as part of the network."
                                        value={formData.innovativeIdeas || ''}
                                        onChange={e => setFormData({ ...formData, innovativeIdeas: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Submission Description */}
                            <div className="mt-7 mb-4 p-4 bg-cyan-900/10 border border-cyan-400/20 rounded-2xl text-cyan-200 text-sm sm:text-base font-medium shadow-cyan-500/10 shadow">
                                We’re excited to learn more about you and your potential to join our mission in building a safer digital world. Please ensure that all details are accurate before submitting.
                            </div>

                            {/* Consent Checkbox */}
                            <div className="flex flex-col items-start gap-2 mb-3">
                                <span className="text-white text-sm sm:text-base mb-1">
                                    <span className="font-semibold">By submitting this form, you agree to the use of your data for selection purposes and potential future opportunities within the DeepCytes network.</span>
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer select-none text-sm sm:text-base">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.consent || false}
                                        onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                                        className="accent-cyan-500 w-5 h-5 rounded border border-cyan-400 bg-black/40 focus:ring-2 focus:ring-cyan-500 transition-all"
                                    />
                                    <span className="text-white">I consent to the use of my data for these purposes.</span>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitLoading || emailStep !== "verified" || !formData.consent}
                                className="w-full h-12 sm:h-14 text-base sm:text-lg font-black italic tracking-[0.05em] sm:tracking-[0.1em] bg-white text-black hover:bg-cyan-400 transition-all rounded-[2rem] shadow-2xl shadow-cyan-500/10 group flex items-center justify-center px-3 sm:px-6 whitespace-normal"
                            >
                                <span className="flex-1 text-center truncate">{submitLoading ? "TRANSMITTING DATA..." : "TRANSMIT APPLICATION"}</span>
                                <Send className="ml-2 sm:ml-3 w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
                            </Button>
                        </form>
                    </motion.div>
                    {/* Application Status Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 mb-4 bg-white/[0.02] border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 md:p-16 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 blur-[100px] rounded-full" />
                        <header className="mb-4 border-b border-white/5 pb-4 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-cyan-400 mb-2">
                                <ShieldCheck className="w-3 h-3" /> Application Status
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight italic mb-2 leading-tight text-cyan-500">Applied already?</h2>
                        </header>
                        <div className="text-center space-y-4 relative z-10">
                            <p className="text-gray-300 text-sm sm:text-base mb-2">Check your application status here and track your progress in the DeepCytes Network.</p>
                            <Button
                                type="button"
                                onClick={() => router.push('/portal')}
                                className="w-full h-12 sm:h-14 text-base sm:text-lg font-black italic tracking-[0.05em] sm:tracking-[0.1em] bg-white text-black hover:bg-cyan-400 transition-all rounded-[2rem] shadow-2xl shadow-cyan-500/10 group flex items-center justify-center px-3 sm:px-6 whitespace-normal"
                            >
                                <span className="flex-1 text-center truncate">CHECK APPLICATION STATUS</span>
                                <ChevronRight className="ml-2 sm:ml-3 w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>

    );
}

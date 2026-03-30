"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Sparkles, ShieldCheck, Search, Mail, ArrowRight, Quote, User, Star } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { Marquee } from "@/components/magicui/marquee";
import { BoxReveal } from "@/components/magicui/box-reveal";
import TronCircuitBackground from "@/components/ParticleBackground";
import { Shield, Cpu, Globe, Terminal, Lock } from "lucide-react";

export default function ApplyLanding() {
    const [code, setCode] = useState("");
    const [activeTab, setActiveTab] = useState("apply"); // "apply" or "status"
    const router = useRouter();

    const alumniFeedback = [
        {
            name: "Sarah Chen",
            role: "Cybersecurity Analyst",
            cohort: "C1-2024",
            feedback: "The DeepCytes fellowship provided me with hands-on experience in threat intelligence that was truly transformative. The mentorship was world-class.",
            image: "SC"
        },
        {
            name: "Marcus Thorne",
            role: "Penetration Tester",
            cohort: "C2-2024",
            feedback: "Working on real-world malware analysis projects helped me bridge the gap between theory and practice. Highly recommend for serious researchers.",
            image: "MT"
        },
        {
            name: "Elena Rodriguez",
            role: "Security Researcher",
            cohort: "C1-2024",
            feedback: "The community and mentorship at DeepCytes are unparalleled. I've grown so much as a researcher and secured a top-tier role post-fellowship.",
            image: "ER"
        },
        {
            name: "David Kim",
            role: "AI Cyber Lab Analyst",
            cohort: "C1-2025",
            feedback: "Integrating AI with cybersecurity was a challenge, but the resources here made it possible. A very forward-thinking program.",
            image: "DK"
        },
        {
            name: "Aisha Khan",
            role: "Digital Forensics Analyst",
            cohort: "C2-2024",
            feedback: "The forensics modules were incredibly detailed. The direct interaction with industry experts is what sets DeepCytes apart.",
            image: "AK"
        },
        {
            name: "John Doe",
            role: "Red Team Analyst",
            cohort: "C3-2024",
            feedback: "The labs are intense and simulate real-world attacks perfectly. It's the best investment I've made for my career in cybersecurity.",
            image: "JD"
        }
    ];

    const TestimonialCard = ({ name, role, cohort, feedback, image }) => (
        <div className="w-[300px] md:w-[350px] p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 flex flex-col gap-4 group hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-cyan-500/20">
                    {image}
                </div>
                <div>
                    <h4 className="font-bold text-white text-sm">{name}</h4>
                    <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{role} • {cohort}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    ))}
                </div>
            </div>
            <div className="relative">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-white/5 -rotate-12" />
                <p className="text-gray-400 text-sm leading-relaxed relative z-10 italic">
                    "{feedback}"
                </p>
            </div>
        </div>
    );

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

    // Floating Background Icons
    const FloatingIcon = ({ icon: Icon, delay, initialX, initialY }) => (
        <motion.div
            initial={{ x: initialX, y: initialY, opacity: 0 }}
            animate={{
                y: [initialY - 20, initialY + 20, initialY - 20],
                opacity: [0.1, 0.3, 0.1],
                rotate: [0, 10, -10, 0]
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                delay,
                ease: "easeInOut"
            }}
            className="absolute z-0 pointer-events-none text-cyan-500/20 hidden lg:block"
        >
            <Icon size={120} strokeWidth={0.5} />
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
            <TronCircuitBackground />

            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />

            <Navbar />

            {/* Floating Elements (Background) */}
            <FloatingIcon icon={Shield} delay={0} initialX="5%" initialY="15%" />
            <FloatingIcon icon={Cpu} delay={2} initialX="90%" initialY="20%" />
            <FloatingIcon icon={Globe} delay={4} initialX="85%" initialY="75%" />
            <FloatingIcon icon={Lock} delay={1} initialX="10%" initialY="80%" />

            <main className="flex-1 flex flex-col lg:flex-row items-stretch justify-center relative z-10 pt-20 lg:pt-0">

                {/* Left Section: Social Proof (Alumni) */}
                <section className="flex-1 flex flex-col items-center lg:items-end justify-center px-4 lg:px-12 py-6 lg:py-0 relative">
                    <div className="max-w-md w-full text-center lg:text-right mb-6 lg:mb-0 relative z-10">
                        <BoxReveal boxColor="#06b6d4" duration={0.5}>
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black italic tracking-tighter mb-2 bg-gradient-to-l from-white via-cyan-100 to-gray-600 bg-clip-text text-transparent leading-none">
                                VOICES OF <br />ALUMNI.
                            </h2>
                        </BoxReveal>
                        <p className="text-cyan-500/50 text-[8px] uppercase tracking-[0.4em] font-black mt-1 mb-4">
                            [ System_Report // Success_Logs ]
                        </p>

                        <div className="relative h-[220px] lg:h-[450px] w-full overflow-hidden mask-fade-y">
                            <Marquee vertical pauseOnHover className="[--duration:60s] py-2">
                                {alumniFeedback.map((f, i) => (
                                    <TestimonialCard key={i} {...f} />
                                ))}
                            </Marquee>
                        </div>

                        <div className="mt-6 flex flex-col lg:items-end items-center gap-3">
                            <a
                                href="/alumni"
                                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/70 hover:text-cyan-400 transition-colors"
                            >
                                <span className="underline underline-offset-4">[ VIEW_FULL_ARCHIVES ]</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <div className="flex -space-x-3 mt-2">
                                {alumniFeedback.slice(0, 5).map((f, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050505] bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                        {f.image}
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-[#050505] bg-cyan-500 flex items-center justify-center text-[8px] font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                    +500
                                </div>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                                JOINED BY <span className="text-white">500+ PROFESSIONALS</span> GLOBAL
                            </p>
                        </div>
                    </div>
                </section>

                {/* Vertical Divider (Desktop Only) */}
                <div className="hidden lg:flex w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black border border-cyan-500/50 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Right Section: Core Interaction (Apply) */}
                <section className="flex-1 flex flex-col items-center lg:items-start justify-center px-6 lg:px-12 py-12 lg:py-0 relative overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-xl w-full text-center lg:text-left relative z-10"
                    >
                        <div className="mb-8">
                            {/* Top Status Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/10 border border-cyan-500/20 text-[10px] font-black tracking-[0.2em] text-cyan-400 mb-6"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                PROTOCOL_CMD: ACCESS_GATEWAY // COHORT_C2_2025: OPEN
                            </motion.div>

                            <BoxReveal boxColor="#06b6d4" duration={0.5}>
                                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter mb-3 bg-gradient-to-r from-white via-cyan-100 to-gray-700 bg-clip-text text-transparent leading-none">
                                    UNLOCK YOUR <br />FUTURE.
                                </h1>
                            </BoxReveal>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="text-gray-500 text-[10px] md:text-sm max-w-sm mt-3 px-4 lg:px-0"
                            >
                                Provide security credentials to initiate the <span className="text-cyan-400 font-bold italic">DeepCytes Fellowship</span> protocol.
                            </motion.p>
                        </div>

                        <div className="relative group max-w-sm lg:mx-0">
                            {/* Border Beam Animation */}
                            <div className="absolute -inset-[2px] rounded-[1.4rem] md:rounded-[2rem] bg-gradient-to-r from-cyan-500 via-transparent to-purple-500 opacity-30 blur-sm group-hover:opacity-100 transition-opacity duration-1000 overflow-hidden">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_340deg,#06b6d4_360deg)]"
                                />
                            </div>

                            <div className="relative bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-[1.3rem] md:rounded-[1.8rem] p-5 lg:p-7 shadow-2xl overflow-hidden ring-1 ring-white/5">
                                {/* Tab Switcher */}
                                <div className="flex mb-5 md:mb-6 bg-slate-950/80 border border-white/5 rounded-2xl p-1">
                                    <button
                                        onClick={() => setActiveTab("apply")}
                                        className={`flex-1 py-2.5 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === "apply" ? "bg-white text-black" : "text-gray-600 hover:text-white"}`}
                                    >
                                        [ Apply ]
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("status")}
                                        className={`flex-1 py-2.5 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === "status" ? "bg-cyan-500 text-black" : "text-gray-600 hover:text-white"}`}
                                    >
                                        [ Status ]
                                    </button>
                                </div>

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
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/70 block ml-1 text-left">Access_Credential</label>
                                                <div className="relative group/input">
                                                    <div className="absolute -inset-0.5 bg-cyan-500/20 blur opacity-0 group-focus-within/input:opacity-100 transition duration-500 rounded-2xl" />
                                                    <Input
                                                        placeholder="ORG-CODE"
                                                        className="relative bg-slate-950/80 border-white/10 text-center text-xl md:text-2xl h-14 md:h-16 tracking-[0.2em] font-black text-white placeholder:text-gray-900 rounded-xl focus:border-cyan-500/50 focus:ring-0 transition-all font-mono"
                                                        value={code}
                                                        onChange={(e) => setCode(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-14 md:h-16 text-base md:text-lg font-black italic tracking-[0.2em] bg-white text-black hover:bg-cyan-400 hover:text-black transition-all rounded-xl group shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-cyan-500/40"
                                            >
                                                INIT_PROTOCOL
                                                <Sparkles className="ml-3 w-4 h-4 md:w-5 md:h-5 group-hover:scale-125 group-hover:rotate-12 transition-transform" />
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
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/70 block ml-1 text-left">Registered_Auth_Email</label>
                                                    <Input
                                                        type="email"
                                                        placeholder="EMAIL-ADDRESS"
                                                        className="bg-slate-950/80 border-white/10 text-center text-lg md:text-xl h-14 md:h-16 tracking-[0.1em] font-black text-white placeholder:text-gray-900 rounded-xl focus:border-cyan-500/50 transition-all"
                                                        value={statusEmail}
                                                        onChange={(e) => setStatusEmail(e.target.value)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/70 block ml-1 text-left">Transmission_Key (OTP)</label>
                                                    <Input
                                                        placeholder="0 0 0 0 0 0"
                                                        className="bg-slate-950/80 border-white/10 text-center text-xl md:text-2xl h-14 md:h-16 tracking-[0.3em] font-black text-white placeholder:text-gray-900 rounded-xl focus:border-cyan-500/50 transition-all font-mono"
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
                                                    className="w-full h-14 md:h-16 text-base md:text-lg font-black italic tracking-[0.2em] bg-white text-black hover:bg-cyan-400 hover:text-black transition-all rounded-xl group"
                                                >
                                                    {statusLoading ? "[ AUTH... ]" : "AUTHENTICATE"}
                                                    <ArrowRight className="ml-3 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
                                                </Button>
                                            ) : (
                                                <div className="flex gap-4">
                                                    <Button
                                                        type="button"
                                                        onClick={() => setStatusStep("email")}
                                                        variant="outline"
                                                        className="flex-1 h-14 md:h-16 border-white/10 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl font-black tracking-widest uppercase text-[10px]"
                                                    >
                                                        [ Back ]
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={handleVerifyOtp}
                                                        disabled={statusLoading}
                                                        className="flex-[2] h-14 md:h-16 bg-white text-black hover:bg-cyan-400 hover:text-black rounded-2xl font-black tracking-widest italic text-xs md:text-sm"
                                                    >
                                                        {statusLoading ? "VERIFYING..." : "GRANT_ACCESS"}
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Encryption: Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Gated Auth</span>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Cyber Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-cyan-500/20 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-cyan-500/20 pointer-events-none" />
            </main>

            <Footer />

            <style jsx global>{`
                .mask-fade-y {
                    mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
                }
            `}</style>
        </div>
    );
}


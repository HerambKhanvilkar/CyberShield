"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Globe, Zap, ShieldCheck, Database, Cpu, Brain, Rocket, ChevronRight, ChevronLeft } from "lucide-react";

const PROJECTS = [
    { title: "Neuro-Encryption Engine", status: "COMPLETED", description: "Biometric-based dynamic encryption for high-security neural interfaces.", icon: <Brain />, color: "from-purple-500 to-indigo-600" },
    { title: "Ghost Protocol 2.0", status: "WIP", description: "Decentralized anonymization layer for public infrastructure.", icon: <ShieldCheck />, color: "from-cyan-500 to-blue-600" },
    { title: "Quantum-Resistant Ledger", status: "COMPLETED", description: "Lattice-based cryptography for long-term data preservation.", icon: <Database />, color: "from-green-500 to-emerald-600" },
    { title: "Synth-Intelligence Optimizer", status: "WIP", description: "Real-time edge computing optimization for LLM deployment.", icon: <Cpu />, color: "from-orange-500 to-red-600" }
];

const DOCUMENTS = [
    { id: 1, name: "NDA", preview: "Strict Confidentiality Agreement" },
    { id: 2, name: "Offer Letter", preview: "Terms of Engagement & Benefits" },
    { id: 3, name: "Completion Letter", preview: "Fellow Accreditation & Badges" }
];

export default function ResearchPage() {
    const [activeDoc, setActiveDoc] = useState(0);

    return (
        <div className="min-h-screen bg-[#020205] text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full opacity-50" />
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/10 text-cyan-400 text-sm font-medium mb-8"
                    >
                        <FlaskConical className="w-4 h-4" />
                        <span>R&D LABORATORIES</span>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4"
                    >
                        <button
                            onClick={() => window.location.href = '/portal/onboarding'}
                            className="text-xs font-bold text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1 mx-auto"
                        >
                            <ChevronLeft className="w-3 h-3" /> BACK TO PORTAL
                        </button>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 italic"
                    >
                        THE <span className="text-cyan-500">DEEPCYTES</span> <br />RESEARCH
                    </motion.h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Where experimental engineering meets real-world security infrastructure.
                        Explore our internal roadmap and validated achievements.
                    </p>
                </div>
            </section>

            {/* Document Roller */}
            <section className="py-20 bg-white/[0.02] border-y border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em] mb-12 text-center">Fellow Credentials</h2>

                    <div className="flex justify-center items-center gap-12 sm:gap-24 relative h-64">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeDoc}
                                initial={{ opacity: 0, x: 100, rotateY: 45 }}
                                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                exit={{ opacity: 0, x: -100, rotateY: -45 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="w-48 h-64 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-lg p-6 shadow-2xl backdrop-blur-xl relative group"
                            >
                                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                                <div className="w-full h-8 bg-slate-900/60 rounded mb-4" />
                                <div className="space-y-2">
                                    <div className="w-full h-2 bg-white/20 rounded" />
                                    <div className="w-3/4 h-2 bg-white/20 rounded" />
                                    <div className="w-full h-2 bg-white/20 rounded" />
                                </div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <p className="text-[10px] text-cyan-400 font-mono mb-1">DOCUMENT {DOCUMENTS[activeDoc].id}</p>
                                    <p className="font-bold text-sm">{DOCUMENTS[activeDoc].name}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex flex-col gap-4">
                            {DOCUMENTS.map((doc, idx) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setActiveDoc(idx)}
                                    className={`text-left px-6 py-3 rounded-xl border transition-all ${activeDoc === idx
                                        ? 'bg-cyan-500 border-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/20'
                                        : 'bg-white/20 border-white/10 text-gray-500 hover:border-white/20'
                                        }`}
                                >
                                    {doc.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Project Grid */}
            <section className="py-32 max-w-7xl mx-auto px-4">
                <div className="flex items-end justify-between mb-16 px-4">
                    <div>
                        <h2 className="text-4xl font-black mb-2 uppercase">Internal Projects</h2>
                        <p className="text-gray-500">Live development status of our core IP</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-gray-500 mt-2">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> COMPLETED</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> WORK IN PROGRESS</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ring-offset-2">
                    {PROJECTS.map((project, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -10 }}
                            className="bg-white/20 border border-white/10 rounded-3xl p-8 relative overflow-hidden group cursor-pointer"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${project.color} opacity-10 blur-3xl group-hover:scale-150 transition-transform duration-700`} />

                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-white/20 rounded-2xl text-cyan-400 border border-white/10">
                                    {project.icon}
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${project.status === 'COMPLETED'
                                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                    : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                                    }`}>
                                    {project.status === 'COMPLETED' ? 'V1.0 DEPLOYED' : 'BETA DEV'}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed">{project.description}</p>

                            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest group-hover:gap-4 transition-all">
                                <span>Learn More</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto p-12 bg-gradient-to-br from-cyan-600 to-blue-800 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-4xl font-black mb-6">READY TO JOIN THE LAB?</h2>
                    <p className="text-white/80 mb-8 max-w-md mx-auto italic">Applications are processed via Organization Codes. Contact your institutional lead for access.</p>
                    <button className="px-10 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform">
                        REQUEST ACCESS
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
}


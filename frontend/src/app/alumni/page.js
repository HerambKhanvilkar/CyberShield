"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Shield, Cpu, Globe, Lock, Award, Briefcase, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TronCircuitBackground from "@/components/ParticleBackground";
import { BoxReveal } from "@/components/magicui/box-reveal";

const alumniStories = [
    {
        name: "Marcus Thorne",
        role: "Penetration Tester",
        cohort: "C2-2024",
        feedback: "Working on real-world malware analysis projects helped me bridge the gap between theory and practice. Highly recommend for serious researchers.",
        image: "MT",
        specialty: "Offensive Security",
        achievement: "Secured role at Top-Tier Firm",
        fullStory: "Marcus joined the DeepCytes fellowship with a background in network administration. Through our intensive penetration testing modules, he masterfully transitioned into red teaming. His capstone project involved a sophisticated deconstruction of zero-day vulnerabilities in IoT architectures."
    },
    {
        name: "Sarah Chen",
        role: "Cybersecurity Analyst",
        cohort: "C1-2024",
        feedback: "The DeepCytes fellowship provided me with hands-on experience in threat intelligence that was truly transformative. The mentorship was world-class.",
        image: "SC",
        specialty: "Threat Intelligence",
        achievement: "Senior Analyst Promotion",
        fullStory: "Sarah excelled in the Threat Intelligence track. Her ability to synthesize complex data points into actionable security reports was unparalleled. She now leads a team of analysts at a major financial institution, applying the principles she honed during her cohort."
    },
    {
        name: "Elena Rodriguez",
        role: "Security Researcher",
        cohort: "C1-2024",
        feedback: "The community and mentorship at DeepCytes are unparalleled. I've grown so much as a researcher and secured a top-tier role post-fellowship.",
        image: "ER",
        specialty: "Vuln Research",
        achievement: "Published 3 CVEs",
        fullStory: "Elena's journey from academic research to applied security was rapid. Her focus on memory corruption bugs led to the discovery of three critical CVEs during her fellowship period. She is now a key contributor to open-source security projects."
    },
    {
        name: "David Kim",
        role: "DevSecOps Engineer",
        cohort: "C3-2023",
        feedback: "Building security into CI/CD pipelines was a challenge, but the resources here made it possible. A very forward-thinking program.",
        image: "DK",
        specialty: "DevSecOps",
        achievement: "Architecture Lead",
        fullStory: "David's passion for automation drove his success. He designed a fully automated security auditing pipeline that is now used by several startup partners. His innovative approach to 'security as code' continues to inspire new fellows."
    },
    {
        name: "Aisha Khan",
        role: "Digital Forensics Analyst",
        cohort: "C2-2024",
        feedback: "The forensics modules were incredibly detailed. The direct interaction with industry experts is what sets DeepCytes apart.",
        image: "AK",
        specialty: "Digital Forensics",
        achievement: "Incident Lead",
        fullStory: "Aisha's meticulous attention to detail made her a natural at digital forensics. Her work on complex incident response scenarios prepared her for her current role as an Incident Lead, where she handles high-stakes security breaches."
    },
    {
        name: "James D.",
        role: "SOC Lead",
        cohort: "C1-2023",
        feedback: "The level of technical depth here is something I haven't found anywhere else. Truly a game-changer for my career.",
        image: "JD",
        specialty: "Operations",
        achievement: "Executive Role",
        fullStory: "James brought years of operations experience to the fellowship. He focused on scaling security operations center (SOC) architectures. Today, he manages global security operations for a Fortune 500 company."
    }
];

const StoryCard = ({ story }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="group relative bg-[#050505]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-cyan-500/30 transition-all overflow-hidden"
    >
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-16 h-16 border-r border-t border-cyan-500/10 group-hover:border-cyan-500/40 transition-colors pointer-events-none" />
        
        <div className="flex flex-col h-full gap-6 relative z-10">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-cyan-500/20">
                        {story.image}
                    </div>
                    <div>
                        <h3 className="text-xl font-black italic tracking-tight text-white">{story.name}</h3>
                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{story.role}</p>
                        <p className="text-gray-600 text-[8px] font-black uppercase tracking-[0.3em]">{story.cohort}</p>
                    </div>
                </div>
                <div className="flex gap-1 text-cyan-500/20">
                    {[...Array(5)].map((_, i) => (
                        <Award key={i} size={12} fill="currentColor" />
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Briefcase size={10} className="text-cyan-500" />
                        {story.specialty}
                    </div>
                    <div className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                        <GraduationCap size={10} />
                        {story.achievement}
                    </div>
                </div>
                
                <p className="text-gray-400 text-sm italic leading-relaxed">
                    "{story.feedback}"
                </p>

                <div className="pt-4 border-t border-white/5">
                    <label className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-500/50 block mb-2">Extended_Archive_Log</label>
                    <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-400 transition-colors">
                        {story.fullStory}
                    </p>
                </div>
            </div>

            <button className="mt-6 w-full py-3 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:bg-cyan-500 group-hover:text-black transition-all flex items-center justify-center gap-2">
                RECON_FULL_STORY
                <ExternalLink size={12} />
            </button>
        </div>
    </motion.div>
);

export default function AlumniGallery() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
            <TronCircuitBackground />
            
            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />

            <Navbar />

            <main className="flex-1 relative z-10 pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
                
                <div className="mb-16">
                    <motion.a 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        href="/apply"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/50 hover:text-cyan-400 transition-colors mb-8"
                    >
                        <ArrowLeft size={14} />
                        [ BACK_TO_AUTH ]
                    </motion.a>

                    <BoxReveal boxColor="#06b6d4" duration={0.5}>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter mb-4 bg-gradient-to-r from-white via-cyan-100 to-gray-700 bg-clip-text text-transparent leading-none">
                            FELLOWSHIP <br />ARCHIVES.
                        </h1>
                    </BoxReveal>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-6 mt-6">
                        <p className="text-gray-500 text-sm max-w-xl">
                            A historical record of exceptional talent. These individuals initiated the protocol, mastered the curriculum, and translated intelligence into action across the global security landscape.
                        </p>
                        <div className="flex-1 border-t border-dashed border-white/10 hidden md:block" />
                        <div className="flex items-center gap-6 opacity-40">
                            <div className="text-center">
                                <p className="text-2xl font-black italic text-white tracking-tighter">500+</p>
                                <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Graduates</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black italic text-white tracking-tighter">15+</p>
                                <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Countries</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {alumniStories.map((story, i) => (
                        <StoryCard key={i} story={story} />
                    ))}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none hidden lg:block">
                    <Shield size={400} strokeWidth={0.5} />
                </div>
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

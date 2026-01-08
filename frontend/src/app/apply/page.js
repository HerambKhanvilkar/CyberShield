"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { KeyRound, Sparkles, ShieldCheck } from "lucide-react";

export default function ApplyLanding() {
    const [code, setCode] = useState("");
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.trim()) {
            router.push(`/apply/${code.trim()}`);
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
                    <div className="text-center mb-12">
                        <div className="inline-flex p-4 rounded-3xl bg-white/5 border border-white/10 mb-6 group">
                            <KeyRound className="w-10 h-10 text-cyan-400 group-hover:rotate-12 transition-transform" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                            UNLOCK YOUR <br />FUTURE.
                        </h1>
                        <p className="text-gray-500 text-lg max-w-sm mx-auto">
                            Enter the unique Organization Code provided by your institution to begin your DeepCytes Fellowship application.
                        </p>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/70 ml-1">Access Credential</label>
                                <Input
                                    placeholder="ORG-CODE-2026"
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
                        </form>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Verified System</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Gated Access</span>
                        </div>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}

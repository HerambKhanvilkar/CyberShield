"use client";

import { motion } from "framer-motion";
import { CheckCircle, Award, Download, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "../layout";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CompletionPage() {
    const { user } = useOnboarding();
    const router = useRouter();
    const isGraduated = user?.onboardingState === 'COMPLETION';

    const handleActivate = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/onboarding/activate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = '/FellowshipProfile';
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center space-y-12 py-20">
            <div className="relative">
                <div className="w-32 h-32 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 rotate-45 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                    <div className="w-20 h-20 border-2 border-cyan-500/50 flex items-center justify-center -rotate-45">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                </div>
                {isGraduated && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-4 -right-4 w-10 h-10 bg-black border border-cyan-500 flex items-center justify-center text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    >
                        <ShieldCheck className="w-6 h-6" />
                    </motion.div>
                )}
            </div>

            <div className="space-y-6">
                <h2 className="text-6xl font-black italic tracking-tighter uppercase text-white">DEPLOYMENT_<span className="text-cyan-500">{isGraduated ? 'COMPLETE' : 'INITIALIZED'}</span></h2>
                <div className="h-1 w-24 bg-cyan-500 mx-auto" />
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-[10px] uppercase tracking-[0.3em] font-bold">
                    [SYSTEM_LOG] Onboarding sequence {isGraduated ? 'finalized' : 'pending_feedback'}. All credentials synchronized. Personnel record {isGraduated ? 'high-priority active' : 'processing'}.
                </p>
            </div>

            <div className={`p-10 bg-black border w-full max-w-sm relative group transition-all duration-700 ${isGraduated ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/5 opacity-40 grayscale'}`}>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500" />
                <Award className="w-12 h-12 mx-auto mb-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-mono text-gray-700 mb-6 uppercase tracking-[0.4em]">A_DC_CERT_{user?.globalPid || 'PENDING'}.pdf</p>
                <Button
                    disabled={!isGraduated}
                    className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-none font-black text-[10px] uppercase tracking-widest transition-all"
                >
                    <Download className="w-4 h-4 mr-3" /> RETRIEVE_ACCREDITATION
                </Button>
            </div>

            <div className="flex flex-col items-center gap-6 w-full">
                {!isGraduated && (
                    <div className="px-8 py-3 bg-cyan-500/5 border border-cyan-500/20 text-[9px] font-black uppercase text-cyan-500/60 tracking-[0.4em] animate-pulse">
                        Awaiting_Final_Peer_Validation
                    </div>
                )}

                {isGraduated && (
                    <Button
                        onClick={handleActivate}
                        className="h-16 px-12 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase tracking-[0.2em] rounded-none shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse"
                    >
                        INITIATE_DASHBOARD_PROTOCOL
                    </Button>
                )}

                <button
                    onClick={() => router.push('/portal')}
                    className="text-[9px] font-black uppercase text-gray-700 hover:text-cyan-500 tracking-[0.3em] transition-colors"
                >
                    [RETURN_TO_MAIN_TERMINAL]
                </button>
            </div>
        </motion.div>
    );
}

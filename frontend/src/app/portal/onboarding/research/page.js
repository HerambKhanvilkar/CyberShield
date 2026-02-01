"use client";

import { motion } from "framer-motion";
import { FlaskConical, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ResearchGatewayPage() {
    const router = useRouter();

    const handleProceed = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/advance-state`, {
                targetState: 'FEEDBACK'
            }, { headers: { Authorization: `Bearer ${token}` } });
            router.push('/portal/onboarding/feedback');
        } catch (error) {
            router.push('/portal/onboarding/feedback');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center space-y-12 py-12">
            <div className="w-28 h-28 bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-500 relative group">
                <div className="absolute inset-0 border border-gray-700/50 -m-2" />
                <FlaskConical className="w-14 h-14" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Lock className="w-8 h-8 text-gray-600" />
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white">R&D_<span className="text-gray-500">LABS</span></h2>
                <div className="inline-block px-6 py-3 bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-cyan-400 text-sm font-black uppercase tracking-[0.3em]">COMING SOON</span>
                </div>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-[10px] uppercase tracking-[0.2em] font-bold">
                    [ACCESS_PENDING] The internal DeepCytes R&D Laboratory is currently being configured. This feature will be available in a future update.
                </p>
            </div>

            <Button onClick={handleProceed} className="w-full max-w-md h-16 bg-white text-black hover:bg-gray-200 rounded-none font-black italic tracking-[0.2em] text-xs transition-all">
                CONTINUE_TO_FEEDBACK <ArrowRight className="w-4 h-4 ml-3" />
            </Button>

            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-gray-600 tracking-[0.4em] px-6 py-3 border border-gray-800">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                INFRASTRUCTURE_UNDER_DEVELOPMENT
            </div>
        </motion.div>
    );
}

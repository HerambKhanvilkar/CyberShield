"use client";

import { motion } from "framer-motion";
import { FlaskConical, ExternalLink, ChevronRight, ArrowRight } from "lucide-react";
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
            <div className="w-28 h-28 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 rotate-3 hover:rotate-0 transition-all duration-700 shadow-[0_0_40px_rgba(6,182,212,0.1)] relative group">
                <div className="absolute inset-0 border border-cyan-500/20 -m-2 group-hover:m-0 transition-all" />
                <FlaskConical className="w-14 h-14" />
            </div>

            <div className="space-y-6">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white">R&D_<span className="text-cyan-500">LABS</span></h2>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-[10px] uppercase tracking-[0.2em] font-bold">
                    [PROPRIETARY_ACCESS_REQUIRED] Step inside the internal DeepCytes laboratory. All project data is high-level confidential.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                <Button
                    variant="outline"
                    className="flex-1 h-16 border-white/10 hover:bg-white/5 text-gray-500 rounded-none font-black text-[10px] uppercase tracking-widest"
                    onClick={handleProceed}
                >
                    SKIP_PROTOTYPE_VIEW
                </Button>
                <Button
                    className="flex-1 h-16 bg-cyan-600 hover:bg-cyan-500 text-white rounded-none font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    onClick={() => router.push("/research")}
                >
                    ACCESS_LAB_SHOWCASE <ExternalLink className="w-4 h-4 ml-3" />
                </Button>
            </div>

            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-cyan-500/40 tracking-[0.4em] px-6 py-3 border border-cyan-500/10">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                LIVE_INTERNAL_INFRASTRUCTURE_ACTIVE
            </div>
        </motion.div>
    );
}

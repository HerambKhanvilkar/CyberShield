"use client";

import { motion } from "framer-motion";
import { BookOpen, Shield, FlaskConical, MessageSquare, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ResourcesPage() {
    const router = useRouter();

    const handleProceed = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/advance-state`, {
                targetState: 'RESEARCH'
            }, { headers: { Authorization: `Bearer ${token}` } });
            router.push('/portal/onboarding/research');
        } catch (error) {
            router.push('/portal/onboarding/research');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div className="border-l-4 border-cyan-500 pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Resource_<span className="text-cyan-500">Hub</span></h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 font-bold">Secure Retrieval of Network Assets & Guidelines.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { title: 'Member_Handbook', icon: <BookOpen className="w-5 h-5" />, type: 'PDF' },
                    { title: 'Brand_Identity_Kit', icon: <Shield className="w-5 h-5" />, type: 'ZIP' },
                    { title: 'Internal_Ethics_v1', icon: <FlaskConical className="w-5 h-5" />, type: 'PDF' },
                    { title: 'Comm_Protocols', icon: <MessageSquare className="w-5 h-5" />, type: 'DOCX' }
                ].map((item, idx) => (
                    <div key={idx} className="p-6 bg-black border border-white/5 hover:border-cyan-500/50 transition-all group cursor-pointer relative overflow-hidden">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-cyan-500 group-hover:border-cyan-500/50 transition-all">{item.icon}</div>
                            <div className="flex-1">
                                <h4 className="font-black text-[11px] text-white uppercase tracking-widest">{item.title}</h4>
                                <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mt-1">{item.type} • Restricted_Access</p>
                            </div>
                            <Download className="w-4 h-4 text-gray-800 group-hover:text-cyan-500 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-cyan-500/5 border border-cyan-500/10 italic">
                <h4 className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-3">[SECURITY_ADVISORY]</h4>
                <p className="text-gray-500 text-[10px] leading-relaxed">
                    All retrieved assets are cryptographically watermarked with your Personnel ID for traceability.
                    Unlicensed distribution is a violation of the signed NDA Protocol.
                </p>
            </div>

            <Button onClick={handleProceed} className="w-full h-16 bg-white text-black hover:bg-gray-200 rounded-none font-black italic tracking-[0.2em] text-xs transition-all">
                EXECUTE_HUB_EXIT_&_RESEARCH_ACCESS <ArrowRight className="w-4 h-4 ml-3" />
            </Button>
        </motion.div>
    );
}

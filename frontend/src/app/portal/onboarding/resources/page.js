"use client";

import { motion } from "framer-motion";
import { BookOpen, Shield, FlaskConical, MessageSquare, Lock, ArrowRight } from "lucide-react";
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
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 font-bold">Secure Retrieval of Fellowship Assets & Guidelines.</p>
            </div>

            {/* Coming Soon Banner */}
            <div className="p-8 bg-cyan-500/5 border border-cyan-500/20 text-center space-y-4">
                <div className="inline-block px-6 py-3 bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-cyan-400 text-sm font-black uppercase tracking-[0.3em]">COMING SOON</span>
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold max-w-lg mx-auto">
                    Fellowship resources are currently being prepared. Handbooks, brand kits, and documentation will be available here soon.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50">
                {[
                    { title: 'Fellowship_Handbook', icon: <BookOpen className="w-5 h-5" />, type: 'PDF' },
                    { title: 'Brand_Identity_Kit', icon: <Shield className="w-5 h-5" />, type: 'ZIP' },
                    { title: 'Internal_Ethics_v1', icon: <FlaskConical className="w-5 h-5" />, type: 'PDF' },
                    { title: 'Comm_Protocols', icon: <MessageSquare className="w-5 h-5" />, type: 'DOCX' }
                ].map((item, idx) => (
                    <div key={idx} className="p-6 bg-black border border-white/5 relative overflow-hidden cursor-not-allowed">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 border border-white/10 flex items-center justify-center text-gray-600">{item.icon}</div>
                            <div className="flex-1">
                                <h4 className="font-black text-[11px] text-gray-500 uppercase tracking-widest">{item.title}</h4>
                                <p className="text-[8px] text-gray-700 uppercase tracking-widest font-bold mt-1">{item.type} • Pending_Upload</p>
                            </div>
                            <Lock className="w-4 h-4 text-gray-700" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-gray-900/50 border border-gray-800 italic">
                <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">[SYSTEM_NOTICE]</h4>
                <p className="text-gray-600 text-[10px] leading-relaxed">
                    Resource distribution is pending administrative approval. All materials will be cryptographically watermarked with your Personnel ID once available.
                </p>
            </div>

            <Button onClick={handleProceed} className="w-full h-16 bg-white text-black hover:bg-gray-200 rounded-none font-black italic tracking-[0.2em] text-xs transition-all">
                PROCEED_TO_R&D_LABS <ArrowRight className="w-4 h-4 ml-3" />
            </Button>
        </motion.div>
    );
}

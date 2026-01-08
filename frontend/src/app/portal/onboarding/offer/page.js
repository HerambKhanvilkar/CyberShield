"use client";

import axios from "axios";
import { useOnboarding } from "../layout";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Award, FileText, Download, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfferPage() {
    const { user, selectedTenureIndex } = useOnboarding();
    const router = useRouter();

    const handleProceed = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/portal/advance-state`, {
                targetState: 'RESOURCES'
            }, { headers: { Authorization: `Bearer ${token}` } });
            router.push('/portal/onboarding/resources');
        } catch (error) {
            router.push('/portal/onboarding/resources'); // Fallback to navigation
        }
    };

    const handleDownload = async (endpoint, filename) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/portal/${endpoint}?tenureIndex=${selectedTenureIndex}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Download failed");
        }
    };

    if (!user) return null;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-12">
            <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <Award className="w-12 h-12" />
            </div>

            <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Fellowship_<span className="text-green-500">Activated</span></h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] max-w-sm mx-auto font-bold leading-relaxed">
                    Credentials verified. Assignment initialized. Your personalized offer letter is ready for retrieval.
                </p>
            </div>

            <div className="p-10 bg-black border border-white/10 w-full max-w-sm relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-500" />

                <FileText className="w-16 h-16 mx-auto mb-6 text-cyan-400/50 group-hover:text-cyan-400 transition-colors" />
                <p className="text-[9px] font-mono text-gray-600 mb-2 uppercase tracking-widest">DeepCytes_Offer_{user.globalPid}.pdf</p>
                {user.tenures && user.tenures[selectedTenureIndex] && (
                    <p className="text-[10px] text-cyan-500 font-black mb-8 tracking-[0.3em] uppercase underline decoration-cyan-500/30">ROLE: {user.tenures[selectedTenureIndex].role}</p>
                )}

                <div className="space-y-4">
                    <Button onClick={() => handleDownload('download-offer', 'DeepCytes_Offer.pdf')} className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-none font-black text-xs uppercase tracking-widest">
                        <Download className="w-4 h-4 mr-3" /> RETRIEVE_OFFER
                    </Button>
                    <Button onClick={handleProceed} className="w-full h-14 bg-cyan-500/5 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-white rounded-none font-black text-xs uppercase tracking-widest transition-all">
                        PROCEED_TO_HUB <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

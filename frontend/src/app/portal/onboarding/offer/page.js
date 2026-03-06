"use client";

import axios from "axios";
import { useOnboarding } from "../layout";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Award, FileText, Download, ChevronRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfferPage() {
    const { user, selectedTenureIndex } = useOnboarding();
    const router = useRouter();

    const handleProceed = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/advance-state`, {
                targetState: 'RESOURCES'
            }, { headers: { Authorization: `Bearer ${token}` } });
            router.push('/portal/onboarding/resources');
        } catch (error) {
            router.push('/portal/onboarding/resources');
        }
    };

    const handleDownload = async (endpoint, filename) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/${endpoint}?tenureIndex=${selectedTenureIndex}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorJson = JSON.parse(text);
                toast.error(`Download Error: ${errorJson.message}`);
                return;
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`${filename} retrieved successfully.`);
        } catch (error) {
            toast.error("Retransmission failed. Ensure upstream connectivity.");
        }
    };

    if (!user) return null;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-10">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Profile: <span className="text-green-500">Active</span></h2>
                <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-none">
                    <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.3em]">Fellowship ID: <span className="text-white font-black">{user.globalPid}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 w-full max-w-2xl px-4">
                {/* /* Offer Letter Box */}
                <div className="p-8 bg-black border border-white/10 relative group hover:border-cyan-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-2 h-2 bg-cyan-500" />
                    <FileText className="w-10 h-10 mb-4 text-cyan-400/50 group-hover:text-cyan-400 transition-colors" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2">Offer_Letter</h3>
                    <p className="text-[9px] font-mono text-gray-500 mb-6 uppercase">DeepCytes_Offer_{user.lastName}.pdf</p>
                    <Button onClick={() => handleDownload('download-offer', `OfferLetter_${user.lastName}.pdf`)} className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-none font-black text-[10px] uppercase tracking-widest">
                        <Download className="w-3 h-3 mr-2" /> RETRIEVE_OFFER
                    </Button>
                </div>
            </div>

            {/* Password Hint
            <div className="w-full max-w-sm p-4 bg-orange-500/5 border border-orange-500/20 text-orange-400/80">
                <p className="text-[10px] font-mono uppercase leading-relaxed tracking-wider">
                    <span className="text-orange-400 font-bold">[SECURITY NOTICE]</span>: All documents are AES-encrypted. <br />
                    Password Format: <span className="text-white font-bold">{user.lastName.toUpperCase()}_{user.globalPid}</span>
                </p>
            </div> */}

            <Button onClick={handleProceed} className="h-16 px-12 bg-green-500/5 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white rounded-none font-black text-xs uppercase tracking-widest transition-all group">
                ADVANCE_TO_RESOURCES <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </Button>
        </motion.div>
    );
}

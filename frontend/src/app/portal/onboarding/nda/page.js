"use client";

import { useState } from "react";
import axios from "axios";
import { useOnboarding } from "../layout";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function NDAPage() {
    const { fetchUser } = useOnboarding();
    const router = useRouter();
    const [legalName, setLegalName] = useState("");
    const [ndaLoading, setNdaLoading] = useState(false);

    const handleSignNDA = async () => {
        if (!legalName || legalName !== legalName.toUpperCase()) {
            return toast.warning("Legal Name must be in ALL CAPS.");
        }
        setNdaLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/portal/sign-nda`, {
                legalName
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("NDA Signed!");
            fetchUser();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to sign NDA");
        } finally {
            setNdaLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="border-l-4 border-purple-500 pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Legal_<span className="text-purple-500">Framework</span></h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 font-bold">Binding Non-Disclosure & Intellectual Property Agreement.</p>
            </div>

            <div className="p-8 bg-black border border-white/10 max-h-72 overflow-y-auto text-xs text-gray-500 leading-relaxed font-mono custom-scrollbar">
                <h3 className="text-lg font-black mb-6 text-center text-white bg-white/5 py-3 tracking-[0.2em] border-y border-white/10 uppercase">Security_Protocol_NDA</h3>
                <p className="mb-4">This Non-Disclosure Agreement (the "Agreement") is entered into by and between DeepCytes R&D and the undersigned Participant...</p>
                <div className="space-y-4 opacity-70">
                    <p>1. <span className="text-white font-bold">CONFIDENTIALITY:</span> The Participant acknowledges that in the course of the fellowship, they may have access to confidential and proprietary information, including but not limited to source code, research data, product roadmaps, and internal methodologies.</p>
                    <p>2. <span className="text-white font-bold">IP_PROTECTION:</span> All intellectual property generated during the tenure remains the sole property of DeepCytes R&D.</p>
                    <p>3. <span className="text-white font-bold">LEGAL_ACTION:</span> Unauthorized disclosure may result in legal action, intellectual property theft charges, and immediate termination of the fellowship.</p>
                </div>
            </div>

            <div className="space-y-6 pt-6">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] text-center block">Validate Sequence with Full Legal Name <span className="text-purple-400">[ALL CAPS]</span>:</label>
                <Input
                    value={legalName}
                    onChange={e => setLegalName(e.target.value.toUpperCase())}
                    placeholder="ENTER_SIGNATURE_NAME"
                    className="bg-white/5 border-white/10 text-2xl font-black tracking-[0.4em] text-center py-10 rounded-none h-20 focus:border-purple-500 transition-all text-white placeholder:text-gray-800"
                />

                <div className="flex flex-col gap-4">
                    <Button
                        onClick={handleSignNDA}
                        disabled={ndaLoading}
                        className="w-full h-16 bg-purple-600 hover:bg-purple-500 text-white font-black italic tracking-[0.2em] rounded-none transition-all shadow-[0_0_30px_rgba(147,51,234,0.2)]"
                    >
                        {ndaLoading ? "GENERATING_PERSONNEL_ID..." : "EXECUTE_SIGN_&_ACTIVATE_PID"}
                    </Button>
                    <button
                        onClick={() => router.push('/portal/onboarding/offer')}
                        className="text-[9px] font-black uppercase text-gray-700 hover:text-purple-400 self-center tracking-[0.3em] transition-colors mt-2"
                    >
                        [BYPASS_SIGNATURE]
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

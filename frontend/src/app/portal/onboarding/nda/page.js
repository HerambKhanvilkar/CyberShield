"use client";

import { useState } from "react";
import axios from "axios";
import { useOnboarding } from "../layout";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Eye, Download, ShieldCheck } from "lucide-react";

export default function NDAPage() {
    const { user, fetchUser } = useOnboarding();
    const router = useRouter();
    const [legalName, setLegalName] = useState("");
    const [ndaLoading, setNdaLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const handleDownloadSigned = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/download-nda`, {
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
            link.setAttribute('download', `NDA_${user.lastName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Signed NDA retrieved.");
        } catch (error) {
            toast.error("Failed to download signed NDA.");
        }
    };

    const handleDownloadPreview = async () => {
        setPreviewLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/preview-nda`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorJson = JSON.parse(text);
                toast.error(`Preview Error: ${errorJson.message}`);
                return;
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'NDA_PREVIEW.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.info("Preview Generated.");
        } catch (error) {
            toast.error("Failed to generate preview.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSignNDA = async () => {
        if (!legalName || legalName !== legalName.toUpperCase()) {
            return toast.warning("Legal Name must be in ALL CAPS.");
        }
        setNdaLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/sign-nda`, {
                legalName
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success("Legal Agreement Sealed. Activating Personnel ID.");

            // Trigger automatic download of the signed copy
            try {
                const response = await axios.get(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/download-nda`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                });

                if (response.data.type === 'application/json') {
                    const text = await response.data.text();
                    const errorJson = JSON.parse(text);
                    toast.error(`Auto-Download Error: ${errorJson.message}`);
                    return;
                }

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Signed_Executed_NDA_${legalName.split(' ')[0]}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.info("Executing local copy download...");
            } catch (dlErr) {
                console.error("Auto-download failed:", dlErr);
            }

            await fetchUser();
            router.push('/portal/onboarding/offer');
        } catch (error) {
            toast.error(error.response?.data?.message || "Encryption Failed");
        } finally {
            setNdaLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="border-l-4 border-purple-500 pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Non Disclosure <span className="text-purple-500">Agreement</span></h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 font-bold">This Ensures All The Sensitive Work Done During This Fellowship Remains Confidential.</p>
            </div>

            {/* <div className="relative group">
                <div className="p-8 bg-slate-950 border border-white/10 max-h-60 overflow-y-auto text-xs text-gray-500 leading-relaxed font-mono custom-scrollbar opacity-50 group-hover:opacity-100 transition-opacity">
                    <h3 className="text-lg font-black mb-6 text-center text-white bg-white/20 py-3 tracking-[0.2em] border-y border-white/10 uppercase">Security_Protocol_NDA</h3>
                    <p className="mb-4">This Non-Disclosure Agreement (the "Agreement") is entered into by and between DeepCytes R&D and the undersigned Participant...</p>
                    <div className="space-y-4">
                        <p>1. <span className="text-white font-bold">CONFIDENTIALITY:</span> The Participant acknowledges that in the course of the tenure, they may have access to confidential and proprietary information, including but not limited to source code, research data, product roadmaps, and internal methodologies.</p>
                        <p>2. <span className="text-white font-bold">IP_PROTECTION:</span> All intellectual property generated during the tenure remains the sole property of DeepCytes Fellowship.</p>
                        <p>3. <span className="text-white font-bold">LEGAL_ACTION:</span> Unauthorized disclosure may result in legal action, intellectual property theft charges, and immediate termination of the fellowship engagement.</p>
                    </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-slate-950/80 backdrop-blur-sm border border-purple-500/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                        Scroll to Review Summary
                    </div>
                </div>
            </div> */}

            <div className="flex justify-center">
                <button
                    onClick={handleDownloadPreview}
                    disabled={previewLoading}
                    className="flex items-center gap-3 px-8 py-4 bg-purple-500/5 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.2em] group"
                >
                    {previewLoading ? (
                        "GENERATING_ENCRYPTED_PREVIEW..."
                    ) : (
                        <>
                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Read the NDA [PDF]
                            <Download className="w-3 h-3 opacity-50" />
                        </>
                    )}
                </button>
            </div>

            {/* signed copy box if already executed */}
            {user?.nda?.dateTimeUser && user.nda.dateTimeUser !== "0" && (
                <div className="p-8 bg-slate-950 border border-white/10 relative group hover:border-purple-500/50 transition-colors mt-6">
                    <div className="absolute top-0 left-0 w-2 h-2 bg-purple-500" />
                    <ShieldCheck className="w-10 h-10 mb-4 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2">Signed_NDA</h3>
                    <p className="text-[9px] font-mono text-gray-500 mb-6 uppercase">NDA_Executed_{user.lastName}.pdf</p>
                    <Button onClick={handleDownloadSigned} className="w-full h-12 bg-purple-500 text-white hover:bg-purple-600 rounded-none font-black text-[10px] uppercase tracking-widest">
                        <Download className="w-3 h-3 mr-2" /> RETRIEVE_NDA
                    </Button>
                </div>
            )}

            <div className="space-y-6 pt-6">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] text-center block">To Sign The Agreement, Please Enter your Full <span className="text-purple-400">Name</span> Below</label>
                <Input
                    value={legalName}
                    onChange={e => setLegalName(e.target.value.toUpperCase())}
                    placeholder="ENTER_SIGNATURE_NAME"
                    className="bg-white/20 border-white/10 text-2xl font-black tracking-[0.4em] text-center py-10 rounded-none h-20 focus:border-purple-500 transition-all text-white placeholder:text-gray-800"
                />

                <div className="flex flex-col gap-4">
                    <Button
                        onClick={handleSignNDA}
                        disabled={ndaLoading}
                        className="w-full h-16 bg-purple-600 hover:bg-purple-500 text-white font-black italic tracking-[0.2em] rounded-none transition-all shadow-[0_0_30px_rgba(147,51,234,0.2)]"
                    >
                        {ndaLoading ? "GENERATING_PERSONNEL_ID..." : "Sign The NDA & Continue"}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}


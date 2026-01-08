"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useOnboarding } from "../layout";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, fetchUser } = useOnboarding();
    const router = useRouter();
    const [formData, setFormData] = useState({ firstName: "", lastName: "", linkedin: "", github: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                linkedin: user.socials?.linkedin || "",
                github: user.socials?.github || ""
            });
        }
    }, [user]);

    const handleProfileSubmit = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/complete-profile`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Profile Updated! Proceed to NDA.");
            fetchUser();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to update profile";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="border-l-4 border-cyan-500 pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Personnel_<span className="text-cyan-500">Registration</span></h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 font-bold">Verification of physical and digital identity footprints.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-500" /> Given_Name
                    </label>
                    <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="bg-white/5 border-white/10 h-14 rounded-none font-mono focus:border-cyan-500 transition-all text-cyan-100" />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-500" /> Surname
                    </label>
                    <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="bg-white/5 border-white/10 h-14 rounded-none font-mono focus:border-cyan-500 transition-all text-cyan-100" />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500" /> LinkedIn_Profile_<span className="text-red-500/50">[MANDATORY]</span>
                </label>
                <Input value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." className="bg-white/5 border-white/10 h-14 rounded-none font-mono focus:border-cyan-500 transition-all text-cyan-100" />
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500" /> GitHub_Profile_<span className="text-cyan-500/50">[OPTIONAL]</span>
                </label>
                <Input value={formData.github} onChange={e => setFormData({ ...formData, github: e.target.value })} placeholder="https://github.com/..." className="bg-white/5 border-white/10 h-14 rounded-none font-mono focus:border-cyan-500 transition-all text-cyan-100" />
            </div>

            <div className="flex flex-col gap-4 mt-12">
                <Button
                    onClick={handleProfileSubmit}
                    className="w-full h-16 bg-cyan-600 hover:bg-cyan-500 rounded-none font-black italic tracking-[0.2em] text-white shadow-[0_0_20px_rgba(6,182,212,0.2)] group transition-all"
                    disabled={saving}
                >
                    {saving ? "SYNCING_DATA..." : "EXECUTE_SAVE_&_CONTINUE"}
                </Button>
                <button
                    onClick={() => router.push('/portal/onboarding/nda')}
                    className="text-[9px] font-black uppercase text-gray-600 hover:text-cyan-500 self-center tracking-[0.3em] transition-colors mt-4"
                >
                    [BYPASS_TO_NDA]
                </button>
            </div>
        </motion.div>
    );
}

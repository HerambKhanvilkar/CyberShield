"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OverviewStats from "./components/OverviewStats";
import TenureTimeline from "./components/TenureTimeline";
import SignatureModal from "./components/SignatureModal";
import { toast } from "react-toastify";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export default function FellowshipProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [tenures, setTenures] = useState([]);

    // Signing State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSigningDoc, setCurrentSigningDoc] = useState(null); // { index, type }
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';

            // Fetch Profile & Stats
            const profileRes = await axios.get(`${serverUrl}/fellowship/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch Tenures (Full history)
            const tenuresRes = await axios.get(`${serverUrl}/fellowship/tenures`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProfile(profileRes.data.profile);
            setStats(profileRes.data.stats);
            setTenures(tenuresRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                // If not authorized (e.g. applicant trying to access), redirect
                if (err.response?.data?.redirect) {
                    router.push(err.response.data.redirect);
                } else {
                    router.push('/login');
                }
            } else {
                toast.error("Failed to load fellowship data");
            }
            setLoading(false);
        }
    };

    const handleSignRequest = (index, type) => {
        setCurrentSigningDoc({ index, type });
        setIsModalOpen(true);
    };

    const handleSignConfirm = async (signatureInfo) => {
        if (!currentSigningDoc) return;

        setIsSigning(true);
        try {
            const token = localStorage.getItem('token');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(
                `${serverUrl}/fellowship/sign-document`,
                {
                    tenureIndex: currentSigningDoc.index,
                    documentType: currentSigningDoc.type,
                    signatureData: signatureInfo.data,
                    signatureType: signatureInfo.type
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Document Signed Successfully!");
            setIsModalOpen(false);
            fetchData(); // Refresh data to show new status
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Signing failed");
        } finally {
            setIsSigning(false);
        }
    };

    const handleDownloadRequest = async (index, type) => {
        try {
            const token = localStorage.getItem('token');
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const res = await axios.get(
                `${serverUrl}/fellowship/download-document/${index}/${type}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${profile.lastName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            toast.error("Download failed");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-cyan-500 animate-pulse flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin" size={48} />
                    <p className="font-mono tracking-widest uppercase text-sm">Initializing Secure Connection...</p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 flex flex-col">
            {/* Background Grid */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-cyan-900/30 border border-cyan-500/30 rounded-lg text-cyan-400">
                                <ShieldCheck size={28} />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent font-mono">
                                Fellowship Portal
                            </h1>
                        </div>
                        <p className="text-zinc-500 font-mono pl-14">
                            Welcome back, <span className="text-cyan-400">{profile.firstName}</span>.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <OverviewStats stats={stats} profile={profile} />

                {/* Main Content: Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TenureTimeline
                            tenures={tenures}
                            onSignRequest={handleSignRequest}
                            onDownloadRequest={handleDownloadRequest}
                        />
                    </div>

                    {/* Sidebar / Info Panel */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                Action Items
                            </h3>
                            <div className="space-y-3">
                                {/* Simple Logic to find unsigned docs */}
                                {tenures.flatMap((t, i) =>
                                    Object.entries(t.signedDocuments || {})
                                        .filter(([_, doc]) => !doc?.signedAt)
                                        .map(([type]) => ({ i, type }))
                                ).length === 0 ? (
                                    <p className="text-zinc-500 text-sm">No pending actions.</p>
                                ) : (
                                    tenures.map((t, i) => (
                                        Object.entries(t.signedDocuments || {}).map(([type, doc]) => {
                                            if (doc && !doc.signedAt) {
                                                return (
                                                    <div key={`${i}-${type}`} className="text-sm p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex justify-between items-center">
                                                        <span className="text-amber-400/80">Sign {type} for {t.role}</span>
                                                        <button
                                                            onClick={() => handleSignRequest(i, type)}
                                                            className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded hover:bg-amber-500/30"
                                                        >
                                                            GO
                                                        </button>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <SignatureModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                docType={currentSigningDoc?.type}
                onConfirm={handleSignConfirm}
                signing={isSigning}
            />
        </div>
    );
}

"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, Shield, Award, BookOpen, FlaskConical, MessageSquare, ScrollText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const OnboardingContext = createContext();

const STEPS = [
    { id: 'profile', title: 'Complete Profile', icon: <Shield className="w-5 h-5" />, description: 'Enter your basic details and social links.' },
    { id: 'nda', title: 'NDA Agreement', icon: <ScrollText className="w-5 h-5" />, description: 'Electronically sign the non-disclosure agreement.' },
    { id: 'offer', title: 'Offer Letter', icon: <Award className="w-5 h-5" />, description: 'View and download your official offer.' },
    { id: 'resources', title: 'Resources', icon: <BookOpen className="w-5 h-5" />, description: 'Access essential fellow documents.' },
    { id: 'research', title: 'R&D Showcase', icon: <FlaskConical className="w-5 h-5" />, description: 'Explore DeepCytes R&D projects.' },
    { id: 'feedback', title: 'Tenure Feedback', icon: <MessageSquare className="w-5 h-5" />, description: 'Provide feedback after your tenure.' },
    { id: 'completion', title: 'Completion', icon: <CheckCircle className="w-5 h-5" />, description: 'Download your completion certificate.' }
];

export const useOnboarding = () => useContext(OnboardingContext);

export default function OnboardingLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTenureIndex, setSelectedTenureIndex] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return router.push("/portal");

            const res = await axios.get(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = res.data.user;
            setUser(userData);

            if (userData.tenures?.length > 0) {
                const activeIdx = userData.tenures.findIndex(t => t.status === 'ACTIVE');
                setSelectedTenureIndex(activeIdx !== -1 ? activeIdx : userData.tenures.length - 1);
            }
        } catch (error) {
            console.error(error);
            toast.error("Session expired");
            router.push("/portal");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono">
            <div className="w-16 h-16 border border-cyan-500/30 border-t-cyan-500 animate-spin mb-4"></div>
            <p className="text-cyan-500 text-[10px] tracking-[0.3em] animate-pulse uppercase font-black">Connecting_to_Neural_Net...</p>
        </div>
    );

    const stateMap = {
        'PROFILE': 0,
        'NDA': 1,
        'OFFER': 2,
        'RESOURCES': 3,
        'RESEARCH': 4,
        'FEEDBACK': 5,
        'COMPLETION': 6
    };

    const userState = user?.onboardingState || 'PROFILE';
    const userInitialStep = stateMap[userState] || 0;
    const currentStepId = pathname.split('/').pop();
    const activeStepIndex = STEPS.findIndex(s => s.id === currentStepId);

    return (
        <OnboardingContext.Provider value={{ user, fetchUser, selectedTenureIndex, setSelectedTenureIndex, userInitialStep }}>
            <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
                <Navbar />

                <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 relative">
                    {/* Technical Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="mb-16 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-block px-4 py-1.5 border border-cyan-500/30 bg-cyan-500/5 text-[10px] uppercase font-black tracking-[0.4em] text-cyan-500 mb-6"
                            >
                                DeepCytes_Fellowship_Portal_v2.0
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic"
                            >
                                PERSONNEL_<span className="text-cyan-500">UPLINK</span>
                            </motion.h1>
                            <p className="mt-4 text-gray-500 text-[10px] uppercase tracking-[0.2em] font-bold">Secure Gateway for Onboarding & R&D Integration</p>
                        </div>

                        {user?.tenures?.length > 1 && userInitialStep >= 2 && (
                            <div className="mb-12 flex justify-center">
                                <div className="bg-white/5 border border-white/10 p-2 flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Select_Directive:</span>
                                    <select
                                        value={selectedTenureIndex}
                                        onChange={(e) => setSelectedTenureIndex(parseInt(e.target.value))}
                                        className="bg-black border border-white/10 px-6 py-2 text-[10px] font-black uppercase text-cyan-400 focus:outline-none hover:border-cyan-500 transition-colors cursor-pointer"
                                    >
                                        {user.tenures.map((t, i) => (
                                            <option key={i} value={i}>{t.role} [{t.status}]</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="grid lg:grid-cols-[1fr_2.5fr] gap-12 items-start">
                            {/* Navigation HUD */}
                            <div className="space-y-3 sticky top-24">
                                <div className="px-4 py-2 border-b border-white/10 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Onboarding_Sequence</div>
                                {STEPS.map((step, idx) => {
                                    const isCompleted = idx < userInitialStep;
                                    const isActive = idx === activeStepIndex;

                                    return (
                                        <div
                                            key={step.id}
                                            onClick={() => {
                                                if (idx <= userInitialStep) {
                                                    router.push(`/portal/onboarding/${step.id}`);
                                                } else {
                                                    toast.warning(`Access Restricted: Complete previous directive before accessing ${step.title}.`);
                                                }
                                            }}
                                            className={`p-5 border transition-all duration-300 relative group cursor-pointer ${isActive
                                                ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                                : isCompleted || idx === userInitialStep
                                                    ? 'bg-black border-white/10 hover:border-cyan-500/50'
                                                    : 'bg-black border-white/5 opacity-50 cursor-not-allowed'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-500" />
                                            )}
                                            <div className="flex items-center gap-6">
                                                <div className={`w-10 h-10 border flex items-center justify-center transition-all ${isActive ? 'bg-cyan-500 border-cyan-500 text-black' : isCompleted ? 'border-green-500 text-green-500 bg-green-500/5' : 'border-white/10 text-gray-600'}`}>
                                                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`font-black text-[11px] uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-500'}`}>{step.title}</h3>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <p className={`text-[8px] font-bold uppercase ${isActive ? 'text-cyan-500' : 'text-gray-700'}`}>{isActive ? 'Accessing' : isCompleted ? 'Completed' : 'Pending_Auth'}</p>
                                                        {isActive && <motion.div layoutId="pulse" className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Main Inspector Panel */}
                            <div className="bg-black border border-white/10 p-10 sm:p-16 relative overflow-hidden min-h-[600px] shadow-[0_0_50px_rgba(0,0,0,1)]">
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-20" />

                                {children}
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </OnboardingContext.Provider>
    );
}

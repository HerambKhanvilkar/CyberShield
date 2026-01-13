"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "../layout";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Clock, MessageSquare, Send, ChevronRight, CheckCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import axios from "axios";

export default function FeedbackPage() {
    const { user, selectedTenureIndex, fetchUser } = useOnboarding();
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isTenureEnded, setIsTenureEnded] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Step 2
        plansToContinue: "", // Yes/No
        // Step 2.5 (Branch A)
        nextRole: "",
        // Step 2.5 (Branch B)
        reasonForDiscontinuing: "",
        // Step 3 (Reflection)
        skillsBefore: 1,
        skillsAfter: 1,
        excitingProject: "",
        programEnhancement: "",
        performanceReflection: "",
        teamLeadSupport: "",
        recommendation: "",
        // Step 4 (Vision)
        inspiration: "",
        innovativeIdeas: "",
        promotionalConsent: "", // Yes/No
        // Step 5 (Career)
        careerNotifications: "" // Yes/No
    });

    const tenure = user?.tenures?.[selectedTenureIndex];

    useEffect(() => {
        if (!tenure?.endDate) {
            setIsTenureEnded(false);
            return;
        }

        const updateTimer = () => {
            let targetDate;
            let dateStr = tenure.endDate.replace(/[-/]/g, ""); // Remove separators

            if (dateStr.length === 8 && /^\d+$/.test(dateStr)) {
                const day = dateStr.slice(0, 2);
                const month = dateStr.slice(2, 4);
                const year = dateStr.slice(4, 8);
                // Create in a format that works across browsers and is local
                targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59).getTime();
            } else {
                targetDate = new Date(tenure.endDate).getTime();
            }

            if (isNaN(targetDate) || targetDate <= 0) {
                setIsTenureEnded(false);
                return;
            }

            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                setIsTenureEnded(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                setIsTenureEnded(false);
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [tenure]);

    const handleNext = () => {
        if (step === 2) {
            if (!formData.plansToContinue) return toast.warning("Please select an option.");
        }
        setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    const submitFeedback = async () => {
        // Validate final step
        if (!formData.careerNotifications) return toast.warning("Please complete the preference selection.");

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/portal/submit-feedback`, { feedback: formData }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Feedback Submitted! Welcome to Graduation.");
            fetchUser();
            router.push('/portal/onboarding/completion');
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to submit feedback";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Intro
                return (
                    <div className="space-y-6">
                        <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl mb-6">
                            <h3 className="text-xl font-bold text-cyan-400 mb-2">Welcome to the DeepCytes Network Experience Form!</h3>
                            <p className="text-sm text-gray-400">
                                The DeepCytes Network Program (DCNP) is more than just a training ground—it’s a movement uniting passionate minds from across the world to tackle the most pressing challenges in cybersecurity.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-2">Email</label>
                                <Input disabled value={user.email} className="bg-white/5 border-white/10" />
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-2">Name</label>
                                <Input disabled value={`${user.firstName} ${user.lastName}`} className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                    </div>
                );
            case 2: // Plans
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Your Plans with the Network</h3>
                        <p className="text-sm text-gray-500">Are you planning to continue with the DeepCytes Network for the next phase?</p>
                        <div className="space-y-3">
                            {['Yes', 'No'].map(opt => (
                                <div
                                    key={opt}
                                    onClick={() => setFormData({ ...formData, plansToContinue: opt })}
                                    className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${formData.plansToContinue === opt ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                >
                                    <span className="font-bold">{opt}</span>
                                    {formData.plansToContinue === opt && <CheckCircle className="w-5 h-5" />}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3: // Logic Branch (Role or Reason)
                if (formData.plansToContinue === 'Yes') {
                    return (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white">Select Your Next Role</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {['Red Team Analyst', 'Digital Forensics Analyst', 'OSINT Investigation Analyst', 'AI Cyber Lab Analyst', 'Cyber Developer', 'Cyber Research Analyst', 'Hardware & IoT Analyst'].map(role => (
                                    <div
                                        key={role}
                                        onClick={() => setFormData({ ...formData, nextRole: role })}
                                        className={`p-3 border rounded-xl cursor-pointer transition-all text-sm ${formData.nextRole === role ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                    >
                                        {role}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white">What's Next for You?</h3>
                            <p className="text-sm text-gray-500">Could you share your reason for discontinuing?</p>
                            <textarea
                                value={formData.reasonForDiscontinuing}
                                onChange={e => setFormData({ ...formData, reasonForDiscontinuing: e.target.value })}
                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-red-500/50 outline-none"
                                placeholder="Your feedback helps us improve..."
                            />
                        </div>
                    );
                }
            case 4: // Reflection (Condensed)
                return (
                    <div className="space-y-6 h-96 overflow-y-auto custom-scrollbar pr-2">
                        <h3 className="text-lg font-bold text-white mb-4">Reflection & Feedback</h3>

                        {/* Skills Before */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 uppercase">Skill Level BEFORE Network Engagement (1-5)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setFormData({ ...formData, skillsBefore: n })}
                                        className={`w-10 h-10 rounded border font-bold ${formData.skillsBefore === n ? 'bg-cyan-500 text-black border-cyan-500' : 'border-white/10 text-gray-500'}`}
                                    >{n}</button>
                                ))}
                            </div>
                        </div>

                        {/* Skills After */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 uppercase">Skill Level NOW (1-5)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setFormData({ ...formData, skillsAfter: n })}
                                        className={`w-10 h-10 rounded border font-bold ${formData.skillsAfter === n ? 'bg-green-500 text-black border-green-500' : 'border-white/10 text-gray-500'}`}
                                    >{n}</button>
                                ))}
                            </div>
                        </div>

                        <Input placeholder="Most exciting project?" value={formData.excitingProject} onChange={e => setFormData({ ...formData, excitingProject: e.target.value })} className="bg-white/5 border-white/10" />
                        <Input placeholder="How can we enhance the program?" value={formData.programEnhancement} onChange={e => setFormData({ ...formData, programEnhancement: e.target.value })} className="bg-white/5 border-white/10" />
                        <Input placeholder="Performance reflection..." value={formData.performanceReflection} onChange={e => setFormData({ ...formData, performanceReflection: e.target.value })} className="bg-white/5 border-white/10" />
                        <textarea
                            placeholder="Feedback on Team Lead/Support..."
                            value={formData.teamLeadSupport}
                            onChange={e => setFormData({ ...formData, teamLeadSupport: e.target.value })}
                            className="w-full h-20 bg-white/5 border border-white/10 rounded-md p-3 text-sm outline-none"
                        />
                        <textarea
                            placeholder="Would you recommend DeepCytes? Why/Why not?"
                            value={formData.recommendation}
                            onChange={e => setFormData({ ...formData, recommendation: e.target.value })}
                            className="w-full h-20 bg-white/5 border border-white/10 rounded-md p-3 text-sm outline-none"
                        />
                    </div>
                );
            case 5: // Vision
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Vision for the Future</h3>
                        <Input placeholder="What inspires you about tackling cybercrime?" value={formData.inspiration} onChange={e => setFormData({ ...formData, inspiration: e.target.value })} className="bg-white/5 border-white/10" />
                        <Input placeholder="Ideas for innovative projects?" value={formData.innovativeIdeas} onChange={e => setFormData({ ...formData, innovativeIdeas: e.target.value })} className="bg-white/5 border-white/10" />

                        <div className="pt-4 border-t border-white/10">
                            <label className="text-sm font-bold text-white block mb-3">Consent for promotional use?</label>
                            <div className="space-y-2">
                                {['Yes, I consent', 'No, I do not consent'].map(opt => (
                                    <div
                                        key={opt}
                                        onClick={() => setFormData({ ...formData, promotionalConsent: opt })}
                                        className={`p-3 border rounded-xl cursor-pointer flex items-center gap-3 text-sm ${formData.promotionalConsent === opt ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border ${formData.promotionalConsent === opt ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500'}`} />
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 6: // Career
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Career Opportunities</h3>
                        <p className="text-sm text-gray-500">Would you like to receive notifications about career opportunities (₹5 LPA to ₹25 LPA)?</p>

                        <div className="space-y-3">
                            {['Yes, send me opportunities', 'No, not interested'].map(opt => (
                                <div
                                    key={opt}
                                    onClick={() => setFormData({ ...formData, careerNotifications: opt })}
                                    className={`p-4 border rounded-xl cursor-pointer flex items-center justify-between ${formData.careerNotifications === opt ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                >
                                    <span className="font-bold text-sm">{opt}</span>
                                    {formData.careerNotifications === opt && <CheckCircle className="w-5 h-5" />}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    if (!tenure) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 max-w-3xl mx-auto">
            <div className="text-center space-y-6">
                <div className="inline-flex p-4 border border-orange-500/20 bg-orange-500/5 text-orange-500 mb-2">
                    <Clock className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Tenure_<span className="text-orange-500">Timeline</span></h2>

                {/* Timer Display */}
                <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto mt-8">
                    {Object.entries(timeLeft).map(([label, value]) => (
                        <div key={label} className="bg-black border border-white/10 p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1 h-1 bg-cyan-500/30" />
                            <div className="text-3xl font-black text-cyan-400 font-mono tracking-tighter">{String(value).padStart(2, '0')}</div>
                            <div className="text-[7px] font-black uppercase text-gray-700 mt-2 tracking-[0.2em]">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Container */}
            <div className={`p-1 border transition-all duration-700 relative overflow-hidden ${isTenureEnded ? 'border-white/10' : 'border-white/5 opacity-40 grayscale select-none pointer-events-none'}`}>
                <div className="bg-black p-10 sm:p-14 relative">
                    {/* Lock Overlay */}
                    {!isTenureEnded && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center flex-col gap-6 p-8 text-center">
                            <div className="w-20 h-20 bg-white/5 flex items-center justify-center border border-white/10 rotate-45">
                                <Clock className="w-8 h-8 text-gray-600 -rotate-45" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-500">Access_Restricted</p>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-700">Form locked until graduation sequence initialized.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 bg-cyan-500 animate-pulse" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Protocol_ID: EXIT_FEEDBACK_v2.0</h4>
                        </div>
                        <span className="text-[10px] font-black text-gray-600 font-mono">SEQ_{step} / 6</span>
                    </div>

                    <div className="min-h-[400px]">
                        {renderStep()}
                    </div>

                    <div className="flex justify-between mt-12 pt-10 border-t border-white/5">
                        {step > 1 ? (
                            <Button onClick={handleBack} variant="outline" className="border-white/10 hover:bg-white/5 rounded-none font-black text-[10px] uppercase tracking-widest h-12 px-8 transition-all">
                                [PREV_SEQ]
                            </Button>
                        ) : <div />}

                        {step < 6 ? (
                            <Button onClick={handleNext} className="bg-white text-black hover:bg-cyan-500 hover:text-white rounded-none font-black text-[10px] uppercase tracking-widest h-12 px-8 transition-all">
                                [NEXT_SEQ] <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={submitFeedback} disabled={loading} className="bg-green-600 text-white hover:bg-green-500 rounded-none font-black text-[10px] uppercase tracking-widest h-12 px-8 transition-all shadow-[0_0_20px_rgba(22,163,74,0.2)]">
                                {loading ? 'TRANSMITTING...' : '[EXECUTE_GRADUATION]'} <Send className="w-4 h-4 ml-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {!isTenureEnded && (
                <div className="text-center py-6">
                    <button
                        onClick={() => router.push('/portal/onboarding/completion')}
                        className="text-[9px] font-black uppercase text-gray-700 hover:text-cyan-500 tracking-[0.4em] transition-colors pointer-events-auto"
                    >
                        {/* //_PREVIEW_COMPLETION_CERTIFICATE_// */}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

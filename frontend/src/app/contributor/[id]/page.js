"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Code, ExternalLink, Github, Clock, Calendar, ArrowLeft,
    Shield, ChevronRight, Activity, Link2, UserCheck, UserMinus,
    Mail, MapPin, Briefcase, Award, FileText, CheckCircle, XCircle,
    Timer, History, ScrollText, User
} from "lucide-react";

export default function ContributorProfilePage() {
    const { id } = useParams(); // This is the FellowProjectProfile _id
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [fellowshipProfile, setFellowshipProfile] = useState(null);
    const [activeProjects, setActiveProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (!id) return;
        const token = localStorage.getItem("accessToken");
        if (!token) {
            toast.error("Please login first");
            router.push("/login");
            return;
        }
        fetchProfileData(token);
    }, [id]);

    const fetchProfileData = async (token) => {
        setLoading(true);
        setError(null);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            // Fetch active projects for this profile
            const projectsRes = await axios.get(`${serverUrl}/active-projects/${id}`, config);
            setActiveProjects(projectsRes.data || []);

            // If we have projects, get the fellowship profile ID from the first one
            if (projectsRes.data && projectsRes.data.length > 0) {
                const fellowshipProfileId = projectsRes.data[0]?.profileId?.fellowshipProfile_id;
                
                if (fellowshipProfileId) {
                    try {
                        const fellowshipRes = await axios.get(`${serverUrl}/fellowship/profile/${fellowshipProfileId}`, config);
                        setFellowshipProfile(fellowshipRes.data);
                    } catch (err) {
                        console.error("Failed to fetch fellowship profile:", err);
                    }
                }

                // Set basic profile info from projectsRes
                setProfile(projectsRes.data[0]?.profileId);
            } else {
                // No active projects, try to fetch profile directly if possible
                setError("No active projects found for this profile");
            }
        } catch (err) {
            console.error("Error fetching profile data:", err);
            setError(err.response?.data?.message || "Failed to load profile data");
            toast.error("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === "0") return 'N/A';
        // Check if it's in DDMMYYYY format
        if (/^\d{8}$/.test(dateStr)) {
            const day = dateStr.slice(0, 2);
            const month = dateStr.slice(2, 4);
            const year = dateStr.slice(4, 8);
            return `${day}/${month}/${year}`;
        }
        return new Date(dateStr).toLocaleDateString('en-IN', { dateStyle: 'medium' });
    };

    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'active') return 'border-green-500/50 text-green-500 bg-green-500/5';
        if (s === 'completed') return 'border-blue-500/50 text-blue-500 bg-blue-500/5';
        if (s === 'pending') return 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5';
        return 'border-gray-500/50 text-gray-500 bg-gray-500/5';
    };

    const getProjectStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'ongoing') return 'border-green-500/50 text-green-500 bg-green-500/5';
        if (s === 'completed') return 'border-blue-500/50 text-blue-500 bg-blue-500/5';
        if (s === 'onhold' || s === 'on-hold') return 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5';
        return 'border-orange-500/50 text-orange-500 bg-orange-500/5';
    };

    const getLinkIcon = (url) => {
        if ((url || '').toLowerCase().includes('github.com')) return <Github className="w-5 h-5" />;
        return <ExternalLink className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-950 text-white flex flex-col font-mono">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-6">
                    <div className="w-16 h-16 border-2 border-orange-500 border-t-white animate-spin rounded-full" />
                    <p className="text-sm font-mono text-orange-500 animate-pulse uppercase tracking-widest">LOADING_PROFILE...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="h-screen bg-slate-950 text-white flex flex-col font-mono">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="text-red-500 text-6xl font-bold">404</div>
                    <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">{error || 'PROFILE_NOT_FOUND'}</p>
                    <button
                        onClick={() => router.push('/applications')}
                        className="mt-4 px-6 py-2 border border-white/20 text-gray-400 hover:text-white hover:border-white/50 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> GO_BACK
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col font-mono selection:bg-orange-500/50 selection:text-black">
            <Navbar />

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

            <main className="flex-1 relative z-10">
                {/* Header Bar */}
                <div className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 border border-white/10 hover:border-orange-500/50 hover:text-orange-400 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-orange-500 animate-pulse" />
                                <span className="text-sm text-gray-400 uppercase tracking-[0.2em]">CONTRIBUTOR_PROFILE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-10">
                    {/* Profile Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col md:flex-row items-start gap-8"
                    >
                        <div className="w-32 h-32 border border-orange-500/30 flex items-center justify-center text-5xl font-bold bg-orange-500/5 text-orange-500 shrink-0">
                            {(profile?.firstName || 'U')[0].toUpperCase()}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-white">
                                    {profile?.firstName || 'UNKNOWN'} {fellowshipProfile?.lastName || ''}
                                </h1>
                                {fellowshipProfile?.email && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm font-mono">{fellowshipProfile.email}</span>
                                    </div>
                                )}
                                {fellowshipProfile?.socials && (
                                    <div className="flex items-center gap-4">
                                        {fellowshipProfile.socials.github && (
                                            <a
                                                href={fellowshipProfile.socials.github}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-orange-400 transition-colors"
                                                title="GitHub"
                                            >
                                                <Github className="w-5 h-5" />
                                            </a>
                                        )}
                                        {fellowshipProfile.socials.linkedin && (
                                            <a
                                                href={fellowshipProfile.socials.linkedin}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                                                title="LinkedIn"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-6 text-xs text-gray-500 font-mono">
                                <span className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Profile ID: {id.slice(-8)}...
                                </span>
                                {fellowshipProfile?.globalPid && (
                                    <span className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5" /> Global ID: {fellowshipProfile.globalPid}
                                    </span>
                                )}
                                {fellowshipProfile?.status && (
                                    <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold ${getStatusStyle(fellowshipProfile.status)}`}>
                                        {fellowshipProfile.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Active Projects */}
                        <div className="lg:col-span-2 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="border border-white/10 bg-white/[0.02]"
                            >
                                <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Active_Projects
                                    </h3>
                                    <span className="text-[10px] text-gray-500 font-mono">{activeProjects.length} PROJECTS</span>
                                </div>
                                <div className="p-6">
                                    {activeProjects.length > 0 ? (
                                        <div className="grid gap-4">
                                            {activeProjects.map((log, idx) => {
                                                const project = log.projectId;
                                                if (!project) return null;
                                                return (
                                                    <div
                                                        key={log._id || idx}
                                                        className="p-5 bg-slate-900/60 border border-white/5 hover:border-green-500/30 transition-all space-y-4 cursor-pointer group"
                                                        onClick={() => router.push(`/project/${project._id}`)}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 space-y-2">
                                                                <h4 className="text-lg font-bold text-white uppercase tracking-wider group-hover:text-orange-400 transition-colors">
                                                                    {project.title || 'UNTITLED'}
                                                                </h4>
                                                                <p className="text-sm text-gray-400 line-clamp-2">
                                                                    {project.description || 'No description'}
                                                                </p>
                                                            </div>
                                                            <div className={`px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest shrink-0 ${getProjectStatusStyle(project.status)}`}>
                                                                {(project.status || 'UNKNOWN').toUpperCase()}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 font-mono">
                                                            <span className="flex items-center gap-1">
                                                                <Shield className="w-3 h-3" /> ROLE: <span className="text-cyan-400">{log.role || 'N/A'}</span>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <UserCheck className="w-3 h-3" /> JOINED: <span className="text-green-400">{formatDate(log.joinedAt)}</span>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" /> {project.contributors?.length || 0} Contributors
                                                            </span>
                                                        </div>

                                                        {project.supportedLinks && project.supportedLinks.length > 0 && (
                                                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                                                {project.supportedLinks.slice(0, 3).map((link, i) => (
                                                                    <a
                                                                        key={i}
                                                                        href={link.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-gray-500 hover:text-orange-400 transition-colors"
                                                                        title={link.linkName}
                                                                    >
                                                                        {getLinkIcon(link.url)}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 font-mono italic text-center py-8">NO_ACTIVE_PROJECTS</div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Fellowship Tenures */}
                            {fellowshipProfile?.tenures && fellowshipProfile.tenures.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="border border-white/10 bg-white/[0.02]"
                                >
                                    <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> Fellowship_Tenures
                                        </h3>
                                        <span className="text-[10px] text-gray-500 font-mono">{fellowshipProfile.tenures.length} ENTRIES</span>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {fellowshipProfile.tenures.map((tenure, idx) => (
                                            <div
                                                key={tenure._id || idx}
                                                className="p-4 bg-slate-900/60 border border-white/5 hover:border-purple-500/30 transition-all space-y-3"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-bold text-white uppercase">{tenure.type || 'N/A'}</span>
                                                            {tenure.role && (
                                                                <span className="px-2 py-0.5 border border-cyan-500/30 text-[9px] text-cyan-400 uppercase font-bold bg-cyan-500/5">
                                                                    {tenure.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {tenure.project && (
                                                            <div className="text-xs text-gray-400 font-mono">
                                                                Project: {tenure.project}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1 border text-[9px] uppercase font-bold ${getStatusStyle(tenure.status)}`}>
                                                        {tenure.status || 'UNKNOWN'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-mono">
                                                    {tenure.orgCode && (
                                                        <span className="flex items-center gap-1">
                                                            <Shield className="w-3 h-3" /> ORG: <span className="text-orange-400">{tenure.orgCode}</span>
                                                        </span>
                                                    )}
                                                    {tenure.cohort && (
                                                        <span className="flex items-center gap-1">
                                                            <Award className="w-3 h-3" /> COHORT: <span className="text-blue-400">{tenure.cohort}</span>
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> 
                                                        {formatDate(tenure.startDate)} → {formatDate(tenure.endDate)}
                                                    </span>
                                                </div>

                                                {tenure.completionStatus && (
                                                    <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500">
                                                        Completion: <span className="text-white">{tenure.completionStatus}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Right Column - Profile Info */}
                        <div className="space-y-8">
                            {/* Quick Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                                className="border border-white/10 bg-white/[0.02]"
                            >
                                <div className="px-6 py-4 border-b border-white/10">
                                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Quick_Stats</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">Active Projects</span>
                                        <span className="text-xs font-bold text-green-400">{activeProjects.length}</span>
                                    </div>
                                    {profile?.activeProject_id && (
                                        <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase font-mono">Total Projects (All)</span>
                                            <span className="text-xs font-bold text-orange-400">{profile.activeProject_id.length}</span>
                                        </div>
                                    )}
                                    {profile?.nonActiveProject_id && profile.nonActiveProject_id.length > 0 && (
                                        <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase font-mono">Past Projects</span>
                                            <span className="text-xs font-bold text-gray-400">{profile.nonActiveProject_id.length}</span>
                                        </div>
                                    )}
                                    {fellowshipProfile?.tenures && (
                                        <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase font-mono">Tenures</span>
                                            <span className="text-xs font-bold text-purple-400">{fellowshipProfile.tenures.length}</span>
                                        </div>
                                    )}
                                    {fellowshipProfile?.createdAt && (
                                        <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase font-mono">Joined</span>
                                            <span className="text-xs font-mono text-gray-400">{formatDate(fellowshipProfile.createdAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Fellowship Info */}
                            {fellowshipProfile && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.25 }}
                                    className="border border-white/10 bg-white/[0.02]"
                                >
                                    <div className="px-6 py-4 border-b border-white/10">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fellowship_Details</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {fellowshipProfile.onboardingState && (
                                            <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                                <span className="text-[10px] text-gray-500 uppercase font-mono">Onboarding</span>
                                                <span className="text-xs font-bold text-cyan-400">{fellowshipProfile.onboardingState}</span>
                                            </div>
                                        )}
                                        {fellowshipProfile.assigned_role && (
                                            <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                                <span className="text-[10px] text-gray-500 uppercase font-mono">Assigned Role</span>
                                                <span className="text-xs font-bold text-cyan-400">{fellowshipProfile.assigned_role}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase font-mono">Email Verified</span>
                                            {fellowshipProfile.isEmailVerified ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                        </div>
                                        {fellowshipProfile.nda?.version && (
                                            <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5">
                                                <span className="text-[10px] text-gray-500 uppercase font-mono">NDA Version</span>
                                                <span className="text-xs font-mono text-gray-400">{fellowshipProfile.nda.version}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* All Project Roles */}
                            {profile?.activeProject_id && profile.activeProject_id.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="border border-white/10 bg-white/[0.02]"
                                >
                                    <div className="px-6 py-4 border-b border-white/10">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">All_Project_Roles</h3>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {profile.activeProject_id.map((proj, idx) => (
                                            <div key={proj._id || idx} className="p-3 bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all">
                                                <div className="flex items-center justify-between text-[10px] font-mono">
                                                    <span className="text-cyan-400 font-bold uppercase">{proj.role || 'N/A'}</span>
                                                    <span className="text-gray-500">{proj.ref_id?.slice(-6) || '...'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}


"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
    Users, Code, ExternalLink, Github, Clock, Calendar, ArrowLeft,
    Shield, ChevronRight, Activity, Link2, UserCheck, UserMinus
} from "lucide-react";

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [activeContributors, setActiveContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (!id) return;
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/admin");
            return;
        }
        fetchProjectData(token);
    }, [id]);

    const fetchProjectData = async (token) => {
        setLoading(true);
        setError(null);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [projectRes, contributorsRes] = await Promise.allSettled([
            axios.get(`${serverUrl}/project/${id}`, config),
            axios.get(`${serverUrl}/active-contributors/${id}`, config)
        ]);

        if (projectRes.status === 'fulfilled') {
            setProject(projectRes.value.data);
        } else {
            const status = projectRes.reason?.response?.status;
            if (status === 401) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                router.push("/admin");
            }
            setError("Project not found");
            toast.error("Failed to load project");
            setLoading(false);
            return;
        }

        if (contributorsRes.status === 'fulfilled') {
            setActiveContributors(contributorsRes.value.data || []);
        }

        setLoading(false);
    };

    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'ongoing') return 'border-blue-500/50 text-blue-500 bg-blue-500/5';
        if (s === 'completed') return 'border-green-500/50 text-green-500 bg-green-500/5';
        if (s === 'onhold' || s === 'on-hold') return 'border-red-500/50 text-red-500 bg-red-500/5';
        return 'border-orange-500/50 text-orange-500 bg-orange-500/5';
    };

    const getLinkIcon = (url) => {
        if ((url || '').toLowerCase().includes('github.com')) return <Github className="w-5 h-5" />;
        return <ExternalLink className="w-5 h-5" />;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', { dateStyle: 'medium' });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    if (loading) {
        return (
            <div className="h-screen bg-black text-white flex flex-col font-mono">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-6">
                    <div className="w-16 h-16 border-2 border-orange-500 border-t-white animate-spin rounded-full" />
                    <p className="text-sm font-mono text-orange-500 animate-pulse uppercase tracking-widest">LOADING_PROJECT_DATA...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="h-screen bg-black text-white flex flex-col font-mono">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="text-red-500 text-6xl font-bold">404</div>
                    <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">{error || 'PROJECT_NOT_FOUND'}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-6 py-2 border border-white/20 text-gray-400 hover:text-white hover:border-white/50 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> GO_BACK
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-orange-500/50 selection:text-black">
            <Navbar />

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

            <main className="flex-1 relative z-10">
                {/* Header Bar */}
                <div className="border-b border-white/10 bg-black/50 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 border border-white/10 hover:border-orange-500/50 hover:text-orange-400 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-orange-500 animate-pulse" />
                            <span className="text-sm text-gray-400 uppercase tracking-[0.2em]">PROJECT_INSPECTOR</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-10">
                    {/* Project Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col md:flex-row items-start gap-8"
                    >
                        <div className="w-24 h-24 border border-orange-500/30 flex items-center justify-center text-4xl font-bold bg-orange-500/5 text-orange-500 shrink-0">
                            <Code className="w-12 h-12" />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-white">{project.title}</h1>

                                    {/* Links icons row */}
                                    <div className="flex items-center gap-3">
                                        {(project.supportedLinks || []).map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-orange-400 transition-colors"
                                                title={link.linkName}
                                            >
                                                {getLinkIcon(link.url)}
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className={`px-5 py-2.5 border text-sm font-bold uppercase tracking-widest shrink-0 ${getStatusStyle(project.status)}`}>
                                    {(project.status || 'UNKNOWN').toUpperCase()}
                                </div>
                            </div>

                            <p className="text-base text-gray-300 leading-relaxed max-w-3xl">{project.description || 'NO_DESCRIPTION'}</p>

                            <div className="flex flex-wrap gap-6 text-xs text-gray-500 font-mono">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Created: {formatDate(project.createdAt)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" /> Updated: {formatDate(project.updatedAt)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> {project.contributors?.length || 0} Contributors
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Contributors from Project */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="border border-white/10 bg-white/[0.02]"
                            >
                                <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Project_Contributors
                                    </h3>
                                    <span className="text-[10px] text-gray-500 font-mono">{project.contributors?.length || 0} REGISTERED</span>
                                </div>
                                <div className="p-6">
                                    {(project.contributors || []).length > 0 ? (
                                        <div className="grid gap-3">
                                            {project.contributors.map((contributor, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-4 bg-black/40 border border-white/5 hover:border-orange-500/30 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 border border-orange-500/30 flex items-center justify-center text-lg font-bold bg-orange-500/5 text-orange-400">
                                                            {(contributor.firstName || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white uppercase tracking-wider">{contributor.firstName}</div>
                                                            <div className="text-[10px] text-gray-500 font-mono">{contributor.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 border border-cyan-500/30 text-[10px] text-cyan-400 uppercase font-bold tracking-wider bg-cyan-500/5">
                                                        {contributor.role || 'UNASSIGNED'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 font-mono italic text-center py-8">NO_CONTRIBUTORS_REGISTERED</div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Active Contributors from Contribution Logs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="border border-white/10 bg-white/[0.02]"
                            >
                                <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Active_Contributors_Log
                                    </h3>
                                    <span className="text-[10px] text-gray-500 font-mono">{activeContributors.length} ACTIVE</span>
                                </div>
                                <div className="p-6">
                                    {activeContributors.length > 0 ? (
                                        <div className="grid gap-3">
                                            {activeContributors.map((log, idx) => (
                                                <div
                                                    key={log._id || idx}
                                                    className="p-4 bg-black/40 border border-white/5 hover:border-green-500/30 transition-all space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${log.isActive ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-700'}`} />
                                                            <span className="text-sm font-bold text-white uppercase tracking-wider">
                                                                Profile: {log.profileId?._id || log.profileId || 'UNKNOWN'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold ${log.isActive ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
                                                                {log.isActive ? 'ACTIVE' : 'LEFT'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-mono">
                                                        <span className="flex items-center gap-1">
                                                            <Shield className="w-3 h-3" /> ROLE: <span className="text-cyan-400">{log.role || 'N/A'}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <UserCheck className="w-3 h-3" /> JOINED: <span className="text-green-400">{formatDateTime(log.joinedAt)}</span>
                                                        </span>
                                                        {log.leftAt && (
                                                            <span className="flex items-center gap-1">
                                                                <UserMinus className="w-3 h-3" /> LEFT: <span className="text-red-400">{formatDateTime(log.leftAt)}</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Show active projects if profileId is populated */}
                                                    {log.profileId?.activeProject_id && log.profileId.activeProject_id.length > 0 && (
                                                        <div className="pt-2 border-t border-white/5">
                                                            <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">Active_Projects ({log.profileId.activeProject_id.length})</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {log.profileId.activeProject_id.map((proj, pIdx) => (
                                                                    <span
                                                                        key={pIdx}
                                                                        className={`px-2 py-1 border text-[9px] font-mono ${
                                                                            proj.ref_id === id
                                                                                ? 'border-orange-500/50 text-orange-400 bg-orange-500/10'
                                                                                : 'border-white/10 text-gray-500'
                                                                        }`}
                                                                    >
                                                                        {proj.role || 'N/A'} — {proj.ref_id?.slice(-6) || '...'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 font-mono italic text-center py-8">NO_ACTIVE_CONTRIBUTION_LOGS</div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-8">
                            {/* Supported Links */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                                className="border border-white/10 bg-white/[0.02]"
                            >
                                <div className="px-6 py-4 border-b border-white/10">
                                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                        <Link2 className="w-4 h-4" /> Supported_Links
                                    </h3>
                                </div>
                                <div className="p-4 space-y-2">
                                    {(project.supportedLinks || []).length > 0 ? (
                                        project.supportedLinks.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-black/40 border border-white/5 hover:border-orange-500/30 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-orange-400">{getLinkIcon(link.url)}</span>
                                                    <span className="text-sm font-mono text-gray-300 uppercase group-hover:text-white transition-colors">{link.linkName || 'LINK'}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors" />
                                            </a>
                                        ))
                                    ) : (
                                        <div className="text-xs text-gray-600 font-mono italic text-center py-4">NO_LINKS</div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Quick Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.25 }}
                                className="border border-white/10 bg-white/[0.02]"
                            >
                                <div className="px-6 py-4 border-b border-white/10">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quick_Stats</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">Status</span>
                                        <span className={`text-xs font-bold uppercase ${getStatusStyle(project.status).split(' ').find(c => c.startsWith('text-'))}`}>
                                            {(project.status || 'UNKNOWN').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">Contributors</span>
                                        <span className="text-xs font-bold text-orange-400">{project.contributors?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">Active Log Entries</span>
                                        <span className="text-xs font-bold text-green-400">{activeContributors.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">Links</span>
                                        <span className="text-xs font-bold text-cyan-400">{project.supportedLinks?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">Created</span>
                                        <span className="text-xs font-mono text-gray-400">{formatDate(project.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">Last Updated</span>
                                        <span className="text-xs font-mono text-gray-400">{formatDate(project.updatedAt)}</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Roles Breakdown */}
                            {(project.contributors || []).length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="border border-white/10 bg-white/[0.02]"
                                >
                                    <div className="px-6 py-4 border-b border-white/10">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Roles_Breakdown</h3>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {Object.entries(
                                            (project.contributors || []).reduce((acc, c) => {
                                                const role = c.role || 'Unassigned';
                                                acc[role] = (acc[role] || 0) + 1;
                                                return acc;
                                            }, {})
                                        ).map(([role, count]) => (
                                            <div key={role} className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                                <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold">{role}</span>
                                                <span className="text-xs font-bold text-white">{count}</span>
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

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
    Edit3, Save, XCircle, Plus, Trash2, LogIn, LogOut, Timer, History,
    ScrollText
} from "lucide-react";

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [activeContributors, setActiveContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Project contribution logs (all logs for this project, latest first)
    const [projectLogs, setProjectLogs] = useState([]);

    // Time tracking: profileId -> { totalMs, totalDays }
    const [contributorTime, setContributorTime] = useState({});
    // History: profileId -> array of logs
    const [contributorHistory, setContributorHistory] = useState({});
    const [expandedHistory, setExpandedHistory] = useState({});

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '', status: '', supportedLinks: [], contributors: [] });
    const [newLink, setNewLink] = useState({ linkName: '', url: '' });
    const [newContributor, setNewContributor] = useState({ firstName: '', email: '', role: '' });

    // Join modal
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinData, setJoinData] = useState({ profileId: '', role: '' });

    const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (!id) return;
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/admin");
            return;
        }
        const user = JSON.parse(localStorage.getItem("user") || "null");
        setIsAdmin(user?.isAdmin || false);
        fetchProjectData(token);
    }, [id]);

    const fetchProjectData = async (token) => {
        setLoading(true);
        setError(null);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [projectRes, contributorsRes, logsRes] = await Promise.allSettled([
            axios.get(`${serverUrl}/project/${id}`, config),
            axios.get(`${serverUrl}/active-contributors/${id}`, config),
            axios.get(`${serverUrl}/logs/${id}`, config)
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

        let contributors = [];
        if (contributorsRes.status === 'fulfilled') {
            contributors = contributorsRes.value.data || [];
            setActiveContributors(contributors);
        }

        if (logsRes.status === 'fulfilled') {
            setProjectLogs(logsRes.value.data || []);
        }

        setLoading(false);

        // Fetch time tracking and history for each active contributor
        if (contributors.length > 0) {
            fetchTimeAndHistory(contributors, config);
        }
    };

    const fetchTimeAndHistory = async (contributors, config) => {
        const timePromises = contributors.map(c => {
            const profileId = c.profileId?._id || c.profileId;
            if (!profileId) return Promise.resolve(null);
            return axios.get(`${serverUrl}/total-time/${id}/${profileId}`, config)
                .then(res => ({ profileId, data: res.data }))
                .catch(() => null);
        });

        const historyPromises = contributors.map(c => {
            const profileId = c.profileId?._id || c.profileId;
            if (!profileId) return Promise.resolve(null);
            return axios.get(`${serverUrl}/history/${profileId}`, config)
                .then(res => ({ profileId, data: res.data }))
                .catch(() => null);
        });

        const [timeResults, historyResults] = await Promise.all([
            Promise.allSettled(timePromises),
            Promise.allSettled(historyPromises)
        ]);

        const timeMap = {};
        timeResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                timeMap[r.value.profileId] = r.value.data;
            }
        });
        setContributorTime(timeMap);

        const histMap = {};
        historyResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                histMap[r.value.profileId] = r.value.data;
            }
        });
        setContributorHistory(histMap);
    };

    const refreshData = () => {
        const token = localStorage.getItem("accessToken");
        if (token) fetchProjectData(token);
    };

    // --- Edit Project ---
    const openEditModal = () => {
        setEditData({
            title: project.title || '',
            description: project.description || '',
            status: project.status || 'ongoing',
            supportedLinks: (project.supportedLinks || []).map(l => ({ linkName: l.linkName, url: l.url })),
            contributors: (project.contributors || []).map(c => ({ firstName: c.firstName, email: c.email, role: c.role }))
        });
        setNewLink({ linkName: '', url: '' });
        setNewContributor({ firstName: '', email: '', role: '' });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.patch(`${serverUrl}/project/${id}`, editData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Project updated successfully");
            setShowEditModal(false);
            refreshData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update project");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddEditLink = () => {
        if (!newLink.linkName || !newLink.url) return toast.error("Link name and URL are required");
        setEditData({ ...editData, supportedLinks: [...editData.supportedLinks, { ...newLink }] });
        setNewLink({ linkName: '', url: '' });
    };

    const handleRemoveEditLink = (idx) => {
        setEditData({ ...editData, supportedLinks: editData.supportedLinks.filter((_, i) => i !== idx) });
    };

    const handleAddEditContributor = () => {
        if (!newContributor.email || !newContributor.firstName) return toast.error("Name and Email are required");
        setEditData({ ...editData, contributors: [...editData.contributors, { ...newContributor }] });
        setNewContributor({ firstName: '', email: '', role: '' });
    };

    const handleRemoveEditContributor = (idx) => {
        setEditData({ ...editData, contributors: editData.contributors.filter((_, i) => i !== idx) });
    };

    // --- Join/Leave ---
    const handleJoinContributor = async () => {
        if (!joinData.profileId || !joinData.role) return toast.error("Profile ID and Role are required");
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${serverUrl}/join`, {
                projectId: id,
                profileId: joinData.profileId,
                role: joinData.role
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Contributor joined project");
            setShowJoinModal(false);
            setJoinData({ profileId: '', role: '' });
            refreshData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to join contributor");
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveContributor = async (profileId) => {
        if (!window.confirm("Mark this contributor as left?")) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${serverUrl}/leave`, {
                projectId: id,
                profileId: profileId
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Contributor marked as left");
            refreshData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to mark contributor as left");
        } finally {
            setActionLoading(false);
        }
    };

    // --- Helpers ---
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

    const formatDuration = (timeData) => {
        if (!timeData) return 'N/A';
        const { totalMs, totalDays } = timeData;
        if (totalDays >= 1) return `${totalDays.toFixed(1)} days`;
        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
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
        <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-orange-500/50 selection:text-black">
            <Navbar />

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

            <main className="flex-1 relative z-10">
                {/* Header Bar */}
                <div className="border-b border-white/10 bg-black/50 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                    onClick={() => router.push('/applications')}
                                className="p-2 border border-white/10 hover:border-orange-500/50 hover:text-orange-400 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-orange-500 animate-pulse" />
                                <span className="text-sm text-gray-400 uppercase tracking-[0.2em]">PROJECT_INSPECTOR</span>
                            </div>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={openEditModal}
                                className="flex items-center gap-2 px-4 py-2 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                <Edit3 className="w-4 h-4" /> EDIT_PROJECT
                            </button>
                        )}
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
                        {/* Left Column */}
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

                            {/* Active Contributors with Time Tracking */}
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
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-500 font-mono">{activeContributors.length} ACTIVE</span>
                                        {isAdmin && (
                                            <button
                                                onClick={() => setShowJoinModal(true)}
                                                className="flex items-center gap-1 px-2 py-1 border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all text-[10px] font-bold uppercase"
                                            >
                                                <LogIn className="w-3 h-3" /> JOIN
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    {activeContributors.length > 0 ? (
                                        <div className="grid gap-3">
                                            {activeContributors.map((log, idx) => {
                                                const profileId = log.profileId?._id || log.profileId;
                                                const timeData = contributorTime[profileId];
                                                return (
                                                    <div
                                                        key={log._id || idx}
                                                        className="p-4 bg-black/40 border border-white/5 hover:border-green-500/30 transition-all space-y-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-2 rounded-full ${log.isActive ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-700'}`} />
                                                                <span className="text-sm font-bold text-white uppercase tracking-wider">
                                                                    Profile: {typeof profileId === 'string' ? profileId?.slice(-8) : 'UNKNOWN'}...
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {/* Time tracking badge */}
                                                                {timeData && (
                                                                    <span className="px-2 py-0.5 border border-yellow-500/30 text-[9px] text-yellow-400 uppercase font-bold bg-yellow-500/5 flex items-center gap-1">
                                                                        <Timer className="w-3 h-3" /> {formatDuration(timeData)}
                                                                    </span>
                                                                )}
                                                                <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold ${log.isActive ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
                                                                    {log.isActive ? 'ACTIVE' : 'LEFT'}
                                                                </span>
                                                                {isAdmin && log.isActive && (
                                                                    <button
                                                                        onClick={() => handleLeaveContributor(profileId)}
                                                                        disabled={actionLoading}
                                                                        className="p-1 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                                                                        title="Mark as left"
                                                                    >
                                                                        <LogOut className="w-3 h-3" />
                                                                    </button>
                                                                )}
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

                                                        {/* Expandable History */}
                                                        {contributorHistory[profileId] && contributorHistory[profileId].length > 0 && (
                                                            <div className="pt-2 border-t border-white/5">
                                                                <button
                                                                    onClick={() => setExpandedHistory(prev => ({ ...prev, [profileId]: !prev[profileId] }))}
                                                                    className="text-[9px] text-gray-500 uppercase tracking-widest hover:text-orange-400 transition-colors flex items-center gap-1"
                                                                >
                                                                    <History className="w-3 h-3" />
                                                                    {expandedHistory[profileId] ? 'Hide' : 'Show'} Full_History ({contributorHistory[profileId].length} entries)
                                                                    <ChevronRight className={`w-3 h-3 transition-transform ${expandedHistory[profileId] ? 'rotate-90' : ''}`} />
                                                                </button>

                                                                <AnimatePresence>
                                                                    {expandedHistory[profileId] && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="mt-2 space-y-1.5">
                                                                                {contributorHistory[profileId].map((entry, hIdx) => (
                                                                                    <div
                                                                                        key={entry._id || hIdx}
                                                                                        className={`p-2.5 border text-[10px] font-mono flex items-center justify-between ${
                                                                                            entry.projectId === id
                                                                                                ? 'border-orange-500/30 bg-orange-500/5'
                                                                                                : 'border-white/5 bg-black/30'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className={`w-1.5 h-1.5 rounded-full ${entry.isActive ? 'bg-green-500' : 'bg-gray-600'}`} />
                                                                                            <span className="text-gray-400">Project: <span className="text-white">{entry.projectId === id ? 'THIS' : (entry.projectId?.slice(-6) || '...')}</span></span>
                                                                                            <span className="text-cyan-400">{entry.role || 'N/A'}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3 text-gray-500">
                                                                                            <span className="text-green-400/70">{formatDate(entry.joinedAt)}</span>
                                                                                            {entry.leftAt && (
                                                                                                <>
                                                                                                    <span>→</span>
                                                                                                    <span className="text-red-400/70">{formatDate(entry.leftAt)}</span>
                                                                                                </>
                                                                                            )}
                                                                                            {!entry.leftAt && entry.isActive && (
                                                                                                <span className="text-green-400">ONGOING</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        )}

                                                        {/* Active projects if populated */}
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
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 font-mono italic text-center py-8">NO_ACTIVE_CONTRIBUTION_LOGS</div>
                                    )}
                                </div>
                            </motion.div>
                            {/* All Contribution Logs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="border border-white/10 bg-white/[0.02]"
                            >
                                <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                        <ScrollText className="w-4 h-4" /> Contribution_Logs
                                    </h3>
                                    <span className="text-[10px] text-gray-500 font-mono">{projectLogs.length} ENTRIES</span>
                                </div>
                                <div className="p-6">
                                    {projectLogs.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* Table header */}
                                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-2 text-[9px] text-gray-600 uppercase tracking-widest font-bold border-b border-white/5">
                                                <span>Contributor</span>
                                                <span>Role</span>
                                                <span>Joined</span>
                                                <span>Left</span>
                                                <span className="text-right">Status</span>
                                            </div>
                                            {projectLogs.map((log, idx) => {
                                                const profileId = log.profileId?._id || log.profileId;
                                                const profileLabel = typeof profileId === 'string' ? profileId.slice(-8) : 'UNKNOWN';
                                                return (
                                                    <div
                                                        key={log._id || idx}
                                                        className={`grid grid-cols-[1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 border transition-all ${
                                                            log.isActive
                                                                ? 'border-green-500/10 bg-green-500/[0.02] hover:border-green-500/30'
                                                                : 'border-white/5 bg-black/30 hover:border-white/10'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.isActive ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-700'}`} />
                                                            <span className="text-[11px] font-mono text-gray-300 truncate" title={profileId}>
                                                                {profileLabel}...
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] font-mono text-cyan-400 truncate">
                                                            {log.role || 'N/A'}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-green-400/70">
                                                            {formatDateTime(log.joinedAt)}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-red-400/70">
                                                            {log.leftAt ? formatDateTime(log.leftAt) : '—'}
                                                        </span>
                                                        <div className="flex justify-end">
                                                            <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold ${
                                                                log.isActive
                                                                    ? 'border-green-500/30 text-green-400 bg-green-500/5'
                                                                    : 'border-red-500/30 text-red-400 bg-red-500/5'
                                                            }`}>
                                                                {log.isActive ? 'ACTIVE' : 'LEFT'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 font-mono italic text-center py-8">NO_CONTRIBUTION_LOGS</div>
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

                            {/* Time Tracking Summary */}
                            {Object.keys(contributorTime).length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.35 }}
                                    className="border border-white/10 bg-white/[0.02]"
                                >
                                    <div className="px-6 py-4 border-b border-white/10">
                                        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                                            <Timer className="w-4 h-4" /> Time_Tracking
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {Object.entries(contributorTime).map(([pId, timeData]) => {
                                            const contributor = activeContributors.find(c => (c.profileId?._id || c.profileId) === pId);
                                            return (
                                                <div key={pId} className="flex justify-between items-center p-3 bg-black/40 border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 uppercase font-mono">
                                                            {contributor?.role || pId?.slice(-6)}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-yellow-400 font-mono">
                                                        {formatDuration(timeData)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Edit Project Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-[700px] bg-black border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.1)] overflow-hidden"
                        >
                            <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-orange-500/5">
                                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                    <Edit3 className="w-4 h-4" /> EDIT_PROJECT
                                </h3>
                                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Title</label>
                                    <input
                                        value={editData.title}
                                        onChange={e => setEditData({ ...editData, title: e.target.value })}
                                        className="w-full bg-black border border-white/10 h-10 text-sm font-mono text-white focus:border-orange-500 outline-none px-3"
                                        placeholder="PROJECT_TITLE"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Description</label>
                                    <textarea
                                        value={editData.description}
                                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                                        className="w-full bg-black border border-white/10 p-3 text-sm font-mono text-white focus:border-orange-500 outline-none min-h-[80px]"
                                        placeholder="PROJECT_DESCRIPTION..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Status</label>
                                    <select
                                        value={editData.status}
                                        onChange={e => setEditData({ ...editData, status: e.target.value })}
                                        className="w-full bg-black border border-white/10 h-10 text-sm font-mono text-white px-3 outline-none focus:border-orange-500"
                                    >
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="onhold">On Hold</option>
                                    </select>
                                </div>

                                {/* Links */}
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <label className="text-[10px] uppercase font-bold text-orange-400 tracking-widest">Supported Links</label>
                                    {editData.supportedLinks.length > 0 && (
                                        <div className="space-y-2">
                                            {editData.supportedLinks.map((link, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-orange-900/10 border border-orange-500/20">
                                                    <ExternalLink className="w-3 h-3 text-orange-500 shrink-0" />
                                                    <div className="flex-1 text-xs font-mono overflow-hidden">
                                                        <span className="text-orange-400">{link.linkName}</span>
                                                        <span className="text-gray-500 ml-2 truncate">{link.url}</span>
                                                    </div>
                                                    <button onClick={() => handleRemoveEditLink(idx)} className="text-red-500 hover:text-red-400 p-1 shrink-0">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            value={newLink.linkName}
                                            onChange={e => setNewLink({ ...newLink, linkName: e.target.value })}
                                            className="bg-black border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-2 flex-1"
                                            placeholder="Link Name"
                                        />
                                        <input
                                            value={newLink.url}
                                            onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                                            className="bg-black border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-2 flex-1"
                                            placeholder="https://..."
                                        />
                                        <button onClick={handleAddEditLink} className="px-3 h-9 bg-orange-900/20 border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 text-xs font-bold uppercase">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Contributors */}
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <label className="text-[10px] uppercase font-bold text-orange-400 tracking-widest">Contributors</label>
                                    {editData.contributors.length > 0 && (
                                        <div className="space-y-2">
                                            {editData.contributors.map((c, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-orange-900/10 border border-orange-500/20">
                                                    <Users className="w-3 h-3 text-orange-500 shrink-0" />
                                                    <div className="flex-1 text-xs font-mono">
                                                        <span className="text-orange-400">{c.firstName}</span>
                                                        <span className="text-gray-500 ml-2">({c.email})</span>
                                                        {c.role && <span className="text-cyan-400 ml-2">[{c.role}]</span>}
                                                    </div>
                                                    <button onClick={() => handleRemoveEditContributor(idx)} className="text-red-500 hover:text-red-400 p-1 shrink-0">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            value={newContributor.firstName}
                                            onChange={e => setNewContributor({ ...newContributor, firstName: e.target.value })}
                                            className="bg-black border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-2 flex-1"
                                            placeholder="Name"
                                        />
                                        <input
                                            value={newContributor.email}
                                            onChange={e => setNewContributor({ ...newContributor, email: e.target.value })}
                                            className="bg-black border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-2 flex-1"
                                            placeholder="Email"
                                        />
                                        <input
                                            value={newContributor.role}
                                            onChange={e => setNewContributor({ ...newContributor, role: e.target.value })}
                                            className="bg-black border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-2 w-28"
                                            placeholder="Role"
                                        />
                                        <button onClick={handleAddEditContributor} className="px-3 h-9 bg-orange-900/20 border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 text-xs font-bold uppercase">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveEdit}
                                    disabled={actionLoading}
                                    className="w-full h-12 bg-orange-900/20 border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-black font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-sm mt-4"
                                >
                                    {actionLoading ? 'SAVING...' : (<><Save className="w-4 h-4" /> SAVE_CHANGES</>)}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Join Contributor Modal */}
            <AnimatePresence>
                {showJoinModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-[450px] bg-black border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden"
                        >
                            <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-green-500/5">
                                <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                                    <LogIn className="w-4 h-4" /> JOIN_CONTRIBUTOR
                                </h3>
                                <button onClick={() => setShowJoinModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Profile ID</label>
                                    <input
                                        value={joinData.profileId}
                                        onChange={e => setJoinData({ ...joinData, profileId: e.target.value })}
                                        className="w-full bg-black border border-white/10 h-10 text-sm font-mono text-white focus:border-green-500 outline-none px-3"
                                        placeholder="FellowProjectProfile _id"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Role</label>
                                    <input
                                        value={joinData.role}
                                        onChange={e => setJoinData({ ...joinData, role: e.target.value })}
                                        className="w-full bg-black border border-white/10 h-10 text-sm font-mono text-white focus:border-green-500 outline-none px-3"
                                        placeholder="e.g. Front Dev, Security Researcher"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowJoinModal(false)}
                                        className="flex-1 h-10 border border-white/10 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleJoinContributor}
                                        disabled={actionLoading}
                                        className="flex-1 h-10 bg-green-900/20 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black font-bold uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? 'JOINING...' : (<><LogIn className="w-3 h-3" /> CONFIRM</>)}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

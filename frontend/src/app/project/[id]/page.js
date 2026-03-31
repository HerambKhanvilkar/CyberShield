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
    
    // Contributor autocomplete for edit modal
    const [contributorMode, setContributorMode] = useState('name');
    const [contributorQuery, setContributorQuery] = useState('');
    const [contributorSuggestions, setContributorSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    // Join modal
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
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

    // Autocomplete search for contributors
    const fetchContributorSuggestions = async (query) => {
        if (!query || query.length === 0) {
            setContributorSuggestions([]);
            return;
        }
        const q = encodeURIComponent(query.trim());
        const endpoint = contributorMode === 'name' 
            ? `${serverUrl}/contributor/autocompleteByname?q=${q}` 
            : `${serverUrl}/contributor/autocompleteByrole?q=${q}`;

        try {
            setSuggestionsLoading(true);
            const res = await fetch(endpoint, { headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setContributorSuggestions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Autocomplete fetch error', err);
            setContributorSuggestions([]);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    // Debounced autocomplete
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContributorSuggestions(contributorQuery);
        }, 250);
        return () => clearTimeout(timer);
    }, [contributorQuery, contributorMode]);

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

    const handleSelectContributor = (item) => {
        const contributorObj = {
            firstName: item.firstName || '',
            email: item.email || item.emailId || '',
            role: item.assigned_role || item.assignedRole || item.role || ''
        };
        setEditData({ ...editData, contributors: [...editData.contributors, contributorObj] });
        setContributorQuery('');
        setContributorSuggestions([]);
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
            <div className="h-screen bg-slate-950 text-white flex flex-col font-mono">
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
            <div className="h-screen bg-slate-950 text-white flex flex-col font-mono">
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

    const totalProjectHours = Object.values(contributorTime).reduce((acc, curr) => acc + (curr.totalMs / (1000 * 60 * 60)), 0);
    const roleCounts = (project?.contributors || []).reduce((acc, c) => {
        if (c.role) acc[c.role] = (acc[c.role] || 0) + 1;
        return acc;
    }, {});

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
                                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">{project.title}</h1>
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

                                <div className={`px-4 py-2 border text-xs font-bold uppercase tracking-widest shrink-0 ${getStatusStyle(project.status)}`}>
                                    {(project.status || 'UNKNOWN').toUpperCase()}
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">{project.description || 'NO_DESCRIPTION'}</p>

                            <div className="flex flex-wrap gap-6 text-[11px] text-gray-500 font-mono">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-orange-500/50" /> Created: <span className="text-gray-400">{formatDate(project.createdAt)}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-orange-500/50" /> Updated: <span className="text-gray-400">{formatDate(project.updatedAt)}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-orange-500/50" /> <span className="text-gray-400">{project.contributors?.length || 0} Contributors</span>
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs Navigation */}
                    <div className="flex items-center border-b border-white/5 gap-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'overview', label: 'OVERVIEW', icon: ScrollText },
                            { id: 'team', label: 'TEAM_EXPERTS', icon: Users },
                            { id: 'activity', label: 'ACTIVITY_LOG', icon: History },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${
                                    activeTab === tab.id ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_10px_#f97316]"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                                >
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Project Description/Details Card */}
                                        <div className="border border-white/5 bg-white/[0.01] p-8 space-y-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all duration-700" />
                                            <div className="space-y-4 relative z-10">
                                                <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                                    <ScrollText className="w-4 h-4" /> About_Project
                                                </h3>
                                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                    {project.description || 'No detailed description provided for this project.'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 relative z-10">
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Metadata</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500 font-mono">REPOSITORY</span>
                                                            <span className="text-orange-400 font-mono">PUBLIC</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500 font-mono">LICENSE</span>
                                                            <span className="text-gray-300 font-mono">MIT_LICENSE</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500 font-mono">SECURITY</span>
                                                            <span className="text-green-500 font-mono flex items-center gap-1">
                                                                <Shield className="w-3 h-3" /> VERIFIED
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tech Stack</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['NEXTJS', 'NODEJS', 'MONGODB', 'TAILWIND'].map(tech => (
                                                            <span key={tech} className="px-2 py-1 border border-white/10 text-[9px] text-gray-400 font-mono uppercase tracking-wider">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Registered Team Members */}
                                        <div className="border border-white/10 bg-slate-900/20">
                                            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-cyan-500" /> Registered_Squad
                                                </h3>
                                                <span className="text-[9px] text-gray-600 font-mono">{project.contributors?.length || 0} TOTAL_MEMBERS</span>
                                            </div>
                                            <div className="p-6">
                                                {(project.contributors || []).length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {project.contributors.map((contributor, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 hover:border-orange-500/20 transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-sm border border-white/10 flex items-center justify-center text-[10px] font-bold bg-white/5 text-gray-500 group-hover:border-orange-500/50 group-hover:text-orange-400 transition-all">
                                                                        {(contributor.firstName || '?')[0].toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{contributor.firstName}</div>
                                                                        <div className="text-[8px] text-gray-500 font-mono truncate">{contributor.email}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="px-1.5 py-0.5 border border-cyan-500/20 text-[7px] text-cyan-500/70 uppercase font-black tracking-widest">
                                                                    {contributor.role || 'MEMBER'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-600 font-mono italic text-center py-8 uppercase tracking-widest">NO_MEMBERS_LINKED</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Vitals Sidebar */}
                                        <div className="border border-white/10 bg-slate-900/30 backdrop-blur-md">
                                            <div className="px-6 py-4 border-b border-white/5 bg-orange-500/5">
                                                <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Activity className="w-4 h-4" /> Global_Vitals
                                                </h3>
                                            </div>
                                            <div className="p-6 space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[9px] text-gray-500 uppercase font-bold font-mono tracking-widest">Aggregate Effort</span>
                                                        <span className="text-xs text-orange-500 font-bold">{totalProjectHours.toFixed(1)} <span className="text-[9px] font-normal text-gray-500 font-mono">HRS</span></span>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '100%' }}
                                                            className="h-full bg-orange-500/50"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-white/5 border border-white/5 rounded-sm">
                                                        <div className="text-[8px] text-gray-500 uppercase mb-1 font-mono tracking-tighter">Team_Size</div>
                                                        <div className="text-xl font-bold text-white">{project.contributors?.length || 0}</div>
                                                    </div>
                                                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-sm">
                                                        <div className="text-[8px] text-gray-500 uppercase mb-1 font-mono tracking-tighter">Live_Sync</div>
                                                        <div className="text-xl font-bold text-green-500">{activeContributors.length}</div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-slate-950 border border-white/10 flex justify-between items-center group">
                                                    <div className="text-[8px] text-gray-500 uppercase font-mono tracking-widest">Status</div>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${getStatusStyle(project.status || 'ongoing')}`}>
                                                        {project.status || 'ACTIVE'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Roles Distribution */}
                                        <div className="border border-white/10 bg-slate-900/30 backdrop-blur-md">
                                            <div className="px-6 py-4 border-b border-white/5">
                                                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Shield className="w-4 h-4" /> Roles_Makeup
                                                </h3>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                {Object.keys(roleCounts).length > 0 ? (
                                                    Object.entries(roleCounts).map(([role, count]) => (
                                                        <div key={role} className="space-y-1.5">
                                                            <div className="flex justify-between text-[10px] font-mono">
                                                                <span className="text-gray-400 uppercase">{role}</span>
                                                                <span className="text-cyan-400">{count}</span>
                                                            </div>
                                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(count / project.contributors.length) * 100}%` }}
                                                                    className="h-full bg-cyan-500/50"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4 border border-dashed border-white/10">
                                                        <p className="text-[9px] text-gray-600 font-mono italic uppercase tracking-widest">NO_ROLES_DETECTED</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Project Assets */}
                                        <div className="border border-white/10 bg-slate-900/30">
                                            <div className="px-6 py-4 border-b border-white/5">
                                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                                    <Link2 className="w-4 h-4 text-orange-400" /> Resource_Links
                                                </h3>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {(project.supportedLinks || []).length > 0 ? (
                                                    project.supportedLinks.map((link, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 hover:border-orange-500/30 transition-all group"
                                                        >
                                                            <div className="text-gray-500 group-hover:text-orange-400 transition-colors">
                                                                {getLinkIcon(link.url)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-[10px] font-bold text-white uppercase truncate">{link.linkName}</div>
                                                                <div className="text-[8px] text-gray-600 font-mono truncate">{link.url}</div>
                                                            </div>
                                                        </a>
                                                    ))
                                                ) : (
                                                    <div className="text-[9px] text-gray-600 font-mono italic text-center py-4 uppercase tracking-widest">NO_ASSETS_LINKED</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'team' && (
                                <motion.div
                                    key="team"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-orange-500" /> ACTIVE_EXPERTS
                                        </h2>
                                        {isAdmin && (
                                            <button
                                                onClick={() => setShowJoinModal(true)}
                                                className="px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                                            >
                                                <LogIn className="w-4 h-4" /> JOIN_CONTRIBUTOR
                                            </button>
                                        )}
                                    </div>

                                    {activeContributors.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {activeContributors.map((c, i) => {
                                                const profileId = c.profileId?._id || c.profileId;
                                                const timeData = contributorTime[profileId];
                                                const history = contributorHistory[profileId] || [];
                                                const isExpanded = expandedHistory[profileId];

                                                return (
                                                    <motion.div
                                                        key={profileId || i}
                                                        className="border border-white/10 bg-slate-900/40 overflow-hidden flex flex-col group hover:border-orange-500/30 transition-all shadow-xl"
                                                    >
                                                        <div className="p-6 flex items-start justify-between border-b border-white/5 bg-slate-950/50">
                                                            <div className="flex gap-4">
                                                                <div className="w-12 h-12 rounded-sm border border-orange-500/30 flex items-center justify-center text-xl font-bold bg-orange-500/5 text-orange-500">
                                                                    {(c.profileId?.firstName || 'U')[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white uppercase tracking-wider">{c.profileId?.firstName || 'Unknown'}</div>
                                                                    <div className="text-[10px] text-gray-500 font-mono mb-2 uppercase">{c.profileId?.emailId || 'no-email'}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-2 py-0.5 border border-cyan-500/30 bg-cyan-500/5 text-[9px] text-cyan-400 font-bold uppercase tracking-tighter">
                                                                            {c.role || 'Contributor'}
                                                                        </span>
                                                                        <span className="text-[9px] text-gray-600 font-mono uppercase">
                                                                            Joined {formatDate(c.joinedAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => handleLeaveContributor(profileId)}
                                                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/30"
                                                                    title="Mark as Left"
                                                                >
                                                                    <UserMinus className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="p-6 grid grid-cols-2 gap-4 bg-slate-900/20">
                                                            <div className="space-y-1">
                                                                <div className="text-[8px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-orange-500/50" /> TOTAL_TIME
                                                                </div>
                                                                <div className="text-lg font-bold text-white font-mono">{formatDuration(timeData)}</div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-[8px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 text-orange-500/50" /> SESSIONS
                                                                </div>
                                                                <div className="text-lg font-bold text-white font-mono">{history.length} <span className="text-[10px] text-gray-600 font-sans">LOGS</span></div>
                                                            </div>
                                                        </div>

                                                        {history.length > 0 && (
                                                            <div className="border-t border-white/5">
                                                                <button
                                                                    onClick={() => setExpandedHistory(prev => ({ ...prev, [profileId]: !prev[profileId] }))}
                                                                    className="w-full px-6 py-3 flex items-center justify-between text-[10px] font-bold text-gray-500 hover:text-orange-400 uppercase tracking-[0.2em] transition-all bg-slate-900/10"
                                                                >
                                                                    {isExpanded ? 'Hide Contribution History' : 'Show Contribution History'}
                                                                    <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            className="overflow-hidden bg-slate-950/50"
                                                                        >
                                                                            <div className="p-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                                                                {history.map((log, idx) => (
                                                                                    <div key={idx} className="p-3 border-l-2 border-orange-500/30 bg-white/[0.02] space-y-2">
                                                                                        <div className="flex justify-between items-start">
                                                                                            <span className="text-[9px] text-orange-500/70 font-bold uppercase">{formatDateTime(log.loginTime)}</span>
                                                                                            <span className="text-[9px] text-gray-600 font-mono italic">#{log._id?.slice(-6)}</span>
                                                                                        </div>
                                                                                        <p className="text-[11px] text-gray-400 leading-relaxed italic line-clamp-2">"{(log.proofOfWork || 'Contributed as per role guidelines').trim()}"</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-60 border border-dashed border-white/10 flex items-center justify-center text-gray-500 text-xs font-mono uppercase tracking-widest">
                                            NO_ACTIVE_CONTRIBUTORS_FOUND
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'activity' && (
                                <motion.div
                                    key="activity"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            <History className="w-5 h-5 text-orange-500" /> AUDIT_STREAM
                                        </h2>
                                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">{projectLogs.length} EVENTS_RECORDED</div>
                                    </div>

                                    <div className="border border-white/10 bg-slate-900/40 rounded-sm overflow-hidden shadow-2xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-slate-950/50 uppercase font-mono text-[10px] tracking-widest text-gray-500">
                                                    <th className="px-6 py-4 font-bold">Contributor</th>
                                                    <th className="px-6 py-4 font-bold">Session Period</th>
                                                    <th className="px-6 py-4 font-bold">Contribution Brief</th>
                                                    <th className="px-6 py-4 font-bold text-right">Reference</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs font-mono">
                                                {projectLogs.length > 0 ? (
                                                    projectLogs.map((log, i) => (
                                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-6 h-6 border border-white/10 flex items-center justify-center text-[9px] font-bold text-gray-500 group-hover:text-orange-500 transition-colors bg-white/5">
                                                                        {(log.profileId?.firstName || 'U')[0].toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-gray-300 group-hover:text-white uppercase transition-colors">{log.profileId?.firstName || 'Unknown'}</div>
                                                                        <div className="text-[9px] text-gray-600 font-mono tracking-tighter uppercase">{log.role || 'Contributor'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-0.5">
                                                                    <div className="text-gray-400 group-hover:text-orange-500 transition-colors uppercase font-bold">{formatDateTime(log.loginTime)}</div>
                                                                    <div className="text-[9px] text-gray-600">to {log.logoutTime ? formatDateTime(log.logoutTime) : 'ACTIVE'}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 max-w-xs">
                                                                <p className="text-gray-500 group-hover:text-gray-400 truncate italic">"{(log.proofOfWork || 'System recorded contribution').trim()}"</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="text-[9px] text-gray-700 bg-black/40 px-2 py-1 border border-white/5 uppercase tracking-widest font-bold">
                                                                    #{log._id?.slice(-8)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-600 italic uppercase tracking-widest text-[10px]">NO_LOGS_AVAILABLE_FOR_AUDIT</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Edit Project Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-[600px] bg-slate-950 border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.1)] overflow-hidden"
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
                                        className="w-full bg-slate-950 border border-white/10 h-10 text-sm font-mono text-white focus:border-orange-500 outline-none px-3"
                                        placeholder="PROJECT_TITLE"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Description</label>
                                    <textarea
                                        value={editData.description}
                                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 p-3 text-sm font-mono text-white focus:border-orange-500 outline-none min-h-[80px]"
                                        placeholder="PROJECT_DESCRIPTION..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Status</label>
                                    <select
                                        value={editData.status}
                                        onChange={e => setEditData({ ...editData, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 h-10 text-sm font-mono text-white px-3 outline-none focus:border-orange-500"
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
                                            className="bg-slate-950 border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-2 flex-1"
                                            placeholder="Link Name"
                                        />
                                        <input
                                            value={newLink.url}
                                            onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                                            className="bg-slate-950 border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-2 flex-1"
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
                                        <div className="space-y-2 mb-3">
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

                                    {/* Search mode toggle */}
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => { setContributorMode('name'); setContributorQuery(''); setContributorSuggestions([]); }}
                                            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${
                                                contributorMode === 'name' 
                                                    ? 'bg-orange-500 text-black' 
                                                    : 'bg-slate-950 border border-white/10 text-orange-500 hover:bg-white/20'
                                            }`}
                                        >
                                            Search by Name
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setContributorMode('role'); setContributorQuery(''); setContributorSuggestions([]); }}
                                            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${
                                                contributorMode === 'role' 
                                                    ? 'bg-orange-500 text-black' 
                                                    : 'bg-slate-950 border border-white/10 text-orange-500 hover:bg-white/20'
                                            }`}
                                        >
                                            Search by Role
                                        </button>
                                    </div>

                                    {/* Autocomplete search */}
                                    <div className="relative">
                                        <input
                                            value={contributorQuery}
                                            onChange={e => setContributorQuery(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 h-9 text-xs font-mono text-white focus:border-orange-500 outline-none px-3"
                                            placeholder={contributorMode === 'name' ? 'Type name to search and select' : 'Type role to search and select'}
                                        />

                                        {/* Suggestions dropdown */}
                                        {(contributorSuggestions.length > 0 || suggestionsLoading) && (
                                            <div className="absolute left-0 right-0 mt-1 z-50 bg-slate-950 border border-white/10 shadow-lg max-h-48 overflow-auto">
                                                {suggestionsLoading && (
                                                    <div className="p-2 text-xs text-gray-400">Searching...</div>
                                                )}
                                                {contributorSuggestions.map((s, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleSelectContributor(s)}
                                                        className="p-3 hover:bg-white/20 cursor-pointer border-b border-white/5 last:border-b-0"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <div className="text-xs font-mono text-orange-400">
                                                                    {s.firstName}
                                                                    <span className="text-gray-500 ml-2">({s.assigned_role || 'No role'})</span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 mt-0.5">{s.email}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-[450px] bg-slate-950 border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden"
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
                                        className="w-full bg-slate-950 border border-white/10 h-10 text-sm font-mono text-white focus:border-green-500 outline-none px-3"
                                        placeholder="FellowProjectProfile _id"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Role</label>
                                    <input
                                        value={joinData.role}
                                        onChange={e => setJoinData({ ...joinData, role: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 h-10 text-sm font-mono text-white focus:border-green-500 outline-none px-3"
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

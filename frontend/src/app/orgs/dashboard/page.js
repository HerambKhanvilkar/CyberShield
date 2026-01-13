"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, LogOut, Shield,
    Activity, GraduationCap, Clock, FileText,
    Search, Filter, ChevronRight
} from 'lucide-react';
import Loader from '@/components/Loader';
import { toast } from 'react-toastify';
import ErrorBoundary from '@/components/ErrorBoundary';
import 'react-toastify/dist/ReactToastify.css';

export default function OrgDashboard() {
    return (
        <ErrorBoundary>
            <OrgDashboardContent />
        </ErrorBoundary>
    );
}

function OrgDashboardContent() {
    const router = useRouter();
    // ... all the content from previous OrgDashboard function
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ totalApplicants: 0, pending: 0, accepted: 0, rejected: 0 });
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, applicants
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('orgToken');
        const userData = localStorage.getItem('orgUser');

        if (!token || !userData) {
            router.push('/orgs/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchDashboardData(token);
    }, [router]);

    const fetchDashboardData = async (token) => {
        try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [statsRes, applicantsRes] = await Promise.all([
                axios.get(`${serverUrl}/org/stats`, config),
                axios.get(`${serverUrl}/org/applicants`, config)
            ]);

            setStats(statsRes.data.metrics);
            setApplicants(applicantsRes.data);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('orgToken');
                router.push('/orgs/login');
            }
            toast.error("Failed to sync node data");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('orgToken');
        localStorage.removeItem('orgUser');
        router.push('/orgs/login');
    };

    const handleDownloadCSV = async () => {
        try {
            const token = localStorage.getItem('orgToken');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/org/export-csv`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `applicants-${user?.orgCode}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("CSV Export failed", error);
            toast.error("Failed to export CSV");
        }
    };

    const filteredApplicants = applicants.filter(app =>
        app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loader text="INITIALIZING NODE LINK..." />;

    return (
        <div className="min-h-screen bg-black text-gray-300 font-mono selection:bg-green-500/30 selection:text-green-200">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/10 bg-black/50 backdrop-blur-sm z-20 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wider">DEEPCYTES</h1>
                            <p className="text-[10px] text-green-500/70">{user?.orgCode} NODE</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'bg-green-900/20 text-green-400 border-l-2 border-green-500' : 'hover:bg-white/5 hover:text-white border-l-2 border-transparent'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('applicants')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs uppercase tracking-wider transition-all ${activeTab === 'applicants' ? 'bg-green-900/20 text-green-400 border-l-2 border-green-500' : 'hover:bg-white/5 hover:text-white border-l-2 border-transparent'}`}
                    >
                        <Users className="w-4 h-4" /> Applicants
                    </button>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="truncate">
                            <p className="text-xs text-white truncate max-w-[120px]">{user?.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-2 py-1">
                        <LogOut className="w-3 h-3" /> Terminate Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">NETWORK_STATUS</h2>
                            <p className="text-xs text-gray-500 font-mono">NODE: {user?.orgCode} | UPTIME: 99.9%</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <StatCard label="Total Applications" value={stats.totalApplicants} icon={<FileText className="w-4 h-4" />} />
                            <StatCard label="Pending Review" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="text-yellow-500" />
                            <StatCard label="Fellows Onboarded" value={stats.accepted} icon={<GraduationCap className="w-4 h-4" />} color="text-green-500" />
                            <StatCard label="Rejected" value={stats.rejected} icon={<Activity className="w-4 h-4" />} color="text-red-500" />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 h-64 bg-white/5 border border-white/10 rounded-sm p-4 flex flex-col items-center justify-center text-gray-500 text-xs text-center">
                                <span className="mb-2 uppercase tracking-widest text-green-500/50">Application Velocity</span>
                                <div className="w-full h-32 flex items-end justify-center gap-2 opacity-50">
                                    {[40, 60, 45, 70, 85, 60, 75, 50, 65, 80].map((h, i) => (
                                        <div key={i} style={{ height: `${h}%` }} className="w-4 bg-green-500/20 hover:bg-green-500/50 transition-colors" />
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-1 h-64 bg-white/5 border border-white/10 rounded-sm p-6">
                                <h3 className="text-xs uppercase text-gray-400 mb-4 tracking-widest">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-[10px] uppercase font-bold text-gray-400 hover:text-white transition-all rounded-sm flex items-center justify-between group">
                                        Download Report
                                        <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                    </button>
                                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-[10px] uppercase font-bold text-gray-400 hover:text-white transition-all rounded-sm flex items-center justify-between group">
                                        Update Node Config
                                        <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'applicants' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">APPLICANT_REGISTRY</h2>
                                <p className="text-xs text-gray-500">Total: {filteredApplicants.length}</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-3 h-3 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH_DB..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-white/5 border border-white/10 pl-8 pr-4 py-2 text-xs text-white focus:outline-none focus:border-green-500/50 w-64 font-mono transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleDownloadCSV}
                                    className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-[10px] font-bold uppercase tracking-widest text-green-400 hover:bg-green-500/20 flex items-center gap-2 transition-all"
                                >
                                    <FileText className="w-3 h-3" /> Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="border border-white/10 bg-white/5 rounded-sm overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-white/5 text-gray-400 uppercase tracking-wider border-b border-white/10">
                                        <th className="p-4 font-normal">Candidate / Identity</th>
                                        <th className="p-4 font-normal">Preferred Role</th>
                                        <th className="p-4 font-normal">Current Status</th>
                                        <th className="p-4 font-normal text-right">Applied</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredApplicants.map((app) => (
                                        <tr
                                            key={app._id}
                                            onClick={() => setSelectedApplicant(app)}
                                            className="hover:bg-green-500/5 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-green-500/50"
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-white group-hover:text-green-400 transition-colors uppercase tracking-tight">{app.firstName} {app.lastName}</div>
                                                <div className="text-white/30 text-[10px] lowercase font-mono">{app.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 border border-cyan-400/20">
                                                    {typeof app.role === 'object' ? app.role?.name : app.role || 'UNSPECIFIED'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={app.status || 'PENDING'} />
                                            </td>
                                            <td className="p-4 text-gray-500 font-mono text-[10px] text-right">
                                                {new Date(app.appliedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredApplicants.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-600 italic font-mono text-xs">
                                                No matching records found in node database.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </main>

            <AnimatePresence>
                {selectedApplicant && (
                    <ApplicantDetailsModal
                        applicant={selectedApplicant}
                        onClose={() => setSelectedApplicant(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function ApplicantDetailsModal({ applicant, onClose }) {
    if (!applicant) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-black border border-green-500/30 w-full max-w-2xl rounded-sm p-8 space-y-6 relative shadow-[0_0_50px_rgba(34,197,94,0.1)]"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 p-4">
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl font-light font-sans">✕</button>
                </div>

                <div className="border-b border-white/10 pb-6">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{applicant.firstName} {applicant.lastName}</h3>
                    <p className="text-xs text-green-500 font-mono tracking-widest flex items-center gap-2 mt-1">
                        <Shield className="w-3 h-3" /> {applicant.email}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase text-gray-500 block font-black tracking-widest">Protocol Assignment</span>
                            <p className="text-white font-bold text-sm">{typeof applicant.role === 'object' ? applicant.role?.name : applicant.role}</p>
                            {applicant.preferredRoles && applicant.preferredRoles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {applicant.preferredRoles.map((r, idx) => (
                                        <span key={idx} className="text-[9px] text-cyan-400 bg-cyan-400/5 px-2 py-0.5 border border-cyan-400/20 font-mono uppercase">
                                            {typeof r === 'object' ? r?.name : r}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] uppercase text-gray-500 block font-black tracking-widest">Clearance Status</span>
                            <div className="mt-1"><StatusBadge status={applicant.status} /></div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] uppercase text-gray-500 block font-black tracking-widest">Entry Date</span>
                            <p className="text-white font-mono text-xs">{new Date(applicant.appliedAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase text-gray-500 block font-black tracking-widest">Motivation Matrix (Why DeepCytes?)</span>
                            <div className="text-xs text-gray-300 font-mono leading-relaxed bg-white/5 p-4 border border-white/5 h-32 overflow-y-auto custom-scrollbar">
                                {applicant.whyJoinDeepCytes || applicant.data?.whyJoin || <span className="text-gray-600 italic">No entry found.</span>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase text-gray-500 block font-black tracking-widest">Project Concept</span>
                            <div className="text-xs text-gray-300 font-mono leading-relaxed bg-white/5 p-4 border border-white/5 h-32 overflow-y-auto custom-scrollbar">
                                {applicant.data?.ideas || <span className="text-gray-600 italic">No entry found.</span>}
                            </div>
                        </div>
                        {applicant.data?.resumeLink && (
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase text-gray-500 block font-black tracking-widest">Portfolio Access</span>
                                <a href={applicant.data.resumeLink} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors text-[10px] font-mono break-all inline-block border-b border-cyan-400/20 pb-0.5">
                                    GO_TO_RESOURCE &rarr;
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                    >
                        Close Portal
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatCard({ label, value, icon, color = "text-green-500" }) {
    return (
        <div className="bg-black border border-white/10 p-6 rounded-sm flex items-center justify-between hover:border-white/30 transition-all cursor-default group relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-[10px] uppercase text-gray-500 tracking-[0.2em] mb-2 font-black group-hover:text-white transition-colors">{label}</p>
                <p className={`text-4xl font-black ${color} font-mono tracking-tighter`}>{value}</p>
            </div>
            <div className={`p-3 rounded-sm bg-white/5 ${color} opacity-20 group-hover:opacity-100 transition-all transform group-hover:scale-110 relative z-10`}>
                {icon}
            </div>
            {/* Background scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        PENDING: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
        ACCEPTED: "text-green-500 border-green-500/30 bg-green-500/10",
        SHORTLISTED: "text-blue-500 border-blue-500/30 bg-blue-500/10",
        REJECTED: "text-red-500 border-red-500/30 bg-red-500/10"
    };
    const style = styles[status] || "text-gray-500 border-gray-500/30 bg-gray-500/10";

    return (
        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border rounded-sm ${style}`}>
            {status}
        </span>
    );
}

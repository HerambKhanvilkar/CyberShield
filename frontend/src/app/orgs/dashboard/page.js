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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OrgDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ totalApplicants: 0, pending: 0, accepted: 0, rejected: 0 });
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, applicants
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('orgToken');
        const userData = localStorage.getItem('orgUser');

        if (!token || !userData) {
            router.push('/orgs/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchDashboardData(token);
    }, []);

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

    const filteredApplicants = applicants.filter(app =>
        app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
            <div className="animate-pulse">INITIALIZING_NODE_LINK...</div>
        </div>
    );

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
                            {user?.name.charAt(0)}
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

                        {/* Recent Activity / Visualizations Placeholder */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 h-64 bg-white/5 border border-white/10 rounded-sm p-4 flex flex-col items-center justify-center text-gray-500 text-xs">
                                <span className="mb-2 uppercase tracking-widest">Application Velocity</span>
                                <div className="w-full h-32 flex items-end justify-center gap-2 opacity-50">
                                    {[40, 60, 45, 70, 85, 60, 75, 50, 65, 80].map((h, i) => (
                                        <div key={i} style={{ height: `${h}%` }} className="w-4 bg-green-500/20 hover:bg-green-500/50 transition-colors" />
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-1 h-64 bg-white/5 border border-white/10 rounded-sm p-6">
                                <h3 className="text-xs uppercase text-gray-400 mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs transition-colors rounded-sm flex items-center justify-between group">
                                        Download Report
                                        <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                    </button>
                                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs transition-colors rounded-sm flex items-center justify-between group">
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
                                        className="bg-white/5 border border-white/10 pl-8 pr-4 py-2 text-xs text-white focus:outline-none focus:border-green-500/50 w-64"
                                    />
                                </div>
                                <button className="px-3 py-2 bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10">
                                    <Filter className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div className="border border-white/10 bg-white/5 rounded-sm overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-white/5 text-gray-400 uppercase tracking-wider border-b border-white/10">
                                        <th className="p-4 font-normal">Candidate</th>
                                        <th className="p-4 font-normal">Preferred Role</th>
                                        <th className="p-4 font-normal">Status</th>
                                        <th className="p-4 font-normal">Applied</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredApplicants.map((app) => (
                                        <tr key={app._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-white group-hover:text-green-400 transition-colors">{app.firstName} {app.lastName}</div>
                                                <div className="text-gray-500 text-[10px]">{app.email}</div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                <span className="px-2 py-1 bg-white/5 rounded-full text-[10px] border border-white/10">
                                                    {app.role || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="p-4 text-gray-500 font-mono text-[10px]">
                                                {new Date(app.appliedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredApplicants.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-600 italic">
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
            <ToastContainer position="bottom-right" theme="dark" />
        </div>
    );
}

function StatCard({ label, value, icon, color = "text-green-500" }) {
    return (
        <div className="bg-white/5 border border-white/10 p-4 rounded-sm flex items-center justify-between hover:border-white/20 transition-all cursor-default group">
            <div>
                <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-1 group-hover:text-gray-400">{label}</p>
                <p className={`text-2xl font-bold ${color} font-mono`}>{value}</p>
            </div>
            <div className={`p-2 rounded-full bg-white/5 ${color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                {icon}
            </div>
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
        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-sm ${style}`}>
            {status}
        </span>
    );
}

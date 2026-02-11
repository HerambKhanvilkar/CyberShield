"use client";

import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import {
    Users,
    Briefcase,
    Shield,
    Database,
    Search,
    Plus,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Award,
    History,
    Settings,
    ArrowLeft,
    ExternalLink,
    Mail,
    Calendar,
    Globe,
    Terminal,
    Code,
    Cpu,
    Zap,
    Linkedin,
    Github,
    Trophy,
    ArrowUpCircle,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AdminDashboardContent() {
    const [activeTab, setActiveTab] = useState("applications");
    const [activeSubTab, setActiveSubTab] = useState("PENDING");
    const [apps, setApps] = useState([]);
    const [fellows, setFellows] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [isEditingOrg, setIsEditingOrg] = useState(false);
    const [orgData, setOrgData] = useState({ name: '', code: '', emailDomainWhitelist: [], endDate: 0, formVar1: [], isActive: true });
    const [tenureEndDate, setTenureEndDate] = useState("");
    const [availableRoles, setAvailableRoles] = useState([]);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [newRole, setNewRole] = useState("");
    const [newProject, setNewProject] = useState("");

    // Promotion State
    const [promotionData, setPromotionData] = useState({ newRole: "", newStatus: "ACTIVE", newCohort: "", completionStatus: "PROMOTED" });
    const [showPromoteModal, setShowPromoteModal] = useState(false);

    // Interview Schedule State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleData, setScheduleData] = useState({ scheduledAt: "", meetLink: "" });

    // Termination State
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminationData, setTerminationData] = useState({ reason: "End of Tenure", endDate: "" });

    // Manual Fellow State
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualFellowData, setManualFellowData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        project: '',
        orgCode: '',
        cohort: 'C1',
        startDate: new Date().toISOString().split('T')[0]
    });

    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { router.push("/admin"); return; }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const [appsRes, fellowsRes, orgsRes, rolesRes, projectsRes] = await Promise.all([
                axios.get(`${serverUrl}/application/admin/list`, config),
                axios.get(`${serverUrl}/admin/fellows`, config),
                axios.get(`${serverUrl}/application/admin/orgs`, config),
                axios.get(`${serverUrl}/application/admin/roles`, config),
                axios.get(`${serverUrl}/application/admin/projects`, config)
            ]);
            setApps(appsRes.data);
            setFellows(fellowsRes.data);
            setOrgs(orgsRes.data);
            setAvailableRoles(rolesRes.data);
            setAvailableProjects(projectsRes.data);
        } catch (error) {
            if (error.response?.status === 401) { router.push("/admin"); }
            toast.error("Failed to load dashboard data");
        } finally { setLoading(false); }
    };

    const handleTerminateFellow = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/admin/fellows/${selectedItem._id}/terminate`,
                terminationData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Fellow Terminated and Email Sent");
            setShowTerminateModal(false);
            setSelectedItem(prev => ({ ...prev, status: 'TERMINATED' })); // Optimistic update
            fetchData();
        } catch (error) {
            toast.error("Failed to terminate fellow");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddManualFellow = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/admin/fellows/add`, manualFellowData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Fellow Added Successfully");
            setShowManualModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add fellow");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddProject = async () => {
        if (!newProject.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/application/admin/projects`,
                { name: newProject },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Project "${newProject}" added!`);
            setNewProject("");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add project");
        }
    };

    const handleQuickAddOrg = async (name, code) => {
        if (!name || !code) return toast.error("Name and Code required");
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/application/admin/orgs`,
                { name, code, isActive: false, emailDomainWhitelist: [], formVar1: [] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Node "${code}" initialized (Offline)`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add node");
        }
    };

    const handleAddRole = async () => {
        if (!newRole.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            await axios.post(`${serverUrl}/application/admin/roles`,
                { name: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Role "${newRole}" added!`);
            setNewRole("");
            fetchData(); // Refresh roles
        } catch (error) {
            console.error("Add Role Error:", error);
            const errMsg = error.response?.data?.message || error.response?.data?.msg || "Failed to add role";
            const status = error.response?.status;
            toast.error(status === 401 ? "Session expired. Please login again." : errMsg);
            if (status === 401) router.push("/admin");
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleUpdateAppStatus = async (status) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.patch(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/status`, {
                applicantId: selectedItem._id,
                status,
                tenureEndDate: status === 'ACCEPTED' ? tenureEndDate : undefined
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Applicant ${status}`);
            setSelectedItem(null);
            fetchData();
        } catch (error) { toast.error("Failed to update status"); } finally { setActionLoading(false); }
    };

    const handlePromoteFellow = async () => {
        if (!promotionData.newRole) { toast.error("Role is required"); return; }
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/admin/fellows/${selectedItem._id}/promote`, promotionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Fellow Promoted!");
            setShowPromoteModal(false);
            setSelectedItem(null);
            fetchData();
        } catch (error) { toast.error("Promotion failed"); } finally { setActionLoading(false); }
    };

    const handleScheduleInterview = async () => {
        if (!scheduleData.scheduledAt || !scheduleData.meetLink) {
            toast.error("Please provide both time and link");
            return;
        }
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");

            // Parse the local datetime string (no timezone conversion)
            const localDate = new Date(scheduleData.scheduledAt);

            // Format as 'YYYY-MM-DDTHH:mm:00+05:30' (IST)
            const pad = n => n.toString().padStart(2, '0');
            const istIsoString = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:00+05:30`;

            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/schedule-interview`, {
                applicantId: selectedItem._id,
                scheduledAt: istIsoString,
                meetLink: scheduleData.meetLink
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Interview Scheduled & Email Sent!");
            setShowScheduleModal(false);
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to schedule interview");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSkipInterview = async () => {
        if (!window.confirm("Are you sure you want to skip the interview step?")) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/skip-interview`, {
                applicantId: selectedItem._id
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Interview Step Skipped");
            fetchData();
            // Upate local state to reflect change so Accept button becomes available immediately
            setSelectedItem(prev => ({ ...prev, status: 'INTERVIEW_SKIPPED', interviewDetails: { ...prev.interviewDetails, status: 'SKIPPED' } }));
        } catch (error) {
            toast.error("Failed to skip interview");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminDownload = async (fellowId, tenureIndex, docType, docName) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(
                `${process.env.SERVER_URL || 'http://localhost:3001/api'}/fellowship/admin/download/${fellowId}/${tenureIndex}/${docType}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', docName || `${docType}_download.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            toast.error("Download failed");
        }
    };

    const handleUpdateState = async (state) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/admin/fellows/${selectedItem._id}`,
                { onboardingState: state },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`State: ${state}`);
            fetchData();
            setSelectedItem({ ...selectedItem, onboardingState: state }); // Local sync
        } catch (error) { toast.error("Update failed"); }
    };

    const searchParams = useSearchParams();
    useEffect(() => {
        if (loading) return;
        const email = searchParams.get('email');
        const type = searchParams.get('type');
        if (email && type) {
            if (type === 'apps') {
                const item = apps.find(a => a.email === email);
                if (item) { setActiveTab('applications'); setSelectedItem(item); }
            } else if (type === 'fellows') {
                const item = fellows.find(f => f.email === email);
                if (item) { setActiveTab('fellows'); setSelectedItem(item); }
            }
        }
    }, [loading, searchParams]);

    const filteredApps = apps.filter(a => {
        const matchesSearch = a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.lastName.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeSubTab === 'PENDING') return matchesSearch && a.status === 'PENDING';
        if (activeSubTab === 'INTERVIEW') return matchesSearch && (a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEW_SKIPPED');
        if (activeSubTab === 'ARCHIVED') return matchesSearch && (a.status === 'ACCEPTED' || a.status === 'REJECTED');
        return matchesSearch; // ALL
    });


    const ensureExternalLink = (url) => {
        if (!url) return "#";
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const handleSaveOrg = async () => {
        if (!orgData.name || !orgData.code) { toast.error("Name and Code are required"); return; }
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const payload = { ...orgData };

            // If editing, use PUT (assuming endpoint exists, or just POST for now as per minimal viable fix)
            // The prompt says "add another org", so primarily focus on CREATE.
            // If ID exists, it would be an update, but let's stick to Create for "Add" request.
            // Adjusting payload for arrays if needed (split by comma if input is string)

            await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/application/admin/orgs`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Organization Saved");
            setIsEditingOrg(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save organization");
        } finally { setActionLoading(false); }
    };

    const TenureTimeline = ({ tenures }) => (
        <div className="relative pl-6 border-l border-cyan-900/50 space-y-8 ml-2">
            {tenures.map((t, i) => (
                <div key={i} className="relative">
                    <div className={`absolute -left-[30px] top-0 w-3 h-3 border border-black ${t.status === 'ACTIVE' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-gray-800'}`} />
                    <div className="bg-black border border-white/10 p-4 relative group hover:border-cyan-500/50 transition-colors">
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-white/20" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-white/20" />

                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">{t.role}</span>
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${t.status === 'ACTIVE' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-gray-700 text-gray-500'}`}>{t.status}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono flex justify-between">
                            <span>{t.startDate || 'N/A'} — {t.endDate || 'PRESENT'}</span>
                            <span className="text-white/40">{t.cohort}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderOrgInspector = () => {
        const orgApps = apps.filter(a => a.orgCode === selectedItem.code && a.status === 'PENDING');
        const orgInterviewees = apps.filter(a => a.orgCode === selectedItem.code && (a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEW_SKIPPED'));
        const orgFellows = fellows.filter(f => f.tenures?.some(t => t.orgCode === selectedItem.code)); // Robust filtering

        return (
            <div className="space-y-8">
                <div className="flex items-start gap-6 border-b border-white/10 pb-8">
                    <div className="w-20 h-20 border border-white/20 flex items-center justify-center text-4xl font-bold bg-white/5 text-green-500">
                        {selectedItem.name[0]}
                    </div>
                    <div className="flex-1 space-y-2">
                        <h2 className="text-3xl font-bold uppercase tracking-tight text-white">{selectedItem.name}</h2>
                        <div className="text-xs font-mono text-gray-400 grid grid-cols-2 gap-2">
                            <span className="block p-2 border border-white/10">CODE: {selectedItem.code}</span>
                            <span className={`block p-2 border border-white/10 ${selectedItem.isActive ? 'text-green-500' : 'text-red-500'}`}>{selectedItem.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Personnel_Manifest
                    </h3>

                    <div className="space-y-6">
                        {/* Org Fellows */}
                        <div>
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 border-b border-purple-500/20 pb-1">deployed_fellows ({orgFellows.length})</h4>
                            {orgFellows.length > 0 ? (
                                <div className="grid gap-2">
                                    {orgFellows.map(f => (
                                        <div
                                            key={f._id}
                                            onClick={() => { setActiveTab('fellows'); setSelectedItem(f); }}
                                            className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-purple-500/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-purple-400">{f.firstName} {f.lastName}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{f.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-2 py-0.5 border border-purple-500/30 text-[9px] text-purple-400 uppercase">{f.onboardingState}</div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(`/admin/applications?type=fellows&email=${f.email}`, '_blank'); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
                                                >
                                                    <ExternalLink className="w-3 h-3 text-purple-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-xs text-gray-600 font-mono italic">NO ACTIVE UNITS</div>}
                        </div>

                        {/* Org Interviewees */}
                        <div>
                            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 border-b border-orange-500/20 pb-1">interview_pipeline ({orgInterviewees.length})</h4>
                            {orgInterviewees.length > 0 ? (
                                <div className="grid gap-2">
                                    {orgInterviewees.map(a => (
                                        <div
                                            key={a._id}
                                            onClick={() => { setActiveTab('applications'); setActiveSubTab('INTERVIEW'); setSelectedItem(a); }}
                                            className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-orange-500/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-orange-400">{a.firstName} {a.lastName}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{a.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-2 py-0.5 border border-orange-500/30 text-[9px] text-orange-400 uppercase">{a.status}</div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(`/admin/applications?type=apps&email=${a.email}`, '_blank'); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
                                                >
                                                    <ExternalLink className="w-3 h-3 text-orange-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-xs text-gray-600 font-mono italic">NO ACTIVE INTERVIEWS</div>}
                        </div>

                        {/* Org Applicants */}
                        <div>
                            <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2 border-b border-cyan-500/20 pb-1">pending_forms ({orgApps.length})</h4>
                            {orgApps.length > 0 ? (
                                <div className="grid gap-2">
                                    {orgApps.map(a => (
                                        <div
                                            key={a._id}
                                            onClick={() => { setActiveTab('applications'); setActiveSubTab('PENDING'); setSelectedItem(a); }}
                                            className="p-3 bg-white/5 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-cyan-500/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-cyan-400">{a.firstName} {a.lastName}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{a.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2 py-0.5 border text-[9px] uppercase ${a.status === 'ACCEPTED' ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>{a.status}</div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(`/admin/applications?type=apps&email=${a.email}`, '_blank'); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
                                                >
                                                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-xs text-gray-600 font-mono italic">NO INCOMING SIGNALS</div>}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Fellowship_Config</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/10">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Termination_Date</span>
                            <span className="text-sm font-mono text-white">{selectedItem.endDate ? new Date(selectedItem.endDate).toLocaleDateString() : 'INDEFINITE'}</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Allowed_Domains</span>
                            <div className="flex flex-wrap gap-1">
                                {selectedItem.emailDomainWhitelist.map(d => <span key={d} className="text-[9px] px-1 bg-white/10 rounded">{d}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-cyan-500/50 selection:text-black">
            <Navbar />

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Cyber Sidebar */}
                <div className="w-full md:w-16 bg-black border-r border-white/10 flex md:flex-col flex-row items-center md:py-6 py-2 gap-2 md:gap-6 shrink-0 relative z-30">
                    <div className="w-10 h-10 md:w-12 md:h-12 border border-cyan-500 flex items-center justify-center text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <Terminal className="w-6 h-6" />
                    </div>

                    <nav className="flex md:flex-col flex-row gap-2 md:gap-4 w-full px-2 md:mt-4 mt-0">
                        {[
                            { id: 'applications', icon: <FileText className="w-6 h-6" />, label: 'REQ' },
                            { id: 'fellows', icon: <Users className="w-6 h-6" />, label: 'OPS' },
                            { id: 'orgs', icon: <Globe className="w-6 h-6" />, label: 'NET' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => { setActiveTab(t.id); setSelectedItem(null); }}
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all relative group border ${activeTab === t.id ? 'bg-white/10 border-white text-white' : 'border-transparent text-gray-600 hover:text-cyan-400 hover:border-cyan-900/50'}`}
                            >
                                {t.icon}
                                <span className="hidden md:block absolute left-full ml-4 bg-black border border-white/20 px-3 py-1.5 text-xs text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex-1" />
                    <button onClick={fetchData} className="w-10 h-10 md:w-12 md:h-12 border border-white/10 hover:border-cyan-500 hover:text-cyan-500 transition-colors flex items-center justify-center">
                        <History className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="h-2 md:h-4" />
                </div>

                {/* Main Viewport */}
                <main className="flex-1 flex flex-col min-w-0 bg-black relative">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

                    {/* Header */}
                    <header className="h-16 md:h-20 border-b border-white/10 flex flex-col md:flex-row items-center justify-between px-2 md:px-8 bg-black z-20 gap-2 md:gap-0">
                        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                            <h2 className="text-lg md:text-2xl font-bold tracking-tighter text-white uppercase flex items-center gap-2">
                                <span className="text-cyan-500">/</span> {activeTab}_CONSOLE
                            </h2>
                            <span className="text-xs bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 px-2 md:px-3 py-1 rounded-none font-bold">
                                CNT: {activeTab === 'applications' ? filteredApps.length : activeTab === 'fellows' ? fellows.length : orgs.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 w-full md:w-96">
                            <div className="relative w-full group">
                                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-500" />
                                <input
                                    type="text"
                                    placeholder="SEARCH_QUERY..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full h-10 bg-black border border-white/20 pl-9 md:pl-11 pr-4 text-sm focus:border-cyan-500 focus:outline-none transition-all placeholder:text-gray-700 font-mono text-cyan-100 uppercase"
                                />
                            </div>
                            {activeTab === 'orgs' && (
                                <button onClick={() => { setOrgData({ name: '', code: '', emailDomainWhitelist: [], endDate: 0, formVar1: [], isActive: true }); setIsEditingOrg(true); }} className="h-10 w-10 border border-white/20 hover:border-cyan-500 hover:text-cyan-500 flex items-center justify-center transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                            {activeTab === 'fellows' && (
                                <button
                                    onClick={() => {
                                        setManualFellowData({ email: '', firstName: '', lastName: '', role: '', orgCode: '', cohort: 'C1', startDate: new Date().toISOString().split('T')[0] });
                                        setShowManualModal(true);
                                    }}
                                    className="h-10 px-4 border border-purple-500/50 text-purple-500 hover:bg-purple-500 hover:text-white flex items-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" /> MANUAL_ONBOARD
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Sub-tabs for Applications */}
                    {activeTab === 'applications' && (
                        <div className="flex bg-black border-b border-white/10 px-2 md:px-8 h-10 md:h-12 items-center gap-4 md:gap-8 relative z-20 overflow-x-auto">
                            {['PENDING', 'INTERVIEW', 'ARCHIVED', 'ALL'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setActiveSubTab(st)}
                                    className={`relative h-full text-[10px] font-bold tracking-[0.2em] transition-all flex items-center ${activeSubTab === st ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {st}
                                    {activeSubTab === st && <motion.div layoutId="app-sub-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar z-10">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-6">
                                <div className="w-16 h-16 border-2 border-cyan-500 border-t-white animate-spin rounded-full" />
                                <p className="text-sm font-mono text-cyan-500 animate-pulse uppercase tracking-widest">ESTABLISHING_UPLINK...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1">
                                {activeTab === 'applications' && filteredApps.map((app, idx) => (
                                    <div
                                        key={app._id}
                                        onClick={() => setSelectedItem(app)}
                                        className={`group px-8 py-5 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === app._id ? 'bg-cyan-900/10 border-l-[6px] border-l-cyan-500' : 'border-l-[6px] border-l-transparent'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <span className="text-sm font-mono text-gray-600 w-10">{String(idx + 1).padStart(2, '0')}</span>
                                            <div>
                                                <h3 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest mb-1.5">{app.firstName} {app.lastName}</h3>
                                                <div className="flex gap-6 text-xs font-mono text-gray-500 items-center flex-wrap">
                                                    <span className="text-white/60">{app.email}</span>
                                                    <span className="text-cyan-600 uppercase text-[10px] font-bold">REQ: {typeof app.role === 'object' ? app.role?.name : app.role}</span>
                                                    {app.processedBy && (
                                                        <span className="text-gray-400 border border-white/10 px-2 py-0.5 text-[10px] bg-white/5">AUTH: {app.processedBy}</span>
                                                    )}
                                                    {app.interviewDetails?.scheduledAt && (
                                                        <span className="text-orange-400 border border-orange-500/30 px-2 py-0.5 text-[10px] bg-orange-500/5 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(app.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${app.status === 'ACCEPTED' ? 'border-green-500/50 text-green-500 bg-green-500/5' : app.status === 'REJECTED' ? 'border-red-500/50 text-red-500 bg-red-500/5' : app.status === 'INTERVIEW_SCHEDULED' ? 'border-orange-500/50 text-orange-500 bg-orange-500/5' : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5'}`}>
                                            {app.status}
                                        </div>
                                    </div>
                                ))}

                                {activeTab === 'fellows' && fellows.filter(f => f.email.toLowerCase().includes(searchTerm.toLowerCase())).map((fellow, idx) => (
                                    <div
                                        key={fellow._id}
                                        onClick={() => setSelectedItem(fellow)}
                                        className={`group px-8 py-5 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === fellow._id ? 'bg-purple-900/10 border-l-[6px] border-l-purple-500' : 'border-l-[6px] border-l-transparent'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <span className="text-sm font-mono text-gray-600 w-10">{String(idx + 1).padStart(2, '0')}</span>
                                            <div>
                                                <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition-colors uppercase tracking-widest mb-1.5">{fellow.firstName} {fellow.lastName}</h3>
                                                <div className="flex gap-6 text-xs font-mono text-gray-500 items-center">
                                                    <span className="bg-white/10 px-2 py-0.5 text-white">{fellow.globalPid || 'NO_ID'}</span>
                                                    <span className="text-purple-400/80 uppercase">
                                                        {(() => {
                                                            const r = fellow.tenures[fellow.tenures.length - 1]?.role;
                                                            return typeof r === 'object' ? r?.name : r || 'UNASSIGNED';
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {/* Social Indicators */}
                                            <div className="flex gap-4 opacity-70">
                                                {fellow.socials?.github && (
                                                    <a href={ensureExternalLink(fellow.socials.github)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                        <Github className="w-4 h-4 text-white hover:text-purple-400 transition-colors" />
                                                    </a>
                                                )}
                                                {fellow.socials?.linkedin && (
                                                    <a href={ensureExternalLink(fellow.socials.linkedin)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                        <Linkedin className="w-4 h-4 text-white hover:text-purple-400 transition-colors" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="px-4 py-1.5 border border-purple-500/30 text-purple-400 bg-purple-500/5 text-xs font-bold uppercase tracking-widest">
                                                {fellow.onboardingState}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {activeTab === 'orgs' && orgs.map((org, idx) => (
                                    <div
                                        key={org._id}
                                        onClick={() => setSelectedItem(org)}
                                        className={`group px-8 py-6 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-all ${selectedItem?._id === org._id ? 'bg-green-900/10 border-l-[6px] border-l-green-500' : 'border-l-[6px] border-l-transparent'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <span className="text-sm font-mono text-gray-600 w-10">{String(idx + 1).padStart(2, '0')}</span>
                                            <div>
                                                <h3 className="font-bold text-2xl text-white group-hover:text-green-400 transition-colors uppercase tracking-tighter mb-2">{org.name}</h3>
                                                <div className="flex gap-4 text-xs font-mono text-gray-500 items-center">
                                                    <span className="text-green-500 border border-green-500/20 bg-green-500/5 px-2 py-0.5 rounded-none">{org.code}</span>
                                                    <span className="text-xs">{org.emailDomainWhitelist.length} DOMAINS</span>
                                                    <span className="text-xs">{(org.availableRoles || org.formVar1 || []).length} ROLES</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOrgData({
                                                        id: org._id,
                                                        name: org.name,
                                                        code: org.code,
                                                        emailDomainWhitelist: org.emailDomainWhitelist || [],
                                                        endDate: org.endDate || 0,
                                                        formVar1: org.availableRoles || org.formVar1 || [],
                                                        isActive: org.isActive
                                                    });
                                                    setIsEditingOrg(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-green-500/10 border border-transparent hover:border-green-500/30 transition-all"
                                                title="Edit Organization"
                                            >
                                                <Settings className="w-4 h-4 text-green-500" />
                                            </button>
                                            <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest ${org.isActive ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                                                {org.isActive ? 'ONLINE' : 'OFFLINE'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Cyber Inspector Panel */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', ease: 'circOut', duration: 0.3 }}
                            className="w-[600px] bg-black border-l border-white/10 z-40 flex flex-col shrink-0 shadow-[-50px_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="h-20 flex items-center justify-between px-10 border-b border-white/10 bg-black/50 backdrop-blur-md">
                                <h3 className="font-mono text-sm text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className={`w-2 h-2 ${activeTab === 'fellows' ? 'bg-purple-500' : activeTab === 'orgs' ? 'bg-green-500' : 'bg-cyan-500'} animate-pulse`} />
                                    DATA_INSPECTOR
                                </h3>
                                <button onClick={() => setSelectedItem(null)} className="hover:text-white text-gray-600 transition-colors"><XCircle className="w-6 h-6" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                                {activeTab === 'orgs' ? renderOrgInspector() : (
                                    <>
                                        <div className="flex items-start gap-8 border-b border-white/10 pb-10">
                                            <div className={`w-24 h-24 border border-white/20 flex items-center justify-center text-4xl font-bold bg-white/5 ${activeTab === 'fellows' ? 'text-purple-500' : 'text-cyan-500'}`}>
                                                {selectedItem.firstName[0]}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <h2 className="text-3xl font-bold uppercase tracking-tight text-white">{selectedItem.firstName} {selectedItem.lastName}</h2>
                                                <div className="text-xs font-mono text-gray-500 grid grid-cols-2 gap-3">
                                                    <span className="block p-2 border border-white/10">ID: {selectedItem.globalPid || 'NULL'}</span>
                                                    <span className="block p-2 border border-white/10">ORG: {selectedItem.orgCode}</span>
                                                    <span className="block p-2 border border-white/10 col-span-2">MAIL: {selectedItem.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {activeTab === 'fellows' && (
                                            <div className="grid grid-cols-2 gap-6">
                                                <button
                                                    onClick={() => selectedItem.socials?.github ? window.open(ensureExternalLink(selectedItem.socials.github), '_blank') : toast.info("No GitHub link")}
                                                    className={`p-6 border border-white/10 hover:border-white hover:bg-white/5 transition-all flex flex-col items-center gap-3 ${!selectedItem.socials?.github && 'opacity-40 grayscale'}`}
                                                >
                                                    <Github className="w-6 h-6 text-gray-400" />
                                                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500">GitHub_Uplink</span>
                                                </button>
                                                <button
                                                    onClick={() => selectedItem.socials?.linkedin ? window.open(ensureExternalLink(selectedItem.socials.linkedin), '_blank') : toast.info("No LinkedIn link")}
                                                    className={`p-6 border border-white/10 hover:border-white hover:bg-white/5 transition-all flex flex-col items-center gap-3 ${!selectedItem.socials?.linkedin && 'opacity-40 grayscale'}`}
                                                >
                                                    <Linkedin className="w-6 h-6 text-gray-400" />
                                                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500">LinkedIn_Feed</span>
                                                </button>
                                            </div>
                                        )}

                                        {activeTab === 'applications' ? (
                                            <div className="space-y-8">
                                                <div className="p-8 border border-white/10 bg-white/[0.02] space-y-6">
                                                    <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-widest border-b border-cyan-900/30 pb-3">Authorization_Protocol</h4>

                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest flex justify-between">
                                                                <span>Motivation_Payload</span>
                                                                <span className={selectedItem.whyJoinDeepCytes?.length < 100 ? "text-red-500" : "text-green-500"}>
                                                                    LEN_{selectedItem.whyJoinDeepCytes?.length || 0}
                                                                </span>
                                                            </div>
                                                            <div className="p-4 bg-black/40 border border-white/5 text-xs text-gray-400 font-mono leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                                                {selectedItem.whyJoinDeepCytes || selectedItem.data?.whyJoin || "NO_DATA_FOUND"}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Initial_Proposal</div>
                                                            <div className="p-4 bg-black/40 border border-white/5 text-xs text-gray-400 font-mono leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                                                {selectedItem.data?.ideas || "NO_PROPOSAL_SUBMITTED"}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Preferred_Specializations</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(selectedItem.preferredRoles || []).length > 0 ? (
                                                                    selectedItem.preferredRoles.map((role, idx) => (
                                                                        <span key={idx} className="px-2 py-1 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold uppercase tracking-wider">
                                                                            {typeof role === 'object' ? role?.name : role}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="px-2 py-1 border border-white/10 text-gray-600 text-[9px] uppercase">LEGACY_ROLE: {typeof selectedItem.role === 'object' ? selectedItem.role?.name : selectedItem.role}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedItem.processedBy && (
                                                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-2">
                                                            <span className="uppercase">Authenticated_By:</span>
                                                            <span className="text-cyan-500">{selectedItem.processedBy}</span>
                                                        </div>
                                                    )}

                                                    {(selectedItem.status === 'PENDING' || selectedItem.status === 'INTERVIEW_SCHEDULED' || selectedItem.status === 'INTERVIEW_SKIPPED') && (
                                                        <div className="space-y-3">
                                                            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Interview Protocol</label>

                                                            {/* Show Schedule Button for PENDING */}
                                                            {selectedItem.status === 'PENDING' && (!selectedItem.interviewDetails || selectedItem.interviewDetails.status === 'PENDING') ? (
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <button
                                                                        onClick={() => setShowScheduleModal(true)}
                                                                        className="h-10 border border-cyan-500/50 text-cyan-400 bg-cyan-900/10 hover:bg-cyan-500/20 text-xs font-bold uppercase tracking-wider"
                                                                    >
                                                                        Schedule Interview
                                                                    </button>
                                                                    <button
                                                                        onClick={handleSkipInterview}
                                                                        className="h-10 border border-gray-600/50 text-gray-500 hover:text-white hover:border-white/50 text-xs font-bold uppercase tracking-wider"
                                                                    >
                                                                        Skip Protocol
                                                                    </button>
                                                                </div>
                                                            ) : selectedItem.status === 'INTERVIEW_SCHEDULED' ? (
                                                                <div className="space-y-3">
                                                                    {/* Current Interview Details */}
                                                                    <div className="p-4 bg-orange-900/10 border border-orange-500/30 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-mono text-orange-400 uppercase">Scheduled_Time:</span>
                                                                            <span className="text-xs font-mono text-white">
                                                                                {selectedItem.interviewDetails?.scheduledAt
                                                                                    ? new Date(selectedItem.interviewDetails.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                                                                    : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-mono text-orange-400 uppercase">Meet_Link:</span>
                                                                            <a
                                                                                href={selectedItem.interviewDetails?.meetLink?.startsWith('http') ? selectedItem.interviewDetails.meetLink : `https://${selectedItem.interviewDetails?.meetLink}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs font-mono text-cyan-400 hover:underline truncate max-w-[200px]"
                                                                            >
                                                                                {selectedItem.interviewDetails?.meetLink || 'N/A'}
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                    {/* Reschedule Button */}
                                                                    <button
                                                                        onClick={() => {
                                                                            setScheduleData({
                                                                                scheduledAt: selectedItem.interviewDetails?.scheduledAt ? new Date(selectedItem.interviewDetails.scheduledAt).toISOString().slice(0, 16) : '',
                                                                                meetLink: selectedItem.interviewDetails?.meetLink || ''
                                                                            });
                                                                            setShowScheduleModal(true);
                                                                        }}
                                                                        className="w-full h-10 border border-orange-500/50 text-orange-400 bg-orange-900/10 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider"
                                                                    >
                                                                        Reschedule Interview
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 bg-cyan-900/10 border border-cyan-500/30 text-xs font-mono text-cyan-400">
                                                                    STATUS: {selectedItem.interviewDetails?.status || selectedItem.status}
                                                                </div>
                                                            )}

                                                            {/* Schedule Modal */}
                                                            {showScheduleModal && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border border-cyan-500/30 bg-black p-4 space-y-4">
                                                                    <h5 className="text-xs font-bold text-cyan-500 uppercase">Input_Coordinates</h5>
                                                                    <Input
                                                                        type="datetime-local"
                                                                        value={scheduleData.scheduledAt}
                                                                        onChange={e => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                                                                        className="bg-black border-white/20 h-10 text-xs font-mono text-white"
                                                                    />
                                                                    <Input
                                                                        placeholder="GMEET_UPLINK_URL"
                                                                        value={scheduleData.meetLink}
                                                                        onChange={e => setScheduleData({ ...scheduleData, meetLink: e.target.value })}
                                                                        className="bg-black border-white/20 h-10 text-xs font-mono text-white"
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 text-[10px] font-bold uppercase">ABORT</button>
                                                                        <button onClick={handleScheduleInterview} className="flex-1 py-2 bg-cyan-600 text-black font-bold text-[10px] uppercase hover:bg-cyan-500">CONFIRM</button>
                                                                    </div>
                                                                </motion.div>
                                                            )}

                                                            <div className="h-px bg-white/10 my-4" />

                                                            {/* <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Tenure Termination Code</label>
                                                            <Input
                                                                placeholder="DDMMYYYY"
                                                                value={tenureEndDate}
                                                                onChange={e => setTenureEndDate(e.target.value)}
                                                                className="bg-black border-white/20 h-12 font-mono text-center text-lg tracking-[0.3em] text-cyan-400 focus:border-cyan-500"
                                                            /> */}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-6 pt-4">
                                                        <button onClick={() => handleUpdateAppStatus('REJECTED')} className="h-14 border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all text-sm font-bold uppercase tracking-[0.2em]">
                                                            REJECT
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateAppStatus('ACCEPTED')}
                                                            disabled={selectedItem.status === 'PENDING' && (!selectedItem.interviewDetails?.status || selectedItem.interviewDetails?.status === 'PENDING') && selectedItem.status !== 'INTERVIEW_SKIPPED'}
                                                            className={`h-14 border transition-all text-sm font-bold uppercase tracking-[0.2em] ${selectedItem.status === 'PENDING' && (!selectedItem.interviewDetails?.status || selectedItem.interviewDetails?.status === 'PENDING') && selectedItem.status !== 'INTERVIEW_SKIPPED' ? 'border-gray-800 text-gray-700 cursor-not-allowed bg-transparent' : 'bg-cyan-700/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black'}`}
                                                        >
                                                            ACCEPT
                                                        </button>
                                                    </div>
                                                </div>

                                                {selectedItem.resume && (
                                                    <button
                                                        onClick={() => {
                                                            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
                                                            const url = selectedItem.resume.startsWith('http') ? selectedItem.resume : `${serverUrl}${selectedItem.resume}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                        className="w-full py-6 border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center gap-4 group"
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                        <span className="text-sm font-mono font-bold uppercase tracking-[0.15em]">Decrypt Resume Payload</span>
                                                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex justify-between items-center">
                                                        <span>Career Trajectory</span>
                                                        <button onClick={() => setShowPromoteModal(!showPromoteModal)} className="text-purple-400 hover:text-white transition-colors flex items-center gap-2 text-xs">
                                                            <ArrowUpCircle className="w-4 h-4" /> PROMOTION_PROTOCOL
                                                        </button>
                                                        <button onClick={() => setShowTerminateModal(!showTerminateModal)} className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-2 text-xs ml-4">
                                                            <XCircle className="w-4 h-4" /> TERMINATION_PROTOCOL
                                                        </button>
                                                    </h4>

                                                    {showTerminateModal && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-8 border border-red-500/30 bg-red-900/10 p-6 space-y-4 overflow-hidden">
                                                            <h5 className="text-xs font-bold text-red-500 uppercase">Confirm_Termination</h5>
                                                            <Input
                                                                placeholder="Reason for Termination"
                                                                value={terminationData.reason}
                                                                onChange={e => setTerminationData({ ...terminationData, reason: e.target.value })}
                                                                className="bg-black border-red-500/20 h-10 text-xs font-mono"
                                                            />
                                                            <Input
                                                                type="date"
                                                                placeholder="End Date"
                                                                value={terminationData.endDate}
                                                                onChange={e => setTerminationData({ ...terminationData, endDate: e.target.value })}
                                                                className="bg-black border-red-500/20 h-10 text-xs font-mono uppercase"
                                                            />
                                                            <button onClick={handleTerminateFellow} className="w-full py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-red-500 border border-red-400">
                                                                EXECUTE TERMINATION
                                                            </button>
                                                        </motion.div>
                                                    )}

                                                    {showPromoteModal && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-8 border border-purple-500/30 bg-purple-900/10 p-6 space-y-4 overflow-hidden">
                                                            <Input placeholder="NEW_ROLE_TITLE" value={promotionData.newRole} onChange={e => setPromotionData({ ...promotionData, newRole: e.target.value })} className="bg-black border-purple-500/20 h-10 text-xs font-mono uppercase" />
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <Input placeholder="COHORT_ID" value={promotionData.newCohort} onChange={e => setPromotionData({ ...promotionData, newCohort: e.target.value })} className="bg-black border-purple-500/20 h-10 text-xs font-mono uppercase" />
                                                                <Input placeholder="STATUS_MARKER" value={promotionData.newStatus} onChange={e => setPromotionData({ ...promotionData, newStatus: e.target.value })} className="bg-black border-purple-500/20 h-10 text-xs font-mono uppercase" />
                                                            </div>
                                                            <button onClick={handlePromoteFellow} className="w-full py-3 bg-purple-600 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-purple-500 border border-purple-400">EXECUTE PROMOTION</button>
                                                        </motion.div>
                                                    )}

                                                    <TenureTimeline tenures={selectedItem.tenures} />

                                                    {/* Signed Documents Inspector */}
                                                    <div className="pt-6 border-t border-white/10 mt-6">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Encrypted_Assets</h4>
                                                        <div className="space-y-4">
                                                            {selectedItem.tenures.map((tenure, idx) => (
                                                                <div key={idx} className="space-y-2">
                                                                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                                                                        <span>TENURE_{idx + 1}: {typeof tenure.role === 'object' ? tenure.role?.name : tenure.role}</span>
                                                                        <span>{tenure.status}</span>
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        {['nda', 'offerLetter', 'completionLetter'].map(docType => {
                                                                            const doc = tenure.signedDocuments?.[docType];
                                                                            if (!doc || !doc.signedAt) return null;
                                                                            return (
                                                                                <button
                                                                                    key={docType}
                                                                                    onClick={() => handleAdminDownload(selectedItem._id, idx, docType, `${docType}_${selectedItem.lastName}.pdf`)}
                                                                                    className="w-full flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-cyan-500/30 transition-all group text-left"
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <FileText className="w-4 h-4 text-cyan-500" />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-xs text-white font-mono uppercase">{docType}</span>
                                                                                            <span className="text-[9px] text-gray-500 font-mono">{new Date(doc.signedAt).toLocaleDateString()}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Download className="w-3 h-3 text-gray-500 group-hover:text-cyan-400" />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                        {(!tenure.signedDocuments || Object.values(tenure.signedDocuments).filter(d => d && d.signedAt).length === 0) && (
                                                                            <span className="text-[10px] italic text-gray-700 pl-2">NO ASSETS FOUND</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-10 border-t border-white/10">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Lifecycle Overrides</h4>
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        {['PROFILE', 'NDA', 'OFFER', 'RESOURCES', 'RESEARCH', 'FEEDBACK', 'COMPLETION'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleUpdateState(s)}
                                                                className={`py-2.5 px-4 border text-[10px] font-mono text-left transition-all hover:bg-white hover:text-black ${selectedItem.onboardingState === s ? 'border-purple-500 text-purple-400 bg-purple-900/10' : 'border-white/10 text-gray-500'}`}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
                {/* Add/Edit Organization Modal */}
                <AnimatePresence>
                    {isEditingOrg && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-[500px] bg-black border border-white/20 shadow-[0_0_50px_rgba(4,120,87,0.2)] p-0 max-h-[100dvh] sm:max-h-[90vh] flex flex-col overflow-y-auto rounded-2xl"
                                style={{ margin: 'env(safe-area-inset-top, 0) auto env(safe-area-inset-bottom, 0) auto' }}
                            >
                                <div className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-white/5 shrink-0 sticky top-0 z-20">
                                    <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                        <Database className="w-4 h-4" /> FELLOWSHIP_NODE_CONFIGURATION
                                    </h3>
                                    <button onClick={() => setIsEditingOrg(false)} className="text-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500"><XCircle className="w-5 h-5" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 sm:p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-mono text-gray-500">Node_Name</label>
                                                <Input value={orgData.name} onChange={e => setOrgData({ ...orgData, name: e.target.value })} className="bg-black border-white/20 h-10 text-xs font-mono text-white focus:border-green-500" placeholder="ENTER_NAME" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-mono text-gray-500">Access_Code</label>
                                                <Input value={orgData.code} onChange={e => setOrgData({ ...orgData, code: e.target.value.toUpperCase() })} className="bg-black border-white/20 h-10 text-xs font-mono text-green-500 focus:border-green-500" placeholder="UNIQUE_CODE" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-mono text-gray-500">Domain_Whitelist (Comma Separated)</label>
                                            <Input
                                                value={orgData.emailDomainWhitelist?.join(', ')}
                                                onChange={e => setOrgData({ ...orgData, emailDomainWhitelist: e.target.value.split(',').map(s => s.trim()) })}
                                                className="bg-black border-white/20 h-10 text-xs font-mono text-gray-300 focus:border-green-500"
                                                placeholder="example.com, org.io"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-mono text-gray-500">Available_Roles (Select Multiple)</label>
                                            <div className="grid grid-cols-2 gap-2 p-3 bg-white/5 border border-white/10 max-h-32 overflow-y-auto">
                                                {['Developer', 'Security Researcher', 'Data Analyst', 'UI/UX Designer', 'Project Manager', 'DevOps Engineer', 'ML Engineer', 'Technical Writer', ...availableRoles.filter(r => !['Developer', 'Security Researcher', 'Data Analyst', 'UI/UX Designer', 'Project Manager', 'DevOps Engineer', 'ML Engineer', 'Technical Writer'].includes(r))].map(role => (
                                                    <label key={role} className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 p-1.5 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={(orgData.formVar1 || []).includes(role)}
                                                            onChange={(e) => {
                                                                const current = orgData.formVar1 || [];
                                                                const updated = e.target.checked
                                                                    ? [...current, role]
                                                                    : current.filter(r => r !== role);
                                                                setOrgData({ ...orgData, formVar1: updated });
                                                            }}
                                                            className="w-3 h-3 accent-green-500"
                                                        />
                                                        <span className="text-[10px] text-gray-300 group-hover:text-white">{role}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {/* Add custom role input */}
                                            <div className="flex gap-2 mt-3">
                                                <Input
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddRole(); }}
                                                    placeholder="Add new role..."
                                                    className="bg-black border-white/20 h-8 text-xs font-mono text-white focus:border-green-500 flex-1"
                                                />
                                                <button
                                                    onClick={handleAddRole}
                                                    className="px-3 h-8 bg-green-900/20 border border-green-500/50 text-green-500 hover:bg-green-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    ADD
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-mono text-gray-500">Termination_Date</label>
                                                <Input
                                                    type="date"
                                                    value={orgData.endDate ? new Date(orgData.endDate).toISOString().split('T')[0] : ''}
                                                    onChange={e => setOrgData({ ...orgData, endDate: new Date(e.target.value).getTime() })}
                                                    className="bg-black border-white/20 h-10 text-xs font-mono text-gray-300 focus:border-green-500"
                                                />
                                            </div>
                                            <div className="flex items-end pb-3">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-4 h-4 border transition-colors ${orgData.isActive ? 'bg-green-500 border-green-500' : 'border-gray-500 group-hover:border-green-500'}`}>
                                                        {orgData.isActive && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-green-400">Node_Online</span>
                                                    <input type="checkbox" className="hidden" checked={orgData.isActive} onChange={e => setOrgData({ ...orgData, isActive: e.target.checked })} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveOrg}
                                        disabled={actionLoading}
                                        className="w-full h-12 bg-green-900/20 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        {actionLoading ? 'UPLOADING...' : (orgData.id ? 'UPDATE_NODE' : 'INITIALIZE_NODE')}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Manual Onboarding Modal */}
                <AnimatePresence>
                    {showManualModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-[600px] bg-black border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)] rounded-2xl overflow-hidden"
                            >
                                <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-purple-500/5">
                                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> MANUAL_TENURE_PROVISIONING
                                    </h3>
                                    <button onClick={() => setShowManualModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Personnel_Email</label>
                                            <Input value={manualFellowData.email} onChange={e => setManualFellowData({ ...manualFellowData, email: e.target.value.toLowerCase() })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" placeholder="IDENTIFIER@DEEPCYTES.IO" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">First_Name</label>
                                            <Input value={manualFellowData.firstName} onChange={e => setManualFellowData({ ...manualFellowData, firstName: e.target.value })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" placeholder="NAME_ENTRY" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Last_Name</label>
                                            <Input value={manualFellowData.lastName} onChange={e => setManualFellowData({ ...manualFellowData, lastName: e.target.value })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" placeholder="SURNAME_ENTRY" />
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5 col-span-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase font-bold text-purple-500 tracking-widest">Designated_Role</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="NEW_ROLE..."
                                                        className="bg-black border-b border-white/20 text-[10px] w-24 outline-none focus:border-purple-500 px-1 text-white"
                                                        value={newRole}
                                                        onChange={e => setNewRole(e.target.value)}
                                                        onKeyPress={e => e.key === 'Enter' && handleAddRole()}
                                                    />
                                                    <button onClick={handleAddRole} className="text-[10px] text-purple-400 hover:text-white uppercase font-bold">Add</button>
                                                </div>
                                            </div>
                                            <select
                                                value={manualFellowData.role}
                                                onChange={e => setManualFellowData({ ...manualFellowData, role: e.target.value })}
                                                className="w-full bg-black border border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500 outline-none px-3"
                                            >
                                                <option value="">SELECT_ROLE</option>
                                                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5 col-span-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase font-bold text-cyan-500 tracking-widest">Primary_Project</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="NEW_PROJECT..."
                                                        className="bg-black border-b border-white/20 text-[10px] w-28 outline-none focus:border-cyan-500 px-1 text-white"
                                                        value={newProject}
                                                        onChange={e => setNewProject(e.target.value)}
                                                        onKeyPress={e => e.key === 'Enter' && handleAddProject()}
                                                    />
                                                    <button onClick={handleAddProject} className="text-[10px] text-cyan-400 hover:text-white uppercase font-bold">Add</button>
                                                </div>
                                            </div>
                                            <select
                                                value={manualFellowData.project}
                                                onChange={e => setManualFellowData({ ...manualFellowData, project: e.target.value })}
                                                className="w-full bg-black border border-white/10 h-10 text-xs font-mono text-white focus:border-cyan-500 outline-none px-3"
                                            >
                                                <option value="">SELECT_PROJECT</option>
                                                {availableProjects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5 col-span-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase font-bold text-green-500 tracking-widest">Assigned_Node_Code</label>
                                                <button
                                                    onClick={() => {
                                                        const name = prompt("Enter Node Name:");
                                                        const code = prompt("Enter Node Code:");
                                                        if (name && code) handleQuickAddOrg(name, code);
                                                    }}
                                                    className="text-[10px] text-green-400 hover:text-white uppercase font-bold"
                                                >
                                                    + Quick_Initialize
                                                </button>
                                            </div>
                                            <select
                                                value={manualFellowData.orgCode}
                                                onChange={e => setManualFellowData({ ...manualFellowData, orgCode: e.target.value })}
                                                className="w-full bg-black border border-white/10 h-10 text-xs font-mono text-white focus:border-green-500 outline-none px-3 text-green-400"
                                            >
                                                <option value="">NO_NODE_ASSIGNED (OPTIONAL)</option>
                                                {orgs.map(o => <option key={o.code} value={o.code}>{o.code} - {o.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Tenure_Sequence</label>
                                            <Input
                                                value={manualFellowData.cohort}
                                                onChange={e => setManualFellowData({ ...manualFellowData, cohort: e.target.value })}
                                                className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500"
                                                placeholder="B1, B2 (OR #)"
                                            />
                                        </div>
                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Onboarding_Date</label>
                                            <Input type="date" value={manualFellowData.startDate} onChange={e => setManualFellowData({ ...manualFellowData, startDate: e.target.value })} className="bg-black border-white/10 h-10 text-xs font-mono text-white focus:border-purple-500" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddManualFellow}
                                        disabled={actionLoading}
                                        className="w-full h-12 bg-purple-900/20 border border-purple-500/50 text-purple-500 hover:bg-purple-500 hover:text-black font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-xs mt-4"
                                    >
                                        {actionLoading ? 'COMMITTING...' : 'INITIALIZE_TENURE'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen bg-black flex items-center justify-center font-mono">
                <div className="text-cyan-500 animate-pulse tracking-widest text-xl">BOOTING_CORE_ENGINE...</div>
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import {
    FileText,
    CheckCircle,
    XCircle,
    ArrowLeft,
    User,
    Mail,
    Calendar,
    Globe,
    ExternalLink,
    ChevronRight,
    Search,
    Shield
} from "lucide-react";

export default function AdminApplications() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    const fetchApps = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const user = JSON.parse(localStorage.getItem("user") || "null");

            if (!token || !user || !user.isAdmin) {
                toast.error("Please login as an administrator.");
                return router.push("/admin");
            }

            const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/application/admin/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApps(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch applications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, [router]);

    const handleUpdateStatus = async (status) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.patch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/application/admin/status`, {
                applicantId: selectedApp._id,
                status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Application ${status.toLowerCase()} successfully!`);
            setSelectedApp(null);
            fetchApps();
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredApps = apps.filter(app =>
        `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.orgCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#00040A] text-white flex flex-col">
                {/* Dashboard Header */}
                <div className="border-b border-white/10 bg-black/40 backdrop-blur-md px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="text-cyan-400 w-6 h-6" />
                            Hiring Dashboard
                        </h1>
                        <p className="text-gray-500 text-sm">Reviewing candidates for DeepCytes Fellowship</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <Input
                            placeholder="Filter by name, email, or org..."
                            className="bg-black/40 border-white/10 pl-10 w-full md:w-80 h-10 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main List Area */}
                    <div className={`transition-all duration-300 ${selectedApp ? 'w-1/2' : 'w-full'} overflow-auto p-6`}>
                        <div className="grid gap-4">
                            {loading ? (
                                <div className="text-center py-20 text-gray-500 italic">Accessing Hiring Database...</div>
                            ) : filteredApps.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">No matching applications found.</div>
                            ) : (
                                filteredApps.map(app => (
                                    <div
                                        key={app._id}
                                        onClick={() => {
                                            setSelectedApp(app);
                                        }}
                                        className={`group relative bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center gap-6 cursor-pointer hover:bg-white/10 transition-all ${selectedApp?._id === app._id ? 'ring-2 ring-cyan-500/50 bg-white/10' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${app.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : app.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                            {app.firstName[0]}{app.lastName[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{app.firstName} {app.lastName}</h3>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-mono tracking-tighter">{app.orgCode}</span>
                                            </div>
                                            <p className="text-gray-500 text-sm truncate">{app.email} • {app.role}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${app.status === 'ACCEPTED' ? 'bg-green-900/40 text-green-400' : app.status === 'REJECTED' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                                                {app.status}
                                            </span>
                                            <span className="text-[10px] text-gray-600 italic">{new Date(app.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                        <ChevronRight className={`text-gray-600 transition-transform ${selectedApp?._id === app._id ? 'translate-x-1 text-cyan-500' : 'group-hover:translate-x-1'}`} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Review Details Pane */}
                    {selectedApp && (
                        <div className="w-1/2 border-l border-white/10 bg-black/60 backdrop-blur-xl p-8 overflow-auto animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <Button variant="ghost" onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-white -ml-4">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleUpdateStatus('REJECTED')}
                                        disabled={actionLoading || selectedApp.status === 'REJECTED'}
                                        variant="outline"
                                        className="rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleUpdateStatus('ACCEPTED')}
                                        disabled={actionLoading || selectedApp.status === 'ACCEPTED'}
                                        className="rounded-xl bg-green-600 hover:bg-green-500"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Accept & Invite
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Profile Summary */}
                                <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-4xl font-extrabold shadow-2xl">
                                        {selectedApp.firstName[0]}{selectedApp.lastName[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold">{selectedApp.firstName} {selectedApp.lastName}</h2>
                                        <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase">{selectedApp.role}</p>
                                        <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedApp.email}</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedApp.dob} (DOB)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Documents & Portfolio
                                    </h3>
                                    <div className="grid gap-3">
                                        {selectedApp.resume ? (
                                            <a
                                                href={selectedApp.resume.startsWith('http') ? selectedApp.resume : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}${selectedApp.resume}`}
                                                target="_blank"
                                                className="group bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all border-l-4 border-l-cyan-500"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                                        <FileText />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">Resume_{selectedApp.lastName}.pdf</p>
                                                        <p className="text-[10px] text-gray-500">{selectedApp.resume.includes('/uploads/') ? 'On-Server PDF' : 'External Drive Link'}</p>
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                                            </a>
                                        ) : (
                                            <div className="text-sm text-gray-600 italic">No resume provided.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Form Data */}
                                {selectedApp.data && Object.keys(selectedApp.data).length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Additional Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(selectedApp.data).map(([key, value]) => (
                                                <div key={key} className="bg-white/5 p-3 rounded-lg">
                                                    <p className="text-[10px] text-gray-600 uppercase mb-1">{key}</p>
                                                    <p className="text-sm font-medium">{String(value)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

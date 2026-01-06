"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Lock, CheckCircle, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PortalDashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ firstName: "", lastName: "", legalName: "" });
    const [ndaLoading, setNdaLoading] = useState(false);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return router.push("/portal");

            const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data.user);
            setFormData(prev => ({
                ...prev,
                firstName: res.data.user.firstName || "",
                lastName: res.data.user.lastName || ""
            }));
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

    const handleNameUpdate = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/portal/update-name`, {
                firstName: formData.firstName,
                lastName: formData.lastName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Name confirmed!");
            fetchUser();
        } catch (error) {
            toast.error("Failed to update name");
        }
    };

    const handleSignNDA = async () => {
        if (formData.legalName !== formData.legalName.toUpperCase()) {
            return toast.warning("Please enter your name in ALL CAPS.");
        }
        setNdaLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/portal/sign-nda`, {
                legalName: formData.legalName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("NDA Signed Successfully!");
            fetchUser();
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to sign NDA");
        } finally {
            setNdaLoading(false);
        }
    };

    const handleDownload = async (endpoint, filename) => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/portal/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Download failed");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#00040A] text-white flex items-center justify-center">Loading...</div>;

    const isNdaSigned = user?.ndaDateTimeUser && user?.ndaDateTimeUser !== "0";
    const isProfileActive = isNdaSigned;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#00040A] text-white py-12 px-4">
                <div className="max-w-4xl mx-auto space-y-8">

                    <header className="mb-8 border-b border-gray-800 pb-4">
                        <h1 className="text-3xl font-bold text-cyan-400">Participant Portal</h1>
                        <p className="text-gray-400">Manage your onboarding and documents.</p>
                        {user?.pid && <div className="mt-2 text-sm text-green-400 font-mono">PID: {user.pid}</div>}
                    </header>

                    {/* Step 1: Personal Details */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-blue-500/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                            Confirm Personal Details
                            {isNdaSigned && <CheckCircle className="text-green-500 w-5 h-5 ml-auto" />}
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400">First Name</label>
                                <Input
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    disabled={isNdaSigned} // Lock after NDA (or strictly, after one edit? Logical to lock after NDA)
                                    className="bg-black/30 border-white/10"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Last Name</label>
                                <Input
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    disabled={isNdaSigned}
                                    className="bg-black/30 border-white/10"
                                />
                            </div>
                        </div>
                        {!isNdaSigned && (
                            <Button onClick={handleNameUpdate} className="mt-4 bg-blue-600 hover:bg-blue-700">
                                Save & Confirm
                            </Button>
                        )}
                    </div>

                    {/* Step 2: NDA */}
                    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden transition-opacity ${!formData.firstName ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-purple-500/20 text-purple-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                            Non-Disclosure Agreement
                            {isNdaSigned && <CheckCircle className="text-green-500 w-5 h-5 ml-auto" />}
                        </h2>

                        {isNdaSigned ? (
                            <div className="flex items-center justify-between bg-black/30 p-4 rounded-lg">
                                <div>
                                    <p className="text-gray-300 text-sm">Signed on: {user.ndaDateTimeUser}</p>
                                    <p className="text-gray-300 text-sm">Legal Name: {user.ndaLegalName}</p>
                                </div>
                                <Button onClick={() => handleDownload('download-nda', 'DC_NDA_SIGNED.pdf')} variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-900">
                                    <Download className="w-4 h-4 mr-2" /> Download NDA
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-black/30 text-gray-400 text-sm h-32 overflow-y-auto border border-white/5 rounded">
                                    [NDA TEMPLATE PREVIEW WOULD GO HERE]
                                    <br /><br />
                                    I, {formData.firstName} {formData.lastName}, hereby agree to the terms...
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Type your FULL LEGAL NAME in ALL CAPS to sign:</label>
                                    <Input
                                        placeholder="e.g. JOHN DOE"
                                        value={formData.legalName}
                                        onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                                        className="bg-black/30 border-white/10 mb-2 uppercase"
                                    />
                                </div>
                                <Button onClick={handleSignNDA} disabled={ndaLoading} className="bg-purple-600 hover:bg-purple-700 w-full">
                                    {ndaLoading ? "Signing..." : "Sign NDA"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Offer Letter */}
                    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden transition-opacity ${!isNdaSigned ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-green-500/20 text-green-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                            Offer Letter & Activation
                            {!isNdaSigned && <Lock className="text-gray-500 w-5 h-5 ml-auto" />}
                        </h2>

                        {isProfileActive ? (
                            <div className="space-y-4">
                                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center">
                                    <h3 className="text-lg font-bold text-green-400 mb-2">Profile Activated!</h3>
                                    <p className="text-sm text-gray-300 mb-4">You have officially joined the program.</p>
                                    <Button onClick={() => handleDownload('download-offer', 'DC_OFFER.pdf')} className="bg-green-600 hover:bg-green-700">
                                        <Download className="w-4 h-4 mr-2" /> Download Offer Letter
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Complete previous steps to unlock your offer letter.</p>
                        )}
                    </div>

                    {/* Step 4: Resources */}
                    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden transition-opacity ${!isProfileActive ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-yellow-500/20 text-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                            Fellowship Resources
                            {!isProfileActive && <Lock className="text-gray-500 w-5 h-5 ml-auto" />}
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['Fellowship Charter', 'About DeepCytes', 'Public Relations Kit', 'Branding Assets'].map((item, i) => (
                                <div key={i} className="bg-black/20 p-4 rounded-lg text-center hover:bg-white/5 cursor-pointer transition">
                                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <span className="text-xs text-gray-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </>
    );
}

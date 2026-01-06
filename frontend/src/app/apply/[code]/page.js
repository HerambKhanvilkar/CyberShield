"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ApplicationForm() {
    const { code } = useParams();
    const router = useRouter();

    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        otp: "",
        role: "",
        dob: "",
        resume: ""
    });
    const [resumeFile, setResumeFile] = useState(null);

    const [emailStep, setEmailStep] = useState("start"); // start, otp_sent, verified
    const [otpLoading, setOtpLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/application/org/${code}`);
                setOrg(res.data);
            } catch (error) {
                toast.error(error.response?.data?.message || "Invalid Organization Code");
                router.push("/apply");
            } finally {
                setLoading(false);
            }
        };
        if (code) fetchOrg();
    }, [code, router]);

    const handleSendOtp = async () => {
        if (!formData.email) return toast.error("Please enter email");
        setOtpLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/register/otp`, { email: formData.email });
            setEmailStep("otp_sent");
            toast.success("OTP sent to your email");
        } catch (error) {
            toast.error("Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setOtpLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/validate-otp`, {
                email: formData.email,
                otp: formData.otp
            });
            setEmailStep("verified");
            toast.success("Email Verified!");
        } catch (error) {
            toast.error("Invalid OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (emailStep !== "verified") return toast.error("Please verify your email first.");
        if (!resumeFile && !formData.resume) return toast.error("Please provide a resume (file or link).");

        setSubmitLoading(true);
        try {
            const data = new FormData();
            data.append("orgCode", code);
            data.append("email", formData.email);
            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            data.append("role", formData.role);
            data.append("dob", formData.dob);
            if (resumeFile) {
                data.append("resumeFile", resumeFile);
            }
            data.append("data", JSON.stringify({ resume: formData.resume }));

            await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/application/apply`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success("Application Submitted Successfully!");
            router.push("/");
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
    if (!org) return <div className="text-white text-center mt-20">Redirecting...</div>;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#00040A] text-white py-12 px-4 flex justify-center">
                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-8 shadow-2xl">
                    <div className="mb-8 border-b border-gray-700 pb-4">
                        <span className="text-cyan-400 text-sm font-mono tracking-wider uppercase">Application Form</span>
                        <h1 className="text-3xl font-bold mt-2">{org.name}</h1>
                        <p className="text-gray-400 text-sm mt-1">Applying for Organization Code: <span className="text-white font-mono">{org.code}</span></p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>First Name</Label>
                                <Input
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    className="bg-black/30 border-white/10"
                                />
                            </div>
                            <div>
                                <Label>Last Name</Label>
                                <Input
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    className="bg-black/30 border-white/10"
                                />
                            </div>
                        </div>

                        {/* DOB */}
                        <div>
                            <Label>Date of Birth</Label>
                            <Input
                                type="date"
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                required
                                className="bg-black/30 border-white/10"
                            />
                        </div>

                        {/* Email Verification */}
                        <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                            <Label>Email Address</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={emailStep !== "start"}
                                    required
                                    placeholder="your.email@example.com"
                                    className="bg-black/30 border-white/10"
                                />
                                {emailStep === "start" && (
                                    <Button type="button" onClick={handleSendOtp} disabled={otpLoading} className="bg-blue-600 hover:bg-blue-700">
                                        {otpLoading ? "Sending..." : "Verify"}
                                    </Button>
                                )}
                                {emailStep === "verified" && (
                                    <Button type="button" disabled className="bg-green-600/20 text-green-400 border border-green-600 cursor-default">
                                        Verified
                                    </Button>
                                )}
                            </div>

                            {emailStep === "otp_sent" && (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                    <Input
                                        placeholder="Enter OTP"
                                        value={formData.otp}
                                        onChange={e => setFormData({ ...formData, otp: e.target.value })}
                                        className="bg-black/30 border-white/10"
                                    />
                                    <Button type="button" onClick={handleVerifyOtp} disabled={otpLoading} className="bg-green-600 hover:bg-green-700">
                                        {otpLoading ? "Checking..." : "Confirm"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Roles */}
                        <div>
                            <Label>Role</Label>
                            <Select onValueChange={val => setFormData({ ...formData, role: val })}>
                                <SelectTrigger className="bg-black/30 border-white/10 text-white">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 text-white border-gray-700">
                                    {org.formVars?.roles?.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Resume Selection */}
                        <div className="space-y-4 border-t border-white/10 pt-4">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Resume / CV</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs">Upload PDF (Max 5MB)</Label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={e => setResumeFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-400
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-cyan-600/20 file:text-cyan-400
                                            hover:file:bg-cyan-600/30 cursor-pointer"
                                    />
                                    {resumeFile && <p className="text-xs text-green-400 flex items-center gap-1">Selected: {resumeFile.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">OR Paste Portfolio/Drive Link</Label>
                                    <Input
                                        value={formData.resume}
                                        onChange={e => setFormData({ ...formData, resume: e.target.value })}
                                        placeholder="https://drive.google.com/..."
                                        className="bg-black/30 border-white/10 h-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={submitLoading || emailStep !== "verified"} className="w-full h-12 text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg mt-8">
                            {submitLoading ? "Submitting..." : "Submit Application"}
                        </Button>

                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}

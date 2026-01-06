"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PortalLogin() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/login-otp`, { email });
            toast.success("OTP sent to your email!");
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/verify-login-otp`, { email, otp });

            const { token, user } = response.data;
            localStorage.setItem("accessToken", token);
            localStorage.setItem("user", JSON.stringify(user));

            toast.success("Login Successful!");
            router.push("/portal");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#00040A] text-white flex items-center justify-center p-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center mb-6 text-cyan-400">Portal Login</h1>

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="enter@deepcytes.io"
                                    className="bg-black/20 border-white/10 text-white"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700">
                                {loading ? "Sending..." : "Send OTP"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="text-center mb-4 text-sm text-gray-300">
                                OTP sent to <strong>{email}</strong>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Enter OTP</label>
                                <Input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    placeholder="123456"
                                    className="bg-black/20 border-white/10 text-white text-center tracking-widest text-lg"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                                {loading ? "Verifying..." : "Verify & Login"}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-xs text-gray-400 hover:text-white mt-2"
                            >
                                Entered wrong email?
                            </button>
                        </form>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import { useAuthContext } from "@/components/AuthContext";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user, loading: authLoading, fetchUser } = useAuthContext();

    useEffect(() => {
        if (authLoading) return;
        
        if (user && user.isAdmin) {
            router.push("/applications");
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="h-screen w-screen bg-[#0d0d0d] flex items-center justify-center font-sans">
                <div className="text-cyan-500 animate-pulse tracking-widest text-xl uppercase font-black">Decrypting Session...</div>
            </div>
        );
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/login`, {
                email,
                password
            });

            const { token, user } = response.data;

            if (!user.isAdmin) {
                toast.error("Access denied. You are not an administrator.");
                return;
            }

            localStorage.setItem("accessToken", token);
            localStorage.setItem("user", JSON.stringify(user));

            await fetchUser();

            toast.success("Admin Login Successful!");
            router.push("/applications");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="relative flex flex-col min-h-screen bg-[#0d0d0d] overflow-hidden group/page">
                {/* Minimal Logo Overlay */}
                <div className="absolute top-6 left-8 z-50">
                    <Link href="/">
                        <img
                            src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                            className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity"
                            alt="Logo"
                        />
                    </Link>
                </div>

                {/* Quick Home Link (Top Right) */}
                <div className="absolute top-8 right-8 z-50">
                    <button
                        onClick={() => router.push("/")}
                        className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-cyan-400 transition-all flex items-center gap-2"
                    >
                        Public Site
                    </button>
                </div>

                {/* Background effects */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="ball" style={{ "--delay": "-2s", "--size": "0.3", "--speed": "25s" }}></div>
                    <div className="ball" style={{ "--delay": "-7s", "--size": "0.4", "--speed": "30s" }}></div>
                    <div className="ball" style={{ "--delay": "-12s", "--size": "0.35", "--speed": "22s" }}></div>
                </div>

                <div className="flex-1 flex items-center justify-center p-4 md:p-8 pt-20 relative z-10">
                    {/* Main Content Card */}
                    <div className="w-full max-w-sm">
                        {/* Header Icon Section */}
                        <div className="flex flex-col items-center mb-6 group">
                            <div className="relative w-14 h-14 mb-3">
                                {/* Animated Lock from globals.css */}
                                <div className="lock-container scale-100 transform transition-transform group-hover:scale-110">
                                    <div className="lock">
                                        <div className="keyhole"></div>
                                    </div>
                                </div>
                                {/* Outer Glow Ring */}
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-pulse"></div>
                            </div>
                            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tight text-center mb-1.5">
                                Admin Portal
                            </h1>
                            <div className="flex items-center gap-2 px-3 py-0.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_cyan]"></div>
                                <span className="text-[8px] uppercase tracking-[0.25em] font-black text-gray-400">Security Access</span>
                            </div>
                        </div>

                        {/* Glassmorphic Login Card */}
                        <div className="glass border border-white/5 p-8 shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            {/* Interactive Glint Effect */}
                            <div className="glint glintcenter opacity-5 group-hover:opacity-15 transition-opacity"></div>
                            
                            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                                            Administrator
                                        </label>
                                    </div>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="admin@deepcytes.io"
                                        className="bg-white/[0.03] border-white/5 text-white h-11 pl-4 rounded-xl focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-gray-700 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                                            Key
                                        </label>
                                    </div>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="bg-white/[0.03] border-white/5 text-white h-11 pl-4 rounded-xl focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-gray-700 text-sm"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-white text-black hover:bg-cyan-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-cyan-500/5 transform active:scale-[0.98] transition-all duration-300 border-none group/btn mt-2"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin group-hover/btn:border-white"></div>
                                            <span>Authenticating</span>
                                        </div>
                                    ) : (
                                        "Enter System"
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Background subtle watermark & version */}
                        <div className="mt-20 flex flex-col items-center gap-2 opacity-10">
                            <img
                                src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                                className="h-4 w-auto brightness-0 invert"
                                alt="Logo Watermark"
                            />
                            <span className="text-[10px] font-mono tracking-widest text-white">v0.1.1-ALPHA</span>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}


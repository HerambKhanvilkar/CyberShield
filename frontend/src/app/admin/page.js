"use client";

import { useState, useEffect } from "react";
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
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const { fetchUser } = useAuthContext();

    useEffect(() => {
        // If already logged in as admin, redirect (only once)
        if (hasCheckedAuth) return;
        
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const token = localStorage.getItem("accessToken");
        
        if (user && user.isAdmin && token) {
            setHasCheckedAuth(true);
            router.push("/applications");
        } else {
            setHasCheckedAuth(true);
        }
    }, [router, hasCheckedAuth]);

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
            <Navbar />
            <div className="min-h-screen bg-[#00040A] text-white flex items-center justify-center p-4 relative overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-500 opacity-20 blur-[100px]"></div>

                <div className="bg-white/20 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-cyan-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                            <Lock className="text-cyan-400 w-8 h-8" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-center mb-2 text-white">Admin Portal</h1>
                    <p className="text-gray-400 text-center mb-8 text-sm italic">Authorized personnel only.</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Admin Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@deepcytes.io"
                                className="bg-slate-900/60 border-white/10 text-white h-12 rounded-xl focus:border-cyan-500/50 transition-all shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="bg-slate-900/60 border-white/10 text-white h-12 rounded-xl focus:border-cyan-500/50 transition-all shadow-inner"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 rounded-xl font-bold shadow-lg shadow-cyan-900/20 transform active:scale-[0.98] transition-all"
                        >
                            {loading ? "Authenticating..." : "Sign In to Dashboard"}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <button
                            onClick={() => router.push("/")}
                            className="text-xs text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                        >
                            Back to public site
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}


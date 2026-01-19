"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Shield, Server, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OrgLoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ orgCode: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/api';
            const res = await axios.post(`${serverUrl}/org/login`, formData);

            // Login success
            const { token, user } = res.data;
            localStorage.setItem('orgToken', token);
            localStorage.setItem('orgUser', JSON.stringify(user));

            toast.success("Access Granted. Initializing Node...");
            setTimeout(() => {
                router.push('/orgs/dashboard');
            }, 1000);

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Access Denied");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_0%,black_100%) pointer-events-none" />

            <div className="z-10 w-full max-w-md p-8">
                {/* Header */}
                <div className="mb-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-900/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Shield className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tighter text-white">DEEPCYTES <span className="text-green-500">FELLOWSHIP</span></h1>
                        <p className="text-xs text-green-500/60 uppercase tracking-widest">Secure Node Access Portal</p>
                    </div>
                </div>

                {/* Login Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-white/5 border border-green-500/20 p-8 rounded-sm backdrop-blur-sm relative group"
                >
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500/50" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-500/50" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-500/50" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500/50" />

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-green-500/70 block">Organization Code</label>
                        <div className="relative">
                            <Server className="absolute left-3 top-2.5 w-4 h-4 text-green-500/30" />
                            <input
                                type="text"
                                required
                                value={formData.orgCode}
                                onChange={(e) => setFormData({ ...formData, orgCode: e.target.value.toUpperCase() })}
                                className="w-full bg-black/50 border border-green-500/20 rounded-none px-10 py-2 text-sm text-green-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 placeholder-green-900/50 transition-all font-mono uppercase"
                                placeholder="IITB"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-green-500/70 block">Security_Key (Password)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-green-500/30" />
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-black/50 border border-green-500/20 rounded-none px-10 py-2 text-sm text-green-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 placeholder-green-900/50 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-green-500 text-black font-bold text-sm uppercase tracking-wider hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    >
                        {loading ? 'Authenticating...' : (
                            <>
                                Establish Connection <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="text-center text-[10px] text-green-500/40 pt-4">
                        UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
                        <br />
                        IP LOGGED: {typeof window !== 'undefined' ? '127.0.0.1' : ''}
                    </div>
                </motion.form>
            </div>

        </div>
    );
}

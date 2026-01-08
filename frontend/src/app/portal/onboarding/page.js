"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function OnboardingGateway() {
    const router = useRouter();

    useEffect(() => {
        const checkState = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return router.push("/portal");

                const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const state = res.data.user.onboardingState || 'PROFILE';
                router.push(`/portal/onboarding/${state.toLowerCase()}`);
            } catch (error) {
                router.push("/portal");
            }
        };
        checkState();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm font-mono animate-pulse uppercase tracking-widest">Sycing Fellowship State...</p>
        </div>
    );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/components/Loader";

export default function OnboardingGateway() {
    const router = useRouter();

    useEffect(() => {
        const checkState = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return router.push("/portal");

                const res = await axios.get(`${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/me`, {
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

    return <Loader text="SYNCING APPLICATION STATE..." />;
}

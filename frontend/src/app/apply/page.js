"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar"; // Or should this be standalone? Prompt says "Single page with a box". But keeping Navbar is fine for consistency, or maybe minimal header. I'll use Navbar for now.

export default function ApplyLanding() {
    const [code, setCode] = useState("");
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.trim()) {
            router.push(`/apply/${code.trim()}`);
        }
    };

    return (
        <>
            <Navbar /> {/* Can remove if user wants totally isolated, but helps navigation */}
            <div className="min-h-screen bg-[#00040A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background Ambient */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

                <div className="z-10 w-full max-w-md text-center space-y-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        Start Application
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Enter your Organization Code to proceed.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Input
                            placeholder="Organization Code (e.g. CODE123)"
                            className="bg-white/5 border-white/20 text-center text-xl h-14 tracking-wider text-white placeholder:text-gray-600"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <Button type="submit" className="h-12 text-lg bg-cyan-600 hover:bg-cyan-700 transition-all shadow-[0_0_20px_rgba(8,145,178,0.5)]">
                            Continue
                        </Button>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}

import { Shield, Activity } from "lucide-react";

export default function Loader({ text = "INITIALIZING SYSTEM..." }) {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono z-50 fixed inset-0">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-cyan-500/50 animate-pulse" />
                </div>
            </div>
            <div className="mt-8 flex items-center gap-3 text-cyan-500/80 text-xs tracking-[0.2em] font-bold uppercase animate-pulse">
                <Activity className="w-4 h-4" />
                {text}
            </div>
        </div>
    );
}

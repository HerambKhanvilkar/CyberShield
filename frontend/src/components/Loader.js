"use client";

import React from 'react';

const Loader = ({ text = "INITIALIZING..." }) => {
    return (
        <div className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center p-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full" />

                {/* Spinning Ring */}
                <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.3)]" />

                {/* Inner Pulse */}
                <div className="w-16 h-16 bg-cyan-500/10 rounded-full animate-pulse border border-cyan-500/30 flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                </div>
            </div>

            <div className="mt-12 space-y-4 text-center">
                <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 bg-cyan-500 animate-pulse" />
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] font-mono whitespace-nowrap">
                        {text}
                    </p>
                </div>

                <div className="w-48 h-1 bg-white/20 mx-auto overflow-hidden relative">
                    <div className="absolute inset-0 bg-cyan-500/30 -translate-x-full animate-[loading-bar_2s_infinite]" />
                </div>

                <p className="text-[8px] font-bold text-gray-700 uppercase tracking-widest animate-pulse font-mono">
                    SECURE_UPLINK_ESTABLISHED // DC_OS_v2.0
                </p>
            </div>

            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default Loader;


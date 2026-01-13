"use client";
import React from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 font-mono">
                    <div className="max-w-md w-full bg-red-950/20 border border-red-500/30 p-8 rounded-2xl text-center space-y-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-repeat opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #ff0000 25%, transparent 25%, transparent 75%, #ff0000 75%, #ff0000), linear-gradient(45deg, #ff0000 25%, transparent 25%, transparent 75%, #ff0000 75%, #ff0000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }} />

                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/50 animate-pulse">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>

                        <div>
                            <h2 className="text-xl font-black italic tracking-widest text-red-500 mb-2">SYSTEM_CRITICAL_FAILURE</h2>
                            <p className="text-xs text-red-400/70 font-mono">
                                {this.state.error?.message || "An unexpected error occurred in the visualization module."}
                            </p>
                        </div>

                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full bg-red-600 hover:bg-red-500 text-black font-bold tracking-wider uppercase h-12 rounded-xl"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" /> Reboot System
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

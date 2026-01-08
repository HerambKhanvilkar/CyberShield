import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Award, Activity, Hash, Calendar } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, delay, color = "cyan" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`bg-zinc-900/50 border border-${color}-500/30 p-4 rounded-xl relative overflow-hidden backdrop-blur-sm group`}
    >
        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all duration-500`} />

        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-white font-mono">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
                <Icon size={20} />
            </div>
        </div>
    </motion.div>
);

export default function OverviewStats({ stats, profile }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
                icon={Hash}
                label="Global PID"
                value={profile.globalPid || "N/A"}
                delay={0.1}
                color="purple"
            />
            <StatCard
                icon={Award}
                label="Current Role"
                value={stats.currentRole}
                delay={0.2}
                color="cyan"
            />
            <StatCard
                icon={Activity}
                label="Tenures"
                value={stats.totalTenures.toString().padStart(2, '0')}
                delay={0.3}
                color="emerald"
            />
            <StatCard
                icon={Calendar}
                label="Since"
                value={stats.programStart}
                delay={0.4}
                color="blue"
            />
        </div>
    );
}

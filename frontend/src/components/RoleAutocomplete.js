"use client";

import { useState, useMemo } from "react";
import { Search, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

export default function RoleAutocomplete({ roles = [], selected = [], onChange }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredRoles = useMemo(() => {
        if (!searchTerm) return roles;
        const lower = searchTerm.toLowerCase();
        return roles.filter(r =>
            (r.name || r).toLowerCase().includes(lower) ||
            (r.description && r.description.toLowerCase().includes(lower))
        );
    }, [roles, searchTerm]);

    const handleToggle = (roleName) => {
        if (selected.includes(roleName)) {
            onChange(selected.filter(s => s !== roleName));
        } else {
            if (selected.length >= 3) {
                toast.warning("You can only select up to 3 roles.");
                return;
            }
            onChange([...selected, roleName]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Selected Roles Chips - Always Visible */}
            <AnimatePresence>
                {selected.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-2 mb-2"
                    >
                        {selected.map(role => (
                            <motion.span
                                key={role}
                                layoutId={role}
                                className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded-full group"
                            >
                                {role}
                                <button
                                    type="button"
                                    onClick={() => handleToggle(role)}
                                    className="hover:text-white transition-colors ml-1"
                                >
                                    ✕
                                </button>
                            </motion.span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Search roles (e.g. 'Developer')..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/50 border-white/10 h-10 rounded-xl text-white text-sm font-mono focus:border-cyan-500/50 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {filteredRoles.length > 0 ? (
                    filteredRoles.map((r) => {
                        const roleName = r.name || r;
                        const isSelected = selected.includes(roleName);
                        return (
                            <button
                                key={roleName}
                                type="button"
                                onClick={() => handleToggle(roleName)}
                                aria-pressed={isSelected}
                                aria-label={`Select role: ${roleName}`}
                                className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${isSelected
                                    ? "bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                    : "bg-black/50 border-white/10 hover:border-white/30 hover:bg-white/5"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`font-bold text-sm tracking-wide ${isSelected ? "text-cyan-400" : "text-gray-300"}`}>
                                        {roleName}
                                    </span>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-500" />}
                                </div>
                                {r.description && (
                                    <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-3 group-hover:text-gray-300 transition-colors">
                                        {r.description}
                                    </p>
                                )}
                                <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                            </button>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-8 text-gray-500 text-xs font-mono">
                        No roles found matching "{searchTerm}"
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-gray-500 border-t border-white/10 pt-2">
                <span>Selected: {selected.length} / 3</span>
                {selected.length === 0 && <span className="text-red-500 animate-pulse">* Required</span>}
            </div>
        </div>
    );
}

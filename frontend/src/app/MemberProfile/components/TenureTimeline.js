import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, CheckCircle, Lock, PenTool, Download } from 'lucide-react';

const DocumentBadge = ({ type, doc, onSign, onDownload }) => {
    const isSigned = !!doc?.signedAt;

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${isSigned ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'} mb-2`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${isSigned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {isSigned ? <CheckCircle size={16} /> : <Lock size={16} />}
                </div>
                <div>
                    <p className="text-sm font-bold text-zinc-200 font-mono">
                        {type === 'nda' ? 'NDA' : type === 'offerLetter' ? 'Offer Letter' : 'Completion Letter'}
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">
                        {isSigned ? `Signed: ${new Date(doc.signedAt).toLocaleDateString()}` : 'Action Required'}
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                {!isSigned ? (
                    <button
                        onClick={onSign}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors text-xs font-mono font-bold uppercase"
                    >
                        <PenTool size={14} />
                        Sign
                    </button>
                ) : (
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors text-xs font-mono uppercase"
                    >
                        <Download size={14} />
                        PDF
                    </button>
                )}
            </div>
        </div>
    );
};

export default function TenureTimeline({ tenures, onSignRequest, onDownloadRequest }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-2 h-8 bg-cyan-500 rounded-full mr-2"></span>
                    Tenure History
                </h2>
            </div>

            <div className="relative border-l-2 border-zinc-800 ml-4 space-y-8 pb-8">
                {tenures.map((tenure, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-8"
                    >
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${tenure.status === 'ACTIVE' ? 'border-cyan-500 bg-cyan-900' : 'border-zinc-600 bg-zinc-900'}`} />

                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-white font-mono">{tenure.role}</h3>
                                        {tenure.status === 'ACTIVE' && (
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wide font-bold">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono">
                                        <Calendar size={14} />
                                        <span>{tenure.startDate} - {tenure.endDate || 'Present'}</span>
                                    </div>
                                </div>
                                <div className="text-zinc-500 font-mono text-sm opacity-50">
                                    ID: #{index + 1}
                                </div>
                            </div>

                            {/* Documents Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DocumentBadge
                                    type="nda"
                                    doc={tenure.signedDocuments?.nda}
                                    onSign={() => onSignRequest(index, 'nda')}
                                    onDownload={() => onDownloadRequest(index, 'nda')}
                                />
                                <DocumentBadge
                                    type="offerLetter"
                                    doc={tenure.signedDocuments?.offerLetter}
                                    onSign={() => onSignRequest(index, 'offerLetter')}
                                    onDownload={() => onDownloadRequest(index, 'offerLetter')}
                                />
                                <DocumentBadge
                                    type="completionLetter"
                                    doc={tenure.signedDocuments?.completionLetter}
                                    onSign={() => onSignRequest(index, 'completionLetter')}
                                    onDownload={() => onDownloadRequest(index, 'completionLetter')}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

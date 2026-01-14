import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PenTool, Type, FileCheck } from 'lucide-react';
// import SignatureCanvas from 'react-signature-canvas'; // Ensure this is installed or use fallback

export default function SignatureModal({ isOpen, onClose, docType, onConfirm, signing }) {
    const [signatureType, setSignatureType] = useState('TYPED'); // TYPED | DRAWN
    const [typedName, setTypedName] = useState('');
    const [hasConsented, setHasConsented] = useState(false);

    // Note: For "Drawn", we would ideally use react-signature-canvas.
    // Since I can't npm install easily inside this turn without a prompt, 
    // I will just implement the "TYPED" flow fully and a minimal placeholder for drawn.
    // If the user wants drawing, they need to install the package.
    // "Strictly no third party" - Wait, user said "no third party dependency initially" in planning?
    // User said: "no third-party dependencies for the initial digital signing system" in summary.
    // So I should stick to TYPED or basic HTML Canvas?
    // I'll stick to TYPED as default and simplest for now, with a stub for drawn.

    const handleConfirm = () => {
        if (!hasConsented) return;
        if (signatureType === 'TYPED' && !typedName.trim()) return;

        onConfirm({
            type: signatureType,
            data: signatureType === 'TYPED' ? typedName : "DRAWN_STUB" // Replace with base64 if canvas implemented
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                <FileCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white font-mono uppercase">Sign Document</h3>
                                <p className="text-zinc-500 text-sm font-mono">
                                    {docType === 'nda' ? 'Non-Disclosure Agreement' : docType}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Method Toggle */}
                        <div className="flex p-1 bg-zinc-800 rounded-lg w-fit">
                            <button
                                onClick={() => setSignatureType('TYPED')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${signatureType === 'TYPED' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-300'}`}
                            >
                                <Type size={16} /> Type Name
                            </button>
                            {/* 
                    <button 
                        onClick={() => setSignatureType('DRAWN')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${signatureType === 'DRAWN' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-300'}`}
                    >
                        <PenTool size={16} /> Draw
                    </button>
                    */}
                        </div>

                        {/* Input Area */}
                        <div className="space-y-4">
                            {signatureType === 'TYPED' ? (
                                <div>
                                    <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Legal Name</label>
                                    <input
                                        type="text"
                                        value={typedName}
                                        onChange={(e) => setTypedName(e.target.value)}
                                        placeholder="Enter your full legal name"
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-lg font-serif italic text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-zinc-700"
                                    />
                                    <p className="text-right text-xs text-zinc-500 mt-2 font-mono">Digitally signed as {typedName || '...'}</p>
                                </div>
                            ) : (
                                <div className="h-40 bg-zinc-950 border border-zinc-700 border-dashed rounded-lg flex items-center justify-center text-zinc-500">
                                    Drawing not implemented in this version
                                </div>
                            )}
                        </div>

                        {/* Consent */}
                        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                            <input
                                type="checkbox"
                                checked={hasConsented}
                                onChange={(e) => setHasConsented(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-600 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                            />
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                I hereby declare that I have read the document and verify that the information provided is correct.
                                I understand that this digital signature is legally binding.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-mono text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!hasConsented || (signatureType === 'TYPED' && !typedName) || signing}
                            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold font-mono text-sm shadow-lg shadow-cyan-900/20 flex items-center gap-2"
                        >
                            {signing ? 'Signing...' : 'Sign & Submit'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

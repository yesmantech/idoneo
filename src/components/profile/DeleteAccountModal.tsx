import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const isValid = confirmText === 'ELIMINA';

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onConfirm();
            setConfirmText('');
        }
    };

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header with warning icon */}
                <div className="pt-8 pb-4 px-6 text-center">
                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-5">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        Sei davvero sicuro di voler eliminare l'account?
                    </h2>

                    {/* Subtitle */}
                    <p className="text-[14px] text-slate-500">
                        Tutti i dati andranno persi per sempre.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6">
                    {/* Input instruction */}
                    <p className="text-[12px] text-slate-400 mb-2 text-center">
                        Digita <span className="font-bold text-rose-500">ELIMINA</span> per confermare
                    </p>

                    {/* Input field */}
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                        placeholder="ELIMINA"
                        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-center font-bold text-lg tracking-widest placeholder-slate-300 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 transition-all"
                        autoComplete="off"
                        autoFocus
                    />

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 mt-6">
                        {/* Cancel Button - Primary */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full py-4 rounded-2xl font-bold text-[15px] bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all active:scale-[0.98]"
                        >
                            Annulla
                        </button>

                        {/* Delete Button - Text style */}
                        <button
                            type="submit"
                            disabled={!isValid}
                            className={`w-full py-3 text-[14px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${isValid
                                    ? 'text-rose-500 hover:text-rose-600'
                                    : 'text-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            Elimina definitivamente
                        </button>
                    </div>
                </form>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    <X className="w-4 h-4 text-slate-500" />
                </button>
            </div>
        </div>
    );
}

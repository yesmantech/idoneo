import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useWindowHeight } from '@/hooks/useKeyboardHeight';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isDeleting?: boolean;
    error?: string | null;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting = false,
    error = null
}: DeleteAccountModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const keyboardHeight = useWindowHeight();
    const isValid = confirmText === 'ELIMINA';

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid && !isDeleting) {
            await onConfirm();
            setConfirmText('');
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setConfirmText('');
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal — centered, shifts up when iOS keyboard opens */}
            <div
                className="relative bg-[var(--card)] w-full max-w-sm rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 mx-4 overflow-y-auto"
                style={{
                    maxHeight: keyboardHeight > 0
                        ? `calc(100vh - ${keyboardHeight}px - 40px)`
                        : '90vh',
                    transform: keyboardHeight > 0
                        ? `translateY(-${keyboardHeight / 2}px)`
                        : undefined,
                    transition: 'transform 0.25s ease-out, max-height 0.25s ease-out',
                }}
            >

                {/* Close button */}
                {!isDeleting && (
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[var(--foreground)]/10 flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <X className="w-4 h-4 text-[var(--foreground)] opacity-50" />
                    </button>
                )}

                {/* Content */}
                <div className="pt-10 pb-4 px-6 text-center">
                    {/* Icon */}
                    <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5 ${isDeleting
                            ? 'bg-amber-500/15'
                            : 'bg-rose-500/15'
                        }`}>
                        {isDeleting ? (
                            <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                        ) : (
                            <AlertTriangle className="w-7 h-7 text-rose-400" />
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-[18px] font-bold text-[var(--foreground)] mb-2 leading-tight">
                        {isDeleting
                            ? 'Eliminazione in corso...'
                            : "Sei davvero sicuro di voler eliminare l'account?"
                        }
                    </h2>

                    {/* Subtitle */}
                    <p className="text-[14px] text-[var(--foreground)] opacity-40">
                        {isDeleting
                            ? 'Stiamo eliminando tutti i tuoi dati. Non chiudere questa finestra.'
                            : 'Tutti i dati andranno persi per sempre.'
                        }
                    </p>

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 p-3 bg-rose-500/10 rounded-xl">
                            <p className="text-[13px] text-rose-400 font-medium">
                                {error}
                            </p>
                        </div>
                    )}
                </div>

                {/* Form */}
                {!isDeleting && (
                    <form onSubmit={handleSubmit} className="px-6 pb-8">
                        {/* Input instruction */}
                        <p className="text-[12px] text-[var(--foreground)] opacity-30 mb-3 text-center">
                            Digita <span className="font-bold text-rose-400 opacity-100">ELIMINA</span> per confermare
                        </p>

                        {/* Input field — no autoFocus to avoid immediate keyboard on iOS */}
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            placeholder="ELIMINA"
                            className="w-full px-4 py-4 bg-[var(--background)] rounded-2xl text-center font-bold text-[16px] tracking-[0.2em] text-[var(--foreground)] placeholder-[var(--foreground)]/15 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
                            autoComplete="off"
                        />

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 mt-6">
                            {/* Cancel Button — primary, safe action */}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full py-4 rounded-2xl font-bold text-[15px] bg-[var(--foreground)]/10 text-[var(--foreground)] active:scale-[0.98] transition-all"
                            >
                                Annulla
                            </button>

                            {/* Delete Button — destructive, requires confirmation */}
                            <button
                                type="submit"
                                disabled={!isValid}
                                className={`w-full py-3 text-[14px] font-semibold transition-all flex items-center justify-center gap-1.5 rounded-2xl ${isValid
                                        ? 'text-rose-400 bg-rose-500/10 active:scale-[0.98]'
                                        : 'text-[var(--foreground)] opacity-15 cursor-not-allowed'
                                    }`}
                            >
                                <Trash2 className="w-4 h-4" />
                                Elimina
                            </button>
                        </div>
                    </form>
                )}

                {/* Loading state */}
                {isDeleting && (
                    <div className="px-6 pb-10">
                        <div className="w-full h-1.5 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

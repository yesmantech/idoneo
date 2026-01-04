import React, { useState } from 'react';

// ================== TYPES ==================

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    warning?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
}

// ================== MAIN COMPONENT ==================

export default function ConfirmDialog({
    open,
    onClose,
    title,
    description,
    warning,
    confirmLabel = 'Conferma',
    cancelLabel = 'Annulla',
    confirmVariant = 'default',
    onConfirm,
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Confirm action failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const confirmButtonClasses = confirmVariant === 'destructive'
        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 pb-4">
                    <h2
                        id="dialog-title"
                        className="text-lg font-bold text-[var(--foreground)]"
                    >
                        {title}
                    </h2>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                    <p className="text-[var(--foreground)] opacity-50 text-sm">
                        {description}
                    </p>

                    {warning && (
                        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                            <p className="text-rose-500 dark:text-rose-400 text-sm font-medium flex items-start gap-2">
                                <span>⚠️</span>
                                <span>{warning}</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-[var(--card-border)] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-3 text-sm font-medium text-[var(--foreground)] opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:opacity-100 rounded-lg transition-all disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`px-4 py-3 text-sm font-medium rounded-lg shadow-lg transition-all disabled:opacity-50 ${confirmButtonClasses}`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span>
                                <span>Attendere...</span>
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ================== HOOK ==================

interface UseConfirmDialogOptions {
    title: string;
    description: string;
    warning?: string;
    confirmLabel?: string;
    confirmVariant?: 'default' | 'destructive';
}

export function useConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<UseConfirmDialogOptions | null>(null);
    const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);

    const confirm = (opts: UseConfirmDialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(opts);
            setOnConfirmCallback(() => () => {
                resolve(true);
            });
            setIsOpen(true);
        });
    };

    const handleClose = () => {
        setIsOpen(false);
        setOptions(null);
        setOnConfirmCallback(null);
    };

    const handleConfirm = async () => {
        if (onConfirmCallback) {
            await onConfirmCallback();
        }
    };

    const DialogComponent = options ? (
        <ConfirmDialog
            open={isOpen}
            onClose={handleClose}
            title={options.title}
            description={options.description}
            warning={options.warning}
            confirmLabel={options.confirmLabel}
            confirmVariant={options.confirmVariant}
            onConfirm={handleConfirm}
        />
    ) : null;

    return { confirm, DialogComponent };
}

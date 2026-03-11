import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Smile, Star, RotateCcw, X } from 'lucide-react';
import { hapticLight } from '@/lib/haptics';
import { createPortal } from 'react-dom';

interface ProfileImageBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onChooseImage: () => void;
    onUseEmoji: () => void;
    onUseIcon: () => void;
    onRestoreDefault: () => void;
}

export default function ProfileImageBottomSheet({
    isOpen,
    onClose,
    onTakePhoto,
    onChooseImage,
    onUseEmoji,
    onUseIcon,
    onRestoreDefault,
}: ProfileImageBottomSheetProps) {

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — heavy blur, dark overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 z-[100]"
                        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' }}
                        onClick={() => { hapticLight(); onClose(); }}
                    />

                    {/* Floating Bottom Sheet — NOT full-width, rounded all corners */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
                        className="fixed z-[101] left-4 right-4"
                        style={{ bottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
                    >
                        <div
                            className="overflow-hidden"
                            style={{
                                backgroundColor: '#1C1C1E',
                                borderRadius: 24,
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-4">
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>
                                    Scegli Immagine
                                </h2>
                                <button
                                    onClick={() => { hapticLight(); onClose(); }}
                                    className="active:scale-90 transition-transform"
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        backgroundColor: '#3A3A3C',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: 'none',
                                    }}
                                >
                                    <X style={{ width: 16, height: 16, color: '#8E8E93' }} />
                                </button>
                            </div>

                            {/* Action Rows — each is a separate pill */}
                            <div className="flex flex-col gap-[6px] px-3 pb-4">

                                <ActionRow
                                    icon={<Camera style={{ width: 20, height: 20, color: '#fff' }} />}
                                    iconBg="#3A3A3C"
                                    label="Scatta Foto"
                                    onClick={() => { hapticLight(); onTakePhoto(); }}
                                />

                                <ActionRow
                                    icon={<ImageIcon style={{ width: 20, height: 20, color: '#fff' }} />}
                                    iconBg="#3A3A3C"
                                    label="Scegli dalla Galleria"
                                    onClick={() => { hapticLight(); onChooseImage(); }}
                                />

                                <ActionRow
                                    icon={<span style={{ fontSize: 22, lineHeight: 1 }}>😀</span>}
                                    iconBg="#FFB800"
                                    label="Usa Emoji"
                                    isHighlighted
                                    onClick={() => { hapticLight(); onUseEmoji(); }}
                                />

                                <ActionRow
                                    icon={<Star style={{ width: 20, height: 20, color: '#fff' }} />}
                                    iconBg="#3A3A3C"
                                    label="Usa Icona"
                                    onClick={() => { hapticLight(); onUseIcon(); }}
                                />

                                <ActionRow
                                    icon={<RotateCcw style={{ width: 20, height: 20, color: '#fff' }} />}
                                    iconBg="#3A3A3C"
                                    label="Ripristina Default"
                                    onClick={() => { hapticLight(); onRestoreDefault(); }}
                                />

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

/** Individual action row — pill-shaped with rounded bg */
function ActionRow({
    icon,
    iconBg,
    label,
    onClick,
    isHighlighted = false,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    onClick: () => void;
    isHighlighted?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className="active:scale-[0.97] transition-transform"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                padding: '12px 14px',
                borderRadius: 14,
                backgroundColor: '#2C2C2E',
                border: 'none',
                cursor: 'pointer',
            }}
        >
            <div
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                {label}
            </span>
        </button>
    );
}

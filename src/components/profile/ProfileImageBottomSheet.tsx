import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Smile, Star, Trash2, X } from 'lucide-react';
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
    activeCategory?: 'emoji' | 'icon' | 'image' | 'camera';
}

export default function ProfileImageBottomSheet({
    isOpen,
    onClose,
    onTakePhoto,
    onChooseImage,
    onUseEmoji,
    onUseIcon,
    onRestoreDefault,
    activeCategory = 'emoji' // Example default from video
}: ProfileImageBottomSheetProps) {

    // Mount state for portal
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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[25px]"
                        onClick={() => {
                            hapticLight();
                            onClose();
                        }}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1c1c1e] text-white rounded-t-[32px] overflow-hidden"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
                    >
                        {/* Drag Handle & Header */}
                        <div className="relative pt-4 pb-4 px-6 flex items-center justify-between border-b border-white/5">
                            {/* Drag Indicator */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-white/20" />

                            <h2 className="text-[18px] font-bold text-white mt-2">Select Icon</h2>
                            <button
                                onClick={() => {
                                    hapticLight();
                                    onClose();
                                }}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mt-2 active:scale-90 transition-transform"
                            >
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>

                        {/* Menu Options */}
                        <div className="px-4 py-2 flex flex-col gap-1 mb-4">

                            <MenuOption
                                icon={<Camera className="w-5 h-5 text-white" />}
                                label="Take Photo"
                                onClick={() => { hapticLight(); onTakePhoto(); }}
                            />

                            <MenuOption
                                icon={<ImageIcon className="w-5 h-5 text-white" />}
                                label="Choose Image"
                                onClick={() => { hapticLight(); onChooseImage(); }}
                            />

                            <MenuOption
                                icon={<Smile className="w-5 h-5 text-white" />}
                                label="Use Emoji"
                                isActive={activeCategory === 'emoji'}
                                onClick={() => { hapticLight(); onUseEmoji(); }}
                            />

                            <MenuOption
                                icon={<Star className="w-5 h-5 text-white" />}
                                label="Use Icon"
                                isActive={activeCategory === 'icon'}
                                onClick={() => { hapticLight(); onUseIcon(); }}
                            />

                            <MenuOption
                                icon={<Trash2 className="w-5 h-5 text-rose-500" />}
                                iconBg="bg-rose-500/10"
                                label="Restore Default"
                                titleColor="text-rose-500"
                                onClick={() => { hapticLight(); onRestoreDefault(); }}
                            />

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

function MenuOption({
    icon,
    label,
    onClick,
    isActive = false,
    iconBg = "bg-white/10",
    titleColor = "text-white"
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    iconBg?: string;
    titleColor?: string;
}) {
    // If active (like the Emoji option in the video), highlight the background
    const wrapperClasses = isActive
        ? "w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center" // Assuming brand yellow
        : `w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`;

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 px-4 py-3 active:bg-white/5 rounded-2xl transition-colors"
        >
            <div className={wrapperClasses}>
                {isActive ? (
                    // When active (brand yellow bg), icon should probably be dark/black for contrast
                    <div className="text-black [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-black">
                        {icon}
                    </div>
                ) : (
                    <div>{icon}</div>
                )}
            </div>
            <span className={`text-[16px] font-semibold ${titleColor}`}>{label}</span>
        </button>
    );
}

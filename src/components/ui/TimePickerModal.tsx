"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Play } from "lucide-react";
import ScrollPicker from "./ScrollPicker";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

interface TimePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    hours: number;
    minutes: number;
    seconds: number;
    onSave: (h: number, m: number, s: number) => void;
}

export default function TimePickerModal({ isOpen, onClose, hours, minutes, seconds, onSave }: TimePickerModalProps) {
    const [h, setH] = React.useState(hours);
    const [m, setM] = React.useState(minutes);
    const [s, setS] = React.useState(seconds);

    // Sync state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setH(hours);
            setM(minutes);
            setS(seconds);
        }
    }, [isOpen, hours, minutes, seconds]);

    const handleConfirm = () => {
        hapticSuccess();
        onSave(h, m, s);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content - Official Apple Clock Style */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
                        className="relative w-full max-w-[340px] rounded-[18px] overflow-hidden shadow-2xl"
                        style={{
                            background: "rgba(255, 255, 255, 0.7)",
                            backdropFilter: "blur(50px) saturate(180%)",
                            WebkitBackdropFilter: "blur(50px) saturate(180%)",
                            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4)"
                        }}
                    >
                        {/* Dark Mode Specifics */}
                        <div className="absolute inset-0 dark:bg-[#1C1C1E]/90 pointer-events-none -z-10" />

                        <div className="relative z-10 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-2">
                                <button
                                    onClick={onClose}
                                    className="text-[17px] font-normal text-[#007AFF] active:opacity-50 transition-opacity"
                                >
                                    Annulla
                                </button>

                                <h2 className="text-[17px] font-bold text-black dark:text-white">
                                    Durata
                                </h2 >

                                <button
                                    onClick={handleConfirm}
                                    className="text-[17px] font-bold text-[#007AFF] active:opacity-50 transition-opacity"
                                >
                                    Fatto
                                </button>
                            </div>

                            {/* Pickers Container */}
                            <div className="px-4 py-8 flex justify-center h-[240px] relative">
                                {/* Unified Highlight Bar */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] h-[34px] bg-black/[0.05] dark:bg-white/[0.08] rounded-[8px] pointer-events-none z-0" />

                                <div className="flex items-center justify-center h-full gap-0 relative z-10">
                                    <ScrollPicker
                                        label="ore"
                                        value={h}
                                        onChange={setH}
                                        items={Array.from({ length: 13 }, (_, i) => ({ label: i.toString(), value: i }))}
                                        height={200}
                                        itemHeight={44}
                                    />

                                    <ScrollPicker
                                        label="min"
                                        value={m}
                                        onChange={setM}
                                        items={Array.from({ length: 60 }, (_, i) => ({ label: i.toString(), value: i }))}
                                        height={200}
                                        itemHeight={44}
                                    />

                                    <ScrollPicker
                                        label="sec"
                                        value={s}
                                        onChange={setS}
                                        items={Array.from({ length: 60 }, (_, i) => ({ label: i.toString(), value: i }))}
                                        height={200}
                                        itemHeight={44}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

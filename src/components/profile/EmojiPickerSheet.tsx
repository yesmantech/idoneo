import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Pencil } from 'lucide-react';
import { hapticLight } from '@/lib/haptics';
import { createPortal } from 'react-dom';
import { EMOJI_CATEGORIES, EMOJI_KEYWORDS } from './emojiData';

// ─── Color palette (from the reference video — 24 colors, 6 columns) ───
const COLOR_PALETTE = [
    '#FF3B30', '#FF6482', '#FF2D92', '#AF52DE', '#5856D6', '#3634A3',
    '#007AFF', '#32ADE6', '#00C7BE', '#FF2D55', '#30D158', '#34C759',
    '#0066FF', '#5AC8FA', '#FFCC00', '#FF9500', '#FF6900', '#FF3B00',
    '#FF2D40', '#C4975A', '#8E6C4A', '#1C3A6B', '#3478F6', '#8E8E93',
];

interface EmojiPickerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (emoji: string, bgColor: string) => void;
    initialEmoji?: string;
    initialColor?: string;
}

export default function EmojiPickerSheet({
    isOpen,
    onClose,
    onSave,
    initialEmoji = '😀',
    initialColor = '#007AFF',
}: EmojiPickerSheetProps) {
    const [mounted, setMounted] = useState(false);
    const [view, setView] = useState<'grid' | 'editor'>('grid');
    const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setView('grid');
            setSearchQuery('');
            setSelectedEmoji(initialEmoji);
            setSelectedColor(initialColor);
        }
    }, [isOpen, initialEmoji, initialColor]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // All emojis flat for grid
    const allEmojis = useMemo(() => {
        return EMOJI_CATEGORIES.flatMap(c => c.emojis);
    }, []);

    // Filtered emojis — searches Italian keywords + category names
    const filteredEmojis = useMemo(() => {
        if (!searchQuery.trim()) return allEmojis;
        const q = searchQuery.toLowerCase().trim();
        const matched = new Set<string>();

        // 1. Match by Italian category name
        for (const cat of EMOJI_CATEGORIES) {
            if (cat.name.toLowerCase().includes(q)) {
                cat.emojis.forEach(e => matched.add(e));
            }
        }

        // 2. Match by individual emoji Italian keywords
        for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
            if (keywords.includes(q)) {
                matched.add(emoji);
            }
        }

        return matched.size > 0 ? Array.from(matched) : allEmojis;
    }, [searchQuery, allEmojis]);

    const handleEmojiSelect = useCallback((emoji: string) => {
        hapticLight();
        setSelectedEmoji(emoji);
        requestAnimationFrame(() => {
            setView('editor');
        });
    }, []);

    const handleSave = () => {
        hapticLight();
        onSave(selectedEmoji, selectedColor);
        onClose();
    };

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
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 z-[100]"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(25px)',
                            WebkitBackdropFilter: 'blur(25px)',
                        }}
                        onClick={() => { hapticLight(); onClose(); }}
                    />

                    {/* Floating Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
                        className="fixed z-[101] left-4 right-4"
                        style={{
                            bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
                            maxHeight: 'calc(100vh - 120px)',
                        }}
                    >
                        <div
                            className="flex flex-col"
                            style={{
                                backgroundColor: '#1C1C1E',
                                borderRadius: 24,
                                maxHeight: 'calc(100vh - 140px)',
                                overflow: 'hidden',
                            }}
                        >
                            <AnimatePresence initial={false} mode="wait">
                                {view === 'grid' ? (
                                    <motion.div
                                        key="grid"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex flex-col"
                                        style={{ maxHeight: 'calc(100vh - 140px)' }}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>
                                                Scegli un Emoji
                                            </h2>
                                            <button
                                                onClick={() => { hapticLight(); onClose(); }}
                                                className="active:scale-90 transition-transform"
                                                style={{
                                                    width: 30, height: 30, borderRadius: '50%',
                                                    backgroundColor: '#3A3A3C',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: 'none',
                                                }}
                                            >
                                                <X style={{ width: 16, height: 16, color: '#8E8E93' }} />
                                            </button>
                                        </div>

                                        {/* Search Bar */}
                                        <div className="px-3 pb-3 flex-shrink-0">
                                            <div
                                                className="flex items-center gap-2"
                                                style={{
                                                    backgroundColor: '#2C2C2E',
                                                    borderRadius: 12,
                                                    padding: '10px 14px',
                                                }}
                                            >
                                                <Search style={{ width: 18, height: 18, color: '#8E8E93', flexShrink: 0 }} />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Cerca Emoji"
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        outline: 'none',
                                                        color: '#fff',
                                                        fontSize: 16,
                                                        fontWeight: 400,
                                                    }}
                                                    className="placeholder:text-[#8E8E93]"
                                                />
                                            </div>
                                        </div>

                                        {/* Emoji Grid — 8 columns, scrollable */}
                                        <div
                                            ref={scrollRef}
                                            className="overflow-y-auto px-3 pb-4"
                                            style={{
                                                maxHeight: '50vh',
                                                WebkitOverflowScrolling: 'touch',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(8, 1fr)',
                                                    gap: 4,
                                                    paddingTop: 10,
                                                }}
                                            >
                                                {filteredEmojis.map((emoji, i) => (
                                                    <button
                                                        key={`${emoji}-${i}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEmojiSelect(emoji);
                                                        }}
                                                        className="active:scale-90 transition-transform"
                                                        style={{
                                                            width: '100%',
                                                            aspectRatio: '1',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 26,
                                                            borderRadius: 10,
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            padding: 2,
                                                            overflow: 'visible',
                                                            touchAction: 'manipulation',
                                                            WebkitTapHighlightColor: 'transparent',
                                                        }}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="editor"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex flex-col"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>
                                                Usa Emoji
                                            </h2>
                                            <button
                                                onClick={() => { hapticLight(); onClose(); }}
                                                className="active:scale-90 transition-transform"
                                                style={{
                                                    width: 30, height: 30, borderRadius: '50%',
                                                    backgroundColor: '#3A3A3C',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: 'none',
                                                }}
                                            >
                                                <X style={{ width: 16, height: 16, color: '#8E8E93' }} />
                                            </button>
                                        </div>

                                        {/* Preview Circle */}
                                        <div className="flex justify-center py-4 flex-shrink-0">
                                            <div className="relative">
                                                <motion.div
                                                    layout
                                                    style={{
                                                        width: 120,
                                                        height: 120,
                                                        borderRadius: '50%',
                                                        backgroundColor: selectedColor,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 56,
                                                    }}
                                                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                                >
                                                    {selectedEmoji}
                                                </motion.div>
                                                {/* Pencil edit button */}
                                                <button
                                                    onClick={() => { hapticLight(); setView('grid'); }}
                                                    className="active:scale-90 transition-transform"
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        right: -8,
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: '50%',
                                                        backgroundColor: '#3A3A3C',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '3px solid #1C1C1E',
                                                    }}
                                                >
                                                    <Pencil style={{ width: 14, height: 14, color: '#fff' }} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Color Palette — 6 columns grid */}
                                        <div className="px-5 pt-2 pb-4 flex-shrink-0">
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(6, 1fr)',
                                                    gap: 12,
                                                    justifyItems: 'center',
                                                }}
                                            >
                                                {COLOR_PALETTE.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => {
                                                            hapticLight();
                                                            setSelectedColor(color);
                                                        }}
                                                        className="active:scale-90 transition-transform"
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            backgroundColor: color,
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: 0,
                                                        }}
                                                    >
                                                        {/* White inner ring when selected */}
                                                        {selectedColor === color && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                                                                style={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: '50%',
                                                                    border: '2.5px solid rgba(255,255,255,0.95)',
                                                                    backgroundColor: 'transparent',
                                                                }}
                                                            />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Save Button — white pill */}
                                        <div className="px-4 pb-5 flex-shrink-0">
                                            <button
                                                onClick={handleSave}
                                                className="active:scale-[0.97] transition-transform"
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 0',
                                                    borderRadius: 14,
                                                    backgroundColor: '#fff',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: 17,
                                                    fontWeight: 700,
                                                    color: '#000',
                                                    letterSpacing: -0.3,
                                                }}
                                            >
                                                Salva
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

import React, { useEffect, useState } from 'react';
import { X, Sun, Moon, Smartphone } from 'lucide-react';

interface ThemeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: 'light' | 'dark' | 'system';
    onSelectTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export default function ThemeSelectorModal({
    isOpen,
    onClose,
    currentTheme,
    onSelectTheme
}: ThemeSelectorModalProps) {
    const [selected, setSelected] = useState(currentTheme);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setSelected(currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelect = (id: 'light' | 'dark' | 'system') => {
        setSelected(id);
        onSelectTheme(id);
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    const themes = [
        { id: 'system' as const, label: 'System', icon: <Smartphone className="w-[22px] h-[22px]" strokeWidth={2} /> },
        { id: 'light' as const, label: 'Light', icon: <Sun className="w-[22px] h-[22px]" strokeWidth={2} /> },
        { id: 'dark' as const, label: 'Dark', icon: <Moon className="w-[22px] h-[22px]" strokeWidth={2} /> },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 transition-colors duration-300"
                style={{ backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)' }}
                onClick={handleClose}
            />

            {/* Floating Bottom Sheet */}
            <div
                className="relative w-full max-w-[400px] transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(120%) scale(0.95)',
                }}
            >
                <div
                    className="rounded-[32px] overflow-hidden backdrop-blur-3xl border border-white/10 shadow-2xl"
                    style={{ backgroundColor: '#1C1C1E' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-2">
                        <h2 className="text-[17px] font-bold text-white tracking-wide">Appearance</h2>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2C2C2E] active:scale-95 transition-transform"
                        >
                            <X className="w-4 h-4 text-white/60" strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="w-full h-[1px] bg-white/[0.05] mx-6 w-[calc(100%-48px)] my-2" />

                    {/* Theme Grid */}
                    <div className="flex gap-3 px-6 pb-8 pt-2">
                        {themes.map(({ id, label, icon }) => {
                            const isActive = selected === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleSelect(id)}
                                    className="flex-1 flex flex-col items-center justify-center gap-3 rounded-[24px] transition-all duration-200 active:scale-[0.98]"
                                    style={{
                                        aspectRatio: '1 / 1.3',
                                        backgroundColor: isActive ? '#2C2C2E' : '#2C2C2E',
                                        border: isActive ? '2px solid white' : '2px solid transparent',
                                        opacity: isActive ? 1 : 0.8
                                    }}
                                >
                                    <span className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/50'}`}>
                                        {icon}
                                    </span>
                                    <span className={`text-[13px] font-semibold transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/50'}`}>
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

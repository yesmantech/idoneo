import React, { useEffect, useState } from 'react';
import { X, Sun, Moon } from 'lucide-react';

interface ThemeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: 'light' | 'dark' | 'system';
    onSelectTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/* System icon — smartphone with vertical split line */
const SystemIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <line x1="12" y1="5" x2="12" y2="19" />
    </svg>
);

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
            // Small delay to trigger CSS transition
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
        { id: 'system' as const, label: 'System', icon: <SystemIcon className="w-6 h-6" /> },
        { id: 'light' as const, label: 'Light', icon: <Sun className="w-6 h-6" strokeWidth={1.5} /> },
        { id: 'dark' as const, label: 'Dark', icon: <Moon className="w-6 h-6" strokeWidth={1.5} /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 transition-colors duration-300"
                style={{ backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)' }}
                onClick={handleClose}
            />

            {/* Bottom Sheet */}
            <div
                className="relative w-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                    transform: visible ? 'translateY(0)' : 'translateY(100%)',
                    maxWidth: '500px',
                }}
            >
                <div
                    style={{ backgroundColor: '#2C2C2E' }}
                    className="rounded-t-[20px] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4">
                        <h2 className="text-[20px] font-bold text-white">Appearance</h2>
                        <button
                            onClick={handleClose}
                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                            <X className="w-3.5 h-3.5 text-white/60" strokeWidth={3} />
                        </button>
                    </div>

                    {/* Theme Grid — 3 equal square buttons */}
                    <div className="grid grid-cols-3 gap-2.5 px-5 pb-8 pt-1">
                        {themes.map(({ id, label, icon }) => {
                            const isActive = selected === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleSelect(id)}
                                    className="flex flex-col items-center justify-center gap-2.5 rounded-[16px] transition-all duration-200 active:scale-[0.96]"
                                    style={{
                                        aspectRatio: '1 / 1.15',
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                                        border: isActive ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                                    }}
                                >
                                    <span className={`transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/50'}`}>
                                        {icon}
                                    </span>
                                    <span className={`text-[14px] font-semibold transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/50'}`}>
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

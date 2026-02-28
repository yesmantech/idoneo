import React, { useEffect, useState } from 'react';
import { X, Sun, Moon } from 'lucide-react';

interface ThemeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: 'light' | 'dark' | 'system';
    onSelectTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Custom SVG for the System icon (a smartphone with a split half)
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
        <rect x="5" y="2" width="14" height="20" rx="4" />
        <path d="M12 2v20" />
    </svg>
);

// Light Icon matching exactly the thin stroke style
const LightIcon = ({ className }: { className?: string }) => (
    <Sun className={className} strokeWidth={1.5} />
);

// Dark Icon matching exactly the thin stroke style
const DarkIcon = ({ className }: { className?: string }) => (
    <Moon className={className} strokeWidth={1.5} />
);

export default function ThemeSelectorModal({
    isOpen,
    onClose,
    currentTheme,
    onSelectTheme
}: ThemeSelectorModalProps) {
    const [themeState, setThemeState] = useState(currentTheme);

    useEffect(() => {
        setThemeState(currentTheme);
    }, [currentTheme]);

    if (!isOpen) return null;

    const themes = [
        { id: 'system', label: 'System', Icon: SystemIcon },
        { id: 'light', label: 'Light', Icon: LightIcon },
        { id: 'dark', label: 'Dark', Icon: DarkIcon },
    ] as const;

    const handleSelect = (id: 'light' | 'dark' | 'system') => {
        setThemeState(id);
        onSelectTheme(id);
        // We do *not* automatically close to match the reference behavior 
        // where it instantly applies the theme but leaves the picker open 
        // to let the user see the transition.
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 ease-out"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div
                className="relative w-full max-w-md bg-[#1c1c1e] rounded-t-[28px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full fade-in duration-[400ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Row */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">Appearance</h2>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/[0.08] hover:bg-white/[0.12] transition-colors active:scale-95"
                    >
                        <X className="w-4 h-4 text-white/50" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Subtle divider line under header */}
                <div className="h-[1px] w-full bg-white/[0.06]" />

                {/* Theme Selector Grid */}
                <div className="grid grid-cols-3 gap-3 p-6 pt-5 pb-8">
                    {themes.map(({ id, label, Icon }) => {
                        const isActive = themeState === id;
                        return (
                            <button
                                key={id}
                                onClick={() => handleSelect(id)}
                                className={`flex flex-col items-center justify-center gap-3 w-full aspect-[4/5] rounded-[20px] transition-all duration-200 active:scale-95 ${isActive
                                    ? 'bg-white/[0.12] ring-2 ring-white shadow-lg'
                                    : 'bg-white/[0.05] hover:bg-white/[0.08] ring-0 ring-transparent'
                                    }`}
                            >
                                <Icon
                                    className={`w-7 h-7 mb-1 transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/60'
                                        }`}
                                />
                                <span
                                    className={`text-[15px] font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/60'
                                        }`}
                                >
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

import React from "react";

export default function SearchSection() {
    return (
        <div className="w-full space-y-4">
            {/* Category Pills - Airy and Rounded */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { icon: '🏛️', label: 'Tutti' },
                    { icon: '👮', label: 'Forze Armate' },
                    { icon: '🏥', label: 'Sanità' },
                    { icon: '💼', label: 'Amministrativi' },
                    { icon: '🎓', label: 'Enti Locali' },
                ].map((item, idx) => (
                    <button
                        key={item.label}
                        className={`flex items-center gap-2 px-5 py-3 rounded-pill text-sm font-semibold transition-all whitespace-nowrap ${idx === 0
                            ? 'bg-brand-cyan text-white shadow-md hover:bg-brand-cyan/90'
                            : 'bg-white text-text-secondary hover:text-text-primary hover:bg-canvas-light border border-canvas-light'
                            }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Search Input - Family Style Filled Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg
                        className="w-5 h-5 text-text-tertiary group-focus-within:text-brand-cyan transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Cerca concorso..."
                    className="w-full h-14 pl-14 pr-5 rounded-input bg-canvas-light border-0 text-text-primary placeholder-text-tertiary text-base font-medium 
                               focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:bg-white transition-all"
                />
            </div>
        </div>
    );
}

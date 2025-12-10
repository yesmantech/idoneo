import React from "react";

export default function SearchSection() {
    return (
        <div className="w-full">
            {/* Toolbar Container - Matches Shuffle's compact bar */}
            <div className="bg-slate-900 rounded-xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-lg">

                {/* Left: Navigation Chips (Lobby style) */}
                <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide px-2 md:px-0">
                    {[
                        { icon: '🏛️', label: 'Tutti' },
                        { icon: '👮', label: 'Forze Armate' },
                        { icon: '🏥', label: 'Sanità' },
                        { icon: '💼', label: 'Amministrativi' },
                        { icon: '🎓', label: 'Enti Locali' },
                    ].map((item, idx) => (
                        <button
                            key={item.label}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${idx === 0
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right: Search Input */}
                <div className="w-full md:flex-1 flex justify-end">
                    <div className="relative w-full md:max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cerca concorso..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 transition-all font-medium"
                        />
                        {/* Cmd+K hint could go here */}
                    </div>
                </div>
            </div>
        </div>
    );
}

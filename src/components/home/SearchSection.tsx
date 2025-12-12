import React, { useState } from "react";
import { Search } from "lucide-react";

export default function SearchSection() {
    const [activeCategory, setActiveCategory] = useState('Tutti');

    const categories = [
        { icon: '🏛️', label: 'Tutti' },
        { icon: '👮', label: 'Forze Armate' },
        { icon: '🏥', label: 'Sanità' },
        { icon: '💼', label: 'Amministrativi' },
        { icon: '🎓', label: 'Enti Locali' },
    ];

    return (
        <div className="w-full space-y-4">
            {/* Search Input - New Style */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Cerca concorso..."
                    className="w-full h-14 pl-14 pr-5 rounded-2xl bg-[#F5F5F5] 
                               text-slate-900 placeholder:text-slate-400 text-[17px] font-medium
                               focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 focus:bg-white 
                               transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                />
            </div>

            {/* Category Pills - New Rounded Style */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {categories.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => setActiveCategory(item.label)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold 
                                    transition-all whitespace-nowrap shrink-0
                                    ${activeCategory === item.label
                                ? 'bg-[#00B1FF] text-white shadow-lg shadow-[#00B1FF]/20'
                                : 'bg-[#F5F5F5] text-[#6B6B6B] hover:bg-slate-200'
                            }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}


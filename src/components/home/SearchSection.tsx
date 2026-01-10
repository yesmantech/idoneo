import React from "react";
import { Search, Command } from "lucide-react";
import { useSpotlight } from "@/context/SpotlightContext";
import { hapticLight } from "@/lib/haptics";
import { analytics } from "@/lib/analytics";

// ============================================
// SEARCH SECTION - Spotlight Trigger
// Simple trigger that opens the global SpotlightModal
// ============================================

interface SearchSectionProps {
    items?: any[]; // Kept for backward compatibility, actual items loaded in SpotlightModal
}

export default function SearchSection({ items = [] }: SearchSectionProps) {
    const { open } = useSpotlight();

    const handleClick = () => {
        hapticLight();
        analytics.track('search_used', { context: 'homepage_trigger' });
        open();
    };

    return (
        <div className="w-full" data-onboarding="search">
            {/* Search Bar Trigger */}
            <div
                onClick={handleClick}
                className="relative cursor-pointer group"
            >
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-5 lg:pl-6 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 group-hover:text-[#00B1FF] transition-colors" />
                </div>

                {/* Fake Input */}
                <div className="w-full h-[52px] lg:h-[60px] pl-14 lg:pl-16 pr-5 bg-[var(--card)] 
                               text-[15px] lg:text-base font-medium text-[var(--foreground)] opacity-50 flex items-center
                               shadow-soft border border-[var(--card-border)] rounded-[26px] lg:rounded-[30px]
                               group-hover:border-[#00B1FF]/30 group-hover:shadow-lg group-hover:shadow-[#00B1FF]/5 transition-all duration-200">
                    Cerca concorso...
                </div>

                {/* Keyboard Shortcut Hint (Desktop only) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight group-hover:border-[#00B1FF]/20 group-hover:bg-[#00B1FF]/5 transition-all">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                </div>
            </div>
        </div>
    );
}


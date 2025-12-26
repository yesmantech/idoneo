import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { SearchItem } from "@/lib/data";

interface SearchSectionProps {
    items?: SearchItem[];
}

export default function SearchSection({ items = [] }: SearchSectionProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (val.trim().length > 0) {
            const lower = val.toLowerCase().trim();
            const matches = items.filter(c => c.title.toLowerCase().includes(lower)).slice(0, 5);
            setSuggestions(matches);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        if (suggestions.length > 0) {
            navigate(suggestions[0].url);
            return;
        }
        const match = items.find(c => c.title.toLowerCase().includes(query.toLowerCase().trim()));
        if (match) navigate(match.url);
        else navigate(`/concorsi/tutti?search=${encodeURIComponent(query)}`);
    };

    const handleSelectSuggestion = (url: string) => {
        navigate(url);
        setShowSuggestions(false);
    };

    return (
        <div className="w-full flex flex-col gap-4" ref={wrapperRef}>
            {/* Search Input */}
            <div className="relative w-full z-50">
                <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 lg:pl-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cerca concorso..."
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => {
                            if (query.trim().length > 0) setShowSuggestions(true);
                        }}
                        className="w-full h-[52px] lg:h-[60px] pl-14 lg:pl-16 pr-5 bg-white 
                                   text-[15px] lg:text-base font-medium text-slate-900 placeholder:text-slate-400
                                   focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50
                                   transition-all shadow-sm border border-slate-100 rounded-[26px] lg:rounded-[30px]"
                    />
                </form>

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 
                                    rounded-[24px] lg:rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 lg:p-3 space-y-1">
                            <div className="px-4 py-2 text-[10px] lg:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                                Risultati
                            </div>

                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.id}
                                    onClick={() => handleSelectSuggestion(suggestion.url)}
                                    className="w-full text-left px-4 py-3 lg:py-4 rounded-[16px] lg:rounded-[20px] hover:bg-slate-50 flex items-center gap-3 lg:gap-4 transition-colors group"
                                >
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center flex-shrink-0 text-xs lg:text-sm font-black text-slate-400 group-hover:text-[#00B1FF] group-hover:border-[#00B1FF]/20 transition-colors">
                                        {suggestion.title.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[14px] lg:text-[16px] font-bold text-slate-700 group-hover:text-slate-900 truncate transition-colors">
                                            {suggestion.title}
                                        </div>
                                        <div className="text-[10px] lg:text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                                            {suggestion.type === 'category' ? 'Categoria' : 'Concorso'}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#00B1FF]/10 flex items-center justify-center">
                                            <Search className="w-4 h-4 lg:w-5 lg:h-5 text-[#00B1FF]" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

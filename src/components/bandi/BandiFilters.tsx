import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    SlidersHorizontal,
    X,
    Check,
    ChevronDown,
    MapPin,
    Briefcase,
    Euro,
    Building2,
    GraduationCap,
    Globe
} from 'lucide-react';
import {
    BandiFilters,
    ITALIAN_REGIONS,
    EDUCATION_LEVELS,
    CONTRACT_TYPES,
    BandiCategory,
    fetchBandiCategories
} from '@/lib/bandiService';

interface BandiFiltersProps {
    filters: BandiFilters;
    onFiltersChange: (filters: BandiFilters) => void;
    totalResults?: number;
}

export default function BandiFiltersBar({ filters, onFiltersChange, totalResults }: BandiFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [categories, setCategories] = useState<BandiCategory[]>([]);

    // Internal state for search bar inputs
    const [keyword, setKeyword] = useState(filters.search || '');
    const [location, setLocation] = useState(filters.province || '');

    useEffect(() => {
        fetchBandiCategories().then(setCategories);
    }, []);

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (keyword !== filters.search || location !== filters.province) {
                onFiltersChange({
                    ...filters,
                    search: keyword || undefined,
                    province: location || undefined,
                    offset: 0
                });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword, location]);

    const activeFiltersCount = [
        filters.categories?.length,
        filters.regions?.length,
        filters.status !== 'all' ? 1 : 0,
        filters.educationLevel?.length,
        filters.contractType?.length,
        filters.isRemote ? 1 : 0,
        filters.minSeats,
        filters.salaryMin
    ].reduce((a, b) => (a || 0) + (b || 0), 0);

    return (
        <div className="space-y-4">
            {/* TIER S SEARCH BAR */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                    // Force immediate search (bypass debounce if needed, though state is already synced)
                    onFiltersChange({
                        ...filters,
                        search: keyword || undefined,
                        province: location || undefined,
                        offset: 0
                    });
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 p-2 flex flex-col md:flex-row gap-2 relative z-20"
            >

                {/* Keyword Input */}
                <div className="flex-1 relative group">
                    <button
                        type="submit"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-focus-within:text-brand-blue group-focus-within:bg-brand-blue/10 dark:group-focus-within:bg-brand-blue/20 transition-all hover:bg-brand-blue hover:text-white"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Cosa cerchi? (es. Amministrativo)"
                        className="w-full pl-14 pr-4 py-3 bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                    />
                </div>

                {/* Divider (Desktop) */}
                <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-700 my-2" />

                {/* Location Input */}
                <div className="flex-1 relative group md:max-w-[30%]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-focus-within:text-brand-blue group-focus-within:bg-brand-blue/10 dark:group-focus-within:bg-brand-blue/20 transition-all">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Dove? (Città o Provincia)"
                        className="w-full pl-14 pr-4 py-3 bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                    />
                </div>

                {/* Filter Button */}
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAdvanced(true)}
                    className={`
                        md:w-auto w-full px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                        ${activeFiltersCount > 0
                            ? 'bg-brand-blue text-white shadow-brand-blue/30 shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}
                    `}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden md:inline">Filtri</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {activeFiltersCount}
                        </span>
                    )}
                </motion.button>
            </form>

            {/* Result Stats & Sort (moved outside) */}
            <div className="flex items-center justify-between px-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {totalResults !== undefined ? `${totalResults} risultati` : 'Caricamento...'}
                </span>

                <SortDropdown
                    value={filters.sortBy || 'deadline'}
                    onChange={(v) => onFiltersChange({ ...filters, sortBy: v, offset: 0 })}
                />
            </div>

            {/* Advanced Filters Modal (Mega Menu) */}
            <AnimatePresence>
                {showAdvanced && (
                    <TierSFilterModal
                        filters={filters}
                        categories={categories}
                        onFiltersChange={onFiltersChange}
                        onClose={() => setShowAdvanced(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================
// SORT DROPDOWN
// ============================================

function SortDropdown({ value, onChange }: { value: string; onChange: (v: any) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                Ordina per: <span className="text-slate-900 dark:text-white">
                    {value === 'deadline' && 'Scadenza'}
                    {value === 'newest' && 'Più recenti'}
                    {value === 'seats' && 'Numero posti'}
                    {value === 'relevance' && 'Rilevanza'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 origin-top-right"
                        >
                            {[
                                { val: 'deadline', label: 'In scadenza' },
                                { val: 'newest', label: 'Più recenti' },
                                { val: 'seats', label: 'Più posti' }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => { onChange(opt.val); setOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between ${value === opt.val
                                        ? 'bg-slate-50 dark:bg-slate-800 text-emerald-500 font-medium'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {opt.label}
                                    {value === opt.val && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================
// TIER S FILTER MODAL
// ============================================

function TierSFilterModal({
    filters,
    categories,
    onFiltersChange,
    onClose
}: {
    filters: BandiFilters;
    categories: BandiCategory[];
    onFiltersChange: (f: BandiFilters) => void;
    onClose: () => void;
}) {
    const [local, setLocal] = useState(filters);

    const toggle = (key: keyof BandiFilters, val: any) => {
        const current = (local[key] as any[]) || [];
        const updated = current.includes(val)
            ? current.filter(x => x !== val)
            : [...current, val];
        setLocal({ ...local, [key]: updated.length ? updated : undefined });
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Sheet */}
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative ml-auto w-full md:w-[500px] h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pt-[max(1.5rem,env(safe-area-inset-top))] border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Filtri Avanzati</h2>
                        <p className="text-sm text-slate-500">Affina la tua ricerca</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pb-8 space-y-8">

                    {/* Categories (Grid) */}
                    <Section title="Categoria" icon={<Briefcase className="w-4 h-4" />}>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map(cat => (
                                <FilterCheckbox
                                    key={cat.id}
                                    label={cat.name}
                                    icon={cat.icon}
                                    checked={local.categories?.includes(cat.id)}
                                    onChange={() => toggle('categories', cat.id)}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Regions (Chips) */}
                    <Section title="Regione" icon={<MapPin className="w-4 h-4" />}>
                        <div className="flex flex-wrap gap-2">
                            {ITALIAN_REGIONS.map(reg => (
                                <FilterChip
                                    key={reg}
                                    label={reg}
                                    active={local.regions?.includes(reg)}
                                    onClick={() => toggle('regions', reg)}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Education */}
                    <Section title="Titolo di Studio" icon={<GraduationCap className="w-4 h-4" />}>
                        <div className="space-y-2">
                            {EDUCATION_LEVELS.map(lvl => (
                                <FilterCheckbox
                                    key={lvl.value}
                                    label={lvl.label}
                                    checked={local.educationLevel?.includes(lvl.value)}
                                    onChange={() => toggle('educationLevel', lvl.value)}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Contract Type */}
                    <Section title="Contratto" icon={<Building2 className="w-4 h-4" />}>
                        <div className="space-y-2">
                            {CONTRACT_TYPES.map(type => (
                                <FilterCheckbox
                                    key={type.value}
                                    label={type.label}
                                    checked={local.contractType?.includes(type.value)}
                                    onChange={() => toggle('contractType', type.value)}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Other Toggles */}
                    <Section title="Altre opzioni" icon={<SlidersHorizontal className="w-4 h-4" />}>
                        <div className="space-y-3">
                            <ToggleRow
                                label="Lavoro da remoto / Smart working"
                                icon={<Globe className="w-4 h-4 text-emerald-500" />}
                                checked={!!local.isRemote}
                                onChange={() => setLocal({ ...local, isRemote: !local.isRemote ? true : undefined })}
                            />
                            <div className="pt-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                                    Numero posti minimo: {local.minSeats || 0}
                                </label>
                                <input
                                    type="range" min="0" max="100" step="1"
                                    value={local.minSeats || 0}
                                    onChange={(e) => setLocal({ ...local, minSeats: parseInt(e.target.value) || undefined })}
                                    className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </Section>

                </div>

                {/* Footer Actions */}
                <div className="p-6 pb-28 border-t border-slate-100 dark:border-slate-800 safe-area-bottom bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                onFiltersChange({
                                    sortBy: 'deadline',
                                    limit: 20,
                                    offset: 0
                                });
                                onClose();
                            }}
                            className="flex-1 py-3 text-slate-500 font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => {
                                onFiltersChange({ ...local, offset: 0 });
                                onClose();
                            }}
                            className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                        >
                            Applica Filtri
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// ============================================
// COMPONENTS
// ============================================

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
                {icon}
                <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
            </div>
            {children}
        </div>
    );
}

function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${active
                ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
        >
            {label}
        </button>
    );
}

function FilterCheckbox({ label, icon, checked, onChange }: { label: string; icon?: string; checked?: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${checked
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
        >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                {checked && <Check className="w-3 h-3" />}
            </div>
            {icon && <span className="text-lg">{icon}</span>}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}

function ToggleRow({ label, icon, checked, onChange }: { label: string; icon: React.ReactNode; checked: boolean; onChange: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
            </div>
            <button
                onClick={onChange}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

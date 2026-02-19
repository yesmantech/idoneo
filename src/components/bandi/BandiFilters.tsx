import React, { useState, useEffect } from 'react';
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
    Building2,
    GraduationCap,
    Globe,
    Sparkles,
    Users,
    RotateCcw
} from 'lucide-react';
import { hapticLight, hapticSuccess, hapticSelection } from '@/lib/haptics';
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
    const [keyword, setKeyword] = useState(filters.search || '');
    const [location, setLocation] = useState(filters.province || '');

    useEffect(() => {
        fetchBandiCategories().then(setCategories);
    }, []);

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
                    onFiltersChange({
                        ...filters,
                        search: keyword || undefined,
                        province: location || undefined,
                        offset: 0
                    });
                }}
                className="bg-[var(--card)] rounded-[28px] shadow-soft border border-[var(--card-border)] p-2 flex flex-col md:flex-row gap-2 relative z-20"
            >
                {/* Keyword Input */}
                <div className="flex-1 relative group">
                    <button
                        type="submit"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-focus-within:text-brand-blue group-focus-within:bg-brand-blue/10 dark:group-focus-within:bg-brand-blue/20 transition-all hover:bg-brand-blue hover:text-white"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Cosa cerchi? (es. Amministrativo)"
                        className="w-full pl-14 pr-4 py-3.5 bg-transparent border-0 focus:ring-0 text-[var(--foreground)] placeholder:text-slate-400/70 font-medium text-[15px]"
                    />
                </div>

                {/* Divider (Desktop) */}
                <div className="hidden md:block w-px bg-[var(--card-border)] my-2" />

                {/* Location Input */}
                <div className="flex-1 relative group md:max-w-[30%]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-focus-within:text-brand-blue group-focus-within:bg-brand-blue/10 dark:group-focus-within:bg-brand-blue/20 transition-all">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Dove? (Città o Provincia)"
                        className="w-full pl-14 pr-4 py-3.5 bg-transparent border-0 focus:ring-0 text-[var(--foreground)] placeholder:text-slate-400/70 font-medium text-[15px]"
                    />
                </div>

                {/* Filter Button */}
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        hapticLight();
                        setShowAdvanced(true);
                    }}
                    className={`
                        md:w-auto w-full px-6 py-3.5 rounded-[22px] font-bold flex items-center justify-center gap-2.5 transition-all text-[14px]
                        ${activeFiltersCount > 0
                            ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-lg shadow-brand-blue/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}
                    `}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden md:inline">Filtri</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-white/25 px-2 py-0.5 rounded-full text-[11px] font-black">
                            {activeFiltersCount}
                        </span>
                    )}
                </motion.button>
            </form>

            {/* Result Stats & Sort */}
            <div className="flex items-center justify-between px-2">
                <span className="text-[13px] font-semibold text-slate-400">
                    {totalResults !== undefined ? `${totalResults} risultati` : 'Caricamento...'}
                </span>
                <SortDropdown
                    value={filters.sortBy || 'relevance'}
                    onChange={(v) => onFiltersChange({ ...filters, sortBy: v, offset: 0 })}
                />
            </div>

            {/* Advanced Filters Modal */}
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
// SORT DROPDOWN - Tier S
// ============================================

function SortDropdown({ value, onChange }: { value: string; onChange: (v: any) => void }) {
    const [open, setOpen] = useState(false);

    const options = [
        { val: 'relevance', label: 'Più rilevanti' },
        { val: 'deadline', label: 'In scadenza' },
        { val: 'newest', label: 'Più recenti' },
        { val: 'seats', label: 'Più posti' }
    ];

    const current = options.find(o => o.val === value);

    return (
        <div className="relative">
            <button
                onClick={() => {
                    hapticLight();
                    setOpen(!open);
                }}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-400 hover:text-[var(--foreground)] transition-colors"
            >
                Ordina per: <span className="text-[var(--foreground)]">{current?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] rounded-[20px] shadow-xl border border-[var(--card-border)] overflow-hidden z-50 origin-top-right p-1.5"
                        >
                            {options.map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => {
                                        hapticSelection();
                                        onChange(opt.val);
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-[13px] font-semibold flex items-center justify-between rounded-[14px] transition-all ${value === opt.val
                                        ? 'bg-brand-blue/10 text-brand-blue'
                                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
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
// TIER S FILTER MODAL - Full Redesign
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

    const activeCount = [
        local.categories?.length,
        local.regions?.length,
        local.educationLevel?.length,
        local.contractType?.length,
        local.isRemote ? 1 : 0,
        local.minSeats ? 1 : 0,
    ].reduce((a, b) => (a || 0) + (b || 0), 0);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-lg bg-[var(--background)] rounded-t-[40px] shadow-2xl flex flex-col"
                style={{ maxHeight: '92vh' }}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-2 pb-4">
                    <div>
                        <h2 className="text-[22px] font-black text-[var(--foreground)] tracking-tight">Filtri Avanzati</h2>
                        <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Affina la tua ricerca</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">

                    {/* Categories */}
                    <FilterSection title="Categoria" icon={<Briefcase className="w-4 h-4" />}>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map(cat => (
                                <TierSCheckbox
                                    key={cat.id}
                                    label={cat.name}
                                    emoji={cat.icon}
                                    checked={local.categories?.includes(cat.id)}
                                    onChange={() => toggle('categories', cat.id)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Regions */}
                    <FilterSection title="Regione" icon={<MapPin className="w-4 h-4" />}>
                        <div className="flex flex-wrap gap-2">
                            {ITALIAN_REGIONS.map(reg => (
                                <TierSChip
                                    key={reg}
                                    label={reg}
                                    active={local.regions?.includes(reg)}
                                    onClick={() => toggle('regions', reg)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Education Level */}
                    <FilterSection title="Titolo di Studio" icon={<GraduationCap className="w-4 h-4" />}>
                        <div className="space-y-2">
                            {EDUCATION_LEVELS.map(lvl => (
                                <TierSCheckbox
                                    key={lvl.value}
                                    label={lvl.label}
                                    checked={local.educationLevel?.includes(lvl.value)}
                                    onChange={() => toggle('educationLevel', lvl.value)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Contract Type */}
                    <FilterSection title="Contratto" icon={<Building2 className="w-4 h-4" />}>
                        <div className="space-y-2">
                            {CONTRACT_TYPES.map(type => (
                                <TierSCheckbox
                                    key={type.value}
                                    label={type.label}
                                    checked={local.contractType?.includes(type.value)}
                                    onChange={() => toggle('contractType', type.value)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Other Options */}
                    <FilterSection title="Altre Opzioni" icon={<Sparkles className="w-4 h-4" />}>
                        <div className="space-y-3">
                            {/* Remote Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-[20px] bg-[var(--card)] border border-[var(--card-border)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[14px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-[var(--foreground)] tracking-tight">Smart Working</div>
                                        <div className="text-[11px] font-medium text-slate-400">Lavoro da remoto</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        hapticSelection();
                                        setLocal({ ...local, isRemote: !local.isRemote ? true : undefined });
                                    }}
                                    className={`w-14 h-8 rounded-full transition-all duration-300 relative ${local.isRemote ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                >
                                    <motion.div
                                        animate={{ x: local.isRemote ? 24 : 4 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
                                    />
                                </button>
                            </div>

                            {/* Min Seats Slider */}
                            <div className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--card-border)]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-[14px] bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[14px] font-bold text-[var(--foreground)] tracking-tight">Posti Minimi</div>
                                            <div className="text-[11px] font-medium text-slate-400">Numero minimo disponibili</div>
                                        </div>
                                    </div>
                                    <div className="bg-brand-blue/10 text-brand-blue text-[14px] font-black px-3 py-1 rounded-xl">
                                        {local.minSeats || 0}
                                    </div>
                                </div>
                                <input
                                    type="range" min="0" max="500" step="5"
                                    value={local.minSeats || 0}
                                    onChange={(e) => setLocal({ ...local, minSeats: parseInt(e.target.value) || undefined })}
                                    className="w-full accent-brand-blue h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span>0</span>
                                    <span>100</span>
                                    <span>250</span>
                                    <span>500</span>
                                </div>
                            </div>
                        </div>
                    </FilterSection>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-[var(--card-border)] bg-[var(--background)]">
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                hapticLight();
                                onFiltersChange({
                                    sortBy: 'relevance',
                                    limit: 20,
                                    offset: 0
                                });
                                onClose();
                            }}
                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[14px] rounded-[20px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={() => {
                                hapticSuccess();
                                onFiltersChange({ ...local, offset: 0 });
                                onClose();
                            }}
                            className="flex-[2] py-4 bg-gradient-to-r from-brand-blue to-brand-cyan text-white font-black text-[14px] rounded-[20px] shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" strokeWidth={3} />
                            Applica Filtri
                            {activeCount > 0 && (
                                <span className="bg-white/25 px-2 py-0.5 rounded-full text-[11px]">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// ============================================
// TIER S SUB-COMPONENTS
// ============================================

function FilterSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2.5">
                <div className="text-brand-blue">{icon}</div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</span>
            </div>
            {children}
        </div>
    );
}

function TierSChip({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void; key?: string | number }) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
                hapticSelection();
                onClick();
            }}
            className={`px-4 py-2.5 rounded-[14px] text-[12px] font-bold transition-all border ${active
                ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                : 'bg-[var(--card)] text-slate-500 border-[var(--card-border)] hover:border-brand-blue/30'
                }`}
        >
            {label}
        </motion.button>
    );
}

function TierSCheckbox({ label, emoji, checked, onChange }: { label: string; emoji?: string; checked?: boolean; onChange: () => void; key?: string | number }) {
    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
                hapticSelection();
                onChange();
            }}
            className={`flex items-center gap-3 p-3.5 rounded-[16px] border transition-all text-left w-full group ${checked
                ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10'
                : 'border-[var(--card-border)] bg-[var(--card)] hover:border-brand-blue/30'
                }`}
        >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${checked
                ? 'bg-brand-blue border-brand-blue text-white shadow-sm shadow-brand-blue/30'
                : 'border-slate-300 dark:border-slate-600'
                }`}>
                {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            {emoji && <span className="text-lg">{emoji}</span>}
            <span className={`text-[13px] font-semibold transition-colors ${checked ? 'text-brand-blue' : 'text-slate-600 dark:text-slate-400'}`}>
                {label}
            </span>
        </motion.button>
    );
}

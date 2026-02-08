'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    ArrowLeft,
    Bell,
    BellOff,
    Plus,
    Trash2,
    Settings2,
    Check,
    Sparkles,
    CalendarClock,
    Loader2,
    MapPin,
    Briefcase,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { BandiCategory, fetchBandiCategories, ITALIAN_REGIONS } from '@/lib/bandiService';

// ============================================
// TYPES
// ============================================

interface BandoAlert {
    id: string;
    user_id: string;
    category_id?: string;
    region?: string;
    education_level?: string;
    notify_days_before: number;
    notify_on_new: boolean;
    notify_on_update: boolean;
    is_active: boolean;
    created_at: string;
    category?: BandiCategory;
}

const NOTIFY_OPTIONS = [
    { value: 1, label: '1 giorno', short: '1g' },
    { value: 3, label: '3 giorni', short: '3g' },
    { value: 7, label: '1 settimana', short: '7g' },
    { value: 14, label: '2 settimane', short: '14g' },
    { value: 30, label: '1 mese', short: '30g' }
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function BandiAlertsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: containerRef });
    const headerOpacity = useTransform(scrollY, [0, 60], [0, 1]);

    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<BandoAlert[]>([]);
    const [categories, setCategories] = useState<BandiCategory[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [globalSettings, setGlobalSettings] = useState({
        notify_days_before: 7,
        notify_on_new: true
    });

    const loadData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const [alertsResult, categoriesResult] = await Promise.all([
                supabase
                    .from('user_bandi_alerts')
                    .select('*, category:bandi_categories(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                fetchBandiCategories()
            ]);

            if (alertsResult.data) {
                setAlerts(alertsResult.data);
            }
            setCategories(categoriesResult);
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggleAlert = async (alert: BandoAlert) => {
        const { error } = await supabase
            .from('user_bandi_alerts')
            .update({ is_active: !alert.is_active })
            .eq('id', alert.id);

        if (!error) {
            setAlerts(prev => prev.map(a =>
                a.id === alert.id ? { ...a, is_active: !a.is_active } : a
            ));
        }
    };

    const handleDeleteAlert = async (id: string) => {
        if (!confirm('Eliminare questo avviso?')) return;

        const { error } = await supabase
            .from('user_bandi_alerts')
            .delete()
            .eq('id', id);

        if (!error) {
            setAlerts(prev => prev.filter(a => a.id !== id));
        }
    };

    const handleCreateAlert = async (data: Partial<BandoAlert>) => {
        if (!user) return;

        const { data: newAlert, error } = await supabase
            .from('user_bandi_alerts')
            .insert({
                user_id: user.id,
                ...data,
                is_active: true
            })
            .select('*, category:bandi_categories(*)')
            .single();

        if (!error && newAlert) {
            setAlerts(prev => [newAlert, ...prev]);
            setShowCreateModal(false);
        } else {
            alert('Errore durante la creazione');
        }
    };

    // ============================================
    // NOT LOGGED IN STATE
    // ============================================
    if (!user) {
        return (
            <div className="min-h-screen bg-canvas-light dark:bg-slate-950 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-[22%] bg-gradient-to-br from-brand-cyan/20 to-brand-blue/20 flex items-center justify-center">
                        <Bell className="w-10 h-10 text-brand-cyan" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
                        Accedi per continuare
                    </h2>
                    <p className="text-text-secondary dark:text-slate-400 mb-6">
                        Crea avvisi personalizzati per non perdere nessun bando importante.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex px-6 py-3 bg-gradient-to-r from-brand-cyan to-brand-blue text-white rounded-2xl font-semibold shadow-lg shadow-brand-cyan/20"
                    >
                        Accedi ora
                    </Link>
                </motion.div>
            </div>
        );
    }

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-canvas-light dark:bg-slate-950 relative overflow-hidden">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl animate-float" />
                <div className="absolute top-1/2 -left-20 w-72 h-72 bg-brand-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
                <div className="absolute bottom-20 right-10 w-48 h-48 bg-brand-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
            </div>

            {/* Sticky Compact Header (appears on scroll) */}
            <motion.div
                style={{ opacity: headerOpacity }}
                className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50"
            >
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <span className="font-semibold text-slate-900 dark:text-white">Notifiche</span>
                </div>
            </motion.div>

            {/* Main Content */}
            <div ref={containerRef} className="relative z-10 pb-24 safe-area-top">
                {/* Hero Header */}
                <div className="px-4 pt-4 pb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Notifiche Bandi
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Ricevi aggiornamenti sui concorsi
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateModal(true)}
                            className="p-3 bg-gradient-to-r from-brand-cyan to-brand-blue text-white rounded-2xl shadow-lg shadow-brand-cyan/30"
                        >
                            <Plus className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 space-y-6">
                    {/* Global Settings Card - Tier S */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl"
                    >
                        {/* Card Header with Gradient */}
                        <div className="relative p-5 bg-gradient-to-r from-brand-cyan/10 via-brand-blue/5 to-transparent dark:from-brand-cyan/20 dark:via-brand-blue/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[22%] bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center shadow-lg shadow-brand-cyan/30">
                                    <Settings2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                        Impostazioni Generali
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Valide per tutti i bandi salvati
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Toggle: New Bandi */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-semantic-success/10 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-semantic-success" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            Nuovi bandi
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Notifica pubblicazioni
                                        </p>
                                    </div>
                                </div>
                                <TierSToggle
                                    checked={globalSettings.notify_on_new}
                                    onChange={() => setGlobalSettings(s => ({ ...s, notify_on_new: !s.notify_on_new }))}
                                />
                            </div>

                            {/* Reminder Chips */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CalendarClock className="w-4 h-4 text-brand-blue" />
                                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                                        Promemoria scadenza
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {NOTIFY_OPTIONS.map(opt => (
                                        <motion.button
                                            key={opt.value}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setGlobalSettings(s => ({ ...s, notify_days_before: opt.value }))}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${globalSettings.notify_days_before === opt.value
                                                ? 'bg-gradient-to-r from-brand-cyan to-brand-blue text-white shadow-lg shadow-brand-cyan/20'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {opt.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Custom Alerts Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                Avvisi Personalizzati
                            </h3>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {alerts.length} {alerts.length === 1 ? 'avviso' : 'avvisi'}
                            </span>
                        </div>

                        {loading ? (
                            <LoadingState />
                        ) : alerts.length === 0 ? (
                            <EmptyState onCreateClick={() => setShowCreateModal(true)} />
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {alerts.map((alert, index) => (
                                        <AlertCard
                                            key={alert.id}
                                            alert={alert}
                                            index={index}
                                            onToggle={() => handleToggleAlert(alert)}
                                            onDelete={() => handleDeleteAlert(alert.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateAlertModal
                        categories={categories}
                        onSave={handleCreateAlert}
                        onClose={() => setShowCreateModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================
// TIER S TOGGLE
// ============================================

function TierSToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${checked
                ? 'bg-gradient-to-r from-brand-cyan to-brand-blue shadow-lg shadow-brand-cyan/30'
                : 'bg-slate-200 dark:bg-slate-700'
                }`}
        >
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center ${checked ? 'left-7' : 'left-1'
                    }`}
            >
                {checked && <Check className="w-3.5 h-3.5 text-brand-cyan" />}
            </motion.div>
        </button>
    );
}

// ============================================
// ALERT CARD
// ============================================

function AlertCard({
    alert,
    index,
    onToggle,
    onDelete
}: {
    alert: BandoAlert;
    index: number;
    onToggle: () => void;
    onDelete: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/80 backdrop-blur-xl border transition-all ${alert.is_active
                ? 'border-brand-cyan/30 shadow-lg shadow-brand-cyan/5'
                : 'border-slate-200/50 dark:border-slate-700/50 opacity-60'
                }`}
        >
            {/* Active indicator bar */}
            {alert.is_active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-cyan to-brand-blue" />
            )}

            <div className="p-4 pl-5 flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-[18%] flex items-center justify-center text-xl shrink-0 ${alert.is_active
                    ? 'bg-gradient-to-br from-brand-cyan/20 to-brand-blue/20'
                    : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                    {alert.category?.icon || '📋'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                        {alert.category?.name || 'Tutti i bandi'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {alert.region && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-blue/10 text-brand-blue rounded-lg font-medium">
                                <MapPin className="w-3 h-3" />
                                {alert.region}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-orange/10 text-brand-orange rounded-lg font-medium">
                            <CalendarClock className="w-3 h-3" />
                            {alert.notify_days_before}g prima
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggle}
                        className={`p-2.5 rounded-xl transition-all ${alert.is_active
                            ? 'bg-brand-cyan/10 text-brand-cyan'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                    >
                        {alert.is_active ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onDelete}
                        className="p-2.5 rounded-xl text-semantic-error bg-semantic-error/10 hover:bg-semantic-error/20 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center"
        >
            <div className="w-16 h-16 mx-auto mb-4 rounded-[22%] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <BellOff className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nessun avviso personalizzato
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Crea avvisi per categorie o regioni specifiche
            </p>
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-cyan to-brand-blue text-white rounded-xl font-semibold shadow-lg shadow-brand-cyan/20"
            >
                <Plus className="w-4 h-4" />
                Crea il primo avviso
            </motion.button>
        </motion.div>
    );
}

// ============================================
// LOADING STATE
// ============================================

function LoadingState() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div
                    key={i}
                    className="h-20 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse"
                />
            ))}
        </div>
    );
}

// ============================================
// CREATE ALERT MODAL - Tier S
// ============================================

interface CreateAlertModalProps {
    categories: BandiCategory[];
    onSave: (data: Partial<BandoAlert>) => void;
    onClose: () => void;
}

function CreateAlertModal({ categories, onSave, onClose }: CreateAlertModalProps) {
    const [formData, setFormData] = useState({
        category_id: '',
        region: '',
        notify_days_before: 7,
        notify_on_new: true,
        notify_on_update: false
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        await onSave({
            category_id: formData.category_id || undefined,
            region: formData.region || undefined,
            notify_days_before: formData.notify_days_before,
            notify_on_new: formData.notify_on_new,
            notify_on_update: formData.notify_on_update
        });
        setSaving(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="relative p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[18%] bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Nuovo Avviso
                            </h2>
                            <p className="text-sm text-slate-500">
                                Personalizza le tue notifiche
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-5 space-y-5 overflow-y-auto max-h-[50vh]">
                    {/* Category */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            <Briefcase className="w-4 h-4 text-brand-cyan" />
                            Categoria
                        </label>
                        <div className="relative">
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData(p => ({ ...p, category_id: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white appearance-none font-medium focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all"
                            >
                                <option value="">✨ Tutte le categorie</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Region */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            <MapPin className="w-4 h-4 text-brand-blue" />
                            Regione
                        </label>
                        <div className="relative">
                            <select
                                value={formData.region}
                                onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white appearance-none font-medium focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                            >
                                <option value="">🇮🇹 Tutte le regioni</option>
                                <option value="nazionale">🏛️ Nazionale</option>
                                {ITALIAN_REGIONS.map(reg => (
                                    <option key={reg} value={reg}>{reg}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Notify Before */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            <CalendarClock className="w-4 h-4 text-brand-orange" />
                            Notifica prima della scadenza
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {NOTIFY_OPTIONS.map(opt => (
                                <motion.button
                                    key={opt.value}
                                    type="button"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setFormData(p => ({ ...p, notify_days_before: opt.value }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${formData.notify_days_before === opt.value
                                        ? 'bg-gradient-to-r from-brand-cyan to-brand-blue text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    {opt.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2">
                        <ToggleOption
                            label="Notifica nuovi bandi"
                            description="Quando viene pubblicato un bando"
                            checked={formData.notify_on_new}
                            onChange={() => setFormData(p => ({ ...p, notify_on_new: !p.notify_on_new }))}
                        />
                        <ToggleOption
                            label="Notifica aggiornamenti"
                            description="Modifiche, proroghe, risultati"
                            checked={formData.notify_on_update}
                            onChange={() => setFormData(p => ({ ...p, notify_on_update: !p.notify_on_update }))}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-3 safe-area-bottom">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Annulla
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-3.5 bg-gradient-to-r from-brand-cyan to-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-cyan/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Crea Avviso
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================
// TOGGLE OPTION
// ============================================

function ToggleOption({
    label,
    description,
    checked,
    onChange
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <div
            onClick={onChange}
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${checked
                ? 'bg-brand-cyan/5 border border-brand-cyan/30'
                : 'bg-slate-50 dark:bg-slate-800 border border-transparent'
                }`}
        >
            <div>
                <p className="font-medium text-slate-800 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <TierSToggle checked={checked} onChange={onChange} />
        </div>
    );
}

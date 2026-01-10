import React, { useState } from 'react';
import {
    Upload,
    Bell,
    FileSpreadsheet,
    RefreshCw,
    Download,
    Trash2,
    Settings,
    Database,
    ChevronRight
} from 'lucide-react';

interface QuickAction {
    id: string;
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
    onClick: () => void;
}

export default function QuickActionsPanel() {
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const actions: QuickAction[] = [
        {
            id: 'import',
            icon: Upload,
            label: 'Importa Domande',
            description: 'Carica da CSV/Excel',
            color: 'from-blue-500 to-cyan-500',
            onClick: () => {
                // Navigate to import page or open modal
                window.location.href = '/admin/import';
            }
        },
        {
            id: 'export',
            icon: Download,
            label: 'Esporta Report',
            description: 'Scarica analytics CSV',
            color: 'from-emerald-500 to-green-500',
            onClick: () => {
                alert('Export funzionalità in arrivo!');
            }
        },
        {
            id: 'notify',
            icon: Bell,
            label: 'Invia Notifica',
            description: 'Push a tutti gli utenti',
            color: 'from-amber-500 to-orange-500',
            onClick: () => {
                alert('Notifiche push in arrivo!');
            }
        },
        {
            id: 'refresh',
            icon: RefreshCw,
            label: 'Rigenera Cache',
            description: 'Aggiorna leaderboard',
            color: 'from-violet-500 to-purple-500',
            onClick: async () => {
                setActiveAction('refresh');
                // Simulate cache refresh
                await new Promise(resolve => setTimeout(resolve, 1500));
                setActiveAction(null);
                alert('Cache rigenerata!');
            }
        },
        {
            id: 'database',
            icon: Database,
            label: 'Database Studio',
            description: 'Apri Supabase',
            color: 'from-slate-500 to-slate-600',
            onClick: () => {
                window.open('https://supabase.com/dashboard', '_blank');
            }
        },
        {
            id: 'settings',
            icon: Settings,
            label: 'Impostazioni',
            description: 'Configura app',
            color: 'from-rose-500 to-pink-500',
            onClick: () => {
                window.location.href = '/admin/settings';
            }
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Azioni Rapide</h3>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        disabled={activeAction === action.id}
                        className={`
                            relative p-4 rounded-xl text-left transition-all duration-200
                            bg-slate-50 dark:bg-slate-800/50 
                            hover:bg-slate-100 dark:hover:bg-slate-800 
                            hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                            disabled:opacity-50 disabled:cursor-wait
                            group
                        `}
                    >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-shadow`}>
                            {activeAction === action.id ? (
                                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                            ) : (
                                <action.icon className="w-4 h-4 text-white" />
                            )}
                        </div>

                        {/* Label */}
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {action.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {action.description}
                        </p>

                        {/* Arrow indicator on hover */}
                        <ChevronRight className="absolute top-4 right-3 w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </div>
        </div>
    );
}

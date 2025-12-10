import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import UnifiedLeaderboardPage from '@/app/leaderboard/UnifiedLeaderboardPage';

export default function AdminLeaderboardPage() {
    const [viewMode, setViewMode] = useState<'stats' | 'preview'>('stats');

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Gestione Classifiche"
                subtitle="Monitora le classifiche e visualizza l'anteprima utente."
                actions={
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('stats')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'stats' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Statistiche
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Anteprima Live
                        </button>
                    </div>
                }
            />

            <div className="p-6">
                {viewMode === 'stats' ? (
                    <div className="space-y-6">
                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InfoCard title="Classifiche Attive" createValue="24" icon="📊" />
                            <InfoCard title="Top Player (XP)" createValue="User #123" icon="👑" />
                            <InfoCard title="Aggiornamento" createValue="Real-time" icon="⚡" />
                        </div>

                        {/* Rules / Explanation */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Come Funziona</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600">
                                <div>
                                    <h4 className="font-bold text-amber-600 mb-2">🏆 Gold League (XP)</h4>
                                    <p className="mb-2">La classifica globale basata sui Punti Esperienza accumulati.</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Reset ogni 14 giorni (Stagione).</li>
                                        <li>XP guadagnati da Quiz, Login giornaliero, e Blog.</li>
                                        <li>Algoritmo: <code>xp = base + bonus</code></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-600 mb-2">📊 Classifiche Concorsi</h4>
                                    <p className="mb-2">Classifiche specifiche per ogni simulazione ufficiale.</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Basate sullo Skill Score (0-100).</li>
                                        <li>Considera: Media Voti, Volume Domande, Trend Recente.</li>
                                        <li>Unico punteggio per utente per concorso.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Placeholder Table */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center py-12 text-slate-400">
                            <div className="text-4xl mb-2">🚧</div>
                            <p>Lista dettagliata leghe in arrivo...</p>
                        </div>
                    </div>
                ) : (
                    <div className="border-4 border-slate-900 rounded-3xl overflow-hidden h-[800px] shadow-2xl relative">
                        <div className="absolute top-0 left-0 right-0 bg-slate-900 text-white text-xs py-1 text-center z-50 font-mono">
                            VISUALE UTENTE
                        </div>
                        <div className="h-full pt-6 bg-slate-900">
                            {/* Embed the Page Component - Note: It has its own Layout structure, so we constrain it */}
                            <UnifiedLeaderboardPage />
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function InfoCard({ title, createValue, icon }: { title: string, createValue: string, icon: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                {icon}
            </div>
            <div>
                <div className="text-slate-500 text-sm font-medium">{title}</div>
                <div className="text-2xl font-bold text-slate-900">{createValue}</div>
            </div>
        </div>
    )
}

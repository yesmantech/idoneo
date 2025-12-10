import React from 'react';

interface Badge {
    id: string;
    name: string;
    icon: string;
    unlocked: boolean;
    description: string;
}

export default function BadgesBlock() {
    // Mock Data for now
    const badges: Badge[] = [
        { id: '1', name: 'Primo Passo', icon: '🎯', unlocked: true, description: 'Hai completato il tuo primo quiz!' },
        { id: '2', name: 'Secchione', icon: '🤓', unlocked: true, description: 'Hai ottenuto 100% in una simulazione.' },
        { id: '3', name: 'Costanza', icon: '🔥', unlocked: false, description: 'Completa quiz per 7 giorni di fila.' },
        { id: '4', name: 'Top 10', icon: '👑', unlocked: false, description: 'Entra nella Top 10 della Gold League.' },
    ];

    return (
        <div className="px-6 mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">I tuoi Badge</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {badges.map(badge => (
                    <div
                        key={badge.id}
                        className={`flex-none snap-start w-24 flex flex-col items-center gap-2 group ${badge.unlocked ? '' : 'opacity-50 grayscale'}`}
                    >
                        {/* Hexagon Shape CSS or simple rounded for now */}
                        <div className={`w-20 h-20 flex items-center justify-center text-4xl bg-white border-2 ${badge.unlocked ? 'border-amber-400 bg-amber-50' : 'border-slate-200'} rounded-2xl shadow-sm transition-transform group-hover:scale-105`}>
                            {badge.icon}
                        </div>
                        <span className="text-xs font-bold text-center text-slate-600 leading-tight">{badge.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

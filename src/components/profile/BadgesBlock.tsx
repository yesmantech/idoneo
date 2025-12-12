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
        <div className="mb-8">
            <h3 className="text-lg font-bold text-text-primary mb-4 px-2">I tuoi Badge</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x px-2">
                {badges.map(badge => (
                    <div
                        key={badge.id}
                        className={`flex-none snap-start w-24 flex flex-col items-center gap-2 group ${badge.unlocked ? '' : 'opacity-50 grayscale'}`}
                    >
                        {/* Squircle Shape */}
                        <div className={`w-20 h-20 flex items-center justify-center text-4xl bg-white ${badge.unlocked ? 'bg-gradient-to-br from-brand-orange/10 to-brand-orange/20 border-brand-orange/20 shadow-sm' : 'bg-canvas-light border-transparent'} border rounded-squircle transition-transform group-hover:scale-105`}>
                            {badge.icon}
                        </div>
                        <span className="text-xs font-bold text-center text-text-secondary leading-tight mt-1">{badge.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

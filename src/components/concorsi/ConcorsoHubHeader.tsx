import React from 'react';
import { Link } from 'react-router-dom';

interface ConcorsoHubHeaderProps {
    title: string;
    subtitle: string;
    description: string;
    logoUrl?: string; // Optional, or use a placeholder
}

export default function ConcorsoHubHeader({ title, subtitle, description, logoUrl }: ConcorsoHubHeaderProps) {
    return (
        <div className={`relative rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm ${logoUrl ? 'p-0' : 'p-8 bg-white'}`}>

            {/* Background Image logic */}
            {logoUrl && (
                <div className="absolute inset-0 z-0">
                    <img src={logoUrl} alt="banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40" />
                </div>
            )}

            <div className={`relative z-10 flex flex-col md:flex-row gap-6 md:items-start ${logoUrl ? 'p-8 text-white' : ''}`}>
                {/* Logo Area - Hide if verified banner is used as background? Or keep as Icon? 
                    User requested "Header banner inside... behind/near the concorso title".
                    If we have a banner, we use it as background.
                */}

                {!logoUrl && (
                    <div className="w-20 h-20 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                        <span className="text-2xl font-bold text-white">
                            {title.substring(0, 3).toUpperCase()}
                        </span>
                    </div>
                )}

                <div className="space-y-4 flex-1">
                    <div>
                        <h1 className={`text-3xl font-bold mb-2 ${logoUrl ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
                        <p className={`text-lg font-medium ${logoUrl ? 'text-slate-200' : 'text-slate-600'}`}>{subtitle}</p>
                    </div>

                    <div className={`p-4 rounded-xl border leading-relaxed max-w-3xl ${logoUrl ? 'bg-white/10 border-white/10 text-slate-100 backdrop-blur-sm' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                        {description || "Nessuna descrizione disponibile per questo concorso."}
                    </div>
                </div>
            </div>
        </div>
    );
}

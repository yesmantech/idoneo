import React from 'react';
import { Link } from 'react-router-dom';

export interface ExamHeaderProps {
    title: string;
    subtitle: string;
    breadcrumbs: { label: string; path?: string }[];
    status?: 'open' | 'closed' | 'coming_soon';
    deadline?: string;
    positions?: string;
}

export default function ExamHeader({ title, subtitle, breadcrumbs, status = 'open', deadline, positions }: ExamHeaderProps) {
    return (
        <div className="bg-white border-b border-slate-200">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <span>/</span>}
                            {crumb.path ? (
                                <Link to={crumb.path} className="hover:text-emerald-600 transition-colors">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="font-medium text-slate-900">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            {status === 'open' && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full tracking-wide">
                                    Aperto
                                </span>
                            )}
                            {status === 'closed' && (
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-full tracking-wide">
                                    Scaduto
                                </span>
                            )}
                            {status === 'coming_soon' && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase rounded-full tracking-wide">
                                    In Arrivo
                                </span>
                            )}
                            {positions && (
                                <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                                    👥 {positions} Posti
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">
                            {title}
                        </h1>
                        <p className="text-lg text-slate-600">
                            {subtitle}
                        </p>
                    </div>

                    {/* Deadline Chip */}
                    {deadline && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Scadenza</span>
                                <span className="text-sm font-bold text-slate-900">{deadline}</span>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm text-slate-400">
                                📅
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

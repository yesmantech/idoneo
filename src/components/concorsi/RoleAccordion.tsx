import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RoleWithContests } from '@/hooks/useConcorsoData';

interface RoleAccordionProps {
    key?: React.Key;
    role: RoleWithContests;
    isOpen: boolean;
    onToggle: () => void;
}

export default function RoleAccordion({ role, isOpen, onToggle }: RoleAccordionProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header / Trigger */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
            >
                <div>
                    <h3 className="text-xl font-bold text-slate-900">{role.title}</h3>
                    <div className="text-sm text-slate-500 font-medium mt-1">
                        {role.contests.length} {role.contests.length === 1 ? 'edizione disponibile' : 'edizioni disponibili'}
                    </div>
                </div>

                <div className={`p-2 rounded-full bg-slate-100 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-emerald-100 text-emerald-600' : ''}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded Content */}
            <div
                className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
                    {role.contests.length > 0 ? (
                        role.contests.map((contest, index) => {
                            // Logic for "New" badge - mock for now, assume first item is newest
                            const isNew = index === 0;

                            return (
                                <Link
                                    key={contest.id}
                                    to={`/concorsi/${contest.categorySlug}/${contest.roleSlug}/${contest.slug}`}
                                    className="block relative group"
                                >
                                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                                {contest.title}
                                            </div>
                                            {isNew && (
                                                <span className="px-2 py-0.5 rounded textxs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide text-[10px]">
                                                    Nuovo
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-slate-400 group-hover:translate-x-1 transition-transform">
                                            →
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="p-4 text-center text-slate-500 italic">
                            Nessuna edizione disponibile al momento.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

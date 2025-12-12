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
        <div className="bg-white rounded-card shadow-soft overflow-hidden transition-all duration-300 ease-ios hover:shadow-card">
            {/* Header / Trigger */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 md:p-6 text-left bg-white hover:bg-canvas-light transition-colors duration-300"
            >
                <div>
                    <h3 className="text-xl font-bold text-text-primary">{role.title}</h3>
                    <div className="text-sm text-text-secondary font-medium mt-1">
                        {role.contests.length} {role.contests.length === 1 ? 'edizione disponibile' : 'edizioni disponibili'}
                    </div>
                </div>

                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-ios ${isOpen ? 'rotate-180 bg-brand-cyan/10 text-brand-cyan' : 'bg-canvas-light text-text-secondary'
                    }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded Content */}
            <div
                className={`transition-[max-height,opacity] duration-300 ease-ios overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-canvas-light/50 p-4 space-y-3">
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
                                    <div className="flex items-center justify-between p-4 bg-white rounded-card shadow-soft hover:shadow-card hover:scale-[1.01] transition-all duration-300 ease-ios">
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-text-primary group-hover:text-brand-cyan transition-colors">
                                                {contest.title}
                                            </div>
                                            {isNew && (
                                                <span className="px-3 py-1 rounded-pill text-xs font-bold bg-brand-cyan/10 text-brand-cyan uppercase tracking-wide">
                                                    Nuovo
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-text-secondary group-hover:translate-x-1 transition-transform">
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

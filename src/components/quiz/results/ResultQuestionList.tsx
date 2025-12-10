import React, { useState } from 'react';

type TabType = 'wrong' | 'correct' | 'skipped';

interface QuestionItem {
    id: string;
    text: string;
    userAnswer: string | null; // e.g. "Marte"
    correctAnswer: string | null;
    isCorrect: boolean;
    isSkipped: boolean;
}

interface ResultQuestionListProps {
    wrong: QuestionItem[];
    correct: QuestionItem[];
    skipped: QuestionItem[];
    attemptId: string;
}

import { useNavigate } from 'react-router-dom';

export default function ResultQuestionList({ wrong, correct, skipped, attemptId }: ResultQuestionListProps) {
    const [activeTab, setActiveTab] = useState<TabType>('wrong');
    const navigate = useNavigate();

    const tabs = [
        { id: 'wrong', label: `Errate (${wrong.length})`, color: 'rose' },
        { id: 'correct', label: `Corrette (${correct.length})`, color: 'emerald' },
        { id: 'skipped', label: `Omesse (${skipped.length})`, color: 'slate' },
    ] as const;

    const currentList = activeTab === 'wrong' ? wrong : activeTab === 'correct' ? correct : skipped;

    return (
        <div className="max-w-4xl mx-auto px-6 mb-24">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    let activeClass = "";
                    if (isActive && tab.color === 'rose') activeClass = "bg-white text-rose-600 shadow-sm";
                    if (isActive && tab.color === 'emerald') activeClass = "bg-white text-emerald-600 shadow-sm";
                    if (isActive && tab.color === 'slate') activeClass = "bg-white text-slate-800 shadow-sm";

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-sm font-bold transition-all ${isActive ? activeClass : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="space-y-3">
                {currentList.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-sm font-medium">Nessuna domanda in questa categoria.</p>
                    </div>
                )}

                {currentList.map((q, i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate(`/quiz/explanations/${attemptId}/${q.id}`)}
                    >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${q.isCorrect ? 'bg-emerald-100 text-emerald-600' :
                            q.isSkipped ? 'bg-slate-100 text-slate-400' : 'bg-rose-100 text-rose-600'
                            }`}>
                            {q.isCorrect ? '✓' : q.isSkipped ? '–' : '✕'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-800 font-medium leading-relaxed line-clamp-2 mb-1.5">{q.text}</p>

                            <div className="text-xs space-y-0.5">
                                {q.isSkipped ? (
                                    <span className="text-slate-400 font-medium italic">Risposta omessa</span>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                                        <span className={`${q.isCorrect ? 'text-emerald-600' : 'text-rose-600'} font-bold`}>
                                            Hai risposto: {q.userAnswer}
                                        </span>
                                        {!q.isCorrect && (
                                            <span className="text-emerald-600 font-bold">
                                                Corretta: {q.correctAnswer}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chevron */}
                        <div className="text-slate-300 group-hover:text-slate-500 transition-colors self-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

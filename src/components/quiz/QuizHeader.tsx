import React from 'react';
import { useNavigate } from 'react-router-dom';

interface QuizHeaderProps {
    title: string;
    onExit: () => void;
    onSettings: () => void;
    instantCheck: boolean;
    setInstantCheck: (v: boolean) => void;
    autoNext: boolean;
    setAutoNext: (v: boolean) => void;
    // New Mobile Timer Props
    timerSeconds?: number;
    totalQuestions?: number;
    currentQuestionIndex?: number;
}

export default function QuizHeader({
    title,
    onExit,
    onSettings,
    instantCheck,
    setInstantCheck,
    autoNext,
    setAutoNext,
    timerSeconds,
    totalQuestions,
    currentQuestionIndex
}: QuizHeaderProps) {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };
    return (
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            {/* Left: Close */}
            <button
                onClick={onExit}
                className="w-10 h-10 -ml-2 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors"
                title="Esci dalla simulazione"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Center: Title or Timer (Mobile Switch) */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 hidden sm:flex bg-emerald-500 rounded-lg items-center justify-center text-white font-bold text-sm shadow-sm">
                    I
                </div>

                {/* Desktop Title */}
                <h1 className="hidden sm:block text-lg font-bold text-slate-800 tracking-tight">
                    {title}
                </h1>

                {/* Mobile Timer & Progress */}
                {(timerSeconds !== undefined && totalQuestions !== undefined && currentQuestionIndex !== undefined) && (
                    <div className="sm:hidden flex flex-col items-center">
                        <div className={`font-mono font-bold text-lg leading-none ${timerSeconds < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>
                            {formatTime(timerSeconds)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Domanda {currentQuestionIndex + 1}/{totalQuestions}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Controls & Settings */}
            <div className="flex items-center gap-2">

                {/* Toggles (Visible on all screens) */}
                <div className="flex items-center gap-2 mr-2 sm:gap-3 sm:mr-4 bg-slate-50 rounded-xl p-1 border border-slate-100">
                    {/* Instant Check Toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            setInstantCheck(!instantCheck);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${instantCheck
                            ? 'bg-white shadow-sm text-emerald-600 border border-emerald-100'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${instantCheck ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                            }`}>
                            {instantCheck && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                        </div>
                        <span className="hidden sm:inline">Instant Check</span>
                        <span className="sm:hidden">Check</span>
                    </button>

                    {/* Auto Next Toggle */}
                    <button
                        type="button"
                        onClick={() => setAutoNext(!autoNext)}
                        className={`flex items-center gap-2 px-2 py-1.5 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${autoNext
                            ? 'bg-white shadow-sm text-blue-600 border border-blue-100'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${autoNext ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                            }`}>
                            {autoNext && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                        </div>
                        <span className="hidden sm:inline">Auto Next</span>
                        <span className="sm:hidden">Auto</span>
                    </button>
                </div>

                <button
                    onClick={onSettings}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors"
                    title="Impostazioni"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>
        </header >
    );
}

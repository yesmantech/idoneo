import React from 'react';
import QuestionGrid from './QuestionGrid';

interface QuizSidebarProps {
    timerSeconds: number;
    totalQuestions: number;
    currentQuestionIndex: number;
    answers: Record<number, any>; // Using generic object to track answered state
    onJumpToQuestion: (index: number) => void;
    onTerminate: () => void;
    onSave?: () => void;
}

export default function QuizSidebar({
    timerSeconds,
    totalQuestions,
    currentQuestionIndex,
    answers,
    onJumpToQuestion,
    onTerminate,
    onSave
}: QuizSidebarProps) {

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const missingAnswers = totalQuestions - Object.keys(answers).filter(k => answers[Number(k)]).length;

    return (
        <aside className="w-80 bg-white border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto flex flex-col p-6 sticky top-16 hidden lg:flex">

            {/* Timer Block */}
            <div className="mb-6 text-center">
                <div className="text-3xl font-mono font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                    <span className="text-slate-400 text-2xl">⏳</span>
                    {formatTime(timerSeconds)}
                </div>
                {/* Progress Bar (Visual only for now, can be tied to timer max) */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                </div>

                <button
                    onClick={onTerminate}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                    Termina simulazione
                </button>
            </div>

            {/* Save Button */}
            <div className="mb-6">
                <button
                    onClick={onSave}
                    className="w-full py-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <span>💾</span> Salva risposte
                </button>
            </div>

            {/* Info Text */}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
                Risposte mancanti: <span className="text-slate-900">{missingAnswers}</span>
            </div>

            {/* Question Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
                <QuestionGrid
                    totalQuestions={totalQuestions}
                    currentQuestionIndex={currentQuestionIndex}
                    answers={answers}
                    onJumpToQuestion={onJumpToQuestion}
                />
            </div>

            <div className="mt-4 text-[10px] text-center text-slate-300">
                IDONEO Exam UI v2.0
            </div>
        </aside>
    );
}

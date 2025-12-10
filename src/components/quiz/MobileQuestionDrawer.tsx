import React from 'react';
import QuestionGrid from './QuestionGrid';

interface MobileQuestionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    totalQuestions: number;
    currentQuestionIndex: number;
    answers: Record<number, any>;
    onJumpToQuestion: (index: number) => void;
    onTerminate: () => void;
}

export default function MobileQuestionDrawer({
    isOpen,
    onClose,
    totalQuestions,
    currentQuestionIndex,
    answers,
    onJumpToQuestion,
    onTerminate
}: MobileQuestionDrawerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-900">Indice Domande</h3>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {Object.keys(answers).length} / {totalQuestions} completate
                    </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <QuestionGrid
                        totalQuestions={totalQuestions}
                        currentQuestionIndex={currentQuestionIndex}
                        answers={answers}
                        onJumpToQuestion={(idx) => {
                            onJumpToQuestion(idx);
                            onClose();
                        }}
                    />
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onTerminate}
                        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 transition-colors"
                    >
                        Termina Simulazione
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full mt-3 py-3 text-slate-500 font-medium hover:text-slate-800"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}

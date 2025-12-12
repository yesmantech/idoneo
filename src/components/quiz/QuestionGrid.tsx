import React from 'react';

interface QuestionGridProps {
    totalQuestions: number;
    currentQuestionIndex: number;
    answers: Record<number, any>;
    onJumpToQuestion: (index: number) => void;
}

export default function QuestionGrid({
    totalQuestions,
    currentQuestionIndex,
    answers,
    onJumpToQuestion
}: QuestionGridProps) {
    return (
        <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = !!answers[idx];

                return (
                    <button
                        key={idx}
                        onClick={() => onJumpToQuestion(idx)}
                        className={`w-10 h-10 rounded-squircle font-bold text-sm transition-all active:scale-95 flex items-center justify-center ${isCurrent
                                ? 'bg-brand-cyan text-white shadow-md shadow-brand-cyan/30'
                                : isAnswered
                                    ? 'bg-canvas-light text-text-secondary border border-slate-200'
                                    : 'bg-canvas-light text-text-tertiary'
                            }`}
                    >
                        {idx + 1}
                    </button>
                );
            })}
        </div>
    );
}

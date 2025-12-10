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
        <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = !!answers[idx];

                let btnClass = "bg-white border-slate-200 text-slate-500 hover:border-slate-300"; // Default
                if (isAnswered) btnClass = "bg-slate-100 border-slate-300 text-slate-900 font-bold";
                if (isCurrent) btnClass = "bg-blue-600 border-blue-600 text-white font-bold shadow-md ring-2 ring-blue-200";

                return (
                    <button
                        key={idx}
                        onClick={() => onJumpToQuestion(idx)}
                        className={`aspect-square rounded-lg border flex items-center justify-center text-sm transition-all ${btnClass}`}
                    >
                        {idx + 1}
                    </button>
                );
            })}
        </div>
    );
}

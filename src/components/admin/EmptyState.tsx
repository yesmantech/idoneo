import React from 'react';

// ================== TYPES ==================

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// ================== MAIN COMPONENT ==================

export default function EmptyState({
    icon = '📭',
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Icon */}
            <div className="text-5xl mb-4 opacity-50">
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-slate-500 text-sm max-w-md mb-6">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-5 py-2.5 bg-[#00B1FF] hover:bg-[#0091D5] text-white font-medium rounded-xl shadow-lg shadow-[#00B1FF]/20 transition-all"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

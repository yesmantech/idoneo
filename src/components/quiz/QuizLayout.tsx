import React, { ReactNode } from 'react';

interface QuizLayoutProps {
    header: ReactNode;
    sidebar: ReactNode;
    children: ReactNode; // Main Content
}

export default function QuizLayout({ header, sidebar, children }: QuizLayoutProps) {
    return (
        <div className="min-h-screen bg-canvas-light flex flex-col">
            {/* Header with explicit stacking context */}
            <div className="relative z-50 isolate">
                {header}
            </div>
            <div className="flex flex-1 overflow-hidden">
                {sidebar}
                <main className="flex-1 overflow-y-auto relative z-0">
                    {children}
                </main>
            </div>
        </div>
    );
}

import React, { ReactNode } from 'react';

interface QuizLayoutProps {
    header: ReactNode;
    sidebar: ReactNode;
    children: ReactNode; // Main Content
}

export default function QuizLayout({ header, sidebar, children }: QuizLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {header}
            <div className="flex flex-1 overflow-hidden">
                {sidebar}
                <main className="flex-1 overflow-y-auto relative">
                    {children}
                </main>
            </div>
        </div>
    );
}

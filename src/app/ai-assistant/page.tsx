import React from 'react';
import SEOHead from '@/components/seo/SEOHead';
import AiChatInterface from '@/components/ai/AiChatInterface';

export default function AiAssistantPage() {
    return (
        <div className="flex flex-col h-[100dvh] bg-white dark:bg-black text-black dark:text-white -mt-[env(safe-area-inset-top,0px)] pt-[env(safe-area-inset-top,0px)] fixed inset-0 z-50">
            <SEOHead
                title="AI Assistente 360° | Idoneo"
                description="Il tuo coach personale per dominare i concorsi pubblici. Chiedi consigli, genera sessioni di studio e analizza i tuoi errori."
            />

            <div className="flex-1 overflow-hidden relative w-full max-w-4xl mx-auto">
                <AiChatInterface />
            </div>
        </div>
    );
}

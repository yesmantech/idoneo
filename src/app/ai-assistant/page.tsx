import React from 'react';
import SEOHead from '@/components/seo/SEOHead';
import AiChatInterface from '@/components/ai/AiChatInterface';

export default function AiAssistantPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-[env(safe-area-inset-bottom,0px)]">
            <SEOHead
                title="AI Assistente 360° | Idoneo"
                description="Il tuo coach personale per dominare i concorsi pubblici. Chiedi consigli, genera sessioni di studio e analizza i tuoi errori."
            />

            <div className="w-full max-w-4xl mx-auto h-full">
                <AiChatInterface />
            </div>
        </div>
    );
}

import React from 'react';
import SEOHead from '@/components/seo/SEOHead';
import AiChatInterface from '@/components/ai/AiChatInterface';

export default function AiAssistantPage() {
    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-black text-black dark:text-white"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <SEOHead
                title="AI Assistente 360° | Idoneo"
                description="Il tuo coach personale per dominare i concorsi pubblici. Chiedi consigli, genera sessioni di studio e analizza i tuoi errori."
            />
            <AiChatInterface />
        </div>
    );
}

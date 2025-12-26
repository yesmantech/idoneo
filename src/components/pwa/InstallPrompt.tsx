import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Don't show install prompt in native app - it's already installed!
        if (Capacitor.isNativePlatform()) return;

        // Check for iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Standard 'beforeinstallprompt' for Android/Desktop
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Check if user has already dismissed it recently? 
            // For now, show it after a slight delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, simple heuristic: standalone mode check
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isIosDevice && !isStandalone) {
            // Show prompts for iOS specifically?
            // Maybe valid on pageload or after interaction.
            setTimeout(() => setShowPrompt(true), 5000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
            setShowPrompt(false);
        } else if (isIOS) {
            // iOS instructions
            alert("Per installare su iOS: tocca il tasto Condividi (Share) e seleziona 'Aggiungi alla Schermata Home'");
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-white/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-[24px] p-4 flex items-center gap-4 relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={() => setShowPrompt(false)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-100/50 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#00B1FF] to-[#0088CC] flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-sm">Installa Idoneo</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                        {isIOS ? "Tocca Condividi > Aggiungi a Home" : "Accesso rapido e notifiche"}
                    </p>
                </div>

                {/* Action Button (Android) */}
                {!isIOS && (
                    <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        Installa
                    </button>
                )}
            </div>
        </div>
    );
}
